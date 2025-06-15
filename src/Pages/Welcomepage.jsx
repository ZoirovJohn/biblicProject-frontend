import React, { useState, useRef, useEffect } from 'react';
import { Send, Copy, Check, MessageSquare, Sparkles, Paperclip, Mic, MicOff, X, File, Image, Globe } from 'lucide-react';
import { supabase } from '../supabaseClient'
import { callBackendPrediction } from '../js/callBackendPrediction';
import { useLanguage } from '../Context/LanguageContext.js';
import '../Styles/WelcomePage.css';

// Translations object
const translations = {
  en: {
    title: "BIBLIC chatbot",
    subtitle: "Always here to help",
    defaultMessage: "Hello! I'm your AI assistant. How can I help you today?",
    placeholder: "Type your question...",
    attachFile: "Attach file",
    holdToRecord: "Hold to record voice message",
    releaseToStop: "Release to stop recording",
    clickToRecord: "Click to start speech recognition",
    listening: "Listening... Click to stop",
    copyMessage: "Copy message",
    microphoneError: "Could not access microphone. Please check permissions.",
    speechNotSupported: "Speech recognition is not supported in this browser.",
    speechError: "Speech recognition error. Please try again.",
    errorPrefix: "⚠️ Error: ",
    voiceMessagePrefix: "voice-message-",
    fileSizes: {
      bytes: "Bytes",
      kb: "KB", 
      mb: "MB",
      gb: "GB"
    }
  },
  ko: {
    title: "BIBLIC 챗봇",
    subtitle: "언제나 도움을 드립니다",
    defaultMessage: "안녕하세요! 저는 AI 어시스턴트입니다. 오늘 어떻게 도와드릴까요?",
    placeholder: "질문을 입력하세요...",
    attachFile: "파일 첨부",
    holdToRecord: "음성 메시지를 녹음하려면 누르고 계세요",
    releaseToStop: "녹음을 중지하려면 놓으세요",
    clickToRecord: "음성 인식을 시작하려면 클릭하세요",
    listening: "듣고 있습니다... 중지하려면 클릭하세요",
    copyMessage: "메시지 복사",
    microphoneError: "마이크에 접근할 수 없습니다. 권한을 확인해주세요.",
    speechNotSupported: "이 브라우저에서는 음성 인식이 지원되지 않습니다.",
    speechError: "음성 인식 오류가 발생했습니다. 다시 시도해주세요.",
    errorPrefix: "⚠️ 오류: ",
    voiceMessagePrefix: "음성-메시지-",
    fileSizes: {
      bytes: "바이트",
      kb: "KB",
      mb: "MB", 
      gb: "GB"
    }
  }
};

export default function WelcomePage() {
  const { language, toggleLanguage } = useLanguage();
  const t = translations[language];

  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(true);

  useEffect(() => {
    const fetchMessages = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('user_email', user.email)
        .order('timestamp', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        setMessages([{
          id: '1',
          content: t.defaultMessage,
          role: 'assistant',
          timestamp: new Date()
        }]);
      } else if (data.length === 0) {
        setMessages([{
          id: '1',
          content: t.defaultMessage,
          role: 'assistant',
          timestamp: new Date()
        }]);
      } else {
        const restoredMessages = data.map(msg => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
          attachments: msg.attachments ? JSON.parse(msg.attachments) : []
        }));
        setMessages(restoredMessages);
      }

      setLoadingMessages(false);
    };

    fetchMessages();
  }, [language]);

  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      // Set language based on current language setting
      recognition.lang = language === 'ko' ? 'ko-KR' : 'en-US';
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputMessage(prev => prev + (prev ? ' ' : '') + transcript);
        setIsListening(false);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        
        // Show user-friendly error message
        if (event.error === 'not-allowed') {
          alert(t.microphoneError);
        } else {
          alert(t.speechError);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [language, t]); // Re-initialize when language changes

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    // Early return if no content
    if (!inputMessage.trim() && attachedFiles.length === 0) return;

    // Store values BEFORE any async operations
    const userInput = inputMessage;
    const userAttachments = [...attachedFiles];
    const messageId = Date.now().toString();

    // Create the user message object
    const newMessage = {
      id: messageId,
      content: userInput,
      role: 'user',
      timestamp: new Date(),
      attachments: userAttachments
    };

    // 🚀 IMMEDIATE UI UPDATES - No async operations before this!
    setInputMessage('');
    setAttachedFiles([]);
    setMessages(prev => [...prev, newMessage]);
    setIsTyping(true);

    // Declare user variable in outer scope
    let user = null;

    // Now handle all async operations after UI is updated
    try {
      // Get user data (async)
      const { data: userData } = await supabase.auth.getUser();
      user = userData.user; // Store in outer scope
      
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('email', user.email)
        .single();

      // Save user message to database with error handling
      const { error: userInsertError } = await supabase.from('messages').insert([{
        id: messageId,
        user_email: user.email,
        content: newMessage.content,
        role: newMessage.role,
        timestamp: newMessage.timestamp.toISOString(),
        attachments: JSON.stringify(newMessage.attachments || [])
      }]);

      if (userInsertError) {
        console.error('Error saving user message:', userInsertError);
      }

      const response = await callBackendPrediction(
        userInput,
        profile.username,
        profile.username,
        messages // if you want to pass full chat history
      );

      let assistantContent = typeof response === 'string'
        ? response
        : response.text || response.answer || response.message || response.result || response.data || JSON.stringify(response);

      const botMessage = {
        id: (Date.now() + 1).toString(),
        content: assistantContent,
        role: 'assistant',
        timestamp: new Date()
      };

      // Add bot message to UI
      setMessages(prev => [...prev, botMessage]);

      // Save bot message to database with proper error handling
      const { error: botInsertError } = await supabase.from('messages').insert([{
        id: botMessage.id,
        user_email: user.email,
        content: botMessage.content,
        role: botMessage.role,
        timestamp: botMessage.timestamp.toISOString(),
        attachments: JSON.stringify([])
      }]);

      if (botInsertError) {
        console.error('Error saving assistant message:', botInsertError);
        // Optionally show user an error message
        console.warn('Assistant message was not saved to database, but conversation continues normally');
      } else {
        console.log('Assistant message saved successfully');
      }

    } catch (err) {
      console.error('Error in handleSendMessage:', err);
      const errorMessage = {
        id: (Date.now() + 2).toString(),
        content: `${t.errorPrefix}${err.message}`,
        role: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);

      // Try to save error message if user is available
      if (user) {
        try {
          await supabase.from('messages').insert([{
            id: errorMessage.id,
            user_email: user.email,
            content: errorMessage.content,
            role: errorMessage.role,
            timestamp: errorMessage.timestamp.toISOString(),
            attachments: JSON.stringify([])
          }]);
        } catch (insertError) {
          console.error('Error saving error message:', insertError);
        }
      }
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileAttachment = (e) => {
    const files = Array.from(e.target.files);
    const newAttachments = files.map(file => ({
      id: Date.now() + Math.random(),
      file,
      name: file.name,
      size: file.size,
      type: file.type
    }));
    setAttachedFiles(prev => [...prev, ...newAttachments]);
  };

  const removeAttachment = (id) => {
    setAttachedFiles(prev => prev.filter(file => file.id !== id));
  };

  const toggleSpeechRecognition = () => {
    if (!recognitionRef.current) {
      alert(t.speechNotSupported);
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        // Update language setting before starting
        recognitionRef.current.lang = language === 'ko' ? 'ko-KR' : 'en-US';
        recognitionRef.current.start();
      } catch (error) {
        console.error('Error starting speech recognition:', error);
        alert(t.speechError);
      }
    }
  };

  const copyMessage = async (messageId, content) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      console.error('Failed to copy message:', err);
    }
  };

  const formatTime = (date) => {
    const locale = language === 'ko' ? 'ko-KR' : 'en-US';
    return new Intl.DateTimeFormat(locale, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: language === 'en'
    }).format(date);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return `0 ${t.fileSizes.bytes}`;
    const k = 1024;
    const sizes = [t.fileSizes.bytes, t.fileSizes.kb, t.fileSizes.mb, t.fileSizes.gb];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type) => {
    if (type.startsWith('image/')) return <Image size={16} />;
    return <File size={16} />;
  };

  return (
    <div className="chat-container">
      {/* Header */}
      <header className="chat-header">
        <div className="header-info">
          <div className="avatar-container">
            <div className="ai-avatar">
              <Sparkles size={20} />
            </div>
            <div className="status-indicator"></div>
          </div>
          <div className="header-text">
            <h1>{t.title}</h1>
            <p>{t.subtitle}</p>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="messages-container">
        {messages.map((message, index) => (
          <div
            key={message.id}
            className={`message-group ${message.role}`}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className={`message-avatar ${message.role}`}>
              {message.role === 'user' ? (
                "U"
              ) : (
                <MessageSquare size={16} />
              )}
            </div>
            
            <div className="message-content">
              {/* File Attachments */}
              {message.attachments && message.attachments.length > 0 && (
                <div className="message-attachments">
                  {message.attachments.map((attachment) => (
                    <div key={attachment.id} className="attachment-preview">
                      {getFileIcon(attachment.type)}
                      <div className="attachment-info">
                        <span className="attachment-name">{attachment.name}</span>
                        <span className="attachment-size">{formatFileSize(attachment.size)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <div className={`message-bubble ${message.role}`}>
                {message.content}
              </div>
              
              {/* Message Actions */}
              <div className={`message-actions ${message.role}`}>
                <button
                  onClick={() => copyMessage(message.id, message.content)}
                  className="copy-button"
                  title={t.copyMessage}
                >
                  {copiedMessageId === message.id ? (
                    <Check size={12} />
                  ) : (
                    <Copy size={12} />
                  )}
                </button>
              </div>
              
              {/* Timestamp */}
              <div className={`message-timestamp ${message.role}`}>
                {formatTime(message.timestamp)}
              </div>
            </div>
          </div>
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="typing-indicator">
            <div className="message-avatar assistant">
              <MessageSquare size={16} />
            </div>
            <div className="typing-bubble">
              <div className="typing-dots">
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="input-container">
        {/* File Attachments Preview */}
        {attachedFiles.length > 0 && (
          <div className="attachments-preview">
            {attachedFiles.map((file) => (
              <div key={file.id} className="attachment-chip">
                {file.isVoice ? <Mic size={14} /> : getFileIcon(file.type)}
                <span className="attachment-chip-name">{file.name}</span>
                <button
                  onClick={() => removeAttachment(file.id)}
                  className="remove-attachment"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="modern-input-wrapper">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="attachment-button"
            title={t.attachFile}
          >
            <Paperclip size={18} />
          </button>

          <div className="input-field-container">
            <input
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={t.placeholder}
              className="modern-input"
            />
          </div>

          <button
            onClick={toggleSpeechRecognition}
            className={`voice-button ${isListening ? 'listening' : ''}`}
            title={isListening ? t.listening : t.clickToRecord}
          >
            {isListening ? <MicOff size={18} /> : <Mic size={18} />}
          </button>

          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() && attachedFiles.length === 0}
            className="modern-send-button"
          >
            <Send size={18} />
          </button>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileAttachment}
            style={{ display: 'none' }}
            accept="*/*"
          />
        </div>
      </div>
    </div>
  );
}