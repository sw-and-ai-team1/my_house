import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card-components";
import { usePriceHistory } from "../hooks/useApartmentQueries";
import { isErrorResponse } from "../services/api";
import type { PriceHistorySuccessResponse } from "../types/api";

interface ChartDataPoint {
  date: string;
  year: string;
  actualPrice: number | null;
  predictedPrice: number | null;
  type: string;
}

const transformHistoryData = (
  historyData: PriceHistorySuccessResponse
): ChartDataPoint[] => {
  if (!historyData.lines || historyData.lines.length === 0) {
    return [];
  }

  // 가장 많은 데이터를 가진 면적 버킷 선택
  const mainLine = historyData.lines.reduce((prev, current) =>
    prev.points.length > current.points.length ? prev : current
  );

  // 실제 데이터를 날짜별로 그룹화하여 평균값 계산
  const dataByYear = new Map<string, { prices: number[]; dates: string[] }>();

  mainLine.points.forEach((point) => {
    const year = point.date.split("-")[0];
    if (!dataByYear.has(year)) {
      dataByYear.set(year, { prices: [], dates: [] });
    }
    dataByYear.get(year)!.prices.push(point.price);
    dataByYear.get(year)!.dates.push(point.date);
  });

  // 연도별 평균 가격 계산
  const actualData: ChartDataPoint[] = [];

  for (const [year, data] of dataByYear.entries()) {
    const avgPrice =
      data.prices.reduce((sum, price) => sum + price, 0) / data.prices.length;
    // 가장 최근 날짜 선택
    const latestDate = data.dates.sort().pop() || `${year}-12-31`;

    actualData.push({
      date: latestDate,
      year: year,
      actualPrice: Math.round(avgPrice),
      predictedPrice: null,
      type: "과거",
    });
  }

  // 예측 데이터 추가
  if (historyData.prediction) {
    const latestYear = Math.max(
      ...Array.from(dataByYear.keys()).map((y) => parseInt(y))
    );
    const futureYear = latestYear + 5;

    actualData.push({
      date: `${futureYear}-12-31`,
      year: futureYear.toString(),
      actualPrice: null,
      predictedPrice: Math.round(historyData.prediction.predicted_price_5y),
      type: "예측",
    });
  }

  return actualData.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
};

export function PriceChart({ 
  apartmentName, 
  areaBucket 
}: { 
  apartmentName: string;
  areaBucket?: string;
}) {
  // TanStack Query를 사용한 API 호출
  const {
    data: historyResponse,
    isLoading,
    error: queryError,
  } = usePriceHistory(apartmentName, 5, areaBucket);

  // 에러 처리
  const error =
    queryError && isErrorResponse(queryError)
      ? "가격 데이터를 불러올 수 없습니다."
      : queryError
      ? "네트워크 오류가 발생했습니다."
      : null;

  // 성공적인 히스토리 데이터가 있고 에러가 아닌 경우
  const historyData =
    historyResponse && !isErrorResponse(historyResponse)
      ? historyResponse
      : null;

  const data = historyData ? transformHistoryData(historyData) : [];

  if (isLoading) {
    return (
      <Card className="price-chart-card">
        <CardHeader className="price-chart-header">
          <CardTitle className="price-chart-title">
            5년 가격 변화 추이
          </CardTitle>
        </CardHeader>
        <CardContent className="price-chart-content">
          <div className="chart-loading">
            <div className="loading-spinner"></div>
            <p>차트 데이터를 불러오는 중...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="price-chart-card">
        <CardHeader className="price-chart-header">
          <CardTitle className="price-chart-title">
            5년 가격 변화 추이
          </CardTitle>
        </CardHeader>
        <CardContent className="price-chart-content">
          <div className="chart-error">
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="price-chart-card">
      <CardHeader className="price-chart-header">
        <CardTitle className="price-chart-title">5년 가격 변화 추이</CardTitle>
      </CardHeader>
      <CardContent className="price-chart-content">
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart
            data={data}
            margin={{ top: 30, right: 30, left: -20, bottom: 20 }}
          >
            <defs>
              <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#f97316" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(148, 163, 184, 0.1)"
              vertical={false}
            />
            <XAxis
              dataKey="year"
              tick={{ fontSize: 11, fill: "rgba(203, 213, 225, 0.6)" }}
              stroke="none"
            />
            <YAxis
              tick={{ fontSize: 11, fill: "rgba(203, 213, 225, 0.6)" }}
              stroke="none"
              width={50}
              tickFormatter={(value) => {
                if (value >= 10000) {
                  return `${(value / 10000).toFixed(0)}억`;
                }
                return `${(value / 1000).toFixed(0)}천`;
              }}
            />
            <Tooltip
              formatter={(value, name) => {
                if (typeof value === "number") {
                  const displayValue =
                    value > 10000
                      ? `${(value / 10000).toFixed(1)}억원`
                      : `${value.toLocaleString()}만원`;
                  return [
                    displayValue,
                    name === "actualPrice" ? "실제 가격" : "예측 가격",
                  ];
                }
                return ["-", name];
              }}
              labelFormatter={(label) => `${label}년`}
              contentStyle={{
                backgroundColor: "rgba(15, 23, 42, 0.95)",
                border: "1px solid rgba(148, 163, 184, 0.2)",
                borderRadius: "12px",
                color: "white",
                fontSize: "12px",
              }}
            />
            <ReferenceLine
              x="2025"
              stroke="rgba(248, 113, 113, 0.5)"
              strokeDasharray="3 3"
              label={{
                value: "현재 (2025년)",
                position: "top",
                fill: "rgba(248, 113, 113, 0.8)",
                fontSize: 11,
                offset: 15,
              }}
            />
            <Area
              type="monotone"
              dataKey="actualPrice"
              stroke="#3b82f6"
              fillOpacity={0.6}
              fill="url(#colorActual)"
              name="실제 가격"
              strokeWidth={3}
              isAnimationActive={true}
              connectNulls={false}
            />
            <Area
              type="monotone"
              dataKey="predictedPrice"
              stroke="#f97316"
              fillOpacity={0.6}
              fill="url(#colorPredicted)"
              name="예측 가격"
              strokeWidth={3}
              isAnimationActive={true}
              connectNulls={false}
            />
          </AreaChart>
        </ResponsiveContainer>

        <div className="price-chart-legend">
          <p className="legend-date">
            과거 {historyData?.history_years || 5}년 ~ 향후 5년 예측
          </p>
          <div className="legend-items">
            <div className="legend-dot blue" />
            <span className="legend-text">실제 가격</span>
            <div className="legend-dot orange" />
            <span className="legend-text">예측 가격</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
