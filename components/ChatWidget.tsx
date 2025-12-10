import React, { useState, useRef, useEffect } from 'react';
import ChatBubbleIcon from './icons/ChatBubbleIcon';
import CloseIcon from './icons/CloseIcon';
import SendIcon from './icons/SendIcon';
import MicrophoneIcon from './icons/MicrophoneIcon';
import WhatsAppIcon from './icons/WhatsAppIcon';
import { sendMessageToGemini } from '../services/geminiService';

// Type definitions for Web Speech API to fix TypeScript error
interface SpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
}

interface SpeechRecognitionEvent extends Event {
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly length: number;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
}

interface Message {
  id: string;
  sender: 'user' | 'bot';
  content: string;
  type?: 'thinking';
}

// Browser support for Speech Recognition API
const SpeechRecognitionApi = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

interface ChatWidgetProps {
  isOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
}

const ChatWidget: React.FC<ChatWidgetProps> = ({ isOpen: controlledIsOpen, onOpenChange }) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;

  const setIsOpen = (value: boolean) => {
    setInternalIsOpen(value);
    onOpenChange?.(value);
  };
  const [messages, setMessages] = useState<Message[]>([
    { id: crypto.randomUUID(), sender: 'bot', content: 'Olá! Como posso ajudar?' },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [chatId] = useState(() => crypto.randomUUID());

  const [isRecording, setIsRecording] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const setVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        const preferredVoices = ['Microsoft Daniel - Portuguese (Brazil)', 'Felipe', 'Google português do Brasil'];
        let foundVoice: SpeechSynthesisVoice | null = null;
        for (const name of preferredVoices) {
          const voice = voices.find(v => v.name === name && v.lang === 'pt-BR');
          if (voice) {
            foundVoice = voice;
            break;
          }
        }
        if (!foundVoice) {
          foundVoice = voices.find(v => v.lang === 'pt-BR' && /male|homem|masculino/i.test(v.name)) || null;
        }
        if (!foundVoice) {
          foundVoice = voices.find(v => v.lang === 'pt-BR') || null;
        }
        setSelectedVoice(foundVoice);
      }
    };

    if ('speechSynthesis' in window) {
      setVoice();
      window.speechSynthesis.onvoiceschanged = setVoice;
    }

    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  const stopSpeaking = () => {
    if ('speechSynthesis' in window && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
    setSpeakingMessageId(null);
  };

  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, []);

  const speakTextWithBrowser = (text: string, messageId: string) => {
    if ('speechSynthesis' in window) {
      stopSpeaking();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'pt-BR';
      if (selectedVoice) utterance.voice = selectedVoice;

      utterance.onstart = () => setSpeakingMessageId(messageId);
      utterance.onend = () => setSpeakingMessageId(null);
      utterance.onerror = (e) => {
        console.error("Speech synthesis error", e);
        setSpeakingMessageId(null);
      };
      window.speechSynthesis.speak(utterance);
    } else {
      console.warn("Este navegador não suporta síntese de voz.");
    }
  };

  const speakTextWithMinimax = async (text: string, messageId: string) => {
    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });

      if (!response.ok) {
        console.warn('TTS API not available, falling back to browser TTS');
        speakTextWithBrowser(text, messageId);
        return;
      }

      const responseData = await response.json();
      const hexAudio = responseData.audio;

      if (!hexAudio) {
        console.warn('No audio data, falling back to browser TTS');
        speakTextWithBrowser(text, messageId);
        return;
      }

      const hexToBytes = (hex: string): Uint8Array => {
        const bytes = new Uint8Array(hex.length / 2);
        for (let i = 0; i < hex.length; i += 2) {
          bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
        }
        return bytes;
      };

      const audioBytes = hexToBytes(hexAudio);
      const audioBlob = new Blob([audioBytes], { type: 'audio/mp3' });
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      setMessages(prev => prev.map(msg => msg.id === messageId ? { ...msg, content: text, type: undefined } : msg));
      setSpeakingMessageId(messageId);

      audio.play().catch(e => {
        console.error("Audio playback failed:", e);
        setSpeakingMessageId(null);
      });

      audio.onended = () => {
        setSpeakingMessageId(null);
        URL.revokeObjectURL(audioUrl);
      };

      audio.onerror = () => {
        console.error("Error playing audio from TTS API");
        setSpeakingMessageId(null);
        URL.revokeObjectURL(audioUrl);
      };

    } catch (error) {
      console.error("Error calling TTS API:", error);
      // Fallback to browser TTS
      speakTextWithBrowser(text, messageId);
    }
  };

  const speakText = async (text: string, messageId: string) => {
    // Remove bold markdown for speech synthesis
    const plainText = text.replace(/\*\*/g, '');
    await speakTextWithMinimax(plainText, messageId);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const sendMessageToAI = async (message: string, speakResponse: boolean, placeholderId?: string) => {
    try {
      // Call Gemini API
      const botReplyText = await sendMessageToGemini(message, chatId);

      if (placeholderId) {
        setMessages(prev => prev.map(msg => msg.id === placeholderId ? { ...msg, content: botReplyText, type: undefined } : msg));
        if (speakResponse) {
          await speakText(botReplyText, placeholderId);
        }
      } else {
        const botResponse: Message = { id: crypto.randomUUID(), sender: 'bot', content: botReplyText };
        setMessages((prev) => [...prev, botResponse]);
      }
    } catch (error) {
      console.error('Falha ao enviar mensagem ou processar resposta:', error);
      const errorContent = 'Desculpe, ocorreu um erro. Tente novamente mais tarde.';
      if (placeholderId) {
        setMessages(prev => prev.map(m => m.id === placeholderId ? { ...m, content: errorContent, type: undefined } : m));
      } else {
        const errorResponse: Message = { id: crypto.randomUUID(), sender: 'bot', content: errorContent };
        setMessages((prev) => [...prev, errorResponse]);
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleSendTextMessage = async () => {
    if (!inputValue.trim() || isSending) return;
    stopSpeaking();
    const userMessage: Message = { id: crypto.randomUUID(), sender: 'user', content: inputValue };
    const botPlaceholder: Message = { id: crypto.randomUUID(), sender: 'bot', content: '', type: 'thinking' };
    setMessages((prev) => [...prev, userMessage, botPlaceholder]);
    setInputValue('');
    setIsSending(true);
    await sendMessageToAI(userMessage.content, false, botPlaceholder.id);
  };

  useEffect(() => {
    if (!SpeechRecognitionApi) return;
    const recognition: SpeechRecognition = new SpeechRecognitionApi();
    recognition.lang = 'pt-BR';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onstart = () => setIsRecording(true);
    recognition.onend = () => setIsRecording(false);
    recognition.onerror = (event) => {
      console.error('Erro no reconhecimento de voz:', event.error);
    };
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      if (!transcript.trim()) return;
      const userMessage: Message = { id: crypto.randomUUID(), sender: 'user', content: transcript };
      const botPlaceholder: Message = { id: crypto.randomUUID(), sender: 'bot', content: '', type: 'thinking' };
      setMessages((prev) => [...prev, userMessage, botPlaceholder]);
      setIsSending(true);
      sendMessageToAI(transcript, true, botPlaceholder.id);
    };
    recognitionRef.current = recognition;
  }, [chatId]);

  const handleStartRecording = () => {
    if (isSending || isRecording || !recognitionRef.current) return;
    stopSpeaking();
    setInputValue('');
    try {
      recognitionRef.current.start();
    } catch (e) {
      console.error("Não foi possível iniciar a gravação:", e);
    }
  };

  const handleStopRecording = () => {
    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSendTextMessage();
  };

  const handleCloseChat = () => {
    stopSpeaking();
    setIsOpen(false);
  }

  const renderMessageContent = (content: string) => {
    const parts = content.split(/(\*\*.*?\*\*)/g);
    const linkRegex = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|]|\bwww\.[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|]|\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b)/ig;

    const renderTextWithLinks = (text: string, keyPrefix: string) => {
      if (!text) {
        return null;
      }
      const linkParts = text.split(linkRegex);
      return linkParts.map((part, index) => {
        if (part && part.match(linkRegex)) {
          if (part.includes('@')) {
            return <a key={`${keyPrefix}-${index}`} href={`mailto:${part}`} className="underline">{part}</a>;
          } else {
            const href = part.startsWith('www.') ? `https://${part}` : part;
            return <a key={`${keyPrefix}-${index}`} href={href} target="_blank" rel="noopener noreferrer" className="underline">{part}</a>;
          }
        } else if (part) {
          return <React.Fragment key={`${keyPrefix}-${index}`}>{part}</React.Fragment>;
        }
        return null;
      });
    };

    return (
      <React.Fragment>
        {parts.map((part, index) => {
          if (part && part.startsWith('**') && part.endsWith('**')) {
            const boldContent = part.slice(2, -2);
            return (
              <strong key={index}>
                {renderTextWithLinks(boldContent, `bold-${index}`)}
              </strong>
            );
          } else if (part && part.includes('[[WHATSAPP_ACTION]]')) {
            const cleanPart = part.replace('[[WHATSAPP_ACTION]]', '');
            return (
              <React.Fragment key={index}>
                {renderTextWithLinks(cleanPart, `part-${index}`)}
                <div className="mt-2">
                  <a
                    href="https://wa.me/5511980888880"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-full font-bold text-sm transition-all shadow-md hover:shadow-lg no-underline"
                  >
                    <WhatsAppIcon className="h-4 w-4" />
                    Falar agora
                  </a>
                </div>
              </React.Fragment>
            );
          } else {
            return renderTextWithLinks(part, `part-${index}`);
          }
        })}
      </React.Fragment>
    );
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={handleCloseChat}
        />
      )}

      {/* Chat Container */}
      <div className="fixed bottom-0 right-0 sm:bottom-6 sm:right-6 z-50 w-full sm:w-auto">
        {isOpen ? (
          <div className="w-full sm:w-96 h-[100dvh] sm:h-[32rem] bg-white sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden sm:border sm:border-slate-200">
            {/* Header */}
            <header className="bg-emerald-500 px-5 py-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <ChatBubbleIcon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">Fale Comigo</h3>
                  <p className="text-white/80 text-xs">Online agora</p>
                </div>
              </div>
              <button
                onClick={handleCloseChat}
                className="bg-white/20 hover:bg-white/30 rounded-full p-2 text-white transition-colors"
                aria-label="Fechar chat"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </header>

            {/* Messages */}
            <div className="flex-1 p-4 overflow-y-auto bg-slate-50">
              <div className="flex flex-col space-y-3" aria-live="polite">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex items-end gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.sender === 'bot' && speakingMessageId === msg.id && (
                      <div className="speaking-indicator flex items-center space-x-1 self-center">
                        <span className="h-3 w-1 bg-emerald-500 rounded-full"></span>
                        <span className="h-3 w-1 bg-emerald-500 rounded-full animation-delay-200"></span>
                        <span className="h-3 w-1 bg-emerald-500 rounded-full animation-delay-400"></span>
                      </div>
                    )}
                    <div className={`max-w-[85%] p-3 rounded-2xl shadow-sm ${msg.sender === 'user'
                      ? 'bg-emerald-500 text-white rounded-br-md'
                      : 'bg-white text-slate-800 rounded-bl-md border border-slate-100'
                      }`}>
                      {msg.type === 'thinking' ? (
                        <div className="speaking-indicator flex items-center space-x-1 px-2 py-1">
                          <span className="h-2 w-2 bg-slate-400 rounded-full animate-bounce"></span>
                          <span className="h-2 w-2 bg-slate-400 rounded-full animate-bounce animation-delay-200"></span>
                          <span className="h-2 w-2 bg-slate-400 rounded-full animate-bounce animation-delay-400"></span>
                        </div>
                      ) : (
                        <div className="text-sm break-words whitespace-pre-wrap leading-relaxed">
                          {renderMessageContent(msg.content)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-slate-200 safe-area-bottom">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => { stopSpeaking(); setInputValue(e.target.value); }}
                  onKeyDown={handleKeyDown}
                  placeholder="Digite sua mensagem..."
                  className="flex-1 bg-slate-100 border-0 rounded-full py-3 px-5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  disabled={isSending || isRecording}
                />
                <div className="flex-shrink-0">
                  {inputValue.trim() === '' ? (
                    <button
                      onMouseDown={handleStartRecording}
                      onMouseUp={handleStopRecording}
                      onMouseLeave={handleStopRecording}
                      onTouchStart={handleStartRecording}
                      onTouchEnd={handleStopRecording}
                      className={`bg-emerald-500 hover:bg-emerald-600 text-white p-3 rounded-full disabled:opacity-50 transition-all shadow-lg ${isRecording ? 'ring-2 ring-red-500 animate-pulse bg-red-500' : ''}`}
                      disabled={isSending}
                      aria-label={isRecording ? "Gravando..." : "Gravar áudio"}
                    >
                      <MicrophoneIcon className="h-5 w-5" />
                    </button>
                  ) : (
                    <button
                      onClick={handleSendTextMessage}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white p-3 rounded-full disabled:opacity-50 transition-all shadow-lg"
                      disabled={isSending || !inputValue.trim()}
                      aria-label="Enviar mensagem"
                    >
                      <SendIcon className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 sm:p-0 flex justify-end">
            <button
              onClick={() => setIsOpen(true)}
              className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-full p-4 shadow-xl shadow-emerald-500/40 transition-all hover:scale-110 active:scale-95"
              aria-label="Abrir chat"
            >
              <ChatBubbleIcon className="h-7 w-7" />
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default ChatWidget;