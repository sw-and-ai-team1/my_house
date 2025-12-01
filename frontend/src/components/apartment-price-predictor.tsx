import { useState, useEffect, useRef } from "react";
import "./ApartmentPredictor.css";
import { Search, Building2, ChevronLeft } from "lucide-react";
import { Input } from "./ui/input";
import { PriceChart } from "./price-chart";
import { PredictionCard } from "./prediction-card";
import {
  usePredictPrice,
  useSearchApartments,
  useAreaBuckets,
} from "../hooks/useApartmentQueries";
import { isErrorResponse } from "../services/api";
import type { ApartmentSearchItem } from "../types/api";
import { Loading } from "./ui/loading";
import { Error } from "./ui/error";
import { SelectBucket } from "./ui/select-bucket";
export default function ApartmentPricePredictorApp() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedApartmentName, setSelectedApartmentName] = useState<
    string | null
  >(null);
  const [selectedAreaBucket, setSelectedAreaBucket] = useState<string>("");
  const [showResults, setShowResults] = useState(false);
  const initializedAreaBucketRef = useRef<string | null>(null);

  const {
    data: predictionData,
    isLoading,
    error: queryError,
  } = usePredictPrice(selectedApartmentName || "", selectedAreaBucket);

  const { data: searchResponse, isLoading: isSearchLoading } =
    useSearchApartments(searchQuery);

  const { data: areaBucketsResponse, isLoading: isAreaBucketsLoading } =
    useAreaBuckets(selectedApartmentName || "");

  useEffect(() => {
    if (
      areaBucketsResponse &&
      !isErrorResponse(areaBucketsResponse) &&
      selectedAreaBucket === "" &&
      initializedAreaBucketRef.current !== selectedApartmentName
    ) {
      const areaBuckets = areaBucketsResponse as { area_buckets: number[] };
      if (areaBuckets && areaBuckets.area_buckets.length > 0) {
        initializedAreaBucketRef.current = selectedApartmentName;
        initializedAreaBucketRef.current = selectedAreaBucket;
      }
    }
  }, [areaBucketsResponse, selectedApartmentName, selectedAreaBucket]);

  // 검색 결과 처리
  const searchResults =
    searchResponse && !isErrorResponse(searchResponse)
      ? searchResponse.apartments
      : [];

  const handleSelect = (apartment: ApartmentSearchItem) => {
    setSelectedApartmentName(apartment.aptNm);
    setSelectedAreaBucket("");
    initializedAreaBucketRef.current = null;
    setShowResults(false);
    setSearchQuery("");
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      setShowResults(true);
    }
  };

  const getErrorMessage = (error: string) => {
    switch (error) {
      case "apartment_not_found":
        return "검색된 아파트를 찾을 수 없습니다.";
      case "missing_feature":
        return "데이터가 부족하여 예측할 수 없습니다.";
      case "no_deals_in_range":
        return "최근 거래 데이터가 없습니다.";
      case "no_deals_in_area":
        return "선택한 평형의 거래 데이터가 없습니다.";
      case "server_error":
        return "서버 오류가 발생했습니다.";
      default:
        return "알 수 없는 오류가 발생했습니다.";
    }
  };

  const errorMessage =
    queryError && isErrorResponse(queryError)
      ? getErrorMessage(queryError.error)
      : queryError
      ? "네트워크 오류가 발생했습니다."
      : null;

  const selectedApartment =
    predictionData && !isErrorResponse(predictionData) ? predictionData : null;

  const renderContent = () => {
    if (isLoading || isAreaBucketsLoading) {
      return <Loading />;
    }
    if (errorMessage) {
      return (
        <Error
          errorMessage={errorMessage}
          onClick={() => setSelectedApartmentName(null)}
        />
      );
    }
    if (selectedApartment) {
      return (
        <div className="dashboard-content">
          <div className="dashboard-header">
            <button
              onClick={() => setSelectedApartmentName(null)}
              className="back-button"
            >
              <ChevronLeft className="back-icon" />
            </button>
            <h1 className="dashboard-title">돌아가기</h1>
          </div>
          <SelectBucket
            areaBuckets={
              (areaBucketsResponse as { area_buckets: number[] }).area_buckets
            }
            selectedBucket={selectedAreaBucket}
            onChange={setSelectedAreaBucket}
          />
          <div className="selected-apartment">
            <div className="apartment-info">
              <div className="apartment-icon">
                <Building2 className="building-icon" />
              </div>
              <div className="apartment-details">
                <h2 className="apartment-name">{selectedApartment.aptNm}</h2>
                <p className="apartment-location">{selectedApartment.umdNm}</p>
              </div>
            </div>
          </div>

          <div className="dashboard-layout">
            <div className="chart-section">
              <PriceChart 
                apartmentName={selectedApartment.aptNm} 
                areaBucket={selectedAreaBucket}
              />
            </div>

            <div className="prediction-section">
              <PredictionCard predictionData={selectedApartment} />
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className="welcome-content">
        <div className="logo-section">
          <img src="/logo.png" alt="Logo" className="welcome-logo" />
        </div>
        <p className="welcome-subtitle">
          아파트 시세를 분석하고, 향후 5년을 예측할게요
        </p>

        <div className="search-section">
          <div className="search-input-container">
            <Input
              placeholder="아파트 검색..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowResults(true);
              }}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="search-input"
            />
            <Search className="search-icon" />
          </div>
        </div>

        {showResults && searchQuery ? (
          <div className="search-results-wrapper">
            {isSearchLoading ? (
              <div className="search-results-container">
                <div className="search-results-list">
                  <div className="search-loading">
                    <div className="loading-spinner"></div>
                    <p>검색 중...</p>
                  </div>
                </div>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="search-results-container">
                <div className="search-results-list">
                  {searchResults.map((apartment, index) => (
                    <div
                      key={`${apartment.aptNm}-${index}`}
                      onClick={() => handleSelect(apartment)}
                      className="search-result-item"
                    >
                      <div className="search-result-content">
                        <div className="search-result-icon">
                          <Building2 className="icon" />
                        </div>
                        <div className="search-result-info">
                          <h3 className="apartment-name">{apartment.aptNm}</h3>
                          <p className="apartment-location">
                            {apartment.location}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="search-results-empty">
                <p>검색 결과가 없습니다</p>
              </div>
            )}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">
              <Building2 className="empty-building-icon" />
            </div>
            <h3 className="empty-state-title">아파트를 검색하세요</h3>
            <p className="empty-state-description">
              위의 검색창에서 원하는 아파트를 찾아 과거 5년의 시세 변화와 향후
              5년 예측을 확인하세요
            </p>
          </div>
        )}
      </div>
    );
  };
  return (
    <div className="app-container">
      <div className="app-wrapper">
        <div className="bg-gradient-1" />
        <div className="bg-gradient-2" />
        <div className="main-content">{renderContent()}</div>
      </div>
    </div>
  );
}
