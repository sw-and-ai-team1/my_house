import { useState } from "react";
import "./ApartmentPredictor.css";
import { Search, Building2, ChevronLeft } from "lucide-react";
import { Input } from "./ui/input";
import { PriceChart } from "./price-chart";
import { PredictionCard } from "./prediction-card";
import {
  usePredictPrice,
  useSearchApartments,
} from "../hooks/useApartmentQueries";
import { isErrorResponse } from "../services/api";
import type { ApartmentSearchItem } from "../types/api";

export default function ApartmentPricePredictorApp() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedApartmentName, setSelectedApartmentName] = useState<
    string | null
  >(null);
  const [showResults, setShowResults] = useState(false);

  // TanStack Query를 사용한 API 호출
  const {
    data: predictionData,
    isLoading,
    error: queryError,
  } = usePredictPrice(selectedApartmentName || "");

  // 검색 API 호출
  const { data: searchResponse, isLoading: isSearchLoading } =
    useSearchApartments(searchQuery);

  // 검색 결과 처리
  const searchResults =
    searchResponse && !isErrorResponse(searchResponse)
      ? searchResponse.apartments
      : [];

  const handleSelect = (apartment: ApartmentSearchItem) => {
    setSelectedApartmentName(apartment.aptNm);
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
      case "server_error":
        return "서버 오류가 발생했습니다.";
      default:
        return "알 수 없는 오류가 발생했습니다.";
    }
  };

  // 에러 처리
  const errorMessage =
    queryError && isErrorResponse(queryError)
      ? getErrorMessage(queryError.error)
      : queryError
      ? "네트워크 오류가 발생했습니다."
      : null;

  // 성공적인 예측 데이터가 있고 에러가 아닌 경우
  const selectedApartment =
    predictionData && !isErrorResponse(predictionData) ? predictionData : null;

  return (
    <div className="app-container">
      <div className="app-wrapper">
        {/* Animated background elements */}
        <div className="bg-gradient-1" />
        <div className="bg-gradient-2" />

        {/* Main scrollable content */}
        <div className="main-content">
          {isLoading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p className="loading-text">데이터를 불러오는 중...</p>
            </div>
          ) : errorMessage ? (
            <div className="error-container">
              <p className="error-text">{errorMessage}</p>
              <button
                className="back-button"
                onClick={() => {
                  setSelectedApartmentName(null);
                }}
              >
                <ChevronLeft className="back-icon" />
                돌아가기
              </button>
            </div>
          ) : selectedApartment ? (
            <div className="dashboard-content">
              {/* Header with back button */}
              <div className="dashboard-header">
                <button
                  onClick={() => setSelectedApartmentName(null)}
                  className="back-button"
                >
                  <ChevronLeft className="back-icon" />
                </button>
                <h1 className="dashboard-title">돌아가기</h1>
              </div>

              {/* Selected Apartment Info */}
              <div className="selected-apartment">
                <div className="apartment-info">
                  <div className="apartment-icon">
                    <Building2 className="building-icon" />
                  </div>
                  <div className="apartment-details">
                    <h2 className="apartment-name">
                      {selectedApartment.aptNm}
                    </h2>
                    <p className="apartment-location">
                      {selectedApartment.umdNm}
                    </p>
                  </div>
                </div>
              </div>

              <div className="dashboard-layout">
                <div className="chart-section">
                  <PriceChart apartmentName={selectedApartment.aptNm} />
                </div>

                <div className="prediction-section">
                  <PredictionCard predictionData={selectedApartment} />
                </div>
              </div>
            </div>
          ) : (
            <div className="welcome-content">
              {/* Logo Section */}
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
                                <h3 className="apartment-name">
                                  {apartment.aptNm}
                                </h3>
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
                    위의 검색창에서 원하는 아파트를 찾아 과거 5년의 시세 변화와
                    향후 5년 예측을 확인하세요
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
