// src/WelcomePage.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import '../Styles/Welcomepage.css'; // Import your shared theme CSS

export default function WelcomePage() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) navigate('/');
  };

  return (
    <div className="welcome-page">
      <button className="logout-button" onClick={handleLogout}>
        Logout
      </button>
      <div className="chatbot-container">
        <iframe
          src="https://cloud.flowiseai.com/chatbot/359181df-9f5f-4379-99ad-619e48a567b9"
          title="Flowise Chatbot"
          frameBorder="0"
          className="chatbot-frame"
        />
      </div>
    </div>
  );
}
