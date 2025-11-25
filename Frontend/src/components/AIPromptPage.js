import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Box,
  Container,
  TextField,
  Button,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Paper,
  Alert,
  AppBar,
  Toolbar,
} from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import { useNavigate } from 'react-router-dom';

function AIPrompt() {
  // Allow overriding backend host during development (same pattern used elsewhere)
    const FRONTEND_API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:3001';
  const [topic, setTopic] = useState('');
  const [model, setModel] = useState('gpt');
  const [question, setQuestion] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
      const userData = localStorage.getItem('user');
  
      if (userData) {
        const userObj = JSON.parse(userData);
        setUser(userObj);
      } else {
        navigate('/login');
      }
    }, [navigate]);

  // =====================
  // OUTPUT FORMATTING
  // =====================

  // Nicely format output objects from the backend
  const formatOutput = (data) => {
    if (typeof data !== "object" || data === null) {
      return String(data); // let markdown render naturally
    }

    let formatted = "";

    for (const key in data) {
      const value = data[key];
      const title = key.replace(/([A-Z])/g, " $1").trim();

      formatted += `## ${title}\n\n`;

      if (typeof value === "string") {
        formatted += `${value}\n\n`;
      } 
      else if (Array.isArray(value)) {
        value.forEach((item, idx) => {
          formatted += `### Item ${idx + 1}\n\n`;

          if (typeof item === "object") {
            formatted += "```json\n";
            formatted += JSON.stringify(item, null, 2);
            formatted += "\n```\n\n";
          } else {
            formatted += `${item}\n\n`;
          }
        });
      }
      else if (typeof value === "object") {
        formatted += "```json\n";
        formatted += JSON.stringify(value, null, 2);
        formatted += "\n```\n\n";
      }
    }

    return formatted.trim();
  };

  // Helper to wrap text to readable width
  const wrapText = (text) => text;  // do nothing, keep markdown intact
  // const wrapText = (text, width = 80) => {
  //   const words = text.split(/\s+/);
  //   let lines = [];
  //   let current = "";

  //   for (const word of words) {
  //     if ((current + word).length > width) {
  //       lines.push(current.trim());
  //       current = "";
  //     }
  //     current += word + " ";
  //   }
  //   if (current) lines.push(current.trim());

  //   return lines.join("\n");
  // };

  const display = (data) => {
    setOutput(formatOutput(data));
  };

  const postData = async (url, data) => {
    const target = `${FRONTEND_API_BASE}${url}`; // url is expected to start with /api
    const res = await fetch(target, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    // accept both JSON and non-JSON responses without throwing on parse
    const contentType = res.headers.get('content-type') || '';
    let body;
    if (contentType.includes('application/json')) {
      body = await res.json();
    } else {
      // server returned non-JSON (likely HTML index) — capture for debugging
      const text = await res.text();
      body = { error: `Server returned non-JSON response (status ${res.status})`, raw: text.slice(0, 1000) };
    }

    if (!res.ok) {
      // If server returned HTML (usually the SPA index) make the error actionable
      let message = body?.error || `HTTP ${res.status}`;
      if (contentType.includes('text/html') || (body && body.raw && body.raw.startsWith('<!doctype'))) {
        message = `Server returned HTML instead of JSON (status ${res.status}). This typically means your request hit the static frontend server (index.html) rather than the backend API.\n+Check that your backend is running and that REACT_APP_API_BASE (or API_BASE) points at the backend (e.g. http://localhost:3001), or configure CRA's proxy. Raw server response omitted.`;
      }

      throw new Error(message);
    }

    return body;
  };

  // start topic
  const handleStartTopic = async () => {
    if (!topic.trim()) {
      setError("Enter a topic");
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await postData("/api/startTopic", { topic, model, user_id: user.id });
      display(data);
    } catch (err) {
      display({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  // ask question
  const handleAskQuestion = async () => {
    if (!topic.trim() || !question.trim()) {
      setError("Enter a topic and question");
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await postData("/api/askQuestion", { topic, question, model, user_id: user.id });
      display(data);
    } catch (err) {
      display({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  // hint
  const handleHint = async () => {
    if (!topic.trim()) {
      setError("Enter a topic first");
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await postData("/api/hint", { topic, model, user_id: user.id });
      display(data);
    } catch (err) {
      display({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      {/* Header */}
      <AppBar 
        position="static" 
        sx={{ 
          bgcolor: 'white', 
          color: '#333',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <SchoolIcon sx={{ fontSize: 32, color: '#1a5f7a', mr: 1 }} />
            <Typography variant="h6" sx={{ color: '#1a5f7a', fontWeight: 600 }}>
              Tutor Bot
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper sx={{ p: 4, mb: 3 }}>
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 600, 
              color: '#333',
              mb: 4,
              textAlign: 'center'
            }}
          >
            TutorHelper Interactive Test
          </Typography>

          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Topic Input */}
          <TextField
            fullWidth
            label="Topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Enter topic"
            sx={{ mb: 3 }}
          />

          {/* Model Selection */}
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Main Model</InputLabel>
            <Select
              value={model}
              label="Main Model"
              onChange={(e) => setModel(e.target.value)}
            >
              <MenuItem value="gpt">GPT</MenuItem>
              <MenuItem value="mistral">Mistral</MenuItem>
              <MenuItem value="deepseek">DeepSeek</MenuItem>
              <MenuItem value="gemini">Gemini</MenuItem>
            </Select>
          </FormControl>

          {/* Question Textarea */}
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask a question or leave blank to start topic"
            sx={{ mb: 3 }}
          />

          {/* Buttons */}
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 4 }}>
            <Button
              variant="contained"
              onClick={handleStartTopic}
              disabled={loading}
              sx={{
                bgcolor: '#2c3e50',
                textTransform: 'none',
                '&:hover': {
                  bgcolor: '#1a252f',
                },
              }}
            >
              Start Topic
            </Button>
            <Button
              variant="contained"
              onClick={handleAskQuestion}
              disabled={loading}
              sx={{
                bgcolor: '#27ae60',
                textTransform: 'none',
                '&:hover': {
                  bgcolor: '#219a52',
                },
              }}
            >
              Ask Question
            </Button>
            <Button
              variant="contained"
              onClick={handleHint}
              disabled={loading}
              sx={{
                bgcolor: '#e67e22',
                textTransform: 'none',
                '&:hover': {
                  bgcolor: '#d35400',
                },
              }}
            >
              Hint
            </Button>
          </Box>

          {/* Output Section */}
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
            Output:
          </Typography>

          <Paper
            variant="outlined"
            sx={{
              p: 2,
              bgcolor: '#f8f9fa',
              minHeight: '200px',
              maxHeight: '400px',
              overflow: 'auto',
              fontSize: '14px',
              }}
          >
            {output ? (
              <ReactMarkdown>{output}</ReactMarkdown>
            ) : (
              <ReactMarkdown>{'Output will appear here...'}</ReactMarkdown>
            )}
          </Paper>
        </Paper>
      </Container>
    </Box>
  );
}

export default AIPrompt;