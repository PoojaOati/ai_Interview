const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { HttpsProxyAgent } = require('https-proxy-agent');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const port = 5000;

app.use(cors());
app.use(bodyParser.json());

// Proxy configuration
const proxyUrl = process.env.HTTP_PROXY || 'http://proxy-chain.intel.com:911';
const httpsAgent = new HttpsProxyAgent(proxyUrl);

// OpenRouter API settings
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_API_KEY = process.env.OPENAI_API_KEY;

// Route to generate interview questions
app.post('/generate-questions', async (req, res) => {
  const { skills, experience } = req.body;

  const generatePrompt = () =>
    `Generate exactly 10 interview questions (numbered 1 to 10) for a candidate with the following skill(s): ${skills}, and ${experience} years of experience. Only return the 10 questions as a numbered list, with no explanations or commentary.`;

  const fetchQuestionsFromOpenRouter = async () => {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      agent: httpsAgent,
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'AI Interview App'
      },
      body: JSON.stringify({
        model: 'microsoft/phi-4-reasoning-plus:free',
        messages: [
          { role: 'user', content: generatePrompt() }
        ]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('OpenRouter error response:', errText);
      throw new Error('Failed to fetch questions from OpenRouter');
    }

    const data = await response.json();
    const rawText = data.choices[0].message.content;

    const questions = rawText
      .split('\n')
      .map(line => line.trim())
      .filter(line => /^[0-9]+[.)-]?\s*(.+\?)$/.test(line)) // Only keep lines that look like questions
      .map(line => line.replace(/^[0-9]+[.)-]?\s*/, ''));   // Remove numbering

    return questions;
  };

  try {
    let questions = await fetchQuestionsFromOpenRouter();

    // Retry once if fewer than 10 questions are returned
    if (questions.length < 10) {
      console.warn(`Only got ${questions.length} questions. Retrying once...`);
       return res.status(200).json({ error: 'AI returned fewer than 10 questions.Please retry once.' });
      //questions = await fetchQuestionsFromOpenRouter();
    }

    if (questions.length < 10) {
      return res.status(500).json({ error: 'OpenRouter returned fewer than 10 questions even after retry.' });
    }

    res.json({ questions });
  } catch (error) {
    console.error('Error generating questions:', error.message);
    res.status(500).json({ error: 'Failed to generate questions (network or config error).' });
  }
});


function FormatEvaluation(rawText) {
    const result = {
      strengths: [],
      weaknesses: [],
      finalScore: ''
    };
  
    // Extract Strengths
    const strengthsMatch = rawText.match(/Strengths\s*:\s*(.*?)Weaknesses\s*:/s);
    if (strengthsMatch) {
      const strengths = strengthsMatch[1].trim().split(/[\n•\-]+/).filter(s => s.trim() !== '');
      result.strengths = strengths.map(s => s.trim());
    }
  
    // Extract Weaknesses
    const weaknessesMatch = rawText.match(/Weaknesses\s*:\s*(.*?)Overall Score\s*:/s);
    if (weaknessesMatch) {
      const weaknesses = weaknessesMatch[1].trim().split(/[\n•\-]+/).filter(w => w.trim() !== '');
      result.weaknesses = weaknesses.map(w => w.trim());
    }
  
    // Extract Final Score
    const scoreMatch = rawText.match(/Overall Score\s*:\s*(.*?)(?:\n|$)/s);
    if (scoreMatch) {
      result.finalScore = scoreMatch[1].trim();
    }
  
    return result;
  }

// Route to evaluate interview answers
app.post('/evaluate', async (req, res) => {
    const { skills, experience, answers } = req.body;
  
    if (!skills || !experience || !Array.isArray(answers)) {
      return res.status(400).json({ error: 'Missing skills, experience, or answers.' });
    }
  
    const formattedAnswers = answers.map((a, i) => `Q${i + 1}: ${a.question}\nA${i + 1}: ${a.answer}`).join('\n\n');
    const evalPrompt = `You are an expert interviewer. Evaluate the following interview based on the candidate's answers, skillset (${skills}), and experience (${experience} years). Provide feedback on strengths, weaknesses, and an overall score out of 10. Interview:\n\n${formattedAnswers}`;
  
    try {
      const response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        agent: httpsAgent,
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'AI Interview Evaluation'
        },
        body: JSON.stringify({
          model: 'microsoft/phi-4-reasoning-plus:free',
          messages: [
            { role: 'user', content: evalPrompt }
          ]
        })
      });
  
      if (!response.ok) {
        const errText = await response.text();
        console.error('Evaluation OpenRouter error:', errText);
        return res.status(500).json({ error: 'Failed to evaluate interview.' });
      }
  
      const data = await response.json();
      const evaluation = data.choices[0].message.content;
      const formatted = FormatEvaluation(evaluation);
    console.log('evaluation12',evaluation);

    res.json(formatted);
    console.log('evaluation',formatted);
  
      //res.json({ evaluation });
    }   catch (error) {
    console.error('Error during evaluation:', error);
    res.status(500).json({ error: 'Failed to evaluate interview (network or config error).' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
