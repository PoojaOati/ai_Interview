import React, { useState } from 'react';
import {
  Container,
  TextField,
  Button,
  Typography,
  Box,
  Paper,
  Link,
} from '@mui/material';
import { auth } from '../firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import emailjs from '@emailjs/browser';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [isForgot, setIsForgot] = useState(false);
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

      // Validate email via Abstract API
      const res = await fetch(
        `https://emailvalidation.abstractapi.com/v1/?api_key=${process.env.REACT_APP_ABSTRACT_API_KEY}&email=${email}`
      );
      const data = await res.json();

      if (!data.deliverability || data.deliverability !== 'DELIVERABLE') {
        enqueueSnackbar('Invalid or fake email. Please enter a valid email address.', { variant: 'warning' });
        return;
      }

      // Send verification email via EmailJS
      await emailjs.send(
        process.env.REACT_APP_EMAILJS_SERVICE_ID,
        process.env.REACT_APP_EMAILJS_TEMPLATE_ID,
        {
          to_email: email,
          message: `Please click the link to verify your email:\nhttps://ai-interview-frontend.onrender.com/verify?uid=${user.uid}`
        },
        process.env.REACT_APP_EMAILJS_PUBLIC_KEY
      );

      enqueueSnackbar('Verification email sent. Please check your inbox.', { variant: 'info' });
      navigate('/login');
    } catch (error) {
      console.error('Registration error:', error);
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

  const handleForgotPassword = async () => {
    if (!email) {
      enqueueSnackbar('Please enter your email to reset the password.', { variant: 'info' });
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      enqueueSnackbar('Password reset link sent. Check your inbox.', { variant: 'success' });
      setIsForgot(false);
      setIsLogin(true);
    } catch (error) {
      console.error('Reset error:', error);
      enqueueSnackbar('Failed to send reset email. Please try again.', { variant: 'error' });
    }
  };

  const handleAuth = async () => {
    if (isForgot) {
      await handleForgotPassword();
    } else if (isLogin) {
      await handleLogin();
    } else {
      await handleRegister();
    }
  };

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ p: 4, mt: 8 }}>
        <Typography variant="h4" align="center" gutterBottom>
          {isForgot ? 'Reset Password' : isLogin ? 'Login' : 'Register'}
        </Typography>
        <Box display="flex" flexDirection="column" gap={2}>
          <TextField
            label="Email"
            fullWidth
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {!isForgot && (
            <TextField
              label="Password"
              type="password"
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          )}
          <Button variant="contained" color="primary" onClick={handleAuth}>
            {isForgot ? 'Send Reset Link' : isLogin ? 'Login' : 'Register'}
          </Button>

          {isLogin && !isForgot && (
            <Link
              component="button"
              variant="body2"
              onClick={() => setIsForgot(true)}
              sx={{ alignSelf: 'flex-end' }}
            >
              Forgot Password?
            </Link>
          )}

          <Button
            onClick={() => {
              setIsLogin(!isLogin);
              setIsForgot(false);
            }}
            sx={{ mt: 1 }}
            color="secondary"
          >
            {isForgot
              ? 'Back to Login'
              : isLogin
              ? "Don't have an account? Register"
              : 'Already have an account? Login'}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default Auth;
