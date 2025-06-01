const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const logger = require("firebase-functions/logger");

// Define secrets for deployment (these must be set via CLI)
const openaiKey = defineSecret("OPENAI_API_KEY");
const httpProxy = defineSecret("HTTP_PROXY");

require("dotenv").config(); // for local testing only
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { HttpsProxyAgent } = require("https-proxy-agent");
const fetch = require("node-fetch");

const app = express();
app.use(cors());
app.use(bodyParser.json());

const getProxyAgent = () => {
  const proxyUrl = process.env.HTTP_PROXY || httpProxy.value();
  return new HttpsProxyAgent(proxyUrl);
};

const getApiKey = () => {
  return process.env.OPENAI_API_KEY || openaiKey.value();
};

// ===== Generate Questions Route =====
app.post("/generate-questions", async (req, res) => {
  const { skills, experience } = req.body;

  const prompt = `Generate exactly 10 interview questions (numbered 1 to 10) for a candidate with the following skill(s): ${skills}, and ${experience} years of experience. Only return the 10 questions as a numbered list, with no explanations or commentary.`;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      agent: getProxyAgent(),
      headers: {
        Authorization: `Bearer ${getApiKey()}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "AI Interview App",
      },
      body: JSON.stringify({
        model: "microsoft/phi-4-reasoning-plus:free",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("OpenRouter error:", errText);
      return res.status(500).json({ error: "OpenRouter failed." });
    }

    const data = await response.json();
    const rawText = data.choices[0].message.content;

    const questions = rawText
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => /^[0-9]+[.)-]?\s*(.+\?)$/.test(line))
      .map((line) => line.replace(/^[0-9]+[.)-]?\s*/, ""));

    if (questions.length < 10) {
      return res.status(200).json({ error: "AI returned fewer than 10 questions. Please retry." });
    }

    res.json({ questions });
  } catch (err) {
    console.error("Error generating questions:", err.message);
    res.status(500).json({ error: "Failed to generate questions." });
  }
});

// ===== Format Evaluation =====
function FormatEvaluation(rawText) {
  const result = { strengths: [], weaknesses: [], finalScore: "" };
  const strengthsMatch = rawText.match(/Strengths\s*:\s*(.*?)Weaknesses\s*:/s);
  if (strengthsMatch) {
    result.strengths = strengthsMatch[1].trim().split(/[\n•\-]+/).filter(Boolean);
  }
  const weaknessesMatch = rawText.match(/Weaknesses\s*:\s*(.*?)Overall Score\s*:/s);
  if (weaknessesMatch) {
    result.weaknesses = weaknessesMatch[1].trim().split(/[\n•\-]+/).filter(Boolean);
  }
  const scoreMatch = rawText.match(/Overall Score\s*:\s*(.*?)(?:\n|$)/s);
  if (scoreMatch) {
    result.finalScore = scoreMatch[1].trim();
  }
  return result;
}

// ===== Evaluate Interview Route =====
app.post("/evaluate", async (req, res) => {
  const { skills, experience, answers } = req.body;
  if (!skills || !experience || !Array.isArray(answers)) {
    return res.status(400).json({ error: "Missing input fields." });
  }

  const formattedAnswers = answers.map((a, i) => `Q${i + 1}: ${a.question}\nA${i + 1}: ${a.answer}`).join("\n\n");
  const evalPrompt = `You are an expert interviewer. Evaluate the following interview based on the candidate's answers, skillset (${skills}), and experience (${experience} years). Provide feedback on strengths, weaknesses, and an overall score out of 10.\n\n${formattedAnswers}`;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      agent: getProxyAgent(),
      headers: {
        Authorization: `Bearer ${getApiKey()}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "AI Interview Evaluation",
      },
      body: JSON.stringify({
        model: "microsoft/phi-4-reasoning-plus:free",
        messages: [{ role: "user", content: evalPrompt }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Evaluation error:", errText);
      return res.status(500).json({ error: "Evaluation API failed." });
    }

    const data = await response.json();
    const evaluation = FormatEvaluation(data.choices[0].message.content);
    res.json(evaluation);
  } catch (err) {
    console.error("Evaluation failed:", err.message);
    res.status(500).json({ error: "Evaluation failed." });
  }
});

// Export the Express app as a Firebase Function
exports.api = onRequest({ secrets: [openaiKey, httpProxy] }, app);
