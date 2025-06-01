import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Button,
  Box,
  Paper,
} from '@mui/material';
import { motion } from 'framer-motion';

const About = () => {
  const navigate = useNavigate();

  const handleProceed = () => {
    localStorage.setItem('hasSeenAbout', 'true');
    navigate('/home');
  };

  return (
    <Container maxWidth="sm">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        <Paper elevation={3} sx={{ p: 4, mt: 8 }}>
          <Typography variant="h4" align="center" gutterBottom>
            Welcome to Smart Interview Assistant
          </Typography>
          <Typography variant="body1" sx={{ mt: 2 }}>
            This tool helps simulate technical interviews using AI-generated questions tailored to your skills and experience.
          </Typography>
          <Typography variant="body1" sx={{ mt: 2 }}>
            Speak your answers, and the system will transcribe, evaluate, and generate a personalized report.
          </Typography>
          <Typography variant="body1" sx={{ mt: 2 }}>
            Click below to start your interview session!
          </Typography>
          <Box textAlign="center" sx={{ mt: 4 }}>
            <Button variant="contained" color="primary" onClick={handleProceed}>
              Proceed to Interview
            </Button>
          </Box>
        </Paper>
      </motion.div>
    </Container>
  );
};

export default About;
