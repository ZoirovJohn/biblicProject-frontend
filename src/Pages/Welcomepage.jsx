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

  // Helper function to convert file to base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  // Helper function to process files for backend
const processFilesForBackend = async (files) => {
  const processedFiles = [];
  const maxFileSize = 10 * 1024 * 1024; // 10MB limit
  
  for (const attachment of files) {
    try {
      // Check file size
      if (attachment.size > maxFileSize) {
        console.warn(`File ${attachment.name} is too large (${attachment.size} bytes). Skipping.`);
        processedFiles.push({
          name: attachment.name,
          type: attachment.type,
          size: attachment.size,
          content: null,
          contentType: 'error',
          error: `File too large (max ${maxFileSize / 1024 / 1024}MB)`
        });
        continue;
      }

      // Process different file types
      if (attachment.type.startsWith('text/') || 
          attachment.type === 'application/json' ||
          attachment.type === 'text/csv' ||
          attachment.type === 'text/plain') {
        
        // For text files, read as text
        const text = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsText(attachment.file);
          reader.onload = () => resolve(reader.result);
          reader.onerror = error => reject(error);
        });
        
        processedFiles.push({
          name: attachment.name,
          type: attachment.type,
          size: attachment.size,
          content: text,
          contentType: 'text'
        });
        
      } else if (attachment.type.startsWith('image/') || 
                 attachment.type === 'application/pdf' ||
                 attachment.type.startsWith('audio/') ||
                 attachment.type.startsWith('video/')) {
        
        // For binary files, convert to base64
        const base64 = await fileToBase64(attachment.file);
        
        processedFiles.push({
          name: attachment.name,
          type: attachment.type,
          size: attachment.size,
          content: base64,
          contentType: 'base64'
        });
        
      } else {
        // For unknown file types, try base64
        console.log(`Unknown file type ${attachment.type}, trying base64 conversion`);
        const base64 = await fileToBase64(attachment.file);
        
        processedFiles.push({
          name: attachment.name,
          type: attachment.type,
          size: attachment.size,
          content: base64,
          contentType: 'base64'
        });
      }
      
      console.log(`Successfully processed: ${attachment.name}`);
      
    } catch (error) {
      console.error('Error processing file:', attachment.name, error);
      processedFiles.push({
        name: attachment.name,
        type: attachment.type,
        size: attachment.size,
        content: null,
        contentType: 'error',
        error: error.message
      });
    }
  }
  
  console.log(`Processed ${processedFiles.length} files for backend`);
  return processedFiles;
};


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

    // Prepare message content for backend - handle file-only messages
    let messageForBackend = userInput.trim();
    
    // If no text but files are attached, create a descriptive message
    if (!messageForBackend && userAttachments.length > 0) {
      const fileDescriptions = userAttachments.map(file => {
        if (file.type.startsWith('image/')) {
          return `[Image: ${file.name}]`;
        } else if (file.type.startsWith('audio/')) {
          return `[Audio: ${file.name}]`;
        } else if (file.type === 'application/pdf') {
          return `[PDF: ${file.name}]`;
        } else if (file.type.includes('text')) {
          return `[Text file: ${file.name}]`;
        } else {
          return `[File: ${file.name}]`;
        }
      }).join(' ');
      
      messageForBackend = language === 'ko' 
        ? `첨부된 파일을 분석해주세요: ${fileDescriptions}`
        : `Please analyze the attached files: ${fileDescriptions}`;
    }

    // Create the user message object for UI (show original input or file description)
    const displayContent = userInput || (userAttachments.length > 0 
      ? (language === 'ko' ? '파일 첨부됨' : 'Files attached') 
      : '');

    const newMessage = {
      id: messageId,
      content: displayContent,
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

      // Process files for backend if any exist
      let processedFiles = [];
      if (userAttachments.length > 0) {
        try {
          processedFiles = await processFilesForBackend(userAttachments);
          console.log('Processed files for backend:', processedFiles.length);
        } catch (error) {
          console.error('Error processing files:', error);
        }
      }

      // Send the prepared message and files to backend
      const response = await callBackendPrediction(
        messageForBackend, // message
        user.email, // sessionId (using email as session identifier)
        profile.username, // userId  
        messages, // chatHistory
        processedFiles // files (processed file attachments)
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
  const maxFiles = 5; // Limit number of files
  
  // Comprehensive list of allowed file types
  const allowedTypes = [
    // Text files
    'text/plain', 'text/csv', 'text/html', 'text/css', 'text/javascript',
    'application/json', 'application/xml', 'text/xml',
    
    // Images
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 
    'image/bmp', 'image/svg+xml', 'image/tiff',
    
    // Documents
    'application/pdf',
    
    // Microsoft Office
    'application/vnd.ms-powerpoint', // .ppt
    'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
    'application/vnd.ms-excel', // .xls
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/msword', // .doc
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    
    // OpenOffice/LibreOffice
    'application/vnd.oasis.opendocument.text', // .odt
    'application/vnd.oasis.opendocument.spreadsheet', // .ods
    'application/vnd.oasis.opendocument.presentation', // .odp
    
    // Audio
    'audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/m4a',
    'audio/aac', 'audio/flac', 'audio/wma',
    
    // Video
    'video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo',
    'video/webm', 'video/ogg', 'video/3gpp',
    
    // Archives
    'application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed',
    
    // Code files
    'application/javascript', 'text/x-python', 'application/x-python-code',
    'text/x-java-source', 'text/x-c', 'text/x-c++src'
  ];
  
  // Function to check if file type is allowed
  const isFileTypeAllowed = (fileType, fileName) => {
    // Check explicit allowed types
    if (allowedTypes.includes(fileType)) {
      return true;
    }
    
    // Check for text/* pattern (covers many text file variations)
    if (fileType.startsWith('text/')) {
      return true;
    }
    
    // Check by file extension as fallback
    const extension = fileName.toLowerCase().split('.').pop();
    const allowedExtensions = [
      'txt', 'csv', 'json', 'xml', 'html', 'css', 'js', 'py', 'java', 'c', 'cpp',
      'jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'tiff',
      'pdf', 'ppt', 'pptx', 'xls', 'xlsx', 'doc', 'docx',
      'odt', 'ods', 'odp',
      'mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac',
      'mp4', 'avi', 'mov', 'wmv', 'webm',
      'zip', 'rar', '7z'
    ];
    
    return allowedExtensions.includes(extension);
  };
  
  // Filter and validate files
  const validFiles = files.filter(file => {
    if (attachedFiles.length >= maxFiles) {
      alert(`Maximum ${maxFiles} files allowed`);
      return false;
    }
    
    if (!isFileTypeAllowed(file.type, file.name)) {
      alert(`File type "${file.type}" not supported for ${file.name}. Please try a different file format.`);
      return false;
    }
    
    if (file.size > 25 * 1024 * 1024) { // Increased to 25MB for documents
      alert(`File ${file.name} is too large (max 25MB)`);
      return false;
    }
    
    return true;
  });
  
  const newAttachments = validFiles.map(file => ({
    id: Date.now() + Math.random(),
    file,
    name: file.name,
    size: file.size,
    type: file.type
  }));
  
  setAttachedFiles(prev => [...prev, ...newAttachments]);
  
  // Clear the input so the same file can be selected again
  e.target.value = '';
};;

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