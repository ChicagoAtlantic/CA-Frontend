import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';

const BASE_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:8000'
  : 'https://ir-backend-pov2.onrender.com';

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

    setChatHistory(prev => [...prev, { sender: 'A Brilliant User', text: currentQuery, time: timestamp }, { sender: 'ChatCAG', text: 'Thinking...', time: timestamp }]);
    setQuery('');

    try {
      const res = await axios.post(`${BASE_URL}/query`, { query: currentQuery });
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
        updated[updated.length - 1] = { sender: 'ChatCAG', text: botResponse.trim(), time: timestamp };
        return updated;
      });

    } catch (err) {
      console.error('❌ Axios error:', err);
      setChatHistory(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { sender: 'ChatCAG', text: 'Error fetching response.', time: timestamp };
        return updated;
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadChatLogs = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/download_chat_logs`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'chat_logs.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Download error:', err);
      alert('Failed to download chat logs.');
    }
  };

  const handleClearChat = () => {
    setChatHistory([]);
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      const questions = json.slice(1).map(row => row[0]).filter(q => q);

      for (const question of questions) {
        await submitQuestion(question);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const submitQuestion = async (text) => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setChatHistory(prev => [...prev, { sender: 'A Brilliant User', text, time: timestamp }, { sender: 'ChatCAG', text: 'Thinking...', time: timestamp }]);

    try {
      const res = await axios.post(`${BASE_URL}/query`, { query: text });
      const responseObj = res.data.answers || { Default: res.data.answer };

      let botResponse = '';
      for (const [fund, answer] of Object.entries(responseObj)) {
        botResponse += `${fund}:\n${answer.answer || answer}\n`;
        if (answer.source) botResponse += `📄 Source: ${answer.source}\n`;
      }

      setChatHistory(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { sender: 'ChatCAG', text: botResponse.trim(), time: timestamp };
        return updated;
      });
    } catch (err) {
      console.error('❌ Axios error:', err);
      setChatHistory(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { sender: 'ChatCAG', text: 'Error fetching response.', time: timestamp };
        return updated;
      });
    }
  };

  const handleDownloadAnswers = async () => {
    const fileInput = document.getElementById("excel-upload");
    const file = fileInput.files[0];
    if (!file) return alert("Please upload an Excel file first.");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post(`${BASE_URL}/upload_questions/`, formData, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "question_answers.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Download Answers error:", err);
      alert("Failed to download answers.");
    }
  };

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

        <div style={{ textAlign: 'center' }}>
          <img
            src="/CA Logo narrow.png"
            alt="Chicago Atlantic Logo"
            style={{ height: '80px', maxWidth: '120px', display: 'block', margin: '0 auto' }}
          />
        </div>

        <h1 style={{
          fontSize: '1.875rem',
          fontWeight: 700,
          textAlign: 'center',
          color: 'black',
          marginBottom: '1rem'
        }}>
          ChatCAG
        </h1>

        <div style={{ textAlign: 'center', display: 'flex', justifyContent: 'center', gap: '10px' }}>
          <button onClick={handleDownloadChatLogs} style={buttonStyle}>Download Chat Logs</button>
          <button onClick={handleClearChat} style={buttonStyle}>Clear Chat</button>
        </div>

        <div style={{ textAlign: 'center', display: 'flex', justifyContent: 'center', gap: '10px' }}>
          <label htmlFor="excel-upload" style={buttonStyle}>
            Upload Questions File
          </label>
          <button onClick={handleDownloadAnswers} style={buttonStyle}>Download Answers</button>
          <input id="excel-upload" type="file" accept=".xlsx" onChange={handleFileUpload} style={{ display: 'none' }} />
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
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
              width: '100%',
              border: '1px solid #d1d5db',
              borderRadius: '0.5rem',
              padding: '0.5rem',
              fontSize: '0.875rem',
              resize: 'none'
            }}
          />
          <button type="submit" disabled={loading} style={{
            backgroundColor: '#2563eb',
            color: 'white',
            padding: '0.5rem',
            borderRadius: '0.5rem',
            border: 'none',
            fontSize: '0.875rem',
            cursor: 'pointer',
            opacity: loading ? 0.5 : 1
          }}>
            {loading ? 'Thinking...' : 'Ask'}
          </button>
        </form>

        <div style={{
          border: '1px solid #d1d5db',
          backgroundColor: '#f9fafb',
          borderRadius: '0.5rem',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          overflowY: 'auto',
          padding: '1rem'
        }}>
          {chatHistory.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#9ca3af', fontStyle: 'italic' }}>No messages yet</p>
          ) : (
            chatHistory.map((item, index) => (
              <div key={index} style={{ textAlign: 'left', fontSize: '0.875rem', whiteSpace: 'pre-wrap' }}>
                <span style={{ fontWeight: 'bold', color: item.sender === 'A Brilliant User' ? '#1d4ed8' : '#047857' }}>
                  {item.sender}
                </span>{' '}
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
  );
}

const buttonStyle = {
  display: 'inline-block',
  backgroundColor: '#000000',
  color: 'white',
  padding: '0.5rem 1rem',
  borderRadius: '0.5rem',
  fontSize: '0.875rem',
  border: 'none',
  cursor: 'pointer',
  marginBottom: '1rem',
  width: '160px'
};
