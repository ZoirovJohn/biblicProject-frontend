import React from 'react'
import { useNavigate } from 'react-router-dom'
import '../Styles/chatFlowSelection.css'

export default function ChatSelector() {
  const nav = useNavigate()
  return (
    <div className="selector-container">
      <h2>Choose Chat Mode</h2>
      <button onClick={() => nav('/chat/text')}>📝 Text Chat</button>
      <button onClick={() => nav('/chat/image')}>🖼️ Image Chat</button>
    </div>
  )
}