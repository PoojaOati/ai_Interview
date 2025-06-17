import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Auth from './components/Auth';
import Home from './components/Home';
import About from './components/About';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useEffect, useState } from 'react';
import FeedbackForm from './components/FeedbackForm';
import VerifyEmailReminder from './components/VerifyEmailReminder';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const disableContextMenu = (e) => e.preventDefault();

    const disableDevTools = (e) => {
      if (
        e.key === 'F12' || // F12
        (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key)) || // Ctrl+Shift+I/J/C
        (e.ctrlKey && e.key === 'U') // Ctrl+U
      ) {
        e.preventDefault();
      }
    };

    document.addEventListener('contextmenu', disableContextMenu);
    document.addEventListener('keydown', disableDevTools);

    document.title = "AI Interview";
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () =>{ unsubscribe()
      document.removeEventListener('contextmenu', disableContextMenu);
      document.removeEventListener('keydown', disableDevTools);
    };
  }, []);

  return (
    <Router>
      <Routes>
       <Route path="/login" element={<Auth />} />
       <Route path="/about" element={<ProtectedRoute><About /></ProtectedRoute>} />
      <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
      <Route path="/verify-email" element={<VerifyEmailReminder />} />
        <Route path="/feedback" element={<FeedbackForm />} />
        <Route path="*" element={user ? <Home /> : <Auth />} />
      </Routes>
    </Router>
  );
}

export default App;
