function IntentCard({ intent }) {
  if (!intent) return null;

  return (
    <div className="intent-card">
      <div className="section-label">UNDERSTOOD</div>

      <div className="intent-title">
        🧠 {intent.title}
      </div>

      <div className="intent-details">
        {intent.details?.map((item, index) => (
          <div className="intent-row" key={index}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

export default IntentCard;