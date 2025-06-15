// src/pages/VerifyEmailReminder.js

import React from 'react';
import { Button, Typography, Container, Paper } from '@mui/material';
import { auth } from '../firebase';
import { sendEmailVerification } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

const VerifyEmailReminder = () => {
  const navigate = useNavigate();

  const resendVerificationEmail = async () => {
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser);
      alert('Verification email resent. Please check your inbox.');
    }
  };

  return (
    <Container maxWidth="sm">
      <Paper sx={{ p: 4, mt: 8, textAlign: 'center' }}>
        <Typography variant="h5" gutterBottom>
          Please verify your email to continue.
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Check your inbox and click the verification link.
        </Typography>
        <Button variant="contained" onClick={resendVerificationEmail} sx={{ mr: 2 }}>
          Resend Verification Email
        </Button>
        <Button variant="outlined" onClick={() => navigate('/login')}>
          Back to Login
        </Button>
      </Paper>
    </Container>
  );
};

export default VerifyEmailReminder;
