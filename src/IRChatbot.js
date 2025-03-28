// npm start
import { useState } from 'react';
import axios from 'axios';

export default function IRChatbot() {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setQuery(''); // Reset the query input after submitting

    try {
      // Change the URL based on local or render
      const res = await axios.post('https://ir-backend-pov2.onrender.com/query', { query });
      // const res = await axios.post('http://localhost:8000/query', { query }); // for local run

      if (res.data.answers) {
        setResponse(res.data.answers); // multiple funds
      } else {
        setResponse({ Default: res.data.answer }); // fallback
      }
    } catch (err) {
      console.error('❌ Axios error:', err);
      setResponse({ Error: 'Error fetching response.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-50 p-6">
      {/* Company Logo */}
      <div className="mb-6">
        <img
          src="/CA Logo narrow.png"
          alt="Chicago Atlantic Logo"
          style={{ height: '100px', width: 'auto' }}  // Inline styling for custom size
        />
      </div>

      <h1 className="text-4xl font-bold text-center text-blue-800 mb-6">
        Chicago Atlantic Chatbot
      </h1>

      <form onSubmit={handleSubmit} className="mb-6 w-full max-w-lg">
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
          placeholder="Hello, how can I help?"
          rows={4}
          className="w-full border rounded-lg p-3 text-lg resize-none text-gray-700 font-sans" // Font change here
          style={{ height: '50px', width: '19.4%', fontSize:''}}  // Adjust width and height (width in percentage)
        />
        <button
          type="submit"
          className="w-full mt-4 bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700"
          // style={{ height: '25px', width:'3%' }}  // Adjust width and height (width in percentage)
          disabled={loading}
        >
          {loading ? 'Thinking...' : 'Ask'}
        </button>
      </form>

      {/* Response Section */}
      <div className="w-full max-w-lg bg-white p-6 rounded-lg shadow-lg">
        <strong className="text-xl mb-2 font-semibold text-blue-700">Response:</strong>
        {loading ? (
          <p className="italic text-gray-500">Generating answer...</p>
        ) : response && typeof response === 'object' ? (
          Object.entries(response).map(([fund, answer]) => (
            <div key={fund} className="mb-6 border-b border-gray-300 pb-4">
              <h2 className="font-semibold text-lg text-blue-700 mb-2">{fund}</h2>
              <p className="text-sm text-gray-500 mb-2">📄 Source: {answer.source}</p>
              <p className="text-gray-800 font-serif text-lg">{answer.answer}</p> {/* Font change here */}
            </div>
          ))
        ) : (
          <p>{response}</p>
        )}
      </div>
    </div>
  );
}
