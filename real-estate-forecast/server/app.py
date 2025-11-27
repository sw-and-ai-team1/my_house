from flask import Flask, request, jsonify
import pandas as pd
import joblib
import traceback

app = Flask(__name__)
app.config["JSON_AS_ASCII"] = False 


def build_features_from_row(row):
    """하나의 거래 row에서 모델 입력 벡터(X)와 부가 정보 생성"""
    if pd.notna(row["buildYear"]) and pd.notna(row["dealYear"]):
        age_at_deal = int(row["dealYear"]) - int(row["buildYear"])
    else:
        age_at_deal = None

    row_dict = {
        "dealAmount_now": row["dealAmount"],
        "excluUseAr": row["excluUseAr"],
        "age_at_deal": age_at_deal,
        "floor": row["floor"],
        "dealYear": row["dealYear"],
        "dealMonth": row["dealMonth"],
    }

    # feature 누락 체크
    for col in feature_cols:
        if row_dict.get(col) is None:
            raise ValueError(f"missing feature: {col}")

    X = [[row_dict[col] for col in feature_cols]]
    return X, row_dict
    
# 1. 모델 로드
model_bundle = joblib.load("ml/model.joblib")
model = model_bundle["model"]
feature_cols = model_bundle["features"]

# 2. 상도동 실거래 데이터 로드
deals_df = pd.read_csv("data/sangdo_raw.csv", parse_dates=["dealDate"])
deals_df = deals_df[deals_df["umdNm"] == "상도동"].copy()

deals_df["area_bucket"] = (deals_df["excluUseAr"] // 5) * 5  # 5㎡ 단위 버킷


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"}), 200


@app.route("/search-apartments", methods=["POST"])
def search_apartments():
    """
    요청 JSON 예시:
    {
      "query": "상도"
    }
    
    응답:
    - 아파트 이름 목록 (중복 제거)
    """
    try:
        data = request.get_json()
        
        if not data or "query" not in data:
            return jsonify({"error": "query is required"}), 400
        
        query = data["query"].strip()
        
        if not query:
            return jsonify({"apartments": []}), 200
        
        # 아파트 이름으로 검색 (대소문자 구분 없이)
        matching_apts = deals_df[deals_df["aptNm"].str.contains(query, case=False, na=False)]
        
        if matching_apts.empty:
            return jsonify({"apartments": []}), 200
        
        # 중복 제거하고 아파트 목록 반환
        unique_apartments = matching_apts["aptNm"].unique()
        
        apartments = [
            {
                "aptNm": apt_name,
                "umdNm": "상도동",  # 모든 데이터가 상도동
                "location": "서울 동작구 상도동"
            }
            for apt_name in sorted(unique_apartments)
        ]
        
        return jsonify({"apartments": apartments}), 200
        
    except Exception as e:
        print("Error in /search-apartments:", e)
        traceback.print_exc()
        return jsonify({"error": "server_error", "message": str(e)}), 500


@app.route("/predict-price", methods=["POST"])
def predict_price():
    try:
        data = request.get_json()

        if not data or "aptNm" not in data:
            return jsonify({"error": "aptNm is required"}), 400

        apt_name_query = data["aptNm"].strip()

        # 3. 아파트 이름으로 검색
        cand = deals_df[deals_df["aptNm"].str.contains(apt_name_query, na=False)]

        if cand.empty:
            return jsonify({"error": "apartment_not_found"}), 404

        # 4. 가장 최근 거래 1건 선택
        latest = cand.sort_values("dealDate").iloc[-1]

        # 5. feature 만들기
        if pd.notna(latest["buildYear"]) and pd.notna(latest["dealYear"]):
            age_at_deal = int(latest["dealYear"]) - int(latest["buildYear"])
        else:
            age_at_deal = None

        row_dict = {
            "dealAmount_now": latest["dealAmount"],
            "excluUseAr": latest["excluUseAr"],
            "age_at_deal": age_at_deal,
            "floor": latest["floor"],
            "dealYear": latest["dealYear"],
            "dealMonth": latest["dealMonth"],
        }

        for col in feature_cols:
            if row_dict.get(col) is None:
                return jsonify({"error": "missing_feature", "missing": col}), 500

        X = [[row_dict[col] for col in feature_cols]]

        # 6. 5년 뒤 가격 예측
        predicted_price = float(model.predict(X)[0])

        latest_price = float(latest["dealAmount"])
        change_rate = (predicted_price - latest_price) / latest_price

        return jsonify(
            {
                "aptNm": latest["aptNm"],
                "umdNm": latest["umdNm"],
                "latest_deal_date": latest["dealDate"].strftime("%Y-%m-%d"),
                "latest_deal_price": latest_price,
                "predicted_price_5y": predicted_price,
                "expected_change": change_rate,
            }
        )

    except Exception as e:
        print("Error:", e)
        traceback.print_exc()
        return jsonify({"error": "server_error", "message": str(e)}), 500

@app.route("/price-history", methods=["POST"])
def price_history():
    """
    요청 JSON 예시:
    {
      "aptNm": "상도",
      "years": 5            # 옵션, 기본 5년
    }

    응답:
    - 평수(버킷)별 히스토리 라인 차트 데이터
    - 가장 최근 거래 기준 5년 뒤 예측 가격
    """
    try:
        data = request.get_json()

        if not data or "aptNm" not in data:
            return jsonify({"error": "aptNm is required"}), 400

        apt_name_query = data["aptNm"].strip()
        years = int(data.get("years", 5))

        # 1. 아파트 이름으로 후보 찾기
        cand = deals_df[deals_df["aptNm"].str.contains(apt_name_query, na=False)]

        if cand.empty:
            return jsonify({"error": "apartment_not_found"}), 404

        # 2. 가장 많이 등장한 단지명으로 고정 (유사 이름 여러 개일 때)
        top_apt = cand["aptNm"].value_counts().idxmax()

        apt_deals = deals_df[deals_df["aptNm"] == top_apt].copy()

        # 3. 최근 N년으로 필터
        now = pd.Timestamp.now()
        start_date = now - pd.DateOffset(years=years)
        apt_deals = apt_deals[apt_deals["dealDate"] >= start_date]

        if apt_deals.empty:
            return jsonify({"error": "no_deals_in_range"}), 404

        apt_deals = apt_deals.sort_values("dealDate")

        # 4. 평수(버킷)별 라인 차트 데이터 만들기
        lines = []
        for bucket, grp in apt_deals.groupby("area_bucket"):
            grp = grp.sort_values("dealDate")
            points = [
                {
                    "date": row["dealDate"].strftime("%Y-%m-%d"),
                    "price": float(row["dealAmount"]),
                    "excluUseAr": float(row["excluUseAr"]),
                    "floor": int(row["floor"]) if pd.notna(row["floor"]) else None,
                }
                for _, row in grp.iterrows()
            ]

            if not points:
                continue

            lines.append(
                {
                    "area_bucket": float(bucket),  # 예: 75 -> 75㎡대
                    "points": points,
                }
            )

        # 5. 예측: 가장 최근 거래 기준으로 5년 뒤 가격
        latest = apt_deals.sort_values("dealDate").iloc[-1]
        try:
            X, feat_dict = build_features_from_row(latest)
            predicted_price = float(model.predict(X)[0])
            latest_price = float(latest["dealAmount"])
            change_rate = (predicted_price - latest_price) / latest_price

            prediction = {
                "latest_deal_date": latest["dealDate"].strftime("%Y-%m-%d"),
                "latest_deal_price": latest_price,
                "predicted_price_5y": predicted_price,
                "expected_change": change_rate,
                "latest_excluUseAr": float(latest["excluUseAr"]),
                "latest_area_bucket": float(latest["area_bucket"]),
            }
        except Exception as e:
            print("Prediction error in /price-history:", e)
            traceback.print_exc()
            prediction = None

        resp = {
            "aptNm": top_apt,
            "umdNm": apt_deals.iloc[0]["umdNm"],
            "history_years": years,
            "lines": lines,
            "prediction": prediction,
        }

        return jsonify(resp)

    except Exception as e:
        print("Error in /price-history:", e)
        traceback.print_exc()
        return jsonify({"error": "server_error", "message": str(e)}), 500



if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)

