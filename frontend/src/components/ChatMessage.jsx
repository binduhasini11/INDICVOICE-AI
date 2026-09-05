function ChatMessage({ message, type = "assistant" }) {
  return (
    <div className={`chat-message ${type}`}>
      {type === "assistant" && (
        <div className="assistant-avatar">
          AI
        </div>
      )}

      <div className="message-content">
        {message}
      </div>
    </div>
  );
}

export default ChatMessage;