import { useEffect, useMemo, useRef, useState } from 'react';

/**
 * ProductChatbot.jsx
 *
 * Props:
 * - plantName: string
 * - plantDescription: string
 * - careGuideText: string
 * - reviewsText: string (pre-formatted summary of reviews)
 *
 * Notes:
 * - Calls backend AI proxy at /api/ai/plant-assistant to keep API key server-side
 */

// Backend endpoint handled by Express and proxied by Vite
const AI_ENDPOINT = '/api/ai/plant-assistant';

export default function ProductChatbot({
  plantName = '',
  plantDescription = '',
  careGuideText = '',
  reviewsText = ''
}) {
  // Start minimized by default; user can expand
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'model', text: `Hi! I'm your Plant Care Assistant for ${plantName || 'this plant'}. Ask me anything about this product—care, watering, light, or sizing.` }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  // no-op; kept in case we need memoized values later
  useMemo(() => {}, []);

  const systemInstruction = useMemo(() => {
    return [
  'You are a friendly and knowledgeable Plant Care Specialist and Product Assistant for a plant nursery.',
  `Your goal is to answer questions based ONLY on the provided context for the specific product, ${plantName}.`,
      '',
      'Plant Context:',
      `Product Name: ${plantName || 'N/A'}`,
      '',
      `Description: ${plantDescription || 'N/A'}`,
      '',
      `Care Guide: ${careGuideText || 'N/A'}`,
      '',
      `User Reviews Summary: ${reviewsText || 'N/A'}`,
      '',
      'If a user asks a question unrelated to the plant or general plant care, politely state that you can only answer questions about the current plant product.'
    ].join('\n');
  }, [plantName, plantDescription, careGuideText, reviewsText]);

  useEffect(() => {
    // Auto-scroll to bottom when messages change
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = async () => {
    const question = input.trim();
    if (!question) return;

    // Push user message
    setMessages(prev => [...prev, { role: 'user', text: question }]);
    setInput('');
    setLoading(true);

    try {
      // Call backend AI proxy with grounded system instruction and chat history
      const res = await fetch(AI_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          systemInstruction,
          history: messages,
          query: question
        })
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || 'Request failed');
      }

      const data = await res.json();
      const answer = data?.answer || 'Sorry, I could not generate a response.';

      setMessages(prev => [...prev, { role: 'model', text: answer }]);
    } catch (err) {
      console.error('AI proxy error:', err);
      setMessages(prev => [...prev, { role: 'model', text: 'There was an error fetching the answer. Please try again later.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={styles.container(open)}>
      <div style={styles.header}>
        <div>
          <i className="bi bi-robot me-2"></i>
         Sasya Swara
        </div>
        <button
          type="button"
          className="btn btn-sm btn-light"
          onClick={() => setOpen(v => !v)}
        >
          {open ? 'Minimize' : 'Open'}
        </button>
      </div>

      {open && (
        <>
          <div ref={scrollRef} style={styles.history}>
            {messages.map((m, i) => (
              <div key={i} style={m.role === 'user' ? styles.userMsg : styles.modelMsg}>
                <div style={styles.msgBubble(m.role)}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div style={styles.modelMsg}>
                <div style={styles.msgBubble('model')}>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Thinking...
                </div>
              </div>
            )}
          </div>

          <div style={styles.inputBar}>
            <textarea
              rows={1}
              placeholder={`Ask about ${plantName || 'this plant'}...`}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              style={styles.textarea}
            />
            <button
              type="button"
              className="btn btn-success"
              onClick={handleSend}
              disabled={loading || !input.trim()}
            >
              Send
            </button>
          </div>
        </>
      )}
    </div>
  );
}

const styles = {
  container: (open) => ({
    position: 'fixed',
    right: '20px',
    bottom: '20px',
    width: open ? '340px' : '260px',
    height: open ? '460px' : '56px',
    background: '#ffffff',
    border: '1px solid #2d5016',
    borderRadius: '12px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
    overflow: 'hidden',
    zIndex: 1050,
    transition: 'width 0.2s ease, height 0.2s ease'
  }),
  header: {
    background: '#2d5016',
    color: '#fff',
    padding: '10px 12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontWeight: 600
  },
  history: {
    padding: '10px',
    height: 'calc(100% - 110px)',
    overflowY: 'auto',
    background: '#f8faf7'
  },
  inputBar: {
    display: 'flex',
    gap: '8px',
    padding: '10px',
    borderTop: '1px solid #e6e6e6',
    background: '#fff'
  },
  textarea: {
    flex: 1,
    resize: 'none',
    borderRadius: '8px',
    border: '1px solid #cbd5c0',
    padding: '8px 10px'
  },
  userMsg: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginBottom: '8px'
  },
  modelMsg: {
    display: 'flex',
    justifyContent: 'flex-start',
    marginBottom: '8px'
  },
  msgBubble: (role) => ({
    maxWidth: '80%',
    padding: '8px 10px',
    borderRadius: '10px',
    background: role === 'user' ? '#e8f5e9' : '#ffffff',
    border: role === 'user' ? '1px solid #b7dfb9' : '1px solid #e6e6e6',
    color: '#1b3910',
    whiteSpace: 'pre-wrap'
  })
};
