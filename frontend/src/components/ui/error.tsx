import { ChevronLeft } from "lucide-react";

export const Error = ({
  errorMessage,
  onClick,
}: {
  errorMessage: string;
  onClick: () => void;
}) => {
  return (
    <div className="error-container">
      <p className="error-text">{errorMessage}</p>
      <button className="back-button" onClick={onClick}>
        <ChevronLeft className="back-icon" />
        돌아가기
      </button>
    </div>
  );
};
