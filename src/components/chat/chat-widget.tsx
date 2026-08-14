'use client'

import { useState, useEffect, useRef, useSyncExternalStore } from 'react'
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

/**
 * Espelho do breakpoint `sm:` do Tailwind.
 *
 * `(width < 40rem)` e não `(max-width: 639px)`: é a media query LITERAL que o
 * Tailwind 4 emite para `max-sm:`. Escrever igual garante que o JS e o CSS
 * virem no mesmo ponto mesmo se a fonte-raiz mudar.
 *
 * Fora do componente e com a MediaQueryList em cache: useSyncExternalStore
 * exige funções de identidade estável, senão reassina a cada render.
 */
const CONSULTA_MOBILE = '(width < 40rem)'
let mediaQueryMobile: MediaQueryList | null = null

function obterMediaQueryMobile(): MediaQueryList {
  if (!mediaQueryMobile) mediaQueryMobile = window.matchMedia(CONSULTA_MOBILE)
  return mediaQueryMobile
}

function assinarLargura(aoMudar: () => void) {
  const mq = obterMediaQueryMobile()
  mq.addEventListener('change', aoMudar)
  return () => mq.removeEventListener('change', aoMudar)
}

const lerLargura = () => obterMediaQueryMobile().matches

/** No servidor não existe viewport. `false` só evita o mismatch de hidratação —
 *  nada de layout depende disto (o layout é 100% CSS, com max-sm:/sm:). */
const lerLarguraNoServidor = () => false

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
  const [sessaoId, setSessaoId] = useState<string>('')

  /**
   * NÃO decide layout — isso é 100% CSS (`max-sm:`/`sm:`), correto já no
   * primeiro paint e durante uma rotação de tela. Serve só para saber se
   * devemos ancorar o painel ao visual viewport, que é problema exclusivo de
   * teclado virtual.
   */
  const ehMobile = useSyncExternalStore(assinarLargura, lerLargura, lerLarguraNoServidor)

  const inputRef = useRef<HTMLInputElement>(null)
  const timerSilencioRef = useRef<NodeJS.Timeout | null>(null)
  const painelRef = useRef<HTMLDivElement>(null)
  const listaRef = useRef<HTMLDivElement>(null)
  const fabRef = useRef<HTMLButtonElement>(null)
  const coladoNoFimRef = useRef(true)
  const jaAbriuRef = useRef(false)

  const historicoTechRef = useRef(historicoTech)
  const historicoPastoralRef = useRef(historicoPastoral)

  /**
   * A rota decide se o painel EXISTE, e os efeitos precisam saber disso.
   *
   * O widget vive no layout raiz e sobrevive à navegação de cliente. Se os
   * efeitos dependessem só de `aberto`, navegar para /admin com o chat aberto
   * desmontaria o painel sem rodar cleanup nenhum — a página inteira ficaria
   * `inert` para sempre e o listener de Escape continuaria vivo no painel
   * administrativo. `painelAberto` é o que muda de verdade nessa hora.
   */
  const rotaBloqueada = !!pathname && (pathname.startsWith('/admin') || pathname.startsWith('/auth'))
  const painelAberto = aberto && !rotaBloqueada

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

  /** Só rola sozinho se o usuário já estava no fim — senão, quem subiu para
   *  reler é puxado de volta a cada token do streaming. */
  const aoRolarLista = () => {
    const el = listaRef.current
    if (!el) return
    coladoNoFimRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80
  }

  useEffect(() => {
    coladoNoFimRef.current = true
  }, [modo, painelAberto])

  /**
   * scrollTop no container, e NUNCA scrollIntoView.
   *
   * `scrollIntoView` rola todos os ancestrais roláveis por definição — inclusive
   * o documento — e `html { scroll-behavior: smooth }` transforma isso em
   * animação. Como `mensagens` muda a cada token do streaming, a versão anterior
   * disparava dezenas de rolagens suaves por segundo arrastando a página inteira
   * atrás do painel. Em tela cheia isso sabotaria a própria contenção.
   */
  useEffect(() => {
    const el = listaRef.current
    if (!painelAberto || !el || !coladoNoFimRef.current) return
    el.scrollTop = el.scrollHeight
  }, [mensagens, modo, painelAberto, carregando, aguardandoSilencio])

  /**
   * Foco de entrada e devolução ao fechar.
   *
   * O critério aqui é `(pointer: fine)` — e não a largura — de propósito: em
   * aparelho de toque, focar o campo abriria o teclado por cima justamente dos
   * chips de sugestão e da mensagem de boas-vindas. Ali o foco vai para o painel,
   * o que faz o leitor de tela entrar no diálogo sem levantar teclado.
   */
  useEffect(() => {
    if (!painelAberto) {
      if (jaAbriuRef.current) fabRef.current?.focus()
      return
    }

    jaAbriuRef.current = true

    if (!window.matchMedia('(pointer: fine)').matches) {
      painelRef.current?.focus()
      return
    }

    const t = setTimeout(() => inputRef.current?.focus(), 150)
    return () => clearTimeout(t)
  }, [painelAberto])

  // Escape fecha — mesmo padrão do lightbox de vídeo do site.
  useEffect(() => {
    if (!painelAberto) return
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAberto(false)
    }
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [painelAberto])

  /**
   * `inert` em tudo que não é o chat — é ISTO que torna o `aria-modal` verdadeiro.
   *
   * Vale nas duas larguras porque o fundo agora fica escurecido e desfocado em
   * qualquer tela: deixar conteúdo borrado alcançável por Tab seria pior do que
   * no desenho anterior. Salvar e restaurar o valor anterior é obrigatório — o
   * container de sentinelas do analytics também é filho do <body> e não é nosso.
   */
  useEffect(() => {
    if (!painelAberto) return

    const meuAside = painelRef.current?.closest('aside')
    const irmaos = Array.from(document.body.children).filter(
      (n): n is HTMLElement => n instanceof HTMLElement && n !== meuAside,
    )
    const antes = irmaos.map((n) => n.inert)

    irmaos.forEach((n) => {
      n.inert = true
    })

    return () => {
      irmaos.forEach((n, i) => {
        n.inert = antes[i]
      })
    }
    // pathname nas deps: a navegação de cliente troca os filhos do <body> por
    // nós NOVOS, que nascem sem inert. Sem re-fotografar, o fundo escurecido
    // volta a ser alcançável por Tab e o aria-modal vira mentira de novo.
  }, [painelAberto, pathname])

  /**
   * Ancoragem ao visual viewport — a parte que faz o teclado do celular não
   * engolir o botão de enviar.
   *
   * Nenhuma unidade de CSS enxerga o teclado: vh, dvh, svh e lvh medem o LAYOUT
   * viewport, e o teclado só encolhe o VISUAL viewport. Daí as duas variáveis:
   *   --vvh encolhe o painel até a área livre acima do teclado (quem cede altura
   *         é a lista, porque o rodapé é shrink-0 — o composer sobe colado);
   *   --vvo re-ancora o painel `fixed`, que continuaria preso ao layout viewport
   *         e sumiria atrás do teclado quando o iOS rola o visual viewport.
   *
   * Escrevemos em custom property, não em style.height, para a cascata do
   * Tailwind continuar mandando: `sm:h-[580px]` sobrescreve no desktop sem o JS
   * precisar saber de breakpoint.
   */
  useEffect(() => {
    if (!painelAberto || !ehMobile) return

    const vv = window.visualViewport
    const el = painelRef.current
    if (!vv || !el) return

    let raf = 0

    const aplicar = () => {
      raf = 0

      // Com pinça ativa, o visual viewport vira a lupa do usuário: seguir isso
      // faria o painel encolher junto e brigar com o gesto.
      if (vv.scale > 1.01) {
        el.style.removeProperty('--vvh')
        el.style.removeProperty('--vvo')
        return
      }

      el.style.setProperty('--vvh', `${Math.round(vv.height)}px`)
      el.style.setProperty('--vvo', `${Math.round(vv.offsetTop)}px`)

      if (coladoNoFimRef.current && listaRef.current) {
        listaRef.current.scrollTop = listaRef.current.scrollHeight
      }
    }

    const agendar = () => {
      if (!raf) raf = requestAnimationFrame(aplicar)
    }

    aplicar()
    vv.addEventListener('resize', agendar)
    vv.addEventListener('scroll', agendar)

    return () => {
      if (raf) cancelAnimationFrame(raf)
      vv.removeEventListener('resize', agendar)
      vv.removeEventListener('scroll', agendar)
      el.style.removeProperty('--vvh')
      el.style.removeProperty('--vvo')
    }
  }, [painelAberto, ehMobile])

  // O timer de 5s sobrevivia ao desmonte e disparava fetch sobre estado morto.
  useEffect(
    () => () => {
      if (timerSilencioRef.current) clearTimeout(timerSilencioRef.current)
    },
    [],
  )

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

  // /auth junto de /admin: um painel de tela cheia cobriria o formulário de login.
  if (rotaBloqueada) {
    return null
  }

  return (
    <aside aria-label="Atendimento por Inteligência Artificial">
      {/* ─── Botão Flutuante (Trigger) ─── */}
      {/*
        z-[100]: o maior z-index do resto do site é 50, e até aqui o chat só
        vencia por ser o último filho do <body> — empate resolvido por ordem de
        DOM é frágil. Aberto no mobile ele some por CSS (`hidden`), porque em
        tela cheia ele ficaria flutuando sobre o próprio chat, duplicando a
        função do botão Fechar. `hidden` também o tira da ordem de tabulação.
      */}
      <div
        className={`fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-[100] items-center group ${
          painelAberto ? 'hidden sm:flex' : 'flex'
        }`}
      >
        {/* Tooltip elegante que aparece SOMENTE ao passar o mouse (Hover) */}
        {!aberto && (
          <div
            aria-hidden="true"
            className="hidden md:flex items-center gap-2 mr-3 px-3 py-1.5 rounded-xl bg-white/95 dark:bg-slate-900/95 border border-stone-200/90 dark:border-slate-800/90 shadow-lg backdrop-blur-md text-xs font-medium text-stone-700 dark:text-slate-200 opacity-0 -translate-x-2 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 whitespace-nowrap"
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
          ref={fabRef}
          id="btn-abrir-chat-ia"
          onClick={() => setAberto(!aberto)}
          aria-label={aberto ? 'Fechar atendimento por IA' : 'Abrir atendimento por IA'}
          aria-haspopup="dialog"
          aria-controls="painel-chat-ia"
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

      {/* ─── Fundo escurecido e desfocado ─── */}
      {/*
        Vale nas duas larguras: é o que dá destaque ao chat e apaga a confusão
        entre a conversa e a página. Mesmo tom e mesmo desfoque do backdrop do
        menu mobile (site-nav.tsx), para o site ter um vocabulário só.

        z-[95] fica ABAIXO do gatilho (100): no desktop o botão flutuante é o
        próprio "fechar" e precisa continuar clicável por cima do escurecido.
      */}
      {painelAberto && (
        <div
          aria-hidden="true"
          onClick={() => setAberto(false)}
          className="fixed inset-0 z-[95] bg-slate-950/60 backdrop-blur-sm animate-fade-in"
        />
      )}

      {/* ─── Painel do Chat ─── */}
      {painelAberto && (
        <div
          id="painel-chat-ia"
          ref={painelRef}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-label="Janela de atendimento por IA"
          /*
            Um elemento só, com a geometria inteira trocando no breakpoint:
            no mobile é tela cheia (inset-0 + altura do visual viewport), no
            desktop volta a ser exatamente o cartão de antes.

            Toda cor `dark:` escrita para o mobile precisa do par `sm:dark:` —
            o Tailwind emite as variantes `dark:` DEPOIS do bloco `sm:`, e como
            :where() soma especificidade zero, sem o par a cor do mobile venceria
            no cartão do desktop em tema escuro.
          */
          className="fixed z-[110] flex flex-col overflow-hidden overscroll-none focus:outline-none
                     inset-0 h-[var(--vvh,100dvh)] translate-y-[var(--vvo,0px)]
                     bg-white dark:bg-slate-900
                     max-sm:animate-slide-in-up
                     sm:inset-auto sm:right-6 sm:bottom-24 sm:translate-y-0
                     sm:w-[430px] sm:h-[580px] sm:max-h-[82dvh]
                     sm:rounded-3xl sm:border sm:border-stone-200/90 sm:dark:border-slate-800/90
                     sm:bg-white/95 sm:dark:bg-slate-900/95 sm:shadow-2xl sm:backdrop-blur-xl"
        >
          {/* ─── Topo / Cabeçalho ─── */}
          <div
            className={`shrink-0 p-4 max-sm:pt-[max(1rem,env(safe-area-inset-top))] max-sm:touch-none border-b transition-colors duration-300 ${
              modo === 'pastoral'
                ? 'bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent border-amber-200/50 dark:border-amber-500/20'
                : 'bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent border-emerald-200/50 dark:border-emerald-500/20'
            }`}
          >
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative shrink-0 w-10 h-10 rounded-full overflow-hidden ring-2 ring-white dark:ring-slate-800 shadow-md">
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

                <div className="min-w-0">
                  <h3 className="font-bold text-sm text-stone-900 dark:text-white flex items-center gap-1.5 min-w-0">
                    <span className="truncate">Márcio Rolim</span>
                    <span
                      className={`shrink-0 text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full ${
                        modo === 'pastoral'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300'
                      }`}
                    >
                      IA Online
                    </span>
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-slate-400 truncate">
                    {modo === 'pastoral'
                      ? 'Pastor & Conselheiro Espiritual'
                      : 'Consultor de Tecnologia & IA'}
                  </p>
                </div>
              </div>

              {/* Ações do cabeçalho — no mobile viram alvos de 44px, e afastados:
                  "Limpar" apaga a conversa sem confirmação e ficava a 4px de "Fechar". */}
              <div className="flex items-center gap-2 max-sm:gap-4 shrink-0">
                <button
                  type="button"
                  onClick={limparHistorico}
                  aria-label="Limpar conversa"
                  title="Limpar conversa"
                  className="grid place-items-center h-11 w-11 sm:h-7 sm:w-7 shrink-0 rounded-full text-stone-600 hover:text-stone-900 hover:bg-stone-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800 transition-colors"
                >
                  <svg
                    className="w-5 h-5 sm:w-4 sm:h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>

                {/* Fechar: no toque não existe hover, então ele tem fundo sólido
                    e 44px. No desktop volta a ser o ícone discreto de sempre. */}
                <button
                  type="button"
                  onClick={() => setAberto(false)}
                  aria-label="Fechar chat"
                  title="Fechar chat"
                  className="grid place-items-center h-11 w-11 sm:h-7 sm:w-7 shrink-0 rounded-full bg-stone-200 text-stone-800 dark:bg-slate-700 dark:text-slate-50 hover:bg-stone-300 dark:hover:bg-slate-600 active:scale-95 sm:bg-transparent sm:dark:bg-transparent sm:text-stone-500 sm:dark:text-slate-400 sm:hover:bg-stone-100 sm:dark:hover:bg-slate-800 transition-colors"
                >
                  <CloseIcon className="w-5 h-5 sm:w-4 sm:h-4" />
                </button>
              </div>
            </div>

            {/* ─── Seletor de Personalidade (Segmented Control) ─── */}
            <div className="grid grid-cols-2 p-1 bg-stone-200/70 dark:bg-slate-800/80 rounded-xl text-xs max-sm:text-sm font-semibold gap-1">
              <button
                type="button"
                onClick={() => alternarModo('tech')}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-2 min-h-11 sm:min-h-0 rounded-lg transition-all ${
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
                className={`flex items-center justify-center gap-1.5 py-1.5 px-2 min-h-11 sm:min-h-0 rounded-lg transition-all ${
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
          {/*
            min-h-0 é load-bearing: sem ele o min-height:auto do item flex impede
            a lista de encolher e o rodapé com o campo é empurrado para fora da
            tela em conversa longa. A altura fixa de antes mascarava isso.
          */}
          <div
            ref={listaRef}
            onScroll={aoRolarLista}
            className="flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-y touch-pinch-zoom [overflow-anchor:none] divide-y divide-stone-100 dark:divide-slate-800/40"
          >
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
                <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-500 dark:text-slate-400 mb-2.5 flex items-center gap-1">
                  <SparklesIcon className="w-3 h-3 text-amber-500" />
                  Sugestões de perguntas:
                </p>
                <div className="flex flex-col gap-1.5 max-sm:gap-2">
                  {sugestoes.map((sugestao, i) => (
                    <button
                      key={i}
                      type="button"
                      disabled={carregando}
                      onClick={() => enviarMensagem(sugestao)}
                      className={`flex items-center text-left text-xs max-sm:text-sm px-3 py-2 min-h-11 sm:min-h-0 rounded-xl transition-all border ${
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
          </div>

          {/* ─── Rodapé do Input ─── */}
          <div className="shrink-0 p-3 max-sm:pb-[max(0.75rem,env(safe-area-inset-bottom))] max-sm:touch-none bg-stone-50/80 dark:bg-slate-900/80 border-t border-stone-200/80 dark:border-slate-800/80">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                enviarMensagem()
              }}
              className="flex items-center gap-2"
            >
              {/*
                text-base no toque não é estética: abaixo de 16px o Safari do iOS
                amplia a página ao focar o campo e NÃO desfaz ao sair — num painel
                fixed de tela cheia isso deixa o conteúdo maior que a viewport e o
                botão Fechar fora de alcance. O critério é (pointer: fine) e não
                `sm:` porque o iPad também é ≥640px.

                Sem `disabled` aqui de propósito: campo desabilitado perde o foco a
                cada turno, e com o resto da página inerte o usuário ficaria preso
                fora do diálogo. `enviarMensagem` já ignora envio durante a resposta.
              */}
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
                enterKeyHint="send"
                autoComplete="off"
                autoCapitalize="sentences"
                className="flex-1 min-w-0 min-h-11 sm:min-h-0 bg-white dark:bg-slate-800 text-stone-900 dark:text-slate-100 text-base [@media(pointer:fine)]:text-sm px-4 py-2.5 rounded-full border border-stone-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:focus:ring-emerald-500 placeholder-stone-400 dark:placeholder-slate-500"
              />

              {/* Desabilitado vira cinza SÓLIDO, não 40% de opacidade: o botão
                  precisa continuar aparente. */}
              <button
                type="submit"
                disabled={!input.trim() || carregando}
                aria-label="Enviar mensagem"
                className={`grid place-items-center shrink-0 h-11 w-11 sm:h-9 sm:w-9 rounded-full text-white shadow-md transition active:scale-95 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-600 disabled:shadow-none dark:disabled:bg-slate-700 dark:disabled:text-slate-300 ${
                  modo === 'pastoral'
                    ? 'bg-amber-600 hover:bg-amber-500'
                    : 'bg-emerald-600 hover:bg-emerald-500'
                }`}
              >
                <svg
                  className="w-5 h-5 sm:w-4 sm:h-4 rotate-90"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              </button>
            </form>

            <div className="mt-2 flex items-center justify-between gap-2 px-1 text-[11px] text-stone-500 dark:text-slate-400">
              <span className="truncate">Atendimento IA • Márcio Rolim</span>
              <a
                href="https://wa.me/5511980888880"
                target="_blank"
                rel="noopener noreferrer"
                onClick={notificarCliqueWhatsApp}
                className="shrink-0 inline-flex items-center gap-1 min-h-11 sm:min-h-0 px-2 -mr-1 font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
              >
                <WhatsAppIcon className="w-4 h-4" />
                Falar no WhatsApp
              </a>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}
