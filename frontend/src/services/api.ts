import type { 
  PredictPriceResponse, 
  PriceHistoryResponse,
  ApiErrorResponse 
} from '../types/api';

// Vite 프록시를 통해 상대 경로로 요청

export function isErrorResponse(response: unknown): response is ApiErrorResponse {
  return Boolean(response && typeof response === 'object' && response !== null && 'error' in response);
}

export async function predictPrice(aptNm: string): Promise<PredictPriceResponse> {
  try {
    const res = await fetch('/predict-price', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ aptNm }),
    });

    const data: PredictPriceResponse = await res.json();
    return data;
  } catch (error) {
    return {
      error: 'server_error',
      message: error instanceof Error ? error.message : 'Network error'
    };
  }
}

export async function getPriceHistory(aptNm: string, years: number = 5): Promise<PriceHistoryResponse> {
  try {
    const res = await fetch('/price-history', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ aptNm, years }),
    });

    const data: PriceHistoryResponse = await res.json();
    return data;
  } catch (error) {
    return {
      error: 'server_error',
      message: error instanceof Error ? error.message : 'Network error'
    };
  }
}

export async function searchApartments(query: string): Promise<import('../types/api').ApartmentSearchResponse> {
  try {
    const res = await fetch('/search-apartments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    });

    const data: import('../types/api').ApartmentSearchResponse = await res.json();
    return data;
  } catch (error) {
    return {
      error: 'server_error',
      message: error instanceof Error ? error.message : 'Network error'
    };
  }
}