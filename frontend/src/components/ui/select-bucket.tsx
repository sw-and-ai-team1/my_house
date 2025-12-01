import { ChevronDown } from "lucide-react";

export const SelectBucket = ({
  areaBuckets,
  selectedBucket,
  onChange,
}: {
  areaBuckets: number[];
  selectedBucket: string;
  onChange: (bucket: string) => void;
}) => {
  return (
    <div className="select-bucket-container">
      <div className="select-bucket-wrapper">
        <select
          value={selectedBucket}
          onChange={(e) => onChange(e.target.value)}
          className="select-bucket"
        >
          <option value="">평형 선택 (선택사항)</option>
          {areaBuckets.map((bucket) => (
            <option key={bucket} value={bucket.toString()}>
              {bucket}㎡
            </option>
          ))}
        </select>
        <ChevronDown className="select-bucket-icon" />
      </div>
    </div>
  );
};
