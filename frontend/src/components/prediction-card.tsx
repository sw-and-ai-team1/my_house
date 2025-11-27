import { Card, CardContent } from "./ui/card-components";
import { TrendingUp } from "lucide-react";
import type { PredictPriceSuccessResponse } from "../types/api";

interface PredictionCardProps {
  predictionData: PredictPriceSuccessResponse;
}

export function PredictionCard({ predictionData }: PredictionCardProps) {
  const currentPrice = predictionData.latest_deal_price / 10000; // 만원 -> 억원
  const predictedPrice = predictionData.predicted_price_5y / 10000; // 만원 -> 억원
  const priceChange = predictedPrice - currentPrice;
  const percentageChange = predictionData.expected_change * 100;
  const isPositive = priceChange > 0;

  return (
    <div className="prediction-container">
      <div className="prediction-grid">
        <Card className="current-price-card">
          <CardContent className="current-price-content">
            <div className="price-header">
              <TrendingUp className="price-icon" />
              <p className="price-label">현재 가격</p>
            </div>
            <div className="price-value">
              <span className="price-number">{currentPrice.toFixed(1)}</span>
              <span className="price-unit">억원</span>
            </div>
            <p className="price-date">{predictionData.latest_deal_date} 기준</p>
          </CardContent>
        </Card>

        <Card className="predicted-price-card">
          <CardContent className="predicted-price-content">
            <div className="prediction-header">
              <TrendingUp className="prediction-icon" />
              <p className="prediction-label">예측 가격</p>
            </div>
            <div className="prediction-value">
              <span className="prediction-number">
                {predictedPrice.toFixed(1)}
              </span>
              <span className="prediction-unit">억원</span>
            </div>
            <p
              className={`prediction-change ${
                isPositive ? "positive" : "negative"
              }`}
            >
              {isPositive ? "+" : ""}
              {percentageChange.toFixed(1)}%
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="prediction-summary-card">
        <CardContent className="prediction-summary-content">
          <div className="prediction-info">
            <h3 className="summary-title">5년 후 예측 상승률</h3>
            <div className="summary-price">
              <span
                className={`summary-percentage ${
                  isPositive ? "positive" : "negative"
                }`}
              >
                {percentageChange.toFixed(1)}%
              </span>
            </div>
            <p className="summary-description">
              예상 수익률:
              <span className={isPositive ? "positive" : "negative"}>
                {isPositive ? "+" : ""}
                {priceChange.toFixed(1)}억원
              </span>
            </p>
          </div>
          <div className="prediction-circle">
            <div className="circle-chart">
              <div className="circle-value">
                <span className="circle-percentage">
                  {Math.abs(percentageChange).toFixed(0)}%
                </span>
                <span className="circle-label">
                  {isPositive ? "상승" : "하락"}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="prediction-note">
        <p>AI 분석 기반 예측으로 시장 변수의 영향을 받을 수 있습니다.</p>
      </div>
    </div>
  );
}
