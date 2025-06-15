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
  Image as ImageIcon,
  Download,
  ExternalLink
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
    downloadImage: "Download image",
    openImage: "Open image in new tab",
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
    downloadImage: "이미지 다운로드",
    openImage: "새 탭에서 이미지 열기",
    microphoneError: "마이크에 접근할 수 없습니다. 권한을 확인해주세요.",
    speechNotSupported: "이 브라우저에서는 음성 인식이 지원되지 않습니다.",
    speechError: "음성 인식 오류가 발생했습니다. 다시 시도해주세요.",
    fileSizes: { bytes: "바이트", kb: "KB", mb: "MB", gb: "GB" }
  }
}

// Renders any generated images with download & open‐in‐new‐tab buttons
const GeneratedImages = ({ images, t }) => {
  if (!images || images.length === 0) return null

  const handleDownload = async (imageUrl, imageName) => {
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = imageName || 'generated-image.png'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading image:', error)
      window.open(imageUrl, '_blank')
    }
  }

  const handleOpenInNewTab = (imageUrl) => {
    window.open(imageUrl, '_blank')
  }

  return (
    <div className="generated-images">
      {images.map((image, idx) => (
        <div key={image.id || idx} className="generated-image-container">
          <img 
            src={image.url} 
            alt={image.name || `Generated image ${idx+1}`} 
            className="generated-image"
            onError={(e) => {
              e.target.style.display = 'none'
              e.target.nextSibling.style.display = 'block'
            }}
          />
          <div className="image-error" style={{ display: 'none' }}>
            <p>Failed to load image</p>
            <a href={image.url} target="_blank" rel="noopener noreferrer">
              View original link
            </a>
          </div>
          <div className="image-actions">
            <button
              onClick={() => handleDownload(image.url, image.name)}
              title={t.downloadImage}
              className="image-action-button"
            >
              <Download size={14} />
            </button>
            <button
              onClick={() => handleOpenInNewTab(image.url)}
              title={t.openImage}
              className="image-action-button"
            >
              <ExternalLink size={14} />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function ChatWindow({
  mode,
  title,
  subtitle,
  placeholderText,
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
  const placeHolder = placeholderText ?? t.placeholder

  return (
    <div className="chat-container">
      {/* Header */}
      <header className="chat-header">
        <div className="header-info">
          <div className="ai-avatar"><MessageSquare size={20}/></div>
          <div className="header-text">
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="messages-container">
        {loadingMessages 
          ? <p>Loading...</p>
          : messages.map((m,i) => (
            <div key={m.id} className={`message-group ${m.role}`} style={{animationDelay:`${i*100}ms`}}>
              <div className={`message-avatar ${m.role}`}>
                {m.role==='user' ? 'U' : <MessageSquare size={16}/>}
              </div>
              <div className="message-content">
                {/* File Attachments */}
                {/* File Attachments & Generated Images */}
              {m.attachments?.length > 0 && (
              <div className="message-attachments">
                {m.attachments.map(a => (
                  a.url
                    ? (
                      // If this attachment has a URL, render it as an <img>
                      <img
                        key={a.id}
                        src={a.url}
                        alt={a.name}
                        className="attachment-image-preview"
                        style={{ maxWidth: '200px', borderRadius: '8px', margin: '8px 0' }}
                        onError={e => { e.currentTarget.style.display = 'none' }}
                      />
                    )
                    : (
                      // Otherwise fall back to your icon + info
                      <div key={a.id} className="attachment-preview">
                        {getFileIcon(a.type)}
                        <div className="attachment-info">
                          <span className="attachment-name">{a.name}</span>
                          <span className="attachment-size">{formatFileSize(a.size)}</span>
                        </div>
                      </div>
                    )
                ))}
              </div>
)}


                {/* Generated Images */}
                {m.generatedImages?.length > 0 && (
                  <GeneratedImages images={m.generatedImages} t={t} />
                )}

                {/* Text Bubble */}
                <div className={`message-bubble ${m.role}`}>
                  {m.content}
                </div>

                {/* Actions */}
                <div className={`message-actions ${m.role}`}>
                  <button onClick={()=>copyMessage(m.id,m.content)} title={t.copyMessage}>
                    {copiedMessageId===m.id ? <Check size={12}/> : <Copy size={12}/>}
                  </button>
                </div>

                {/* Timestamp */}
                <div className={`message-timestamp ${m.role}`}>
                  {formatTime(m.timestamp)}
                </div>
              </div>
            </div>
          ))
        }

        {/* Typing Indicator */}
        {isTyping && (
          <div className="typing-indicator">
            <div className="message-avatar assistant"><MessageSquare size={16}/></div>
            <div className="typing-bubble"><div className="typing-dots"><div/><div/><div/></div></div>
          </div>
        )}
        <div ref={messagesEndRef}/>
      </div>

      {/* Input Area */}
      <div className="input-container">
        {/* File Attachments Preview */}
        {attachedFiles.length > 0 && (
          <div className="attachments-preview">
            {attachedFiles.map(f=>(
              <div key={f.id} className="attachment-chip">
                {getFileIcon(f.type)}
                <span className="attachment-chip-name">{f.name}</span>
                <button onClick={()=>removeAttachment(f.id)}><X size={12}/></button>
              </div>
            ))}
          </div>
        )}

        <div className="modern-input-wrapper">
          <button onClick={()=>fileInputRef.current.click()} title={t.attachFile} className='attachment-button'><Paperclip size={18}/></button>
          <input ref={fileInputRef} type="file" multiple onChange={handleFileAttachment} style={{display:'none'}} accept="*/*"/>

          <input
            value={inputMessage}
            onChange={e => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeHolder}
            className="modern-input"
          />

          <button onClick={toggleSpeechRecognition} className={`voice-button ${isListening?'listening':''}`} title={isListening?t.listening:t.clickToRecord}>
            {isListening ? <MicOff size={18}/> : <Mic size={18}/>}
          </button>

          <button onClick={handleSend} disabled={!inputMessage.trim() && attachedFiles.length===0} className="modern-send-button">
            <Send size={18}/>
          </button>
        </div>
      </div>
    </div>
  )
}
