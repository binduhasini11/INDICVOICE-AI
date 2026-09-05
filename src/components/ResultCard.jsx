import TravelResult from "./TravelResult";
import ProductResult from "./ProductResult";
import WebResult from "./WebResult";

function ResultCard({ result, index, intentBudget }) {
  if (!result) return null;

  const resultType = result.type || (result.metadata?.transport ? "travel" : result.metadata?.category ? "product" : "travel");

  if (resultType === "travel") {
    return <TravelResult result={result} index={index} />;
  }

  if (resultType === "product") {
    return <ProductResult result={result} index={index} intentBudget={intentBudget} />;
  }

  if (resultType === "web") {
    return <WebResult result={result} index={index} />;
  }

  return <TravelResult result={result} index={index} />;
}

export default ResultCard;
