function Transcript({ text }) {
  if (!text) return null;

  return (
    <div className="transcript-box">
      <div className="section-label">YOU SAID</div>

      <div className="transcript-text">
        “{text}”
      </div>
    </div>
  );
}

export default Transcript;