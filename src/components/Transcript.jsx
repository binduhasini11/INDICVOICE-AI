function Transcript({ text }) {
  if (!text) return null;
  return (
    <div className="transcript-box" id="transcript-box">
      <div className="section-label">VOICE TRANSCRIPT / QUERY</div>
      <p className="transcript-text">“{text}”</p>
    </div>
  );
}

export default Transcript;
