// src/components/AiAvatar.js
import React, { useRef, useEffect } from 'react';
import Lottie from 'lottie-react';
import '../styles/AiAvatar.css';
import talkingAnimation from '../assets/male-call-center-operator.json';

const AIAvatar = ({ isSpeaking }) => {
  const lottieRef = useRef();

  useEffect(() => {
    if (isSpeaking) {
      lottieRef.current?.play();
    } else {
      lottieRef.current?.stop();
    }
  }, [isSpeaking]);

  return (
    <div className={`avatar-container ${isSpeaking ? 'speaking' : ''}`}>
      <Lottie
        lottieRef={lottieRef}
        animationData={talkingAnimation}
        loop={true}
        autoplay={false} // Autoplay disabled so we can control it manually
        className="avatar-lottie"
      />
    </div>
  );
};

export default AIAvatar;
