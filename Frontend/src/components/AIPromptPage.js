import React, { useState } from 'react';
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
    // If response contains AI results (object), build readable sections
    if (typeof data === "object" && data !== null) {
      let formatted = "";

      for (const key in data) {
        const value = data[key];
        const title = key.replace(/([A-Z])/g, " $1").toUpperCase();

        formatted += `=== ${title.trim()} ===\n`;

        if (typeof value === "string") {
          formatted += wrapText(value) + "\n\n";
        } else if (Array.isArray(value)) {
          formatted += value
            .map((v, i) => {
              if (typeof v === "object") {
                return `#${i + 1}: ${v.model ? `[${v.model}] ` : ""}${wrapText(JSON.stringify(v.check || v, null, 2))}`;
              } else {
                return `#${i + 1}: ${wrapText(String(v))}`;
              }
            })
            .join("\n\n");
          formatted += "\n\n";
        } else if (typeof value === "object" && value !== null) {
          formatted += JSON.stringify(value, null, 2) + "\n\n";
        } else {
          formatted += String(value) + "\n\n";
        }
      }

      return formatted.trim();
    }

    // Otherwise just return wrapped text
    return wrapText(String(data));
  };

  // Helper to wrap text to readable width
  const wrapText = (text, width = 80) => {
    const words = text.split(/\s+/);
    let lines = [];
    let current = "";

    for (const word of words) {
      if ((current + word).length > width) {
        lines.push(current.trim());
        current = "";
      }
      current += word + " ";
    }
    if (current) lines.push(current.trim());

    return lines.join("\n");
  };

  const display = (data) => {
    setOutput(formatOutput(data));
  };

  const postData = async (url, data) => {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
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
              fontFamily: 'monospace',
              fontSize: '14px',
              whiteSpace: 'pre-wrap',
              wordWrap: 'break-word'
            }}
          >
            {output || 'Output will appear here...'}
          </Paper>
        </Paper>
      </Container>
    </Box>
  );
}

export default AIPrompt;