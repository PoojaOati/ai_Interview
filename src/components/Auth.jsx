import React, { useState } from 'react';
import {
  Container,
  TextField,
  Button,
  Typography,
  Box,
  Paper,
} from '@mui/material';
import { auth } from '../firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from 'firebase/auth'; // 🔧 Removed sendEmailVerification
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import emailjs from '@emailjs/browser'; // 🔧 Import EmailJS

// const SERVICE_ID = 'service_q54pshc';     // 🔧 Replace with your EmailJS service ID
// const TEMPLATE_ID = 'template_am09vij';   // 🔧 Replace with your template ID
// const PUBLIC_KEY = 'fC0Xn4n_sehmeZCd6';     // 🔧 Replace with your public key

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

const handleLogin = async () => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    if (!user.emailVerified) {
      enqueueSnackbar('Please verify your email before logging in.', { variant: 'warning' });
      return;
    }

    const hasSeenAbout = localStorage.getItem('hasSeenAbout') === 'true';
    navigate(hasSeenAbout ? '/home' : '/about');
  } catch (error) {
    console.error('Login error:', error);
    enqueueSnackbar('Login failed. Please try again.', { variant: 'error' });
  }
};

const handleRegister = async () => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // 🔧 Send verification email using EmailJS
    await emailjs.send(
      process.env.REACT_APP_EMAILJS_SERVICE_ID,
      process.env.REACT_APP_EMAILJS_TEMPLATE_ID,
      {
        to_email: email,
        message: `Please click the link to verify your email:\nhttps://ai-interview-frontend.onrender.com/verify?uid=${user.uid}`
      },
      process.env.REACT_APP_EMAILJS_PUBLIC_KEY
    );

    enqueueSnackbar('Verification email sent via EmailJS. Please check your inbox.', { variant: 'info' });
    navigate('/login');
  } catch (error) {
    console.error('Registration error:', error);

    // 🔍 Specific Firebase error handling
    switch (error.code) {
      case 'auth/email-already-in-use':
        enqueueSnackbar('Email is already registered. Please login or use another email.', { variant: 'warning' });
        break;

      case 'auth/invalid-email':
        enqueueSnackbar('Invalid email format. Please check and try again.', { variant: 'warning' });
        break;

      case 'auth/weak-password':
        enqueueSnackbar('Password is too weak. Please choose a stronger one.', { variant: 'warning' });
        break;

      default:
        enqueueSnackbar(`Registration failed. Please try again. (${error.message})`, { variant: 'error' });
        break;
    }
  }
};


// 🔁 Replaces your old `handleAuth`
const handleAuth = async () => {
  if (isLogin) {
    await handleLogin();
  } else {
    await handleRegister();
  }
};


  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ p: 4, mt: 8 }}>
        <Typography variant="h4" align="center" gutterBottom>
          {isLogin ? 'Login' : 'Register'}
        </Typography>
        <Box display="flex" flexDirection="column" gap={2}>
          <TextField
            label="Email"
            fullWidth
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            label="Password"
            type="password"
            fullWidth
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button variant="contained" color="primary" onClick={handleAuth}>
            {isLogin ? 'Login' : 'Register'}
          </Button>
          <Button
            onClick={() => setIsLogin(!isLogin)}
            sx={{ mt: 1 }}
            color="secondary"
          >
            {isLogin
              ? "Don't have an account? Register"
              : 'Already have an account? Login'}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default Auth;
