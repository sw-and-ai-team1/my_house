# ml/prepare_data.py
import requests
import xml.etree.ElementTree as ET
from urllib.parse import urlencode
import pandas as pd

BASE_URL = "https://apis.data.go.kr/1613000/RTMSDataSvcAptTradeDev/getRTMSDataSvcAptTradeDev"

def make_training_data():
    # 1. 방금 만든 raw 데이터 불러오기
    df = pd.read_csv("data/sangdo_raw.csv", parse_dates=["dealDate"])

    # 2. 아파트 이름 + 면적 버킷으로 묶기 (비슷한 평형끼리 그룹)
    df["area_bucket"] = (df["excluUseAr"] // 5) * 5  # 5㎡ 단위로 버킷

    df = df.sort_values("dealDate")

    records = []

    # 3. 아파트 + 평형 그룹별로 5년 뒤 가격 찾기
    for (aptNm, area_bucket), grp in df.groupby(["aptNm", "area_bucket"]):
        grp = grp.sort_values("dealDate").reset_index(drop=True)

        for i, row in grp.iterrows():
            t_date = row["dealDate"]
            if pd.isna(t_date):
                continue

            # 5년 뒤 ± 6개월 범위
            future_start = t_date + pd.DateOffset(years=5) - pd.DateOffset(months=6)
            future_end = t_date + pd.DateOffset(years=5) + pd.DateOffset(months=6)

            future_rows = grp[
                (grp["dealDate"] >= future_start)
                & (grp["dealDate"] <= future_end)
            ]

            # 5년 뒤 근처에 거래 없으면 이 행은 학습에 사용 X
            if len(future_rows) == 0:
                continue

            future_price = future_rows["dealAmount"].mean()

            # 연식
            build_year = row.get("buildYear")
            deal_year = row.get("dealYear")
            if pd.notna(build_year) and pd.notna(deal_year):
                age_at_deal = int(deal_year) - int(build_year)
            else:
                age_at_deal = None

            record = {
                "aptNm": aptNm,
                "area_bucket": area_bucket,
                "dealDate": t_date,
                "dealAmount_now": row["dealAmount"],  # 현재 시점 가격
                "buildYear": build_year,
                "age_at_deal": age_at_deal,
                "excluUseAr": row["excluUseAr"],
                "floor": row["floor"],
                "dealYear": row["dealYear"],
                "dealMonth": row["dealMonth"],
                "price_5y": future_price,  # 타겟(5년 뒤 평균 거래가)
            }
            records.append(record)

    train_df = pd.DataFrame(records)

    # 4. 학습에 꼭 필요한 값 없는 행은 제거
    train_df = train_df.dropna(
        subset=["dealAmount_now", "price_5y", "excluUseAr", "age_at_deal"]
    )

    train_df.to_csv("data/sangdo_training.csv", index=False, encoding="utf-8-sig")
    print("Saved training data to data/sangdo_training.csv")
    print("shape:", train_df.shape)

    return train_df


def fetch_deals_one_month(lawd_cd: str, deal_ym: str, service_key: str, num_of_rows: int = 1000):
    """
    lawd_cd: '11590' (동작구)
    deal_ym: '202508' (2025년 8월)
    """
    params = {
        "LAWD_CD": lawd_cd,
        "DEAL_YMD": deal_ym,
        "serviceKey": service_key,
        "pageNo": 1,
        "numOfRows": num_of_rows,
    }

    url = f"{BASE_URL}?{urlencode(params, doseq=True)}"
    res = requests.get(url, timeout=10)
    res.raise_for_status()

    res.encoding = "euc-kr"

    xml_text = res.text  # 이제 euc-kr → 유니코드 문자열로 잘 변환된 상태
    root = ET.fromstring(xml_text)

    items = []
    for item in root.findall(".//item"):
        def get(tag):
            el = item.find(tag)
            return el.text.strip() if el is not None and el.text is not None else None

        deal_amount_raw = get("dealAmount")
        if deal_amount_raw:
            deal_amount = int(deal_amount_raw.replace(",", "").strip())
        else:
            deal_amount = None

        row = {
            "aptNm": get("aptNm"),
            "aptSeq": get("aptSeq"),
            "excluUseAr": float(get("excluUseAr")) if get("excluUseAr") else None,
            "dealYear": int(get("dealYear")) if get("dealYear") else None,
            "dealMonth": int(get("dealMonth")) if get("dealMonth") else None,
            "dealDay": int(get("dealDay")) if get("dealDay") else None,
            "dealAmount": deal_amount,
            "buildYear": int(get("buildYear")) if get("buildYear") else None,
            "umdNm": get("umdNm"),
            "sggCd": get("sggCd"),
            "floor": int(get("floor")) if get("floor") else None,
        }
        items.append(row)

    return items

def fetch_sangdo_range(service_key: str, start_year: int = 2020, end_year: int = 2025):
    lawd_cd = "11590"  # 서울 동작구
    all_rows = []

    for year in range(start_year, end_year + 1):
        for month in range(1, 13):
            deal_ym = f"{year}{month:02d}"
            print(f"Fetching {lawd_cd}, {deal_ym}...")
            rows = fetch_deals_one_month(lawd_cd, deal_ym, service_key)
            all_rows.extend(rows)

    df = pd.DataFrame(all_rows)
    # 상도동만 필터
    df = df[df["umdNm"] == "상도동"].copy()

    # 날짜 컬럼 만들기
    # dealYear, dealMonth, dealDay를 문자열로 합쳐서 'YYYY-MM-DD' 형태로 만든 뒤 파싱
    df["dealDate"] = pd.to_datetime(
        df["dealYear"].astype("Int64").astype(str)
        + "-"
        + df["dealMonth"].astype("Int64").astype(str).str.zfill(2)
        + "-"
        + df["dealDay"].astype("Int64").astype(str).str.zfill(2),
        errors="coerce"
    )

    # 저장
    df.to_csv("data/sangdo_raw.csv", index=False, encoding="utf-8-sig")
    print("Saved to data/sangdo_raw.csv")
    return df


if __name__ == "__main__":
    SERVICE_KEY = "sCqdbs6ZAvEzlukEFMjMpzm382vZjp/kwNd8YSG6GLE1I+n9jpwBFEnIoAlCebThhnOPeaEIkXtGGLvVf40O3w=="
    make_training_data()


    