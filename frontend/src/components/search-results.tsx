import { Card } from "./ui/card";
import { MapPin } from "lucide-react";

interface SearchResult {
  id: number;
  name: string;
  location: string;
}

interface SearchResultsProps {
  results: SearchResult[];
  onSelect: (apartment: SearchResult) => void;
}

export default function SearchResults({
  results,
  onSelect,
}: SearchResultsProps) {
  if (results.length === 0) {
    return (
      <Card className="search-results-empty">
        <p>검색 결과가 없습니다</p>
      </Card>
    );
  }

  return (
    <Card className="search-results-container">
      <div className="search-results-list">
        {results.map((apartment) => (
          <div
            key={apartment.id}
            onClick={() => onSelect(apartment)}
            className="search-result-item"
          >
            <div className="search-result-content">
              <div className="search-result-icon">
                <MapPin className="icon" />
              </div>
              <div className="search-result-info">
                <h3 className="apartment-name">{apartment.name}</h3>
                <p className="apartment-location">{apartment.location}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
