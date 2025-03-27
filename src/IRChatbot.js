import { useState } from 'react';
import axios from 'axios';

export default function IRChatbot() {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post('https://ir-backend-pov2.onrender.com/query', { query });

      if (res.data.answers) {
        setResponse(res.data.answers); // multiple funds
      } else {
        setResponse({ Default: res.data.answer }); // wrap single answer in object
      }
    } catch (err) {
      setResponse({ Error: 'Error fetching response.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Chicago Atlantic Informational Chatbot</h1>

      <form onSubmit={handleSubmit} className="mb-4">
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Hello, how can I help?"
          rows={4}
          className="w-full border p-2 rounded resize-y"
          />
        <button
          type="submit"
          className="mt-2 bg-blue-600 text-white px-4 py-2 rounded"
          disabled={loading}
        >
          {loading ? 'Thinking...' : 'Ask'}
        </button>
      </form>

      <div className="bg-gray-100 p-4 rounded shadow mt-4">
        <strong>Response:</strong>
        {loading ? (
          <p className="italic text-gray-500">Generating answer...</p>
        ) : response && typeof response === 'object' ? (
          Object.entries(response).map(([fund, answer]) => (
            <div key={fund} className="mb-4 border-b border-gray-300 pb-2">
              <h2 className="font-semibold text-lg text-blue-700 mb-1">{fund}</h2>
              <p className="text-sm text-gray-500 mb-1">📄 Source: {answer.source}</p>
              <p>{answer.answer}</p>
            </div>
          ))
        ) : (
          <p>{response}</p>
        )}
      </div>
    </div>
  );
}
