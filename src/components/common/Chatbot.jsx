import { useEffect, useRef, useState } from 'react';
import { MessageCircle, Send, X } from 'lucide-react';
import { apiPost } from '../../services/api';

const FALLBACK_REPLY = 'I can help with reporting ocean observations, submitting cleanup evidence, and understanding your impact. What would you like to do?';

function getChatErrorMessage(error) {
  if (error instanceof Error && error.message) return `BlueMind is unavailable: ${error.message}`;
  return 'BlueMind is unavailable right now. Please try again later.';
}

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [showGreeting, setShowGreeting] = useState(true);
  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState([
    { id: 'welcome', role: 'assistant', content: 'Hi, I am BlueMind. How can I help with your ocean cleanup today?' }
  ]);
  const messagesRef = useRef(null);

  useEffect(() => {
    if (isOpen) messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight, behavior: 'smooth' });
  }, [isOpen, messages]);

  async function handleSubmit(event) {
    event.preventDefault();
    const content = draft.trim();
    if (!content || isSending) return;

    const userMessage = { id: `${Date.now()}-user`, role: 'user', content };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setDraft('');
    setIsSending(true);

    try {
      const response = await apiPost('/api/ai/chat', {
        messages: nextMessages.slice(-10).map(({ role, content: text }) => ({ role, content: text }))
      });
      if (!response?.ok || typeof response.reply !== 'string') {
        throw new Error(response?.error || response?.message || 'The server returned no chat reply.');
      }
      setMessages((current) => [...current, {
        id: `${Date.now()}-assistant`,
        role: 'assistant',
        content: response.reply
      }]);
    } catch (error) {
      console.error('BlueMind chat request failed:', error);
      setMessages((current) => [...current, {
        id: `${Date.now()}-assistant`,
        role: 'assistant',
        content: getChatErrorMessage(error) || FALLBACK_REPLY
      }]);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="chatbot-root">
      {!isOpen && showGreeting && (
        <button
          type="button"
          className="chatbot-greeting"
          onClick={() => {
            setShowGreeting(false);
            setIsOpen(true);
          }}
          aria-label="Open BlueMind chat"
        >
          <strong>We're Online! <br/><span>How may I help you today?</span></strong>
        </button>
      )}
      {isOpen && (
        <section className="chatbot-panel" aria-label="BlueMind chat">
          <header className="chatbot-header">
            <div>
              <strong>BlueMind</strong>
              <span>Ocean cleanup assistant</span>
            </div>
            <button type="button" className="chatbot-icon-button" onClick={() => setIsOpen(false)} aria-label="Close chat" title="Close chat">
              <X size={18} />
            </button>
          </header>
          <div className="chatbot-messages" ref={messagesRef} aria-live="polite">
            {messages.map((message) => (
              <p key={message.id} className={`chatbot-message chatbot-message-${message.role}`}>{message.content}</p>
            ))}
            {isSending && <p className="chatbot-message chatbot-message-assistant chatbot-loading">Thinking...</p>}
          </div>
          <form className="chatbot-form" onSubmit={handleSubmit}>
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Ask anything..."
              aria-label="Message BlueMind"
              maxLength={1000}
            />
            <button type="submit" className="chatbot-send-button" disabled={!draft.trim() || isSending} aria-label="Send message" title="Send message">
              <Send size={17} />
            </button>
          </form>
        </section>
      )}
      <button type="button" className="chatbot-launcher" onClick={() => { setShowGreeting(false); setIsOpen((open) => !open); }} aria-label={isOpen ? 'Close BlueMind chat' : 'Open BlueMind chat'} title="Chat with BlueMind">
        {isOpen ? <X size={21} /> : <MessageCircle size={21} />}
      </button>
    </div>
  );
}