import React, { useState, useRef, useEffect } from 'react';
import { Send, Copy, Check, MessageSquare, Sparkles, Paperclip, Mic, MicOff, X, File, Image } from 'lucide-react';
import { supabase } from '../supabaseClient'
import { createPrediction } from '../js/createPrediction';
import '../Styles/WelcomePage.css';

export default function WelcomePage() {
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
        content: "Hello! I'm your AI assistant. How can I help you today?",
        role: 'assistant',
        timestamp: new Date()
      }]);
    } else if (data.length === 0) {
      setMessages([{
        id: '1',
        content: "Hello! I'm your AI assistant. How can I help you today?",
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
}, []);

  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    const { data: profile, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', user.email)
      .single();


    if (!inputMessage.trim() && attachedFiles.length === 0) return;

    console.log('Sending message:', inputMessage);

    const userMessage = {
      id: Date.now().toString(),
      content: inputMessage,
      role: 'user',
      timestamp: new Date(),
      attachments: attachedFiles
    };

    // Add user message to the chat
    setMessages(prev => [...prev, userMessage]);
    const { error: insertError } = await supabase.from('messages').insert([{
      id: userMessage.id,
      user_email: user.email,
      content: userMessage.content,
      role: userMessage.role,
      timestamp: userMessage.timestamp.toISOString(),
      attachments: JSON.stringify(userMessage.attachments || [])
    }]);

    if (insertError) {
      console.error('Supabase insert error:', insertError);
    }
    
    // Store the input before clearing it
    const currentInput = inputMessage;
    setInputMessage('');
    setAttachedFiles([]);
    setIsTyping(true);

    try {
      console.log('Calling createPrediction with:', currentInput);
      const response = await createPrediction(currentInput, profile.username, profile.username);
      console.log(user.email)
      console.log('Received response:', response);

      // Extract the content from Flowise response
      let assistantContent;
      
      if (typeof response === 'string') {
        assistantContent = response;
      } else if (response.text) {
        assistantContent = response.text;
      } else if (response.answer) {
        assistantContent = response.answer;
      } else if (response.message) {
        assistantContent = response.message;
      } else if (response.result) {
        assistantContent = response.result;
      } else if (response.data) {
        assistantContent = response.data;
      } else {
        // For Flowise, the response might be directly the text content
        assistantContent = JSON.stringify(response);
      }

      console.log('Extracted content:', assistantContent);

      // Create assistant message
      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        content: assistantContent,
        role: 'assistant',
        timestamp: new Date()
      };

      await supabase.from('messages').insert([{
        id: assistantMessage.id,
        user_email: user.email,
        content: assistantMessage.content,
        role: assistantMessage.role,
        timestamp: assistantMessage.timestamp.toISOString(),
        attachments: JSON.stringify(assistantMessage.attachments || [])
      }]);

      // Add assistant message to the chat
      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error('Error getting AI response:', error);
      
      // Add detailed error message to chat for debugging
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        content: `Error: ${error.message}. Please check the console for more details and verify your API configuration.`,
        role: 'assistant',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      // Always stop typing indicator
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

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      const chunks = [];
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        const audioFile = {
          id: Date.now(),
          file: blob,
          name: `voice-message-${Date.now()}.wav`,
          size: blob.size,
          type: 'audio/wav',
          isVoice: true
        };
        setAttachedFiles(prev => [...prev, audioFile]);
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
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
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(date);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
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
            <h1>BIBLIC chatbot</h1>
            <p>Always here to help</p>
          </div>
        </div>
        <div className="message-count">
          {messages.length - 1} messages
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
                  title="Copy message"
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
            title="Attach file"
          >
            <Paperclip size={18} />
          </button>

          <div className="input-field-container">
            <input
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your question..."
              className="modern-input"
            />
          </div>

          <button
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            onMouseLeave={stopRecording}
            className={`voice-button ${isRecording ? 'recording' : ''}`}
            title={isRecording ? "Release to stop recording" : "Hold to record voice message"}
          >
            {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
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