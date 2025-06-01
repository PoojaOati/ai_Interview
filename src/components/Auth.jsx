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
} from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();

  const handleAuth = async () => {
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }

      const hasSeenAbout = localStorage.getItem('hasSeenAbout') === 'true';
      navigate(hasSeenAbout ? '/home' : '/about');
    } catch (error) {
      console.error('Authentication error:', error);
      alert('Authentication failed. Please try again.');
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
