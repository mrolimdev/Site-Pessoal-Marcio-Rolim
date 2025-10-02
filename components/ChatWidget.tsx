import React, { useState, useRef, useEffect } from 'react';
import ChatBubbleIcon from './icons/ChatBubbleIcon';
import CloseIcon from './icons/CloseIcon';
import SendIcon from './icons/SendIcon';
import MicrophoneIcon from './icons/MicrophoneIcon';

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

type WebhookPayload = {
  pergunta_chat: string;
  id_chat: string;
  mensagem_tipo: 'texto' | 'audio';
};

// Browser support for Speech Recognition API
const SpeechRecognitionApi = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

const ChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
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
  const webhookUrl = 'https://api.automacao.click/webhook/a225d8b7-52a1-4489-98fe-23f59ca92cc6';

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
    const groupId = '1869423538042048652';
    const apiKey = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJHcm91cE5hbWUiOiJNYXJjaW8gUm9saW0iLCJVc2VyTmFtZSI6Ik1hcmNpbyBSb2xpbSIsIkFjY291bnQiOiIiLCJTdWJqZWN0SUQiOiIxODY5NDIzNTM4MDUwNDM3MjYwIiwiUGhvbmUiOiIiLCJHcm91cElEIjoiMTg2OTQyMzUzODA0MjA0ODY1MiIsIlBhZ2VOYW1lIjoiIiwiTWFpbCI6Im1hcmNpby5yb2xpbUBnbWFpbC5jb20iLCJDcmVhdGVUaW1lIjoiMjAyNS0wOC0yMiAyMzowMTozOCIsIlRva2VuVHlwZSI6MSwiaXNzIjoibWluaW1heCJ9.Q6cK2Ba741_PSo4RWOPAqa0JDyGIfaUT7lB87_rbrOABh3vy6Edz9UH047ZsmrD2w6Fecjj8kimv8AG5wlN5ASSYKyNhCO6t_n6d72kTdJDqw8QllsBYtVg9NThyIrGDYM5Wksy5xoW6BxFrulWpMvzQbOud3C0zdLNogAfPXtKd_1tSKgqok6WGFQZ1iqNk8udnJ7R6LQ0YW2YRhFXrLM8TAkkvdrUzZ9J6WICnRHQIhm78O4ZikXbO0zoMVrwCi4JtL_q6ccpuzzVCC4vy3gPATrJ4HB6dtjOibJ0sNrp7nFyRswp_758BfAiqN24elYxNI3I3mFYmWE15rh04Gg';
    const url = `https://api.minimax.io/v1/t2a_v2?GroupId=${groupId}`;

    const payload = {
      model: "speech-2.5-hd-preview", text, stream: false,
      voice_setting: { voice_id: "moss_audio_0b954a1b-c0a1-11ef-aeac-3e1feda129b7", speed: 1.1, vol: 1, pitch: 0 },
      audio_setting: { sample_rate: 32000, bitrate: 128000, format: "mp3", channel: 1 }
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error(`Minimax API error: ${response.status} ${response.statusText}`);
      
      const responseData = await response.json();
      if (responseData.base_resp?.status_code !== 0) throw new Error(`Minimax API Error: ${responseData.base_resp?.status_msg || 'Unknown error'}`);
      
      const hexAudio = responseData.data?.audio;
      if (!hexAudio) throw new Error("No audio data found in Minimax response.");
      
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
        console.error("Error playing audio from Minimax");
        setSpeakingMessageId(null);
        URL.revokeObjectURL(audioUrl);
      };

    } catch (error) {
      console.error("Error calling Minimax TTS API:", error);
      setMessages(prev => prev.map(msg => msg.id === messageId ? { ...msg, content: "Desculpe, tive um problema ao gerar o áudio.", type: undefined } : msg));
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

  const sendWebhookRequest = async (payload: WebhookPayload, speakResponse: boolean, placeholderId?: string) => {
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('A resposta do webhook não foi bem-sucedida.');
      const responseText = await response.text();
      let botReplyText = responseText || 'Obrigado pelo seu contato! Responderei em breve.';
      try {
        const responseData = JSON.parse(responseText);
        botReplyText = responseData.resposta_chat || botReplyText;
      } catch (e) { /* It's plain text, use as is */ }

      if (speakResponse && placeholderId) {
        setMessages(prev => prev.map(msg => msg.id === placeholderId ? { ...msg, content: botReplyText, type: undefined } : msg));
        await speakText(botReplyText, placeholderId);
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
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsSending(true);
    await sendWebhookRequest({ pergunta_chat: userMessage.content, id_chat: chatId, mensagem_tipo: 'texto' }, false);
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
      sendWebhookRequest({ pergunta_chat: transcript, id_chat: chatId, mensagem_tipo: 'audio' }, true, botPlaceholder.id);
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
          } else {
            return renderTextWithLinks(part, `part-${index}`);
          }
        })}
      </React.Fragment>
    );
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={handleCloseChat} />
      )}
      <div className="fixed bottom-0 right-0 sm:bottom-8 sm:right-8 z-50 w-full sm:w-auto">
        {isOpen ? (
          <div className="w-full sm:w-80 h-[85vh] sm:h-[28rem] bg-brand-dark rounded-t-lg sm:rounded-lg shadow-2xl flex flex-col border-t-2 sm:border-2 border-brand-gold animate-slide-in-up">
            <header className="bg-brand-gold p-4 flex justify-between items-center rounded-t-lg sm:rounded-t-md">
              <h3 className="text-brand-dark font-bold text-lg">Fale Comigo</h3>
              <button 
                onClick={handleCloseChat} 
                className="bg-black/10 rounded-full p-1 text-brand-dark hover:bg-black/20 transition-colors duration-300" 
                aria-label="Fechar chat"
              >
                <CloseIcon className="h-6 w-6" />
              </button>
            </header>
            <div className="flex-1 p-4 overflow-y-auto scrollbar-hide">
              <div className="flex flex-col space-y-3">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex items-end gap-2 ${ msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.sender === 'bot' && speakingMessageId === msg.id && (
                      <div className="speaking-indicator flex items-center space-x-1 self-center">
                        <span className="h-4 w-1 bg-brand-gold rounded-full"></span>
                        <span className="h-4 w-1 bg-brand-gold rounded-full" style={{ animationDelay: '0.2s' }}></span>
                        <span className="h-4 w-1 bg-brand-gold rounded-full" style={{ animationDelay: '0.4s' }}></span>
                      </div>
                    )}
                    <div className={`max-w-[80%] p-3 rounded-xl ${ msg.sender === 'user' ? 'bg-brand-gold text-brand-dark' : 'bg-brand-grey text-white' }`}>
                      {msg.type === 'thinking' ? (
                        <div className="speaking-indicator flex items-center space-x-1 px-2 py-1">
                          <span className="h-4 w-1 bg-brand-light/50 rounded-full"></span>
                          <span className="h-4 w-1 bg-brand-light/50 rounded-full" style={{ animationDelay: '0.2s' }}></span>
                          <span className="h-4 w-1 bg-brand-light/50 rounded-full" style={{ animationDelay: '0.4s' }}></span>
                        </div>
                      ) : (
                        <div className="text-sm break-words whitespace-pre-wrap">
                          {renderMessageContent(msg.content)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>
            <div className="p-4 border-t-2 border-brand-light/10 flex items-center bg-brand-grey sm:rounded-b-md">
              <input type="text" value={inputValue} onChange={(e) => { stopSpeaking(); setInputValue(e.target.value); }} onKeyDown={handleKeyDown} placeholder="Digite ou grave..." className="flex-1 bg-brand-dark border border-brand-light/20 rounded-full py-2 px-4 text-brand-light focus:outline-none focus:ring-2 focus:ring-brand-gold" disabled={isSending || isRecording} />
              <div className="ml-3 flex-shrink-0">
                {inputValue.trim() === '' ? (
                  <button onMouseDown={handleStartRecording} onMouseUp={handleStopRecording} onMouseLeave={handleStopRecording} onTouchStart={handleStartRecording} onTouchEnd={handleStopRecording} className={`bg-brand-gold text-brand-dark p-4 rounded-full disabled:opacity-50 hover:opacity-90 transition-all ${isRecording ? 'ring-2 ring-red-500 animate-pulse' : ''}`} disabled={isSending} aria-label={isRecording ? "Gravando..." : "Gravar áudio"}>
                    <MicrophoneIcon className="h-6 w-6" />
                  </button>
                ) : (
                  <button onClick={handleSendTextMessage} className="bg-brand-gold text-brand-dark p-3 rounded-full disabled:opacity-50 hover:opacity-90 transition-opacity" disabled={isSending || !inputValue.trim()} aria-label="Enviar mensagem">
                    <SendIcon className="h-6 w-6" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
           <div className="p-5 sm:p-0 flex justify-end">
             <button onClick={() => setIsOpen(true)} className="bg-brand-gold text-brand-dark rounded-full p-4 shadow-lg hover:opacity-90 transition-opacity" aria-label="Abrir chat">
               <ChatBubbleIcon className="h-8 w-8" />
             </button>
           </div>
        )}
      </div>
    </>
  );
};

export default ChatWidget;