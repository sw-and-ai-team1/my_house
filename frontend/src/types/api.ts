// 공통 에러 응답
export interface ApiErrorResponse {
  error:
    | "aptNm is required"
    | "apartment_not_found"
    | "missing_feature"
    | "no_deals_in_range"
    | "server_error"
    | string; // 혹시 모를 기타 문자열 대비

  // 선택적으로 붙는 필드들
  missing?: string; // "missing_feature" 일 때 빠진 feature 이름
  message?: string; // server_error 일 때 에러 메시지
}

// ------------------------
// /predict-price 응답
// ------------------------

export interface PredictPriceSuccessResponse {
  aptNm: string;                // 아파트 이름 (예: "이수브라운스톤상도(527-0)")
  umdNm: string;                // 법정동 이름 (예: "상도동")
  latest_deal_date: string;     // "YYYY-MM-DD"
  latest_deal_price: number;    // 최근 실거래가
  predicted_price_5y: number;   // 5년 후 예측 가격
  expected_change: number;      // (예측 - 현재) / 현재  (예: 0.12 = +12%)
}

// fetch 사용 시
export type PredictPriceResponse = PredictPriceSuccessResponse | ApiErrorResponse;

// ------------------------
// /price-history 응답
// ------------------------

export interface PriceHistoryPoint {
  date: string;       // "YYYY-MM-DD"
  price: number;      // 해당 날짜 실거래가
  excluUseAr: number; // 전용면적
  floor: number | null;
}

export interface PriceHistoryLine {
  area_bucket: number;      // 평형 버킷 (예: 75 → 75㎡대)
  points: PriceHistoryPoint[];
}

export interface PriceHistoryPrediction {
  latest_deal_date: string;     // 예측 기준이 된 마지막 거래 날짜
  latest_deal_price: number;    // 기준 거래 가격
  predicted_price_5y: number;   // 5년 뒤 예측 가격
  expected_change: number;      // 변동률 (예: -0.044 → -4.4%)
  latest_excluUseAr: number;    // 기준 거래의 전용면적
  latest_area_bucket: number;   // 기준 거래의 면적 버킷
}

export interface PriceHistorySuccessResponse {
  aptNm: string;                 // 최종 선택된 단지명
  umdNm: string;                 // 상도동
  history_years: number;         // 요청한 연도 범위 (기본 5)
  lines: PriceHistoryLine[];     // 평수별 라인 차트 데이터
  prediction: PriceHistoryPrediction | null; // 예측 실패 시 null 가능
}

// fetch 사용 시
export type PriceHistoryResponse =
  | PriceHistorySuccessResponse
  | ApiErrorResponse;

// ------------------------
// /search-apartments 응답
// ------------------------

export interface ApartmentSearchItem {
  aptNm: string;           // 아파트 이름
  umdNm: string;          // 법정동 이름
  location: string;       // 전체 주소
}

export interface ApartmentSearchSuccessResponse {
  apartments: ApartmentSearchItem[];
}

// fetch 사용 시
export type ApartmentSearchResponse =
  | ApartmentSearchSuccessResponse
  | ApiErrorResponse;