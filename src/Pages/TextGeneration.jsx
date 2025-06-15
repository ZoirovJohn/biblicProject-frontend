import React from 'react'
import useChatFlow from '../js/useChatFlow.js';
import ChatWindow from './ChatWindow.jsx';
import { callBackendPrediction } from '../js/callBackendTextPrediction.js'
import { useLanguage } from '../Context/LanguageContext.js';
import { translations } from '../js/translations.js';
import '../Styles/TextGeneration.css';

export default function TextChat() {
  const { language } = useLanguage()
  const flow = useChatFlow({
    language,
    translations,
    sendHandler: async ({ message, sessionId, userId, chatHistory, files }) => {
      // your existing callBackendPrediction
      const res = await callBackendPrediction(message, sessionId, userId, chatHistory, files)
      return typeof res==='string' ? res : res.text||res.answer||JSON.stringify(res)
    }
  })
  return (
    <ChatWindow
      {...flow}
      title={translations[language].title}
      subtitle={translations[language].subtitle}
    />
  )
}
