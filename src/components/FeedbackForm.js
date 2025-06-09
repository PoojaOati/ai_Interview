// FeedbackForm.js
import React, { useState } from 'react';
import emailjs from 'emailjs-com';
import { useNavigate } from 'react-router-dom';

import {
  Box,
  Button,
  Typography,
  TextField,
  Rating,
  Snackbar,
  Alert,
} from '@mui/material';

export default function FeedbackForm({ onSubmitSuccess }) {
  const [rating, setRating] = useState(0);
  const [comments, setComments] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const navigate = useNavigate();


  const handleSubmit = async () => {
    const feedback = {
      rating,
      comments,
      submittedAt: new Date().toISOString(),
    };

   await emailjs.send(
      'service_q54pshc',
      'template_kzzd6ce',
      {
        rating: feedback.rating,
        comments: feedback.comments,
        submittedAt: feedback.submittedAt,
      },
      'fC0Xn4n_sehmeZCd6' // (public key)
    );

    setSubmitted(true);
    setOpenSnackbar(true);
    setTimeout(() => {
      navigate('/'); // Redirect to homepage
    }, 2000); // 2 seconds delays
  };

  return (
    <Box
      sx={{
        p: 3,
        mt: 4,
        border: '1px solid #ccc',
        borderRadius: '16px',
        backgroundColor: '#f9f9f9',
        maxWidth: 600,
        mx: 'auto',
      }}
    >
      <Typography variant="h6" gutterBottom>
        💬 Help us improve!
      </Typography>

      <Typography gutterBottom>How would you rate your experience?</Typography>
      <Rating
        value={rating}
        onChange={(e, newValue) => setRating(newValue)}
        sx={{ mb: 2 }}
      />

      <TextField
        fullWidth
        multiline
        rows={4}
        variant="outlined"
        label="Any suggestions or feedback?"
        value={comments}
        onChange={(e) => setComments(e.target.value)}
        sx={{ mb: 2 }}
      />

      <Button
        variant="contained"
        color="primary"
        onClick={handleSubmit}
        disabled={submitted}
      >
        {submitted ? 'Thanks for your feedback!' : 'Submit Feedback'}
      </Button>

      <Snackbar
        open={openSnackbar}
        autoHideDuration={3000}
        onClose={() => setOpenSnackbar(false)}
      >
        <Alert onClose={() => setOpenSnackbar(false)} severity="success" sx={{ width: '100%' }}>
          Feedback submitted successfully!
        </Alert>
      </Snackbar>
    </Box>
  );
}
