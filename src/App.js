import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Auth from './components/Auth';
import Home from './components/Home';
import About from './components/About';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useEffect, useState } from 'react';
import FeedbackForm from './components/FeedbackForm';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    document.title = "AI Interview";
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  return (
    <Router>
      <Routes>
       <Route path="/login" element={<Auth />} />
       <Route path="/about" element={<About />} />
        <Route path="/home" element={<Home />} />
        <Route path="/feedback" element={<FeedbackForm />} />
        <Route path="/" element={user ? <Home /> : <Auth />} />
      </Routes>
    </Router>
  );
}

export default App;
