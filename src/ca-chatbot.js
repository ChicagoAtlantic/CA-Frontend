import { useState } from 'react';
import axios from 'axios';

export default function IRChatbot() {
  const [query, setQuery] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    const currentQuery = query;
    setLoading(true);
    setQuery('');

    try {
      // const res = await axios.post('http://localhost:8000/query', { query: currentQuery });
      const res = await axios.post('https://ir-backend-pov2.onrender.com/query', { query: currentQuery });
      const responseObj = res.data.answers || { Default: res.data.answer };
      setChatHistory((prev) => [...prev, { query: currentQuery, response: responseObj }]);
    } catch (err) {
      console.error('❌ Axios error:', err);
      setChatHistory((prev) => [
        ...prev,
        { query: currentQuery, response: { Error: 'Error fetching response.' } }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4 py-6">
      <div className="bg-white w-full max-w-2xl sm:max-w-lg rounded-2xl shadow-lg p-6 sm:p-8">
        {/* Logo */}
        <div className="text-center mb-4">
          <img
            src="/CA Logo narrow.png"
            alt="Chicago Atlantic Logo"
            className="mx-auto"
            style={{ height: '100px', width: 'auto', objectFit: 'contain' }}
          />

        </div>

        {/* Heading */}
        <h1 className="text-2xl sm:text-3xl font-bold text-center text-blue-800 mb-4">
          Chicago Atlantic Chatbot
        </h1>

        {/* Text Input */}
        <form onSubmit={handleSubmit} className="mb-6">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder="Ask a question..."
            rows={3}
            className="w-full border rounded-lg p-3 text-base resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
          <button
            type="submit"
            className="w-full mt-3 bg-blue-600 text-white text-base py-2 rounded-lg hover:bg-blue-700 transition-colors"
            disabled={loading}
          >
            {loading ? 'Thinking...' : 'Ask'}
          </button>
        </form>

        {/* Chat History */}
        <div className="h-96 overflow-y-auto space-y-4 px-2 bg-gray-50 border rounded-lg p-4">
          {chatHistory.length === 0 ? (
            <p className="text-center text-gray-400 italic">No questions yet</p>
          ) : (
            chatHistory.map((item, index) => (
              <div key={index} className="bg-white p-3 rounded shadow-sm">
                <p className="text-xs text-gray-400">You asked:</p>
                <p className="italic text-blue-900 text-sm mb-2">"{item.query}"</p>
                {Object.entries(item.response).map(([fund, answer], i) => (
                  <div key={i} className="mb-1">
                    <p className="font-semibold text-blue-700 text-sm">{fund}</p>
                    {answer.source && (
                      <p className="text-xs text-gray-500">📄 Source: {answer.source}</p>
                    )}
                    <p className="text-sm text-gray-800">{answer.answer || answer}</p>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
