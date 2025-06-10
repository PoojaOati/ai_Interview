import React, { useState, useEffect, useRef} from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Container,
  TextField,
  FormControl,
  Typography,
  AppBar,
  Toolbar,
  IconButton,
  InputLabel,MenuItem, Select,
  Stack,
  Snackbar,
  Alert,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import AiAvatar from './AiAvatar';
import axios from 'axios';
import jsPDF from 'jspdf';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [skills, setSkills] = useState('SQL');
  const [experience, setExperience] = useState(1);
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [recording, setRecording] = useState(false);
  const [transcribedAnswer, setTranscribedAnswer] = useState('');
  const [answers, setAnswers] = useState([]);
  const recognitionRef = useRef(null);
  const [loadingTextIndex, setLoadingTextIndex] = useState(0);
  const [evaluationResult, setEvaluationResult] = useState(null);
  const evaluationRef = useRef();
  const [disabledText, setDisabledText] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState([]);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [noAnswer,setNoAnswer]  = useState(true);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const formRef = useRef(null);

 useEffect(() => {
  const introText =
    "Let's start with the interview. Select your skills and years of experience and click submit to start.";
  const utterance = new SpeechSynthesisUtterance(introText);
  utterance.rate = 1;
  utterance.pitch = 1;

  setIsSpeaking(true);
  utterance.onend = () => {
    setIsSpeaking(false);
    setShowForm(true);

    // 🔁 Scroll after rendering the form
    setTimeout(() => {
      if (formRef.current) {
        formRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, 200); // small delay to let form mount
  };

  speechSynthesis.speak(utterance);

  return () => {
    speechSynthesis.cancel();
    setIsSpeaking(false);
  };
}, []);


  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setLoadingTextIndex((prev) => (prev + 1) % loadingMessages.length);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [loading, loadingMessages]);

  const handleStartInterview = async () => {
    if (!skills.trim() || !experience) {
       enqueueSnackbar('Please select your skills and experience.', { variant: 'warning' });
     // alert('Please enter your skills and experience.');
      return;
    }

    setLoading(true);
    setDisabledText(true);
    const messages = [
      'Creating questions for the interview...',
      'Loading questions...',
      'Sorry to keep you waiting...'
    ];
    setLoadingMessages(messages);

    const loadingUtterance = new SpeechSynthesisUtterance();
    loadingUtterance.rate = 1;
    loadingUtterance.pitch = 1;

    loadingUtterance.onend = async () => {
      try {
        const response = await axios.post('https://ai-interview-backend-90wp.onrender.com/generate-questions', {
          skills,
          experience,
        });

        const cleanedQuestions = response.data.questions || [];

        if (cleanedQuestions.length < 10) {
           enqueueSnackbar('Less than 10 questions received. Please Retry Once..', { variant: 'info' });
          //alert('Less than 10 questions received. Please Retry Once.');
        }

        setQuestions(cleanedQuestions);
        setCurrentQuestionIndex(0);
        setLoading(false);

        if (cleanedQuestions.length > 0) {
          speakQuestion(cleanedQuestions[0]);
        }
      } catch (error) {
        console.error('Error fetching questions:', error);
        setLoading(false);
      }
    };

    speechSynthesis.speak(loadingUtterance);
  };

  const speakQuestion = (question) => {
    setDisplayedText('');
    const words = question.split(' ');
    let wordIndex = 0;

    const utterance = new SpeechSynthesisUtterance(question);
    utterance.rate = 1;
    utterance.pitch = 1;

    utterance.onstart = () => {
      setIsSpeaking(true);
      const interval = setInterval(() => {
        setDisplayedText((prev) => prev + words[wordIndex] + ' ');
        wordIndex++;
        if (wordIndex >= words.length) {
          clearInterval(interval);
        }
      }, 300);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
    };

    speechSynthesis.speak(utterance);
  };

  const startTranscription = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      enqueueSnackbar('Speech recognition not supported in this browser.', { variant: 'warning' });
      //alert('Speech recognition not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.continuous = true;

    recognition.onresult = (event) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + ' ';
        }
      }
      if (finalTranscript) {
        setTranscribedAnswer((prev) => (prev + ' ' + finalTranscript).trim());
      }
    };
    if(transcribedAnswer === '' || transcribedAnswer === undefined) {
      setOpenSnackbar(true);
      setNoAnswer(true);
    }

    recognition.onerror = (e) => {
      console.error('Speech recognition error:', e.error);
      setRecording(false);
    };

    recognition.onend = () => {
      if (recording) {
        recognition.start();
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    setRecording(true);
  };

  const stopTranscription = () => {
    setRecording(false);
    setDisabledText(false);
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setNoAnswer(false);
  };

  const handleNextQuestion = () => {
    setAnswers((prev) => [...prev, transcribedAnswer]);
    setTranscribedAnswer('');
    setDisabledText(true);
    setNoAnswer(true);

    if (currentQuestionIndex < questions.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      setDisplayedText('');
      speakQuestion(questions[nextIndex]);
    }
  };

  const handleSubmitTest = async () => {
    setLoading(true);
    const messages = ['Evaluating Your Interview...', 'Be Patient you will get the result shortly..'];
    setLoadingMessages(messages);
    const finalAnswers = [...answers, transcribedAnswer];

    try {
      const response = await axios.post('https://ai-interview-backend-90wp.onrender.com/evaluate', {
        skills,
        experience,
        questions,
        answers: finalAnswers,
      });
      setEvaluationResult(response.data);
    } catch (error) {
      console.error('Error during evaluation:', error);
      enqueueSnackbar('Evaluation failed.', { variant: 'error' });
      //alert('Evaluation failed.');
    }

    setLoading(false);
  };

//import { jsPDF } from 'jspdf';

//import { jsPDF } from 'jspdf';

const handleDownloadPDF = () => {
  const pdf = new jsPDF();
  const pageHeight = pdf.internal.pageSize.height;
  const pageWidth = pdf.internal.pageSize.width;
  const lineHeight = 8;
  let y = 30;
  let pageNumber = 1;

  const currentDate = new Date().toLocaleDateString();

  const addHeader = () => {
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Interview Evaluation Report', 20, 20);
  };

  const addFooter = () => {
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Page ${pageNumber}`, 20, pageHeight - 10);
    pdf.text(`Date: ${currentDate}`, pageWidth - 50, pageHeight - 10);
  };

  const addNewPage = () => {
    pdf.addPage();
    pageNumber++;
    y = 30;
    addHeader();
    addFooter();
  };

  const addTextWithWrap = (label, text, isBold = false) => {
    if (isBold) {
      pdf.setFont('helvetica', 'bold');
    } else {
      pdf.setFont('helvetica', 'normal');
    }

    const lines = pdf.splitTextToSize(`${label} ${text}`, 170);
    lines.forEach((line) => {
      if (y > pageHeight - 20) {
        addNewPage();
      }
      pdf.text(line, 20, y);
      y += lineHeight;
    });
    y += 5;
  };

  // First page setup
  addHeader();
  addFooter();
  pdf.setFontSize(12);

  // Report content
  addTextWithWrap('', `This report outlines the candidate's evaluation based on an automated interview analysis. The assessment includes skills, experience, strengths, weaknesses, and an overall performance score.`);
  addTextWithWrap('Skills:', skills, true);
  addTextWithWrap('Experience:', `${experience} years`, true);
  addTextWithWrap('Strengths:', evaluationResult?.strengths || 'N/A', true);
  addTextWithWrap('Weaknesses:', evaluationResult?.weaknesses || 'N/A', true);
  addTextWithWrap('Final Score:', evaluationResult?.finalScore || 'N/A', true);

  // Thank You + Feedback
  const thankYouNote = `Thank you for using our AI Interview Evaluation Tool. We hope this report helped you better understand the candidate's performance.`;
  const feedbackNote = `We’re always looking to improve! Please share your feedback or suggestions via the email below.`;

  if (y > pageHeight - 40) {
    addNewPage();
  }

  pdf.setFont('helvetica', 'bold');
  pdf.text('— Thank You —', 20, y);
  y += 10;

  pdf.setFont('helvetica', 'normal');
  addTextWithWrap('', thankYouNote);
  addTextWithWrap('', feedbackNote);

  // Add clickable email link
  const email = 'poojas632@gmail.com';
  const mailtoLink = `mailto:${email}`;
  pdf.setTextColor(0, 0, 255); // blue link color
  pdf.textWithLink(email, 20, y, { url: mailtoLink });
  pdf.setTextColor(0, 0, 0); // reset to black

  // Save the PDF
  pdf.save('interview_evaluation.pdf');
};

const feedbackClicked = () => {
  navigate('/feedback');
};

  const handleStartNew = () => {
    setSkills('SQL');
    setExperience(1);
    setQuestions([]);
    setAnswers([]);
    setCurrentQuestionIndex(0);
    setDisplayedText('');
    setTranscribedAnswer('');
    setEvaluationResult(null);
    setShowForm(true);
  };

  const logout = () => {
    signOut(auth);
    navigate('/login');
  };

  return (
    <Container maxWidth="md" sx={{ py: 2 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            AI Interviewer
          </Typography>
          <IconButton color="inherit" onClick={logout}>
            <LogoutIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Stack direction={isMobile ? 'column' : 'row'} spacing={4} alignItems="center" sx={{ mt: 4 }}>
        <AiAvatar isSpeaking={isSpeaking} />
      </Stack>

      {!showForm && <Box sx={{ height: '20vh' }} />}

      {showForm && !loading && questions.length === 0 && !evaluationResult &&
      (
<Box ref={formRef}
  sx={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    mt: 4,
  }}
>
  <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
    <FormControl sx={{ minWidth: 140 }}>
      <InputLabel id="skills-label">Skills</InputLabel>
      <Select
        labelId="skills-label"
        value={skills}
        label="Skills"
        onChange={(e) => setSkills(e.target.value)}
      >
        <MenuItem value="JavaScript">JavaScript</MenuItem>
        <MenuItem value="Python">Python</MenuItem>
        <MenuItem value="Java">Java</MenuItem>
        <MenuItem value="C#">C#</MenuItem>
        <MenuItem value="SQL">SQL</MenuItem>
        <MenuItem value="React">React</MenuItem>
        <MenuItem value="Node.js">Node.js</MenuItem>
        <MenuItem value="Machine Learning">Machine Learning</MenuItem>
      </Select>
    </FormControl>

    <FormControl sx={{ minWidth: 140 }}>
      <InputLabel id="experience-label">Experience</InputLabel>
      <Select
        labelId="experience-label"
        value={experience}
        label="Experience"
        onChange={(e) => setExperience(e.target.value)}
      >
        <MenuItem value="1">1 Year</MenuItem>
        <MenuItem value="2">2 Years</MenuItem>
        <MenuItem value="3">3 Years</MenuItem>
        <MenuItem value="4">4 Years</MenuItem>
        <MenuItem value="5">5 Years</MenuItem>
        <MenuItem value="6+">6+ Years</MenuItem>
      </Select>
    </FormControl>
  </Box>

  <Button
    variant="contained"
    size="medium"
    sx={{ width: 120 }}
    onClick={handleStartInterview}
  >
    Let's Start
  </Button>
</Box>


      )}
      {loading && (
        <Box sx={{ height: '50vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <CircularProgress />
          <Typography variant="h6" sx={{ mt: 2 }}>{loadingMessages[loadingTextIndex]}</Typography>
        </Box>
      )}

      {!loading && questions.length > 0 && !evaluationResult && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6">Question {currentQuestionIndex + 1}:</Typography>
          <Typography variant="body1" sx={{ mt: 2 }}>{displayedText}</Typography>

          <TextField
            fullWidth
            multiline
            minRows={3}
            disabled={disabledText}
            label="Your Answer"
            value={transcribedAnswer}
            onChange={(e) => setTranscribedAnswer(e.target.value)}
            sx={{ mt: 3 }}
          />

          {!recording ? (
            <Button variant="contained" color="success" onClick={startTranscription} sx={{ mt: 2 }}>
              Start Answering
            </Button>
          ) : (
            <Button variant="contained" color="error" onClick={stopTranscription} sx={{ mt: 2 }}>
              Stop & Submit Answer
            </Button>
          )}
          <Button
            variant="outlined"
            sx={{ mt: 2, ml: 2 }}
            onClick={handleNextQuestion}
            disabled={noAnswer}
          >
            Next Question
          </Button>

          {currentQuestionIndex >= 1 && (
            <Button variant="contained" color="primary" sx={{ mt: 2, ml: 2 }} onClick={handleSubmitTest}>
              Submit Test
            </Button>
          )}
        </Box>
      )}

      {evaluationResult && (
        <Box sx={{ mt: 4 }} ref={evaluationRef}>
          <Typography variant="h5" gutterBottom>Interview Evaluation</Typography>
          <Typography variant="body1" sx={{ mt: 2 }}><strong>Strengths:</strong> {evaluationResult.strengths}</Typography>
          <Typography variant="body1" sx={{ mt: 2 }}><strong>Weaknesses:</strong> {evaluationResult.weaknesses}</Typography>
          <Typography variant="h6" sx={{ mt: 3 }}><strong>Final Score:</strong> {evaluationResult.finalScore}</Typography>

          <Button variant="contained" color="secondary" onClick={handleDownloadPDF} sx={{ mt: 3, mr: 2 }}>
            Download PDF
          </Button>
          <Button variant="outlined" color="primary" onClick={handleStartNew} sx={{ mt: 3 }}>
            Start New Interview
          </Button>
          <Button variant="outlined" color="primary" onClick={feedbackClicked} sx={{ mt: 3 }}>
           Like us?
          </Button>
        </Box>
      )}
    </Container>
  );
};

export default Home;
