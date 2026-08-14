'use client'

import React, { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { MEDIA, SITE } from '@/content/site'
import {
  CloseIcon,
  SparklesIcon,
  HeartIcon,
  CodeIcon,
  WhatsAppIcon,
} from '@/components/icons'
import { ChatMensagens, type Mensagem } from './chat-mensagens'

const SUGESTOES_TECH = [
  'Como automatizar processos com IA na minha empresa?',
  'Desenvolvimento de Web Apps & Sistemas modernos',
  'Gestão de Tráfego Pago e Performance (Meta/Google Ads)',
  'Como funciona a consultoria personalizada?',
]

const SUGESTOES_PASTORAL = [
  'Preciso de uma palavra de encorajamento e oração',
  'O que a Bíblia ensina para vencer a ansiedade?',
  'Como fortalecer meu casamento e família na fé?',
  'Gostaria de agendar um aconselhamento pastoral',
]

const MENSAGEM_BOAS_VINDAS_TECH: Mensagem = {
  id: 'welcome-tech',
  role: 'assistant',
  content: `Olá! Sou o **Assistente de IA & Consultoria** de Márcio Rolim.\n\nPosso te ajudar com **Agentes de IA, Automações (n8n/Make), Desenvolvimento Web e Tráfego Pago**.\n\nComo posso impulsionar seu projeto hoje?`,
  modo: 'tech',
}

const MENSAGEM_BOAS_VINDAS_PASTORAL: Mensagem = {
  id: 'welcome-pastoral',
  role: 'assistant',
  content: `A paz do Senhor! Sou o **Assistente IA Pastoral do Pr. Márcio Rolim**.\n\n> "O Senhor é o meu pastor; nada me faltará." — **Salmos 23:1**\n\nEstou aqui para oferecer acolhimento, orientação bíblica e oração. Como posso te abençoar hoje?`,
  modo: 'pastoral',
}

export function ChatWidget() {
  const pathname = usePathname()
  const [aberto, setAberto] = useState(false)
  const [modo, setModo] = useState<'tech' | 'pastoral'>('tech')
  const [historicoTech, setHistoricoTech] = useState<Mensagem[]>([MENSAGEM_BOAS_VINDAS_TECH])
  const [historicoPastoral, setHistoricoPastoral] = useState<Mensagem[]>([MENSAGEM_BOAS_VINDAS_PASTORAL])
  const [input, setInput] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [aguardandoSilencio, setAguardandoSilencio] = useState(false)
  const [notificacaoAtiva, setNotificacaoAtiva] = useState(true)
  const [sessaoId, setSessaoId] = useState<string>('')

  const fimMensagensRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const timerSilencioRef = useRef<NodeJS.Timeout | null>(null)

  const historicoTechRef = useRef(historicoTech)
  const historicoPastoralRef = useRef(historicoPastoral)

  useEffect(() => {
    historicoTechRef.current = historicoTech
  }, [historicoTech])

  useEffect(() => {
    historicoPastoralRef.current = historicoPastoral
  }, [historicoPastoral])

  // Mensagens ativas conforme a persona selecionada
  const mensagens = modo === 'pastoral' ? historicoPastoral : historicoTech

  // Carrega estado e memórias separadas de cada persona no cliente
  useEffect(() => {
    try {
      let sid = sessionStorage.getItem('mr_chat_session_id')
      if (!sid) {
        sid = crypto.randomUUID()
        sessionStorage.setItem('mr_chat_session_id', sid)
      }
      setSessaoId(sid)

      const modoSalvo = localStorage.getItem('mr_chat_mode') as 'tech' | 'pastoral' | null
      if (modoSalvo === 'tech' || modoSalvo === 'pastoral') {
        setModo(modoSalvo)
      }

      // Memória Tech
      const techSalvo = localStorage.getItem('mr_chat_history_tech') || localStorage.getItem('mr_chat_history')
      if (techSalvo) {
        const msgs = JSON.parse(techSalvo)
        if (Array.isArray(msgs) && msgs.length > 0) {
          setHistoricoTech(msgs)
        }
      }

      // Memória Pastoral
      const pastoralSalvo = localStorage.getItem('mr_chat_history_pastoral')
      if (pastoralSalvo) {
        const msgs = JSON.parse(pastoralSalvo)
        if (Array.isArray(msgs) && msgs.length > 0) {
          setHistoricoPastoral(msgs)
        }
      }
    } catch {
      // fallback padrão
    }
  }, [])

  // Persiste histórico Tech isolado
  useEffect(() => {
    if (historicoTech.length > 0) {
      try {
        localStorage.setItem('mr_chat_history_tech', JSON.stringify(historicoTech.slice(-20)))
      } catch {
        // ignora quota
      }
    }
  }, [historicoTech])

  // Persiste histórico Pastoral isolado
  useEffect(() => {
    if (historicoPastoral.length > 0) {
      try {
        localStorage.setItem('mr_chat_history_pastoral', JSON.stringify(historicoPastoral.slice(-20)))
      } catch {
        // ignora quota
      }
    }
  }, [historicoPastoral])

  // Rola para o fim das mensagens suavemente ao trocar de persona ou receber novos dados
  useEffect(() => {
    if (aberto) {
      fimMensagensRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [mensagens, modo, aberto, carregando, aguardandoSilencio])

  // Foco automático no input ao abrir
  useEffect(() => {
    if (aberto) {
      setTimeout(() => inputRef.current?.focus(), 150)
      setNotificacaoAtiva(false)
    }
  }, [aberto])

  const alternarModo = (novoModo: 'tech' | 'pastoral') => {
    if (novoModo === modo) return
    setModo(novoModo)
    try {
      localStorage.setItem('mr_chat_mode', novoModo)
    } catch {
      // ignora
    }
  }

  const limparHistorico = () => {
    if (timerSilencioRef.current) {
      clearTimeout(timerSilencioRef.current)
    }
    setAguardandoSilencio(false)
    setCarregando(false)

    if (modo === 'pastoral') {
      setHistoricoPastoral([MENSAGEM_BOAS_VINDAS_PASTORAL])
      try {
        localStorage.removeItem('mr_chat_history_pastoral')
      } catch {
        // ignora
      }
    } else {
      setHistoricoTech([MENSAGEM_BOAS_VINDAS_TECH])
      try {
        localStorage.removeItem('mr_chat_history_tech')
        localStorage.removeItem('mr_chat_history')
      } catch {
        // ignora
      }
    }
  }

  // Processa o histórico acumulado com a API da IA após a janela de silêncio
  const processarEnvioIA = async (modoEnvio: 'tech' | 'pastoral') => {
    setAguardandoSilencio(false)
    setCarregando(true)

    const historicoAtual =
      modoEnvio === 'pastoral' ? historicoPastoralRef.current : historicoTechRef.current

    const idAssistente = `assistant-${Date.now()}`
    let respostaAcumulada = ''
    let modoAtual = modoEnvio

    const atualizarMensagemAssistente = (
      conteudo: string,
      modoDestino: 'tech' | 'pastoral' = modoAtual,
    ) => {
      const updater = (prev: Mensagem[]) =>
        prev.map((msg) =>
          msg.id === idAssistente ? { ...msg, content: conteudo, modo: modoDestino } : msg,
        )
      if (modoDestino === 'pastoral') {
        setHistoricoPastoral(updater)
      } else {
        setHistoricoTech(updater)
      }
    }

    // Inicializa a mensagem de streaming na persona ativa
    const msgAssistenteInicial: Mensagem = {
      id: idAssistente,
      role: 'assistant',
      content: '',
      modo: modoEnvio,
      criadoEm: Date.now(),
    }

    if (modoEnvio === 'pastoral') {
      setHistoricoPastoral((prev) => [...prev, msgAssistenteInicial])
    } else {
      setHistoricoTech((prev) => [...prev, msgAssistenteInicial])
    }

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: historicoAtual.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          modo: modoEnvio,
          sessionId: sessaoId || undefined,
        }),
      })

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        throw new Error(errJson.erro || `Erro de conexão HTTP ${res.status}`)
      }

      if (!res.body) {
        throw new Error('Corpo de resposta vazio.')
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed || !trimmed.startsWith('data:')) continue

          const jsonStr = trimmed.replace(/^data:\s*/, '')
          if (jsonStr === '[DONE]') continue

          try {
            const parsed = JSON.parse(jsonStr)

            // Transferência dinâmica de atendimento entre personas
            if (parsed.transfer && (parsed.transfer === 'tech' || parsed.transfer === 'pastoral')) {
              const novoModo = parsed.transfer as 'tech' | 'pastoral'
              if (novoModo !== modoAtual) {
                setModo(novoModo)
                try {
                  localStorage.setItem('mr_chat_mode', novoModo)
                } catch {}

                // Move a resposta para o histórico da nova persona
                if (novoModo === 'pastoral') {
                  setHistoricoPastoral((prev) => {
                    const jaExiste = prev.some((m) => m.id === idAssistente)
                    if (!jaExiste) {
                      return [...prev, { ...msgAssistenteInicial, modo: 'pastoral' }]
                    }
                    return prev
                  })
                  setHistoricoTech((prev) => prev.filter((m) => m.id !== idAssistente))
                } else {
                  setHistoricoTech((prev) => {
                    const jaExiste = prev.some((m) => m.id === idAssistente)
                    if (!jaExiste) {
                      return [...prev, { ...msgAssistenteInicial, modo: 'tech' }]
                    }
                    return prev
                  })
                  setHistoricoPastoral((prev) => prev.filter((m) => m.id !== idAssistente))
                }

                modoAtual = novoModo
              }
            }

            if (parsed.text) {
              respostaAcumulada += parsed.text
              atualizarMensagemAssistente(respostaAcumulada, modoAtual)
            }
          } catch {
            // chunk parcial
          }
        }
      }
    } catch (err: any) {
      console.error('[Chat Widget Error]:', err)
      atualizarMensagemAssistente(
        `Desculpe, tive um momento de instabilidade na conexão. Por favor, tente novamente ou fale diretamente com Márcio Rolim no WhatsApp: https://wa.me/5511980888880`,
        modoAtual,
      )
    } finally {
      setCarregando(false)
    }
  }

  // Envia mensagem do usuário imediatamente para a tela e aguarda 5s de silêncio
  const enviarMensagem = (textoParaEnviar?: string) => {
    const texto = (textoParaEnviar ?? input).trim()
    if (!texto || carregando) return

    const modoEnvio = modo
    setInput('')

    const novaMensagemUsuario: Mensagem = {
      id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      role: 'user',
      content: texto,
      modo: modoEnvio,
      criadoEm: Date.now(),
    }

    if (modoEnvio === 'pastoral') {
      setHistoricoPastoral((prev) => [...prev, novaMensagemUsuario])
    } else {
      setHistoricoTech((prev) => [...prev, novaMensagemUsuario])
    }

    // Reinicia o timer de 5 segundos de silêncio
    if (timerSilencioRef.current) {
      clearTimeout(timerSilencioRef.current)
    }

    setAguardandoSilencio(true)

    timerSilencioRef.current = setTimeout(() => {
      processarEnvioIA(modoEnvio)
    }, 5000)
  }

  const notificarCliqueWhatsApp = () => {
    if (!sessaoId) return
    fetch('/api/chat/evento', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessaoId, evento: 'whatsapp_click' }),
    }).catch(() => {})
  }

  const sugestoes = modo === 'pastoral' ? SUGESTOES_PASTORAL : SUGESTOES_TECH

  if (pathname?.startsWith('/admin')) {
    return null
  }

  return (
    <aside aria-label="Atendimento por Inteligência Artificial">
      {/* ─── Botão Flutuante (Trigger) ─── */}
      <div className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-50 flex items-center group">
        {/* Tooltip elegante que aparece SOMENTE ao passar o mouse (Hover) */}
        {!aberto && (
          <div
            onClick={() => setAberto(true)}
            className="hidden md:flex items-center gap-2 mr-3 px-3 py-1.5 rounded-xl bg-white/95 dark:bg-slate-900/95 border border-stone-200/90 dark:border-slate-800/90 shadow-lg backdrop-blur-md cursor-pointer text-xs font-medium text-stone-700 dark:text-slate-200 opacity-0 -translate-x-2 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 group-hover:pointer-events-auto transition-all duration-200 whitespace-nowrap"
          >
            <SparklesIcon
              className={`w-3.5 h-3.5 ${
                modo === 'pastoral' ? 'text-amber-500' : 'text-emerald-500'
              }`}
            />
            <span>Fale com a IA de Márcio Rolim</span>
          </div>
        )}

        <button
          id="btn-abrir-chat-ia"
          onClick={() => setAberto(!aberto)}
          aria-label={aberto ? 'Fechar atendimento por IA' : 'Abrir atendimento por IA'}
          aria-expanded={aberto}
          className={`relative flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full text-white shadow-xl transition-all duration-200 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
            aberto
              ? modo === 'pastoral'
                ? 'bg-amber-500 hover:bg-amber-600 focus:ring-amber-400'
                : 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-400'
              : 'bg-white dark:bg-slate-900 ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-950 ' +
                (modo === 'pastoral'
                  ? 'ring-amber-500 focus:ring-amber-400 shadow-amber-500/20'
                  : 'ring-emerald-500 focus:ring-emerald-400 shadow-emerald-500/20')
          }`}
        >
          {/* Ícone de alternância */}
          <span className="relative flex items-center justify-center">
            {aberto ? (
              <CloseIcon className="w-5 h-5 transition-transform duration-200 rotate-90 group-hover:rotate-0 text-white" />
            ) : (
              <div className="relative">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full overflow-hidden">
                  <Image
                    src={MEDIA.profileImageUrl}
                    alt="Márcio Rolim"
                    width={44}
                    height={44}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span
                  className={`absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 ${
                    modo === 'pastoral' ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                />
              </div>
            )}
          </span>
        </button>
      </div>

      {/* ─── Painel do Chat (Modal / Drawer) ─── */}
      {aberto && (
        <div
          className="fixed bottom-24 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[430px] h-[580px] max-h-[82vh] rounded-3xl overflow-hidden flex flex-col bg-white/95 dark:bg-slate-900/95 border border-stone-200/90 dark:border-slate-800/90 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-6 duration-300"
          role="dialog"
          aria-modal="true"
          aria-label="Janela de atendimento por IA"
        >
          {/* ─── Topo / Cabeçalho ─── */}
          <div
            className={`p-4 border-b transition-colors duration-300 ${
              modo === 'pastoral'
                ? 'bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent border-amber-200/50 dark:border-amber-500/20'
                : 'bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent border-emerald-200/50 dark:border-emerald-500/20'
            }`}
          >
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10 rounded-full overflow-hidden ring-2 ring-white dark:ring-slate-800 shadow-md">
                  <Image
                    src={MEDIA.profileImageUrl}
                    alt={SITE.name}
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                  />
                  <span
                    className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border border-white dark:border-slate-900 ${
                      modo === 'pastoral' ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                  />
                </div>

                <div>
                  <h3 className="font-bold text-sm text-stone-900 dark:text-white flex items-center gap-1.5">
                    Márcio Rolim
                    <span
                      className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full ${
                        modo === 'pastoral'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300'
                      }`}
                    >
                      IA Online
                    </span>
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-slate-400">
                    {modo === 'pastoral'
                      ? 'Pastor & Conselheiro Espiritual'
                      : 'Consultor de Tecnologia & IA'}
                  </p>
                </div>
              </div>

              {/* Ações do cabeçalho */}
              <div className="flex items-center gap-1">
                <button
                  onClick={limparHistorico}
                  title="Limpar conversa"
                  className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-slate-200 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors text-xs"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
                <button
                  onClick={() => setAberto(false)}
                  title="Fechar chat"
                  className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-slate-200 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <CloseIcon className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* ─── Seletor de Personalidade (Segmented Control) ─── */}
            <div className="grid grid-cols-2 p-1 bg-stone-200/70 dark:bg-slate-800/80 rounded-xl text-xs font-semibold gap-1">
              <button
                type="button"
                onClick={() => alternarModo('tech')}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg transition-all ${
                  modo === 'tech'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white'
                }`}
              >
                <CodeIcon className="w-3.5 h-3.5" />
                Tecnologia & IA
              </button>

              <button
                type="button"
                onClick={() => alternarModo('pastoral')}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg transition-all ${
                  modo === 'pastoral'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white'
                }`}
              >
                <HeartIcon className="w-3.5 h-3.5" />
                Pastoral & Fé
              </button>
            </div>
          </div>

          {/* ─── Corpo de Mensagens com Scroll ─── */}
          <div className="flex-1 overflow-y-auto divide-y divide-stone-100 dark:divide-slate-800/40">
            <ChatMensagens
              mensagens={mensagens}
              carregando={carregando}
              aguardandoSilencio={aguardandoSilencio}
              modo={modo}
              onSelectSugestao={(s) => enviarMensagem(s)}
              onWhatsAppClick={notificarCliqueWhatsApp}
            />

            {/* ─── Chips de Sugestões de Perguntas Rápidas (Aparecem APENAS na tela inicial) ─── */}
            {!mensagens.some((m) => m.role === 'user') && mensagens.length <= 1 && (
              <div className="p-4 pt-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-400 dark:text-slate-500 mb-2.5 flex items-center gap-1">
                  <SparklesIcon className="w-3 h-3 text-amber-500" />
                  Sugestões de perguntas:
                </p>
                <div className="flex flex-col gap-1.5">
                  {sugestoes.map((sugestao, i) => (
                    <button
                      key={i}
                      type="button"
                      disabled={carregando}
                      onClick={() => enviarMensagem(sugestao)}
                      className={`text-left text-xs px-3 py-2 rounded-xl transition-all border ${
                        modo === 'pastoral'
                          ? 'bg-amber-50/70 dark:bg-amber-500/5 text-amber-900 dark:text-amber-200 border-amber-200/60 dark:border-amber-500/20 hover:bg-amber-100 dark:hover:bg-amber-500/10'
                          : 'bg-emerald-50/70 dark:bg-emerald-500/5 text-emerald-900 dark:text-emerald-200 border-emerald-200/60 dark:border-emerald-500/20 hover:bg-emerald-100 dark:hover:bg-emerald-500/10'
                      }`}
                    >
                      {sugestao}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div ref={fimMensagensRef} />
          </div>

          {/* ─── Rodapé do Input ─── */}
          <div className="p-3 bg-stone-50/80 dark:bg-slate-900/80 border-t border-stone-200/80 dark:border-slate-800/80">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                enviarMensagem()
              }}
              className="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  modo === 'pastoral'
                    ? 'Peça um conselho bíblico ou oração...'
                    : 'Pergunte sobre IA, projetos ou serviços...'
                }
                disabled={carregando}
                className="flex-1 bg-white dark:bg-slate-800 text-stone-900 dark:text-slate-100 text-xs sm:text-sm px-4 py-2.5 rounded-full border border-stone-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:focus:ring-emerald-500 placeholder-stone-400 dark:placeholder-slate-500"
              />

              <button
                type="submit"
                disabled={!input.trim() || carregando}
                aria-label="Enviar mensagem"
                className={`p-2.5 rounded-full text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md ${
                  modo === 'pastoral'
                    ? 'bg-amber-500 hover:bg-amber-400'
                    : 'bg-emerald-500 hover:bg-emerald-400'
                }`}
              >
                <svg className="w-4 h-4 transform rotate-90" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              </button>
            </form>

            <div className="mt-2 flex items-center justify-between px-1 text-[10px] text-stone-400 dark:text-slate-500">
              <span>Atendimento IA • Márcio Rolim</span>
              <a
                href="https://wa.me/5511980888880"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 font-medium"
              >
                <WhatsAppIcon className="w-3 h-3" />
                Falar no WhatsApp
              </a>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}
