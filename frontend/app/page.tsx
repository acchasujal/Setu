"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Mic, Camera, Keyboard, Play, Calendar, Banknote, Sun, Bell } from "lucide-react"

// API URL from environment variable, default to localhost
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

// Simple logger utility for consistent debugging
const logger = {
  log: (msg: string) => console.log(`[SETU-PWA] ${msg}`),
  error: (msg: string) => console.error(`[SETU-PWA-ERROR] ${msg}`),
  warn: (msg: string) => console.warn(`[SETU-PWA-WARN] ${msg}`),
}

type AppState = "idle" | "recording" | "processing" | "response"
type Language = "hindi" | "english" | "marathi"

interface NoticeItem {
  id: string
  title: string
  date: string
  tag: string
  type: "exam" | "fee" | "holiday" | "general"
}

interface Translations {
  appTitle: string
  appSubtitle: string
  installBanner: string
  installButton: string
  noticesButton: string
  helpButton: string
  askAnything: string
  listening: string
  searching: string
  yourAnswer: string
  listenAudio: string
  askNewQuestion: string
  back: string
  schoolNotices: string
  step1: string
  listeningFooter: string
  thinkingFooter: string
  answerReady: string
  uploadHint: string
  typeHint: string
  tapToSpeak: string
}

const translations: Record<Language, Translations> = {
  hindi: {
    appTitle: "सेतु",
    appSubtitle: "स्कूल साथी",
    installBanner: "सेतु App Install करें",
    installButton: "Install",
    noticesButton: "स्कूल की सूचना",
    helpButton: "मदद",
    askAnything: "स्कूल के बारे में कुछ भी पूछें",
    listening: "बोलिए... हम सुन रहे हैं",
    searching: "जवाब ढूंढ रहे हैं...",
    yourAnswer: "आपका जवाब",
    listenAudio: "सुनें (Play Audio)",
    askNewQuestion: "नया सवाल पूछें",
    back: "← वापस",
    schoolNotices: "स्कूल की सूचना",
    step1: "Step 1: बड़ा बटन दबाएं",
    listeningFooter: "सुन रहे हैं... बोलते रहें",
    thinkingFooter: "सोच रहे हैं... रुको ज़रा",
    answerReady: "जवाब तैयार है!",
    uploadHint: "Photo/PDF",
    typeHint: "Type",
    tapToSpeak: "बोलने के लिए दबाएं",
  },
  english: {
    appTitle: "Setu",
    appSubtitle: "School Companion",
    installBanner: "Install Setu App",
    installButton: "Install",
    noticesButton: "School Notices",
    helpButton: "Help",
    askAnything: "Ask anything about school",
    listening: "Speak... we are listening",
    searching: "Finding your answer...",
    yourAnswer: "Your Answer",
    listenAudio: "Listen (Play Audio)",
    askNewQuestion: "Ask New Question",
    back: "← Back",
    schoolNotices: "School Notices",
    step1: "Step 1: Press the Big Button",
    listeningFooter: "Listening... Keep speaking",
    thinkingFooter: "Thinking... Please wait",
    answerReady: "Answer is ready!",
    uploadHint: "Photo/PDF",
    typeHint: "Type",
    tapToSpeak: "Tap to Speak",
  },
  marathi: {
    appTitle: "सेतु",
    appSubtitle: "शाळा साथी",
    installBanner: "सेतु App Install करा",
    installButton: "Install",
    noticesButton: "शाळा सूचना",
    helpButton: "मदत",
    askAnything: "शाळेबद्दल काहीही विचारा",
    listening: "बोला... आम्ही ऐकतो आहे",
    searching: "उत्तर शोधत आहे...",
    yourAnswer: "तुमचे उत्तर",
    listenAudio: "ऐका (Play Audio)",
    askNewQuestion: "नवा प्रश्न विचारा",
    back: "← मागे",
    schoolNotices: "शाळा सूचना",
    step1: "Step 1: मोठा बटण दाबा",
    listeningFooter: "ऐकतो आहे... बोलत रहा",
    thinkingFooter: "विचार करत आहे... थांबा",
    answerReady: "उत्तर तयार आहे!",
    uploadHint: "Photo/PDF",
    typeHint: "Type",
    tapToSpeak: "बोलण्यासाठी दाबा",
  },
}

const exampleQuestions: Record<Language, { text: string; icon: "calendar" | "money" | "general" }[]> = {
  hindi: [
    { text: "क्या कल स्कूल की छुट्टी है?", icon: "calendar" },
    { text: "Scholarship form कैसे भरें?", icon: "general" },
    { text: "रोहन की फीस जमा हुई?", icon: "money" },
  ],
  english: [
    { text: "Is there a holiday tomorrow?", icon: "calendar" },
    { text: "How to fill scholarship form?", icon: "general" },
    { text: "Was Rohan's fee submitted?", icon: "money" },
  ],
  marathi: [
    { text: "उद्या शाळेला सुट्टी आहे का?", icon: "calendar" },
    { text: "Scholarship form कसा भरायचा?", icon: "general" },
    { text: "रोहनची फीस भरणा झाली का?", icon: "money" },
  ],
}

export default function SetuApp() {
  const [mounted, setMounted] = useState(false)
  const [appState, setAppState] = useState<AppState>("idle")
  const [showNotices, setShowNotices] = useState(false)
  const [language, setLanguage] = useState<Language>("hindi")
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false)
  const [response, setResponse] = useState<{ summary: string[]; audioUrl: string } | null>(null)
  const [notices, setNotices] = useState<NoticeItem[]>([])
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null)
  const uploadedPdfRef = useRef<File | null>(null)

  const t = translations[language]

  useEffect(() => {
    audioPlayerRef.current = new Audio()

  return () => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause()
      audioPlayerRef.current.src = ""
      audioPlayerRef.current = null
    }
  
    // Log API configuration on mount for debugging
    console.log("[SETU-INIT] Component mounted")
    console.log("[SETU-INIT] API_URL:", API_URL)
    console.log("[SETU-INIT] NEXT_PUBLIC_API_URL env:", process.env.NEXT_PUBLIC_API_URL)
    console.log("[SETU-INIT] Window location:", window.location.href)
    logger.log("Component initialized with language: " + language)
    
    // Fetch chat history on mount (optional - can be used for history display)
    // For now, keeping mock notices
    const mockNotices: NoticeItem[] = [
      { id: "1", title: "Exam Schedule", date: "आज", tag: "Rohan - Class 5B", type: "exam" },
      { id: "2", title: "Fee Payment Reminder", date: "कल", tag: "Rohan - Class 5B", type: "fee" },
      { id: "3", title: "Diwali Holiday Notice", date: "20 Jan", tag: "Rohan - Class 5B", type: "holiday" },
      { id: "4", title: "PTM Scheduled", date: "25 Jan", tag: "Rohan - Class 5B", type: "general" },
    ]
    setNotices(mockNotices)
    setMounted(true)

  }
}, [])

  const getFooterText = () => {
    switch (appState) {
      case "idle":
        return t.step1
      case "recording":
        return t.listeningFooter
      case "processing":
        return t.thinkingFooter
      case "response":
        return t.answerReady
      default:
        return ""
    }
  }

  const startRecording = async () => {
    try {
      logger.log("[RECORDING] Requesting microphone access...")
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      
      // Determine best audio codec support
      const audioType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : MediaRecorder.isTypeSupported("audio/mp4")
          ? "audio/mp4"
          : "audio/wav"
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: audioType === "audio/webm" ? "audio/webm" : undefined
      })
      
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          console.log("🎤 Audio chunk received, size:", event.data.size)
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: audioType })
        console.log("🛑 Recording stopped, total blob size:", audioBlob.size)
        
        // Alert user if microphone was silent
        if (audioBlob.size === 0) {
          alert(
            language === "hindi"
              ? "माइक्रोफ़ोन शांत है! कृपया जोर से बोलें।"
              : language === "marathi"
                ? "मायक्रोफोन शांत आहे! कृपया मोठ्याने बोला."
                : "Microphone is silent! Please speak louder."
          )
          setAppState("idle")
          return
        }
        
        logger.log("[RECORDING] Recording stopped, processing audio...")
        
        // Stop all tracks to free up microphone
        stream.getTracks().forEach((track) => {
          track.stop()
        })
        
        await processAudio(audioBlob)
      }

      mediaRecorder.onerror = (event) => {
        logger.error(`[RECORDING] MediaRecorder error: ${event.error}`)
        console.error("MediaRecorder error:", event.error)
        setAppState("idle")
      }

      mediaRecorder.start()
      setAppState("recording")
      logger.log(`[RECORDING] Started recording with codec: ${audioType}`)
    } catch (error) {
      logger.error(`[RECORDING] Microphone access denied: ${error}`)
      console.error("Microphone access denied:", error)
      setAppState("idle")
      alert(
        language === "hindi"
          ? "माइक्रोफ़ोन का उपयोग करने की अनुमति दें"
          : language === "marathi"
            ? "मायक्रोफोन परवानगी देखील मिळणे आवश्यक आहे"
            : "Please allow microphone access"
      )
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && appState === "recording") {
      logger.log("[RECORDING] Stop button clicked")
      console.log("🎤 [DEBUG] mediaRecorderRef.current:", mediaRecorderRef.current)
      console.log("🎤 [DEBUG] appState before stop:", appState)
      mediaRecorderRef.current.stop()
      setAppState("processing")
    } else {
      console.log("🎤 [DEBUG] Cannot stop - mediaRecorder null or appState is", appState)
    }
  }

  const playAudio = (url: string) => {
    const audio = audioPlayerRef.current
    if (!audio) return
  
    audio.pause()
    audio.src = url
    audio.currentTime = 0
  
    setIsPlayingAudio(true)
  
    audio.onended = () => setIsPlayingAudio(false)
    audio.onerror = () => setIsPlayingAudio(false)
  
    audio.play().catch((err) => {
      console.error("Audio playback failed:", err)
      setIsPlayingAudio(false)
    })
  }
  

  const processAudio = async (audioBlob: Blob) => {
    try {
      setAppState("processing")
      logger.log(`[PROCESS] Starting audio processing (size: ${audioBlob.size} bytes)`)
      
      // Build FormData with audio and optional context
      const formData = new FormData()
      formData.append("audio_file", audioBlob, `recording_${Date.now()}.webm`)
      
      if (uploadedPdfRef.current) {
        formData.append("pdf_file", uploadedPdfRef.current)
        logger.log("[PROCESS] Attached PDF for context")
      }
      
      const langCode = language === "hindi" ? "hi" : language === "marathi" ? "mr" : "en"
      formData.append("language", langCode)
      
      // Send to backend
      logger.log(`[PROCESS] Sending request to ${API_URL}/api/chat`)
      const response = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        body: formData,
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`API error: ${response.status} - ${errorText}`)
      }
      
      const data = await response.json()
      logger.log("[PROCESS] Received response from backend")
      
      if (data.error) {
        logger.error(`[PROCESS] Backend error: ${data.error}`)
        throw new Error(data.error)
      }
      
      // Parse response text into bullet points
      const summary = data.answer
        .split(/[।.!?]\s*|\n+/)
        .filter((s: string) => s.trim().length > 0)
        .map((s: string) => s.trim())
        .slice(0, 5)
      
      setResponse({
        summary: summary.length > 0 ? summary : [data.answer],
        audioUrl: data.audio_url || "",
      })
      setAppState("response")
      logger.log("[PROCESS] ✓ Response displayed")
      
      // Auto-play audio
      if (data.audio_url) {
        const fullUrl = `${API_URL}${data.audio_url}`
        console.log("Playing audio from:", fullUrl)
        if (data.audio_url) {
          playAudio(`${API_URL}${data.audio_url}`)
        }
      
      }
    } catch (error) {
      logger.error(`[PROCESS] Error: ${error}`)
      console.error("Error processing audio:", error)
      
      setResponse({
        summary: [
          language === "hindi"
            ? "माफ़ करें, कुछ गलत हो गया। कृपया फिर से कोशिश करें।"
            : language === "marathi"
              ? "क्षमस्व, काही चूक झाली. कृपया पुन्हा प्रयत्न करा."
              : "Sorry, something went wrong. Please try again."
        ],
        audioUrl: "",
      })
      setAppState("response")
    }
  }

  const handleMicClick = () => {
    console.log("🎤 [DEBUG] handleMicClick triggered, current appState:", appState)
    console.log("🎤 [DEBUG] API_URL:", API_URL)
    console.log("🎤 [DEBUG] Env NEXT_PUBLIC_API_URL:", process.env.NEXT_PUBLIC_API_URL)
    
    if (appState === "idle" || appState === "response") {
      console.log("🎤 [DEBUG] Starting new recording...")
      setResponse(null)
      startRecording()
    } else if (appState === "recording") {
      console.log("🎤 [DEBUG] Stopping recording...")
      stopRecording()
    } else {
      console.log("🎤 [DEBUG] App is in state:", appState, "- no action taken")
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    // Validate file size (max 25MB)
    const maxSizeMB = 25
    if (file.size > maxSizeMB * 1024 * 1024) {
      logger.warn(`File too large: ${file.size} bytes`)
      alert(
        language === "hindi"
          ? `फाइल बहुत बड़ी है। कृपया ${maxSizeMB}MB से कम की फाइल अपलोड करें।`
          : language === "marathi"
            ? `फाईल खूप मोठी आहे. कृपया ${maxSizeMB}MB पेक्षा कमी फाईल अपलोड करा.`
            : `File is too large. Please upload a file smaller than ${maxSizeMB}MB.`
      )
      return
    }

    // Validate file type
    const validTypes = ["application/pdf", "image/jpeg", "image/png"]
    if (!validTypes.includes(file.type)) {
      logger.warn(`Invalid file type: ${file.type}`)
      alert(
        language === "hindi"
          ? "कृपया PDF, JPG, या PNG फाइल अपलोड करें।"
          : language === "marathi"
            ? "कृपया PDF, JPG, किंवा PNG फाइल अपलोड करा."
            : "Please upload a PDF, JPG, or PNG file."
      )
      return
    }

    uploadedPdfRef.current = file
    logger.log(`[FILE] Uploaded: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`)
    
    alert(
      language === "hindi"
        ? "फाइल अपलोड हो गई! अब माइक बटन दबाकर सवाल पूछें।"
        : language === "marathi"
          ? "फाईल अपलोड झाली! आता माइक बटण दाबून प्रश्न विचारा."
          : "File uploaded! Now click the mic button to ask a question."
    )
  }

  const handleKeyboardClick = async () => {
    const query = prompt(
      language === "hindi" ? "अपना सवाल लिखें:" : language === "marathi" ? "तुमचा प्रश्न लिहा:" : "Type your question:",
    )
    
    if (!query || query.trim() === "") {
      return
    }

    try {
      setAppState("processing")
      logger.log("[KEYBOARD] Processing text query")
      
      // Build FormData with text query and optional context
      const formData = new FormData()
      formData.append("text_query", query)
      
      if (uploadedPdfRef.current) {
        formData.append("pdf_file", uploadedPdfRef.current)
        logger.log("[KEYBOARD] Attached PDF for context")
      }
      
      const langCode = language === "hindi" ? "hi" : language === "marathi" ? "mr" : "en"
      formData.append("language", langCode)
      
      // Send to backend
      logger.log(`[KEYBOARD] Sending request to ${API_URL}/api/chat`)
      const response = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        body: formData,
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`API error: ${response.status} - ${errorText}`)
      }
      
      const data = await response.json()
      logger.log("[KEYBOARD] Received response from backend")
      
      if (data.error) {
        logger.error(`[KEYBOARD] Backend error: ${data.error}`)
        throw new Error(data.error)
      }
      
      // Parse response text
      const summary = data.answer
        .split(/[।.!?]\s*|\n+/)
        .filter((s: string) => s.trim().length > 0)
        .map((s: string) => s.trim())
        .slice(0, 5)
      
      setResponse({
        summary: summary.length > 0 ? summary : [data.answer],
        audioUrl: data.audio_url || "",
      })
      setAppState("response")
      logger.log("[KEYBOARD] ✓ Response displayed")
      
      // Auto-play audio
      if (data.audio_url) {
        const fullUrl = `${API_URL}${data.audio_url}`
        console.log("Playing audio from:", fullUrl)
        const audio = new Audio(fullUrl)
        audio.play().catch(e => console.error("Playback failed:", e))
      }
    } catch (error) {
      logger.error(`[KEYBOARD] Error: ${error}`)
      console.error("Error processing text query:", error)
      
      setResponse({
        summary: [
          language === "hindi"
            ? "माफ़ करें, कुछ गलत हो गया। कृपया फिर से कोशिश करें।"
            : language === "marathi"
              ? "क्षमस्व, काही चूक झाली. कृपया पुन्हा प्रयत्न करा."
              : "Sorry, something went wrong. Please try again."
        ],
        audioUrl: "",
      })
      setAppState("response")
    }
  }

  const handleLanguageChange = (lang: Language) => {
    // BACKEND_INTEGRATION_POINT: handleLanguageChange
    setLanguage(lang)
    setShowLanguageDropdown(false)
  }

  const resetToIdle = () => {
    setAppState("idle")
    setResponse(null)
  }

  const getNoticeTypeIcon = (type: NoticeItem["type"]) => {
    switch (type) {
      case "exam":
        return <Calendar className="w-5 h-5" />
      case "fee":
        return <Banknote className="w-5 h-5" />
      case "holiday":
        return <Sun className="w-5 h-5" />
      default:
        return <Bell className="w-5 h-5" />
    }
  }

  const getNoticeTypeColor = (type: NoticeItem["type"]) => {
    switch (type) {
      case "exam":
        return "bg-[#FF7F50]"
      case "fee":
        return "bg-[#1A365D]"
      case "holiday":
        return "bg-[#22C55E]"
      default:
        return "bg-[#666]"
    }
  }

  const getQuestionIcon = (icon: "calendar" | "money" | "general") => {
    switch (icon) {
      case "calendar":
        return <Calendar className="w-5 h-5 text-[#FF7F50] flex-shrink-0" />
      case "money":
        return <Banknote className="w-5 h-5 text-[#22C55E] flex-shrink-0" />
      default:
        return <Bell className="w-5 h-5 text-[#1A365D] flex-shrink-0" />
    }
  }

  if (showNotices) {
    if (!mounted) {
    return null}
    (
    
      <main className="min-h-screen bg-[#FFF8F5] flex justify-center">
        <div className="w-full max-w-[450px] min-h-screen flex flex-col">
          <header className="bg-[#1A365D] text-white py-6 px-6 flex items-center gap-4">
            <button
              onClick={() => setShowNotices(false)}
              className="text-lg font-semibold px-4 py-2 bg-white/10 rounded-lg"
            >
              {t.back}
            </button>
            <h1 className="text-xl font-bold">{t.schoolNotices}</h1>
          </header>

          <div className="flex-1 px-6 py-8 space-y-4">
            {notices.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl p-5 shadow-sm border border-orange-100 flex flex-col gap-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {getNoticeTypeIcon(item.type)}
                    <h3 className="text-[#1A365D] text-lg font-bold">{item.title}</h3>
                  </div>
                  <span
                    className={`${getNoticeTypeColor(item.type)} text-white text-xs px-2 py-1 rounded-full font-medium`}
                  >
                    {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                  </span>
                </div>
                <p className="text-[#666] text-base">{item.date}</p>
                <div className="bg-[#F0F7FF] text-[#1A365D] text-sm px-3 py-1.5 rounded-lg inline-block w-fit font-medium">
                  {item.tag}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#FFF8F5] flex justify-center">
      <div className="w-full max-w-[450px] min-h-screen flex flex-col">
        <input ref={fileInputRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleFileUpload} />

        <header className="bg-white border-b border-[#E5E5E5] py-6 px-6 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#1A365D]">{t.appTitle}</h1>
              <p className="text-[#666] text-sm">{t.appSubtitle}</p>
            </div>
            <div className="relative">
              <button
                onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                className="px-4 py-2.5 bg-[#FF7F50] text-white rounded-lg font-semibold text-base flex items-center gap-2"
              >
                {language === "hindi" ? "हिंदी" : language === "english" ? "EN" : "मराठी"}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showLanguageDropdown && (
                <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-[#E5E5E5] overflow-hidden z-50">
                  <button
                    onClick={() => handleLanguageChange("hindi")}
                    className={`block w-full px-4 py-3 text-left text-base ${
                      language === "hindi" ? "bg-[#FFF8F5] text-[#FF7F50]" : "text-[#1A365D]"
                    }`}
                  >
                    हिंदी (Hindi)
                  </button>
                  <button
                    onClick={() => handleLanguageChange("english")}
                    className={`block w-full px-4 py-3 text-left text-base ${
                      language === "english" ? "bg-[#FFF8F5] text-[#FF7F50]" : "text-[#1A365D]"
                    }`}
                  >
                    English
                  </button>
                  <button
                    onClick={() => handleLanguageChange("marathi")}
                    className={`block w-full px-4 py-3 text-left text-base ${
                      language === "marathi" ? "bg-[#FFF8F5] text-[#FF7F50]" : "text-[#1A365D]"
                    }`}
                  >
                    मराठी (Marathi)
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto pb-52 px-6">
          <div className="flex flex-col space-y-8 py-8">
            {appState === "response" && response ? (
              <div className="space-y-8">
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-orange-100">
                  <h2 className="text-xl font-bold text-[#1A365D] mb-4">{t.yourAnswer}</h2>

                  <button
                    onClick={() => {
                      if (response.audioUrl) {
                        try {
                          const fullAudioUrl = new URL(response.audioUrl, API_URL).toString()
                          console.log("🔊 Playing from response button:", fullAudioUrl)
                          if (!audioPlayerRef.current) {
                            audioPlayerRef.current = new Audio()
                          }
                          const audio = audioPlayerRef.current
                          audio.src = fullAudioUrl
                          setIsPlayingAudio(true)
                          audio.onended = () => setIsPlayingAudio(false)
                          audio.onerror = () => setIsPlayingAudio(false)
                          audio.play().catch((err) => {
                            console.error("❌ Audio Playback Failed. Possible Autoplay block.", err)
                            setIsPlayingAudio(false)
                          })
                        } catch (err) {
                          console.error("Error setting up audio:", err)
                          setIsPlayingAudio(false)
                        }
                      }
                    }}
                    className={`w-full py-4 rounded-xl flex items-center justify-center gap-3 mb-6 transition-all font-semibold text-lg ${
                      isPlayingAudio
                        ? "bg-[#22C55E] text-white animate-pulse"
                        : "bg-[#1A365D] text-white hover:bg-[#1A365D]/90"
                    }`}
                  >
                    <Play className={`w-8 h-8 ${isPlayingAudio ? "animate-spin" : ""}`} />
                    <span>{isPlayingAudio ? "🔊 Playing..." : t.listenAudio}</span>
                  </button>

                  <div className="space-y-3">
                    {response.summary.map((point, index) => (
                      <div key={index} className="flex gap-3 items-start">
                        <span className="bg-[#FF7F50] text-white w-8 h-8 rounded-full flex items-center justify-center font-bold flex-shrink-0">
                          {index + 1}
                        </span>
                        <p className="text-[#1A365D] text-lg">{point}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={resetToIdle}
                  className="w-full py-4 bg-white rounded-2xl text-[#1A365D] font-semibold text-lg shadow-sm border border-orange-100"
                >
                  {t.askNewQuestion}
                </button>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="text-center">
                  <p className="text-[#1A365D] text-xl font-medium">
                    {appState === "idle" && t.askAnything}
                    {appState === "recording" && t.listening}
                    {appState === "processing" && t.searching}
                  </p>
                </div>

                {appState === "idle" && (
                  <>
                    <div className="space-y-4">
                      <h3 className="text-[#666] text-sm font-medium uppercase tracking-wide">
                        {language === "hindi"
                          ? "उदाहरण सवाल"
                          : language === "marathi"
                            ? "उदाहरण प्रश्न"
                            : "Example Questions"}
                      </h3>
                      {exampleQuestions[language].map((q, i) => (
                        <div
                          key={i}
                          className="bg-white text-[#1A365D] text-lg px-5 py-4 rounded-2xl shadow-sm border border-orange-100 flex items-center gap-3 text-left mb-4 last:mb-0"
                        >
                          {getQuestionIcon(q.icon)}
                          <span>"{q.text}"</span>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-[#666] text-sm font-medium uppercase tracking-wide">
                        {language === "hindi" ? "त्वरित कार्रवाई" : language === "marathi" ? "जलद कृती" : "Quick Actions"}
                      </h3>
                      <button
                        onClick={() => setShowNotices(true)}
                        className="w-full bg-white rounded-2xl p-5 shadow-sm border border-orange-100 flex items-center gap-4 text-left"
                      >
                        <div className="w-12 h-12 rounded-xl bg-[#FF7F50]/10 flex items-center justify-center">
                          <Bell className="w-6 h-6 text-[#FF7F50]" />
                        </div>
                        <div>
                          <p className="text-[#1A365D] text-lg font-semibold">{t.noticesButton}</p>
                          <p className="text-[#666] text-sm">
                            {language === "hindi"
                              ? "4 नई सूचनाएं"
                              : language === "marathi"
                                ? "4 नवीन सूचना"
                                : "4 new notices"}
                          </p>
                        </div>
                      </button>
                    </div>
                  </>
                )}

                {appState === "processing" && (
                  <div className="flex justify-center py-8">
                    <div className="w-16 h-16 border-4 border-[#FF7F50] border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {appState !== "response" && (
          <div className="fixed bottom-0 left-0 right-0 flex justify-center">
            <div className="w-full max-w-[450px] bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] px-6 pt-4 pb-8">
              <div className="flex items-center justify-center gap-8">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={appState === "processing"}
                  className="w-16 h-16 rounded-xl border-2 border-[#3b82f6] bg-white text-[#3b82f6] flex flex-col items-center justify-center shadow-md disabled:opacity-50 transition-all hover:bg-[#3b82f6] hover:text-white"
                  aria-label={t.uploadHint}
                >
                  <Camera className="w-7 h-7" />
                  <span className="text-[10px] mt-0.5 font-medium">{t.uploadHint}</span>
                </button>

                <button
                  onClick={handleMicClick}
                  disabled={appState === "processing"}
                  className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all ${
                    appState === "processing" ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  aria-label={t.tapToSpeak}
                >
                  {appState === "idle" && (
                    <>
                      <span className="absolute inset-0 rounded-full bg-[#22c55e]/20 animate-ping" />
                      <span className="absolute inset-2 rounded-full bg-[#22c55e]/30 animate-pulse" />
                    </>
                  )}

                  {appState === "recording" && (
                    <>
                      <span className="absolute inset-0 rounded-full bg-[#EF4444]/20 animate-ping" />
                      <span className="absolute inset-2 rounded-full bg-[#EF4444]/30 animate-pulse" />
                      <span
                        className="absolute inset-4 rounded-full bg-[#EF4444]/40 animate-pulse"
                        style={{ animationDelay: "150ms" }}
                      />
                    </>
                  )}

                  <span
                    className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center shadow-lg ${
                      appState === "recording" ? "bg-[#EF4444]" : "bg-[#22c55e]"
                    }`}
                  >
                    <Mic className="w-10 h-10 text-white" />
                  </span>
                </button>

                <button
                  onClick={handleKeyboardClick}
                  disabled={appState === "processing"}
                  className="w-16 h-16 rounded-xl bg-transparent border-2 border-[#9ca3af] text-[#6b7280] flex flex-col items-center justify-center disabled:opacity-50 transition-all hover:bg-[#6b7280] hover:text-white"
                  aria-label={t.typeHint}
                >
                  <Keyboard className="w-7 h-7" />
                  <span className="text-[10px] mt-0.5 font-medium">{t.typeHint}</span>
                </button>
              </div>

              <p className="text-center text-[#1A365D] text-base font-medium mt-4">{getFooterText()}</p>
            </div>
          </div>
        )}

        {appState === "response" && (
          <div className="fixed bottom-0 left-0 right-0 flex justify-center">
            <div className="w-full max-w-[450px] bg-[#1A365D] text-white px-6 py-4 text-center">
              <p className="text-lg font-semibold">{getFooterText()}</p>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
