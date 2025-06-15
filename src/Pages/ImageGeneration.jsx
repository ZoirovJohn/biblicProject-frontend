import React from 'react'
import useChatFlow from '../hooks/useChatFlow'
import ChatWindow from '../components/ChatWindow'
import { generateImage } from '../js/callImageAPI.js' // your image‐gen endpoint
import { useLanguage } from '../Context/LanguageContext.js'
import { translations } from '../utils/translations.js'

export default function ImageChat() {
  const { language } = useLanguage()
  const flow = useChatFlow({
    language,
    translations,
    sendHandler: async ({ message /* prompt */, sessionId }) => {
      const { url } = await generateImage({ prompt: message, user: sessionId })
      return url  // will render as a normal message bubble with the image URL
    }
  })
  return (
    <ChatWindow
      {...flow}
      title={language==='ko'?'이미지 생성':'Image Generator'}
      subtitle={language==='ko'?'장면을 묘사하세요':'Describe what you want'}
    />
  )
}
