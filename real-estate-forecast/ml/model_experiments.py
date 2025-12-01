# ml/model_experiments.py
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import LinearRegression, Ridge, Lasso
from sklearn.svm import SVR
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import joblib

def load_data():
    """데이터 로드 및 기본 전처리"""
    df = pd.read_csv("data/sangdo_training.csv")
    return df

def get_baseline_features():
    """기본 특성"""
    return [
        "dealAmount_now",  # 현재 거래가격
        "excluUseAr",      # 전용면적
        "age_at_deal",     # 연식
        "floor",           # 층
        "dealYear",
        "dealMonth",
    ]

def feature_engineering(df):
    """특성공학 적용"""
    df_fe = df.copy()
    
    # 1. 면적당 가격 (만원/㎡)
    df_fe['price_per_area'] = df_fe['dealAmount_now'] / df_fe['excluUseAr']
    
    # 2. 건물 연식 구간화
    df_fe['age_group'] = pd.cut(df_fe['age_at_deal'], 
                               bins=[0, 5, 10, 20, float('inf')], 
                               labels=[0, 1, 2, 3])
    
    # 3. 층 구간화 (저층/중층/고층)
    df_fe['floor_group'] = pd.cut(df_fe['floor'], 
                                 bins=[0, 5, 15, float('inf')], 
                                 labels=[0, 1, 2])
    
    # 4. 거래 시기 특성 (계절성)
    df_fe['season'] = df_fe['dealMonth'].apply(lambda x: 
        0 if x in [12, 1, 2] else  # 겨울
        1 if x in [3, 4, 5] else   # 봄
        2 if x in [6, 7, 8] else   # 여름
        3)  # 가을
    
    return df_fe

def evaluate_model(model_name, model, X_train, X_test, y_train, y_test, scaler=None):
    """모델 평가"""
    # 스케일링 적용 (필요한 경우)
    if scaler:
        X_train_scaled = scaler.fit_transform(X_train)
        X_test_scaled = scaler.transform(X_test)
        model.fit(X_train_scaled, y_train)
        y_pred = model.predict(X_test_scaled)
    else:
        model.fit(X_train, y_train)
        y_pred = model.predict(X_test)
    
    # 평가 지표 계산
    mae = mean_absolute_error(y_test, y_pred)
    mse = mean_squared_error(y_test, y_pred)
    rmse = np.sqrt(mse)
    r2 = r2_score(y_test, y_pred)
    
    return {
        'model': model_name,
        'mae': mae,
        'mse': mse,
        'rmse': rmse,
        'r2': r2
    }

def experiment_1_baseline():
    """실험 1: 기본 RandomForest (Baseline)"""
    print("=== 실험 1: Baseline (RandomForest) ===")
    
    df = load_data()
    features = get_baseline_features()
    X = df[features]
    y = df["price_5y"]
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    model = RandomForestRegressor(n_estimators=300, random_state=42, n_jobs=-1)
    result = evaluate_model("RandomForest_Baseline", model, X_train, X_test, y_train, y_test)
    
    print(f"MAE: {result['mae']:.2f}만원")
    print(f"RMSE: {result['rmse']:.2f}만원")
    print(f"R²: {result['r2']:.4f}")
    print()
    
    return result

def experiment_2_model_comparison():
    """실험 2: 다양한 회귀 모델 비교"""
    print("=== 실험 2: 모델 변경 실험 ===")
    
    df = load_data()
    features = get_baseline_features()
    X = df[features]
    y = df["price_5y"]
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    models = [
        ("Linear Regression", LinearRegression(), StandardScaler()),
        ("Ridge Regression", Ridge(alpha=1000), StandardScaler()),
        ("Lasso Regression", Lasso(alpha=100), StandardScaler()),
        ("SVR", SVR(kernel='rbf', C=1000, gamma='scale'), StandardScaler()),
        ("RandomForest", RandomForestRegressor(n_estimators=300, random_state=42), None)
    ]
    
    results = []
    for name, model, scaler in models:
        result = evaluate_model(name, model, X_train, X_test, y_train, y_test, scaler)
        results.append(result)
        print(f"{name}:")
        print(f"  MAE: {result['mae']:.2f}만원")
        print(f"  RMSE: {result['rmse']:.2f}만원")  
        print(f"  R²: {result['r2']:.4f}")
        print()
    
    return results

def experiment_3_feature_engineering():
    """실험 3: 특성공학"""
    print("=== 실험 3: 특성공학 ===")
    
    df = load_data()
    df_fe = feature_engineering(df)
    
    # 기본 특성
    baseline_features = get_baseline_features()
    
    # 특성공학 적용된 특성
    engineered_features = baseline_features + [
        'price_per_area', 'age_group', 'floor_group', 'season'
    ]
    
    # 기본 특성으로 실험
    X_baseline = df[baseline_features]
    y = df["price_5y"]
    X_train_base, X_test_base, y_train, y_test = train_test_split(X_baseline, y, test_size=0.2, random_state=42)
    
    model_baseline = RandomForestRegressor(n_estimators=300, random_state=42, n_jobs=-1)
    result_baseline = evaluate_model("RF_Baseline_Features", model_baseline, X_train_base, X_test_base, y_train, y_test)
    
    # 특성공학 적용된 특성으로 실험
    X_engineered = df_fe[engineered_features]
    X_train_eng, X_test_eng, _, _ = train_test_split(X_engineered, y, test_size=0.2, random_state=42)
    
    model_engineered = RandomForestRegressor(n_estimators=300, random_state=42, n_jobs=-1)
    result_engineered = evaluate_model("RF_Feature_Engineering", model_engineered, X_train_eng, X_test_eng, y_train, y_test)
    
    print("기본 특성:")
    print(f"  MAE: {result_baseline['mae']:.2f}만원")
    print(f"  RMSE: {result_baseline['rmse']:.2f}만원")
    print(f"  R²: {result_baseline['r2']:.4f}")
    print()
    
    print("특성공학 적용:")
    print(f"  MAE: {result_engineered['mae']:.2f}만원")
    print(f"  RMSE: {result_engineered['rmse']:.2f}만원")
    print(f"  R²: {result_engineered['r2']:.4f}")
    print()
    
    improvement = result_baseline['mae'] - result_engineered['mae']
    print(f"MAE 개선: {improvement:.2f}만원 ({'향상' if improvement > 0 else '감소'})")
    
    return result_baseline, result_engineered

def main():
    print("부동산 가격 예측 모델 실험\n")
    
    # 실험 1: Baseline
    baseline_result = experiment_1_baseline()
    
    # 실험 2: 모델 비교
    model_results = experiment_2_model_comparison()
    
    # 실험 3: 특성공학
    fe_baseline, fe_engineered = experiment_3_feature_engineering()
    
    # 최종 요약
    print("=== 실험 요약 ===")
    print(f"1. Baseline RandomForest MAE: {baseline_result['mae']:.2f}만원")
    
    best_model = min(model_results, key=lambda x: x['mae'])
    print(f"2. 최고 성능 모델: {best_model['model']} (MAE: {best_model['mae']:.2f}만원)")
    
    print(f"3. 특성공학 전: {fe_baseline['mae']:.2f}만원")
    print(f"   특성공학 후: {fe_engineered['mae']:.2f}만원")
    print(f"   개선도: {fe_baseline['mae'] - fe_engineered['mae']:.2f}만원")

if __name__ == "__main__":
    main()