import { useState, useRef, useEffect } from 'react';
import axios from 'axios';

export default function IRChatbot() {
  const [query, setQuery] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    const currentQuery = query.trim();
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setLoading(true);

    setChatHistory(prev => [...prev, { sender: 'User', text: currentQuery, time: timestamp }, { sender: 'Chatbot', text: 'Thinking...', time: timestamp }]);
    setQuery('');

    try {
      const res = await axios.post('https://ir-backend-pov2.onrender.com/query', { query: currentQuery });
      const responseObj = res.data.answers || { Default: res.data.answer };

      let botResponse = '';
      for (const [fund, answer] of Object.entries(responseObj)) {
        botResponse += `${fund}:\n${answer.answer || answer}\n`;
        if (answer.source) {
          botResponse += `📄 Source: ${answer.source}\n`;
        }
      }

      setChatHistory(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { sender: 'Chatbot', text: botResponse.trim(), time: timestamp };
        return updated;
      });

    } catch (err) {
      console.error('❌ Axios error:', err);
      setChatHistory(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { sender: 'Chatbot', text: 'Error fetching response.', time: timestamp };
        return updated;
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadChatLogs = () => {
    window.open('https://ir-backend-pov2.onrender.com/download_chat_logs', '_blank');
  };

  const handleClearChat = () => {
    setChatHistory([]);
  };

  // Auto-scroll to bottom whenever chatHistory changes
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  return (
    <div style={{ width: '90%', maxWidth: '600px', margin: '1rem auto', padding: '1rem' }}>
      <div style={{
        backgroundColor: 'white',
        padding: '1.5rem',
        borderRadius: '1rem',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
        border: '1px solid #e5e7eb',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        height: '700px'
      }}>

        {/* Logo */}
        <div style={{ textAlign: 'center' }}>
          <img
            src="/CA Logo narrow.png"
            alt="Chicago Atlantic Logo"
            style={{ height: '80px', maxWidth: '120px', display: 'block', marginLeft: 'auto', marginRight: 'auto' }}
          />
        </div>

        {/* Heading */}
        <h1 style={{
          fontSize: '1.875rem',
          fontWeight: 700,
          textAlign: 'center',
          color: 'black',
          marginBottom: '1rem'
        }}>
          Chicago Atlantic Chatbot
        </h1>

        {/* Download and Clear Buttons */}
        <div style={{ textAlign: 'center', display: 'flex', justifyContent: 'center', gap: '10px' }}>
          <button
            onClick={handleDownloadChatLogs}
            style={{
              backgroundColor: 'green',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              border: 'none',
              cursor: 'pointer'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = 'green'}
            onMouseOut={(e) => e.target.style.backgroundColor = 'green'}
          >
            Download Chat Logs
          </button>
          <button
            onClick={handleClearChat}
            style={{
              backgroundColor: '#ef4444',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              border: 'none',
              cursor: 'pointer'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#dc2626'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#ef4444'}
          >
            Clear Chat
          </button>
        </div>

        {/* Chat Window */}
        <div style={{
          border: '1px solid #d1d5db',
          backgroundColor: '#f9fafb',
          borderRadius: '0.5rem',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          overflowY: 'auto',
          padding: '1rem',
          marginTop: '1rem'
        }}>
          {/* Input Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              rows={2}
              placeholder="Ask a question..."
              style={{
                width: '95%',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                padding: '0.5rem',
                fontSize: '0.875rem',
                resize: 'none'
              }}
            />
            <button
              type="submit"
              disabled={loading}
              style={{
                backgroundColor: '#2563eb',
                color: 'white',
                padding: '0.5rem',
                borderRadius: '0.5rem',
                border: 'none',
                fontSize: '0.875rem',
                cursor: 'pointer',
                opacity: loading ? 0.5 : 1
              }}
            >
              {loading ? 'Thinking...' : 'Ask'}
            </button>
          </form>

          {/* Chat History */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {chatHistory.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#9ca3af', fontStyle: 'italic' }}>No messages yet</p>
            ) : (
              chatHistory.map((item, index) => (
                <div key={index} style={{ textAlign: 'left', fontSize: '0.875rem', whiteSpace: 'pre-wrap' }}>
                  <span style={{ fontWeight: 'bold', color: item.sender === 'User' ? '#1d4ed8' : '#047857' }}>
                    {item.sender}
                  </span> {' '}
                  <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                    [{item.time}]
                  </span>: {' '}
                  {item.text}
                </div>
              ))
            )}
            <div ref={chatEndRef} />
          </div>

        </div>
      </div>
    </div>
  );
}
