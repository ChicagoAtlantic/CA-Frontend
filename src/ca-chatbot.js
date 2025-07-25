import { useMsal } from "@azure/msal-react";
import { loginRequest } from "./authConfig";
import { useState, useRef, useEffect } from 'react';
import axios from 'axios';

const BASE_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:8000'
  : 'https://ir-backend-pov2.onrender.com';

// Function to allow http urls to become clickable links
function parseLinks(text) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;

  return text.split(urlRegex).map((part, i) => {
    if (urlRegex.test(part)) {
      // Remove trailing punctuation: ., ), ,, etc.
      const cleanUrl = part.replace(/[.,)]+$/, '');
      const trailing = part.slice(cleanUrl.length); // Save what was removed (if any)

      return (
        <span key={i}>
          <a href={cleanUrl} target="_blank" rel="noopener noreferrer">{cleanUrl}</a>{trailing}
        </span>
      );
    }
    return part;
  });
}



export default function IRChatbot() {
  const [query, setQuery] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);
  const [processingFile, setProcessingFile] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [downloading, setDownloading] = useState(false);

  //for login credentials authorization//////////////////
  const { instance, accounts } = useMsal();
  const email = accounts[0]?.username;
  const handleLogin = () => {
    instance.loginPopup(loginRequest).catch((e) => {
      console.error("Login failed:", e);
    });
  };

// //All CAG employees
//   useEffect(() => {
//     if (email && !email.endsWith("@chicagoatlantic.com")) {
//       alert("Access restricted to @chicagoatlantic.com users.");
//       instance.logoutPopup();
//     }
//   }, [email]);

//Specific Users only
  useEffect(() => {
    const allowedUsers = ["clee@chicagoatlantic.com",
                      "tcappell@chicagoatlantic.com",
                    "dkite@chicagoatlantic.com",
                  "psack@chicagoatlantic.com",
                "jmazarakis@chicagoatlantic.com",
              "hkelly@chicagoatlantic.com",
            "lkim@chicagoatlantic.com",
          "gkim@chicagoatlantic.com",
        "hlarkin@chicagoatlantic.com",
      "kvargas@chicagoatlantic.com",
    "hgonzalez@chicagoatlantic.com",
  "kyucel@chicagoatlantic.com",
"mburge@chicagoatlantic.com",
"bfordon@chicagoatlantic.com",
"cmullins@chicagoatlantic.com",
"elukin@chicagoatlantic.com",
"bhealy@chicagoatlantic.com",
"alovitt@chicagoatlantic.com",
"egoldfarb@chicagoatlantic.com"]; // Add others if needed

    if (email && !allowedUsers.includes(email.toLowerCase())) {
      alert("Access restricted to approved users only.");
      instance.logoutPopup();
    }
  }, [email]);

  useEffect(() => {
  chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);
//////////////////////////////////////////////////////

  // Get the first file selected by the user from the input element
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return; // Exit if no file is selected
    
    // Check if the file extension is one of the supported types
    const isValid = file.name.endsWith('.xlsx') || file.name.endsWith('.docx') || file.name.endsWith('.pdf');
    if (!isValid) {
      alert("Unsupported file type. Please upload a .xlsx, .docx, or .pdf file.");
      return;
    }
    
    // Show that we are now processing the file (e.g., show a spinner or loading message)
    setProcessingFile(true);
    setUploadStatus(null); // Clear any previous success/failure messages
    
    // Create a "package" to send the file to the server
    const formData = new FormData();
    formData.append("file", file);
    formData.append("email", email);

    // Send the file to the backend (server) so it can be processed
    try { 
      const res = await axios.post(`${BASE_URL}/upload_questions/`, formData, {
        responseType: "blob", // We expect to get a file back (not plain text)
        headers: {
          'x-api-key': 'ChicagoAtlanticOnly', // A security code to identify this request
        },
      });

      // Figure out what type of file we got back (Word or Excel)
      const ext = file.name.endsWith(".docx") || file.name.endsWith(".pdf") ? "docx" : "xlsx";
      
      // Create a downloadable link from the file we got back
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `question_answers.${ext}`);
      document.body.appendChild(link);
      link.click(); // Pretend the user clicked the link to start the download
      link.remove(); // Clean up

      setUploadStatus('success');
    } catch (err) {
      setUploadStatus('error');
      
      // If the server tried to send back an error message (in readable text form)
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
        console.warn("Caught blob response during upload, ignoring."); // If the error wasn’t readable text, just log it and move on
      }
    } finally {
      setProcessingFile(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); // Stop the page from refreshing when user presses Enter
    if (!query.trim()) return; // If input box is empty or just spaces, don’t do anything

    const currentQuery = query.trim(); // Remove any extra spaces from the input
    const timestamp = new Date().toLocaleString('en-US', { // Get the current date and time in readable format (MM/DD/YYYY HH:MM)
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    setLoading(true); // Show "Thinking..." instead of button so user knows it's working
    const history = chatHistory.map(msg => msg.text); // Grab all past chat messages (just the text)

    setChatHistory(prev => [ // Add the user’s question and a temporary “Thinking...” bot response to the chat windo
      ...prev,
      { sender: 'A Brilliant User', text: currentQuery, time: timestamp },
      { sender: 'ChatCAG', text: 'Thinking...', time: timestamp }
    ]);
    setQuery(''); // Clear the input box after submitting

    try {
      const res = await axios.post(`${BASE_URL}/query`, { // Send the question to the backend, along with chat history and user's email
        query: currentQuery,
        history: history,
        email: email
      }, {
        headers: {
          'x-api-key': 'ChicagoAtlanticOnly',
        }
      });


      const responseObj = res.data.answers || { Default: res.data.answer };   // Extract the response (might have multiple fund-specific answers)
      let botResponse = '';
      for (const [fund, answer] of Object.entries(responseObj)) {
        if (typeof answer.answer === 'string' && answer.answer.trim()) {
          botResponse += `${fund}:\n${answer.answer.trim()}`;

          if (answer.source) {
            const sourceLines = answer.source.split('\n');
            const sourceList = sourceLines.map((src) => `• ${src}`).join('\n');
            botResponse += `\n\nSources:\n${sourceList}`;
          }

          botResponse += '\n\n'; // Add spacing between fund sections
        }
      }


      setChatHistory(prev => {   // Replace the "Thinking..." placeholder with the actual bot answer
        const updated = [...prev];
        updated[updated.length - 1] = { sender: 'ChatCAG', text: botResponse.trim(), time: timestamp };
        return updated;
      });
    } catch (err) {
      console.error('❌ Axios error:', err); // Log the error in case something goes wrong
      setChatHistory(prev => { // Replace the "Thinking..." message with an error message
        const updated = [...prev];
        updated[updated.length - 1] = { sender: 'ChatCAG', text: 'Error fetching response.', time: timestamp };
        return updated;
      });
    } finally {
      setLoading(false); // Turn off the "Thinking..." state
    }
  };

  const handleClearChat = () => {
    setChatHistory([]); // Wipe out the chat messages
    setUploadStatus(null); // Reset file upload status too
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); // Always scroll to the latest message
  }, [chatHistory]);

  const loadingBarStyle = {
    height: '4px',
    background: 'linear-gradient(to right, #2563eb, #60a5fa)', // Blue gradient
    animation: 'loadingBar 1s infinite linear', // Moves across the bar over and over
    width: '100%'
  };

  const globalStyle = document.createElement('style');
  globalStyle.innerHTML = `
    @keyframes loadingBar {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }
  `;
  document.head.appendChild(globalStyle); // then add the loading bar to the page

  if (!email) { //show the login screen if the user isn't already logged in
    return (
      <div style={{ textAlign: 'center', marginTop: '4rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Sign in to access ChatCAG</h2>
        <button onClick={handleLogin} style={buttonStyle}>
          Login with Microsoft
        </button>
      </div>
    );
  }
  //returns the component's visible UI — it's what renders on the page.//
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
{/* show's who is signed in */}
        <p style={{ textAlign: 'center', fontSize: '0.875rem', color: '#4b5563' }}>
        Signed in as: <strong>{email}</strong> 
        </p>
{/* logo and header */}
        <div style={{ textAlign: 'center' }}>
          <img src="/CA Logo narrow.png" alt="Chicago Atlantic Logo"
            style={{ height: '80px', maxWidth: '120px', display: 'block', margin: '0 auto' }} />
        </div>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 700, textAlign: 'center', color: 'black', marginBottom: '1rem' }}>
          ChatCAG
        </h1>
{/* file upload */}
        <div style={{ textAlign: 'center', display: 'flex', justifyContent: 'center', gap: '10px' }}>
          <label htmlFor="excel-upload" style={buttonStyle}>
            Upload Questions (Excel, Word, or PDF)
          </label>
          <input id="excel-upload" type="file" accept=".xlsx, .docx, .pdf" onChange={handleFileUpload} style={{ display: 'none' }} />
        </div>
{/* Clear chat */}
        <div style={{ textAlign: 'center', display: 'flex', justifyContent: 'center', gap: '10px' }}>
          <button onClick={handleClearChat} style={buttonStyle}>Clear Chat</button>
        </div>
{/* File upload status and loading indicator */}
        {processingFile && (
          <div style={{ marginTop: '0.5rem' }}>
            <div style={{ width: '100%', height: '4px', backgroundColor: '#e5e7eb', overflow: 'hidden', borderRadius: '4px' }}>
              <div style={loadingBarStyle}></div>
            </div>
            <p style={{ textAlign: 'center', color: '#6b7280', fontStyle: 'italic', marginTop: '0.25rem' }}>
              Processing and downloading answers...
            </p>
          </div>
        )}

        {uploadStatus === 'success' && (
          <p style={{ textAlign: 'center', color: 'green' }}>
            ✅ Document processed and downloaded.
          </p>
        )}
        {uploadStatus === 'error' && (
          <p style={{ textAlign: 'center', color: 'red' }}>
            ❌ Failed to process the document.
          </p>
        )}
{/* User Input Section */}
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
            placeholder="Ask a detailed question..."
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
{/* Chat message display box */}
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
                {parseLinks(item.text)}

              </div>
            ))
          )}
          <div ref={chatEndRef} />
        </div>
      </div>
    </div>
  );
}

// Style for all buttons
const buttonStyle = {
  flex: 1,
  backgroundColor: '#000000',
  color: 'white',
  padding: '0.5rem 1rem',
  borderRadius: '0.5rem',
  fontSize: '0.875rem',
  border: 'none',
  cursor: 'pointer',
  textAlign: 'center'
};

