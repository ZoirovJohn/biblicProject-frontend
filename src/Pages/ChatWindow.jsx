// src/components/ChatWindow.jsx

import React from 'react'
import { useLanguage } from '../Context/LanguageContext.js'
import {
  Send,
  Copy,
  Check,
  MessageSquare,
  Mic,
  MicOff,
  Paperclip,
  X,
  File as FileIcon,
  Image as ImageIcon
} from 'lucide-react'
import '../Styles/chatFlowSelection.css'

const translations = {
  en: {
    title: "BIBLIC chatbot",
    subtitle: "Always here to help",
    defaultMessage: "Hello! I'm your AI assistant. How can I help you today?",
    placeholder: "Type your question...",
    attachFile: "Attach file",
    clickToRecord: "Click to start speech recognition",
    listening: "Listening... Click to stop",
    copyMessage: "Copy message",
    microphoneError: "Could not access microphone. Please check permissions.",
    speechNotSupported: "Speech recognition is not supported in this browser.",
    speechError: "Speech recognition error. Please try again.",
    fileSizes: { bytes: "Bytes", kb: "KB", mb: "MB", gb: "GB" }
  },
  ko: {
    title: "BIBLIC 챗봇",
    subtitle: "언제나 도움을 드립니다",
    defaultMessage: "안녕하세요! 저는 AI 어시스턴트입니다. 오늘 어떻게 도와드릴까요?",
    placeholder: "질문을 입력하세요...",
    attachFile: "파일 첨부",
    clickToRecord: "음성 인식을 시작하려면 클릭하세요",
    listening: "듣고 있습니다... 중지하려면 클릭하세요",
    copyMessage: "메시지 복사",
    microphoneError: "마이크에 접근할 수 없습니다. 권한을 확인해주세요.",
    speechNotSupported: "이 브라우저에서는 음성 인식이 지원되지 않습니다.",
    speechError: "음성 인식 오류가 발생했습니다. 다시 시도해주세요.",
    fileSizes: { bytes: "바이트", kb: "KB", mb: "MB", gb: "GB" }
  }
}

export default function ChatWindow({
  // passed in from your flow hook
  messages,
  loadingMessages,
  inputMessage,
  setInputMessage,
  isTyping,
  copiedMessageId,
  isListening,
  attachedFiles,
  messagesEndRef,
  fileInputRef,
  handleFileAttachment,
  removeAttachment,
  toggleSpeechRecognition,
  copyMessage,
  handleKeyPress,
  handleSend,
  formatTime,
  formatFileSize,
  getFileIcon
}) {
  const { language } = useLanguage()
  const t = translations[language]

  return (
    <div className="chat-container">
      {/* Header */}
      <header className="chat-header">
        <div className="header-info">
          <div className="ai-avatar">
            <MessageSquare size={20} />
          </div>
          <div className="header-text">
            <h1>{t.title}</h1>
            <p>{t.subtitle}</p>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="messages-container">
        {loadingMessages ? (
          <p>Loading...</p>
        ) : (
          messages.map((m, i) => (
            <div
              key={m.id}
              className={`message-group ${m.role}`}
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className={`message-avatar ${m.role}`}>
                {m.role === 'user' ? "U" : <MessageSquare size={16} />}
              </div>
              <div className="message-content">
                {/* Attachments */}
                {m.attachments?.length > 0 && (
                  <div className="message-attachments">
                    {m.attachments.map(a => (
                      <div key={a.id} className="attachment-preview">
                        {getFileIcon(a.type)}
                        <div className="attachment-info">
                          <span className="attachment-name">{a.name}</span>
                          <span className="attachment-size">
                            {formatFileSize(a.size)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {/* Text Bubble */}
                <div className={`message-bubble ${m.role}`}>
                  {m.content}
                </div>
                {/* Actions */}
                <div className={`message-actions ${m.role}`}>
                  <button
                    onClick={() => copyMessage(m.id, m.content)}
                    title={t.copyMessage}
                  >
                    {copiedMessageId === m.id ? (
                      <Check size={12} />
                    ) : (
                      <Copy size={12} />
                    )}
                  </button>
                </div>
                {/* Timestamp */}
                <div className={`message-timestamp ${m.role}`}>
                  {formatTime(m.timestamp)}
                </div>
              </div>
            </div>
          ))
        )}
        {/* Typing Indicator */}
        {isTyping && (
          <div className="typing-indicator">
            <div className="message-avatar assistant">
              <MessageSquare size={16} />
            </div>
            <div className="typing-bubble">
              <div className="typing-dots">
                <div className="typing-dot" />
                <div className="typing-dot" />
                <div className="typing-dot" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="input-container">
        {/* Attachment preview */}
        {attachedFiles.length > 0 && (
          <div className="attachments-preview">
            {attachedFiles.map(f => (
              <div key={f.id} className="attachment-chip">
                {f.isVoice ? <Mic size={14} /> : getFileIcon(f.type)}
                <span className="attachment-chip-name">{f.name}</span>
                <button
                  onClick={() => removeAttachment(f.id)}
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
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileAttachment}
            style={{ display: 'none' }}
            accept="*/*"
          />

          <input
            value={inputMessage}
            onChange={e => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={t.placeholder}
            className="modern-input"
          />

          <button
            onClick={toggleSpeechRecognition}
            className={`voice-button ${isListening ? 'listening' : ''}`}
            title={isListening ? t.listening : t.clickToRecord}
          >
            {isListening ? (
              <MicOff size={18} />
            ) : (
              <Mic size={18} />
            )}
          </button>

          <button
            onClick={handleSend}
            disabled={!inputMessage.trim() && attachedFiles.length === 0}
            className="modern-send-button"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}
