// src/components/ChatSelector.jsx

import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../Context/LanguageContext.js'
import '../Styles/chatFlowSelection.css'

export default function ChatSelector() {
  const nav = useNavigate()
  const { language } = useLanguage()

  const headings = {
    en: {
      title: 'Welcome to BIBLIC',
      subtitle: 'Choose your chat mode'
    },
    ko: {
      title: 'BIBLIC에 오신 것을 환영합니다',
      subtitle: '채팅 모드를 선택하세요'
    }
  }

  const { title, subtitle } = headings[language]

  return (
    <div className="selector-container">
      <h1 className="selector-title">{title}</h1>
      <p className="selector-subtitle">{subtitle}</p>
      <div className="selector-buttons">
        <button className="selector-btn text-btn" onClick={() => nav('/textGeneration')}>
          📝 {language==='ko'?'텍스트 채팅':'Text Chat'}
        </button>
        <button className="selector-btn image-btn" onClick={() => nav('/imageGeneration')}>
          🖼️ {language==='ko'?'이미지 생성':'Image Chat'}
        </button>
      </div>
    </div>
  )
}
