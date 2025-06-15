import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './Pages/Loginpage';
import SignupPage from './Pages/Signuppage';
import ForgotPassword from './Pages/Forgotpassword';
import ResetPasswordPage from './Pages/Resetpasswordpage';
import TextGeneration from './Pages/TextGeneration';
import ChatSelector from './Pages/ChatflowSelectionPage';
import ImageGeneration from './Pages/ImageGeneration';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/textGeneration" element={<TextGeneration />} />
        <Route path="/chatFlowSelection" element={<ChatSelector />} />
        <Route path="/imageGeneration" element={<ImageGeneration />}/>
      </Routes>
    </Router>
  );
}

export default App;




