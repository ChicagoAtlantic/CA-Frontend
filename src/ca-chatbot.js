import { useState, useRef, useEffect } from 'react';
import axios from 'axios';

const BASE_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:8000'
  : 'https://ir-backend-pov2.onrender.com';

export default function IRChatbot() {
  const [query, setQuery] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [processingFile, setProcessingFile] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null); // 'success' | 'error' | null
  const [downloading, setDownloading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
  
    const currentQuery = query.trim();
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setLoading(true);
  
    // Extract just the user's prior questions
    const history = chatHistory.map(msg => msg.text);
  
    setChatHistory(prev => [
      ...prev,
      { sender: 'A Brilliant User', text: currentQuery, time: timestamp },
      { sender: 'ChatCAG', text: 'Thinking...', time: timestamp }
    ]);
    setQuery('');
  
    try {
      const res = await axios.post(`${BASE_URL}/query`, {
        query: currentQuery,
        history: history
      });
  
      const responseObj = res.data.answers || { Default: res.data.answer };
  
      let botResponse = '';
      for (const [fund, answer] of Object.entries(responseObj)) {
        if (typeof answer.answer === 'string' && answer.answer.trim()) {
          botResponse += `${fund}:\n${answer.answer.trim()}\n`;
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

    setDownloading(true); // ⬅️ Start loading bar
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
    } finally {
      setDownloading(false); // ⬅️ End loading bar
    }
  };
  
  const handleClearChat = () => {
    setChatHistory([]);
    setUploadedFile(null);
    setUploadStatus(null);
  };
  

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setUploadedFile(file);
    setUploadStatus(null);

    const isExcel = file.name.endsWith('.xlsx');
    const isWord = file.name.endsWith('.docx');
    const isPDF = file.name.endsWith('.pdf');

    if (!isExcel && !isWord && !isPDF) {
      alert("Unsupported file type. Please upload a .xlsx, .docx, or .pdf file.");
      return;
    }
  
    setProcessingFile(true);
    await new Promise(resolve => setTimeout(resolve, 50)); // allow spinner to render
  
    const formData = new FormData();
    formData.append("file", file);
  
    try {
      const res = await axios.post(`${BASE_URL}/upload_questions/`, formData);
      setUploadStatus('success');

      // If response is JSON with questions + answers, show them in chat
      if (res.data?.questions && res.data?.answers) {
        res.data.questions.forEach((q, i) => {
          const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          setChatHistory(prev => [...prev, { sender: 'A Brilliant User', text: q, time: timestamp }]);
  
          let botResponse = '';
          for (const [fund, answer] of Object.entries(res.data.answers[i])) {
            const responseText = typeof answer === 'string' ? answer : (answer.answer || '');
            if (responseText.trim()) {
              botResponse += `${fund}:\n${responseText}\n`;
            }
                      } 
          setChatHistory(prev => [...prev, { sender: 'ChatCAG', text: botResponse.trim(), time: timestamp }]);
        });
      }
  
    } catch (err) {
      setUploadStatus('error');

      // Only show error if it's actual JSON error (not blob response)
      const contentType = err?.response?.headers?.['content-type'] || '';
      if (contentType.includes("application/json")) {
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const json = JSON.parse(reader.result);
            alert(json.error || "Failed to process file.");
          } catch {
            alert("Unexpected error during file upload.");
          }
        };
        reader.readAsText(err.response.data);
      } else {
        // Silently ignore if it was just a download trigger
        console.warn("Caught blob response during upload, ignoring.");
      }
    } finally {
      setProcessingFile(false);
    }
  };
  
  const handleDownloadAnswers = async () => {
    if (!uploadedFile) return alert("Please upload a file first.");

    const formData = new FormData();
    formData.append("file", uploadedFile);

    setDownloading(true); // ⬅️ Start loading bar
    try {
      const res = await axios.post(`${BASE_URL}/upload_questions/`, formData, {
        responseType: "blob",
      });

      let ext = "xlsx";
      if (uploadedFile.name.endsWith(".docx") || uploadedFile.name.endsWith(".pdf")) {
        ext = "docx";
      }
      
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `question_answers.${ext}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Download Answers error:", err);
      alert("Failed to download answers.");
    } finally {
      setDownloading(false); // ⬅️ End loading bar
    }
  };

  const loadingBarStyle = {
    height: '4px',
    background: 'linear-gradient(to right, #2563eb, #60a5fa)',
    animation: 'loadingBar 1s infinite linear',
    width: '100%'
  };
  
  const globalStyle = document.createElement('style');
  globalStyle.innerHTML = `
    @keyframes loadingBar {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }
  `;
  document.head.appendChild(globalStyle);
  

  // logo
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
          {/* buttons */}
        <div style={{ textAlign: 'center', display: 'flex', justifyContent: 'center', gap: '10px' }}>
          <button onClick={handleDownloadChatLogs} style={buttonStyle}>Download Chat Logs</button>
          <button onClick={handleClearChat} style={buttonStyle}>Clear Chat</button>
        </div>
      
        <div style={{ textAlign: 'center', display: 'flex', justifyContent: 'center', gap: '10px' }}>
          <label htmlFor="excel-upload" style={buttonStyle}>
            Upload Questions (Excel, Word, or PDF)
          </label>
          <button onClick={handleDownloadAnswers} style={buttonStyle}>Download Answers</button>
          <input id="excel-upload" type="file" accept=".xlsx, .docx, .pdf" onChange={handleFileUpload} style={{ display: 'none' }} />
        </div>


{/* processing and download status bar animation */}
        {processingFile && (
        <div style={{ marginTop: '0.5rem' }}>
          <div style={{ width: '100%', height: '4px', backgroundColor: '#e5e7eb', overflow: 'hidden', borderRadius: '4px' }}>
            <div style={loadingBarStyle}></div>
          </div>
          <p style={{ textAlign: 'center', color: '#6b7280', fontStyle: 'italic', marginTop: '0.25rem' }}>
            Processing document...
          </p>
        </div>
        )}

        {downloading && (
        <div style={{ marginTop: '0.5rem' }}>
          <div style={{ width: '100%', height: '4px', backgroundColor: '#e5e7eb', overflow: 'hidden', borderRadius: '4px' }}>
            <div style={loadingBarStyle}></div>
          </div>
          <p style={{ textAlign: 'center', color: '#6b7280', fontStyle: 'italic', marginTop: '0.25rem' }}>
            Downloading answers...
          </p>
        </div>
        )}



        {uploadStatus === 'success' && (
        <p style={{ textAlign: 'center', color: 'green' }}>
          ✅ Document processed successfully.
        </p>
        )}
        {uploadStatus === 'error' && (
        <p style={{ textAlign: 'center', color: 'red' }}>
          ❌ Failed to process the document.
        </p>
        )}

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
            placeholder="A thought-out question..."
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
            {loading ? 'Thinking...' : 'Ask ChatCAG'}
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
  marginBottom: '0rem',
  width: '4000px'
};
