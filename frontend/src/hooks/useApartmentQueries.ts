import { useQuery } from "@tanstack/react-query";
import {
  predictPrice,
  getPriceHistory,
  searchApartments,
  getAreaBuckets,
} from "../services/api";

export const usePredictPrice = (aptNm: string, areaBucket?: string) => {
  return useQuery({
    queryKey: ["predict-price", aptNm, areaBucket],
    queryFn: () => predictPrice(aptNm, areaBucket),
    enabled: !!aptNm && aptNm.trim().length > 0,
  });
};

export const usePriceHistory = (aptNm: string, years: number = 5, areaBucket?: string) => {
  return useQuery({
    queryKey: ["price-history", aptNm, years, areaBucket],
    queryFn: () => getPriceHistory(aptNm, years, areaBucket),
    enabled: !!aptNm && aptNm.trim().length > 0,
  });
};

export const useSearchApartments = (query: string) => {
  return useQuery({
    queryKey: ["search-apartments", query],
    queryFn: () => searchApartments(query),
    enabled: !!query && query.trim().length > 0,
    staleTime: 10 * 60 * 1000, // 검색 결과는 10분간 fresh
  });
};

export const useAreaBuckets = (aptNm: string) => {
  return useQuery({
    queryKey: ["area-buckets", aptNm],
    queryFn: () => getAreaBuckets(aptNm),
    enabled: !!aptNm && aptNm.trim().length > 0,
  });
};
