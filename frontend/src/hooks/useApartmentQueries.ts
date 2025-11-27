import { useQuery } from '@tanstack/react-query';
import { predictPrice, getPriceHistory, searchApartments } from '../services/api';

export const usePredictPrice = (aptNm: string) => {
  return useQuery({
    queryKey: ['predict-price', aptNm],
    queryFn: () => predictPrice(aptNm),
    enabled: !!aptNm && aptNm.trim().length > 0,
  });
};

export const usePriceHistory = (aptNm: string, years: number = 5) => {
  return useQuery({
    queryKey: ['price-history', aptNm, years],
    queryFn: () => getPriceHistory(aptNm, years),
    enabled: !!aptNm && aptNm.trim().length > 0,
  });
};

export const useSearchApartments = (query: string) => {
  return useQuery({
    queryKey: ['search-apartments', query],
    queryFn: () => searchApartments(query),
    enabled: !!query && query.trim().length > 0,
    staleTime: 10 * 60 * 1000, // 검색 결과는 10분간 fresh
  });
};