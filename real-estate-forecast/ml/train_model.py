# ml/train_model.py
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error
import joblib

def main():
    # 1. 학습용 데이터 로드
    df = pd.read_csv("data/sangdo_training.csv")

    # 2. 사용할 feature와 target 정의
    feature_cols = [
        "dealAmount_now",  # 현재 거래가격
        "excluUseAr",      # 전용면적
        "age_at_deal",     # 연식
        "floor",           # 층
        "dealYear",
        "dealMonth",
    ]
    target_col = "price_5y"       # 5년 뒤 가격

    X = df[feature_cols]
    y = df[target_col]

    # 3. train / test 분리
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    # 4. 모델 정의 (RandomForest 회귀)
    model = RandomForestRegressor(
        n_estimators=300,
        random_state=42,
        n_jobs=-1,
    )

    # 5. 학습
    model.fit(X_train, y_train)

    # 6. 평가
    y_pred = model.predict(X_test)
    mae = mean_absolute_error(y_test, y_pred)
    print(f"Test MAE: {mae:.2f} (단위: dealAmount와 동일)")

    # 7. 저장
    joblib.dump(
        {
            "model": model,
            "features": feature_cols,
        },
        "ml/model.joblib",
    )
    print("Saved model to ml/model.joblib")


if __name__ == "__main__":
    main()
