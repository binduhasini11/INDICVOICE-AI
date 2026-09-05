function ChatMessage({ message, type }) {
  const isUser = type === "user";
  return (
    <div className={`chat-message ${isUser ? "user-message" : "assistant-message"}`}>
      <div className="chat-avatar">{isUser ? "👤" : "🤖"}</div>
      <div className="chat-bubble">
        <div className="chat-sender">{isUser ? "You" : "IndicVoice AI"}</div>
        <p className="chat-content">{message}</p>
      </div>
    </div>
  );
}

export default ChatMessage;
