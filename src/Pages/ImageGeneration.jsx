import React from 'react'
import useChatFlow from '../js/useChatFlow.js';
import ChatWindow from '../Pages/ChatWindow.jsx';
// import { generateImage } from '../js/callImageAPI.js' // your image‐gen endpoint
import { useLanguage } from '../Context/LanguageContext.js'
import { translations } from '../js/translations.js'
import { callBackendPrediction } from '../js/callBackendImagePrediction.js';

export default function ImageChat() {
  const { language } = useLanguage()
  const flow = useChatFlow({
    language,
    translations,
    sendHandler: async ({ message, sessionId, chatHistory, files }) => {
      const response = await callBackendPrediction(message, sessionId, chatHistory, files)

      console.log('Raw response from callBackendPrediction:', response)
      console.log('Type of response:', typeof response)

      const match = response.match(/src="([^"]+)"/)
      if (!match) {
        console.error('Could not find image URL in response:', response)
        return response.trim()
      }
      const imageUrl = match[1]
      console.log(imageUrl);
      return [
        {
          id: Date.now().toString(),
          name: 'generated.png',
          url: imageUrl,
          type: 'image/png',
          size: null
        }
      ]
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
