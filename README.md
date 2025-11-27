# 🏠 울집올라 (My House Goes Up)

공공데이터 기반 부동산 가격 예측 서비스  
특정 아파트의 **과거 5년 실거래 가격 추이**와  
**향후 5년 뒤 예측 가격**을 머신러닝으로 제공하는 웹 서비스입니다.

---

## ✅ 프로젝트 핵심 기능

- 상도동 아파트 실거래 공공데이터 자동 수집
- 아파트 이름 검색 기능
- 최근 5년 실거래 가격 **평수별 라인 차트 데이터 제공**
- 최근 거래 기준 **5년 뒤 가격 예측**
- 가격 상승/하락률 자동 계산
- Flask API 형태로 프론트엔드 연동 가능

---

## 🧠 머신러닝 모델 개요

| 항목        | 내용                                                |
| ----------- | --------------------------------------------------- |
| 문제 유형   | 회귀 (Regression)                                   |
| 예측 목표   | 5년 뒤 아파트 실거래 가격                           |
| 사용 모델   | RandomForestRegressor                               |
| 입력 데이터 | 실거래 가격, 전용면적, 층수, 연식, 거래연도, 거래월 |
| 출력 값     | 5년 후 예측 가격                                    |
| 학습 데이터 | 2010 ~ 2025 상도동 실거래 데이터                    |

---

## 📊 모델 입력 Feature

```text
dealAmount_now   : 현재 실거래가
excluUseAr       : 전용면적(㎡)
age_at_deal      : 거래 시점 기준 연식
floor            : 층수
dealYear         : 거래 연도
dealMonth        : 거래 월
``
```

## 🎯 모델 Target (정답값)

price_5y : 거래 시점 기준 약 5년 후의 평균 실거래가

동일 아파트 + 동일 평수대(area_bucket)

± 6개월 범위 내 가장 가까운 미래 거래 평균값 사용

## 🏗️ 기술 스택

### ✅ 데이터 수집 & 전처리

- **데이터 출처**

  - 국토교통부 아파트 실거래 공공데이터 API
  - 응답 포맷: XML

- **사용 기술**

  - Python
  - requests
  - pandas
  - xml.etree.ElementTree

- **전처리 내용**
  - 결측치 제거 (dropna)
  - 날짜 파싱 (`pd.to_datetime`)
  - 연식 계산
    ```
    age_at_deal = dealYear - buildYear
    ```
  - 평수 버킷화 (5㎡ 단위 그룹화)
    ```
    area_bucket = (excluUseAr // 5) * 5
    ```
  - 상도동 데이터 필터링
  - 학습용 CSV 저장 (`sangdo_raw.csv`, `sangdo_training.csv`)

---

### ✅ 머신러닝 (가격 예측 모델)

- **사용 라이브러리**

  - scikit-learn
  - joblib

- **모델**

  - RandomForestRegressor

- **학습 방식**

  - train_test_split 기반 학습/검증 데이터 분리
  - 평가 지표: MAE (Mean Absolute Error)

- **모델 저장**
  - `model.joblib` 파일로 저장 후 서버에서 로드하여 사용

---

### ✅ 백엔드 서버

- **Framework**

  - Flask

- **기능**

  - 가격 단일 예측 API (`/predict-price`)
  - 5년 가격 히스토리 + 5년 뒤 예측 API (`/price-history`)
  - 평수(버킷)별 가격 라인 차트 데이터 제공

- **통신 방식**

  - REST API (JSON)

- **모델 서빙**
  - joblib 로드 후 실시간 예측 처리
