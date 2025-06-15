// src/hooks/useChatFlow.js
import { useState, useRef, useEffect } from 'react'
import { supabase } from '../supabaseClient.js'
import { File, Image as FileImageIcon } from 'lucide-react'

export default function useChatFlow({ language, translations, sendHandler }) {
  const t = translations[language]

  // ── STATE & REFS ────────────────────────────────────────────
  const [messages, setMessages]             = useState([])
  const [loadingMessages, setLoading]       = useState(true)
  const [inputMessage, setInputMessage]     = useState('')
  const [isTyping, setIsTyping]             = useState(false)
  const [copiedMessageId, setCopiedMessageId] = useState(null)
  const [isListening, setIsListening]       = useState(false)
  const [attachedFiles, setAttachedFiles]   = useState([])

  const messagesEndRef = useRef(null)
  const fileInputRef   = useRef(null)
  const recognitionRef = useRef(null)

  // ── LOAD PAST MESSAGES ──────────────────────────────────────
  useEffect(() => {
    const fetch = async () => {
      const { data:{ user } } = await supabase.auth.getUser()
      const { data, error } = await supabase
        .from('messages').select('*')
        .eq('user_email', user.email)
        .order('timestamp', { ascending: true })

      if (error || data.length === 0) {
        setMessages([{ id:'1', content:t.defaultMessage, role:'assistant', timestamp:new Date() }])
      } else {
        setMessages(data.map(m=>({
          ...m,
          timestamp: new Date(m.timestamp),
          attachments: m.attachments ? JSON.parse(m.attachments) : []
        })))
      }
      setLoading(false)
    }
    fetch()
  }, [language])

  // ── SCROLL TO BOTTOM ────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  // ── SPEECH RECOGNITION SETUP ────────────────────────────────
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition
      const rec = new SR()
      rec.lang = language==='ko' ? 'ko-KR' : 'en-US'
      rec.continuous = false
      rec.interimResults = false
      rec.maxAlternatives = 1

      rec.onstart = ()    => setIsListening(true)
      rec.onresult = e    => {
        const t = e.results[0][0].transcript
        setInputMessage(prev=> prev ? prev+' '+t : t)
        setIsListening(false)
      }
      rec.onerror = e     => {
        console.error('Speech error:', e.error)
        setIsListening(false)
        alert(e.error==='not-allowed' ? t.microphoneError : t.speechError)
      }
      rec.onend = ()      => setIsListening(false)

      recognitionRef.current = rec
    }
    return () => recognitionRef.current?.abort()
  }, [language, t])

  // ── HELPERS ─────────────────────────────────────────────────
  const formatTime = date => 
    new Intl.DateTimeFormat(
      language==='ko' ? 'ko-KR' : 'en-US',
      { hour:'2-digit', minute:'2-digit', hour12: language==='en' }
    ).format(date)

  const formatFileSize = bytes => {
    if (!bytes) return `0 ${t.fileSizes.bytes}`
    const k=1024, sizes=[t.fileSizes.bytes,t.fileSizes.kb,t.fileSizes.mb,t.fileSizes.gb]
    const i=Math.floor(Math.log(bytes)/Math.log(k))
    return (bytes/Math.pow(k,i)).toFixed(2)+' '+sizes[i]
  }

  const getFileIcon = type => type.startsWith('image/') ? <FileImageIcon size={16}/> : <File size={16}/>

  // convert file → base64 or text
  const fileToBase64 = file => new Promise((res,rej) => {
    const r=new FileReader()
    r.readAsDataURL(file)
    r.onload = ()=>res(r.result)
    r.onerror= e=>rej(e)
  })

  const processFilesForBackend = async files => {
    const out=[]
    const maxSize=10*1024*1024
    for (let att of files){
      if (att.size>maxSize) {
        out.push({ name:att.name, type:att.type, size:att.size, content:null, contentType:'error', error:`File too large` })
        continue
      }
      if (att.type.startsWith('text/')||att.type==='application/json'||att.type==='text/csv'){
        const txt = await new Promise((r,rej)=> {
          const reader=new FileReader()
          reader.readAsText(att.file)
          reader.onload=()=>r(reader.result)
          reader.onerror= e=>rej(e)
        })
        out.push({ name:att.name, type:att.type, size:att.size, content:txt, contentType:'text' })
      } else {
        const b64 = await fileToBase64(att.file)
        out.push({ name:att.name, type:att.type, size:att.size, content:b64, contentType:'base64' })
      }
    }
    return out
  }

  // ── HANDLERS ────────────────────────────────────────────────

  const handleFileAttachment = e => {
    const files = Array.from(e.target.files)
    const newAtt = files.map(f=>({
      id: Date.now()+Math.random(),
      file: f, name:f.name, size:f.size, type:f.type
    }))
    setAttachedFiles(a=>[...a,...newAtt])
    e.target.value = ''
  }

  const removeAttachment = id =>
    setAttachedFiles(a=>a.filter(f=>f.id!==id))

  const toggleSpeechRecognition = () => {
    if (!recognitionRef.current) { alert(t.speechNotSupported); return }
    if (isListening) recognitionRef.current.stop()
    else {
      recognitionRef.current.lang = language==='ko' ? 'ko-KR' : 'en-US'
      recognitionRef.current.start()
    }
  }

  const copyMessage = async (id, content) => {
    await navigator.clipboard.writeText(content)
    setCopiedMessageId(id)
    setTimeout(()=>setCopiedMessageId(null),2000)
  }

  const handleKeyPress = e => {
    if (e.key==='Enter' && !e.shiftKey) {
      e.preventDefault(); handleSend()
    }
  }

  const handleSend = async () => {
    if (!inputMessage.trim() && attachedFiles.length===0) return

    // 1) UI update
    const userMsg = {
      id: Date.now().toString(),
      content: inputMessage.trim() || (language==='ko'?'파일 첨부됨':'Files attached'),
      role: 'user',
      timestamp: new Date(),
      attachments: attachedFiles
    }
    setMessages(m=>[...m, userMsg])
    setInputMessage(''); setAttachedFiles([]); setIsTyping(true)

    // 2) Persist user msg
    const { data:{ user } } = await supabase.auth.getUser()
    await supabase.from('messages').insert([{
      ...userMsg,
      user_email: user.email,
      timestamp: userMsg.timestamp.toISOString(),
      attachments: JSON.stringify(userMsg.attachments)
    }])

    // 3) Prepare backend call
    const fileData = attachedFiles.length
      ? await processFilesForBackend(attachedFiles)
      : []
    const backendContent = inputMessage.trim() || (
      language==='ko'
        ? `첨부된 파일을 분석해주세요: ${attachedFiles.map(f=>f.name).join(', ')}`
        : `Please analyze the attached files: ${attachedFiles.map(f=>f.name).join(', ')}`
    )

    // 4) Call injected handler (text vs. image)
    const assistantContent = await sendHandler({
      message: backendContent,
      sessionId: user.email,
      userId: user.email,
      chatHistory: messages,
      files: fileData
    })

    // 5) UI + persist assistant
    const botMsg = {
      id: (Date.now()+1).toString(),
      content: assistantContent,
      role: 'assistant',
      timestamp: new Date(),
      attachments: []
    }
    setMessages(m=>[...m, botMsg])
    await supabase.from('messages').insert([{
      ...botMsg, user_email: user.email,
      timestamp: botMsg.timestamp.toISOString(),
      attachments: JSON.stringify([])
    }])

    setIsTyping(false)
  }

  return {
    t,
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
  }
}
