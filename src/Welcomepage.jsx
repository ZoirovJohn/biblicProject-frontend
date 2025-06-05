import React from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';

export default function WelcomePage() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) navigate('/');
  };

  return (
    <div style={{ height: '100vh', width: '100%', position: 'relative' }}>
      <button
        onClick={handleLogout}
        style={{
          position: 'absolute',
          top: 10,
          right: 20,
          zIndex: 10,
          padding: '8px 16px',
          background: '#0b74de',
          color: '#fff',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
        }}
      >
        Logout
      </button>
      <iframe
        src="https://cloud.flowiseai.com/chatbot/359181df-9f5f-4379-99ad-619e48a567b9"
        width="100%"
        height="100%"
        style={{ border: 'none' }}
        title="Flowise Chatbot"
      />
    </div>
  );
}
