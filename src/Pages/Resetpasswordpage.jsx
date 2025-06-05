// src/ResetPasswordPage.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import '../Styles/Resetpassword.css'; // Import the CSS

export default function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState('');
  const [tokenReady, setTokenReady] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const hash = window.location.hash;
    const parsed = Object.fromEntries(new URLSearchParams(hash.substring(1)));
    if (parsed.access_token) {
      supabase.auth.setSession({
        access_token: parsed.access_token,
        refresh_token: parsed.refresh_token
      }).then(() => setTokenReady(true));
    }
  }, []);

  const handleReset = async () => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setMessage(error.message);
    } else {
      setMessage('✅ Password successfully reset!');
      setTimeout(() => navigate('/'), 2000);
    }
  };

  if (!tokenReady) {
    return (
      <div className="reset-page">
        <div className="reset-card">
          <p>Validating reset link...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="reset-page">
      <div className="reset-card">
        <h2>Reset Your Password</h2>
        <input
          type="password"
          placeholder="Enter new password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <button onClick={handleReset}>Reset Password</button>
        <p>{message}</p>
      </div>
    </div>
  );
}
