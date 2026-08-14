'use client'

import React from 'react'
import Image from 'next/image'
import { MEDIA } from '@/content/site'
import { WhatsAppIcon, SparklesIcon } from '@/components/icons'

export type Mensagem = {
  id: string
  role: 'user' | 'assistant'
  content: string
  modo?: 'tech' | 'pastoral'
  criadoEm?: number
}

// ─── Formatador Simples e Seguro de Markdown ────────────────────────────────

function sanitizarConteudoMarkdown(texto: string): string {
  return texto
    // Normaliza citações embutidas no meio da frase para quebrarem linha corretamente
    .replace(/([:;\.\!\?])\s*>\s*/g, '$1\n\n> ')
    // Remove links inline de WhatsApp para evitar duplicar com o botão oficial de ação
    .replace(/\[([^\]]*whatsapp[^\]]*)\]\([^)]*\)/gi, '')
    .replace(/\[([^\]]*)\]\((https?:\/\/wa\.me\/[^)]+)\)/gi, '')
    .replace(/https?:\/\/wa\.me\/[0-9]+/gi, '')
    .replace(/:\s*$/gm, '.')
    .trim()
}

function renderizarCitacaoBiblica(textoCitacao: string, modo: 'tech' | 'pastoral', chave: number) {
  // Extrai a referência bíblica caso exista no final (ex: — Filipenses 4:6, - Salmos 23:1)
  const matchReferencia = textoCitacao.match(/\s+(?:—|-|–)\s+([A-Za-z0-9À-ÿ\s\:\*\_]+)$/)

  let versiculo = textoCitacao
  let referencia = ''

  if (matchReferencia && matchReferencia[1]) {
    referencia = matchReferencia[1].replace(/[\*_]/g, '').trim()
    versiculo = textoCitacao.slice(0, matchReferencia.index).trim()
  }

  // Remove aspas das pontas para o estilo de card
  const versiculoLimpo = versiculo.replace(/^["“]|["”]$/g, '').trim()

  return (
    <div
      key={`citacao-${chave}`}
      className={`my-3 p-3.5 rounded-2xl border-l-4 shadow-sm transition-all ${
        modo === 'pastoral'
          ? 'bg-amber-500/10 dark:bg-amber-500/15 border-amber-500 text-amber-950 dark:text-amber-100 ring-1 ring-amber-500/20'
          : 'bg-emerald-500/10 dark:bg-emerald-500/15 border-emerald-500 text-emerald-950 dark:text-emerald-100 ring-1 ring-emerald-500/20'
      }`}
    >
      <div className="flex items-start gap-2.5">
        <span
          className={`text-xl font-serif leading-none select-none ${
            modo === 'pastoral' ? 'text-amber-500' : 'text-emerald-500'
          }`}
        >
          “
        </span>
        <div className="flex-1 space-y-2">
          <p className="text-sm italic leading-relaxed font-medium">
            {renderizarFormatacoesLinha(versiculoLimpo, modo)}
          </p>
          {referencia && (
            <div className="flex justify-end items-center pt-1 border-t border-amber-500/20 dark:border-amber-500/10">
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-md tracking-wide not-italic ${
                  modo === 'pastoral'
                    ? 'bg-amber-200/80 text-amber-950 dark:bg-amber-500/25 dark:text-amber-200 border border-amber-400/40'
                    : 'bg-emerald-200/80 text-emerald-950 dark:bg-emerald-500/25 dark:text-emerald-200 border border-emerald-400/40'
                }`}
              >
                — {referencia}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function formatarMarkdown(texto: string, modo: 'tech' | 'pastoral'): React.ReactNode[] {
  // Sanitiza e remove menções brutas a números de telefone inventados
  const textoLimpo = sanitizarConteudoMarkdown(texto)
    .replace(/(você pode (enviar uma mensagem|ligar|falar|chamar) para o número:?\s*)?(\(?\d{2}\)?\s*9?\d{4,5}[-\s]?\d{4}\.?)/gi, '')
    .replace(/número:?\s*\(\d{2}\)\s*\d{4,5}-\d{4}\.?/gi, '')

  const linhas = textoLimpo.split('\n')
  const elementos: React.ReactNode[] = []
  let emCitacao = false
  let bufferCitacao: string[] = []

  const fecharCitacao = (chave: number) => {
    if (bufferCitacao.length > 0) {
      const citacaoTexto = bufferCitacao.join(' ')
      elementos.push(renderizarCitacaoBiblica(citacaoTexto, modo, chave))
      bufferCitacao = []
    }
    emCitacao = false
  }

  linhas.forEach((linha, idx) => {
    const trimmed = linha.trim()

    // Bloco de citação (ex: > "Versículo bíblico...")
    if (trimmed.startsWith('>')) {
      emCitacao = true
      bufferCitacao.push(trimmed.replace(/^>\s*/, ''))
      return
    }

    if (emCitacao) {
      fecharCitacao(idx)
    }

    if (!trimmed) {
      elementos.push(<div key={`espaco-${idx}`} className="h-1.5" />)
      return
    }

    // Linha divisória (--- ou ***)
    if (/^(\-{3,}|\*{3,})$/.test(trimmed)) {
      elementos.push(
        <hr key={`hr-${idx}`} className="my-2 border-stone-200 dark:border-slate-800" />,
      )
      return
    }

    // Cabeçalhos (#, ##, ###) convertidos para título limpo em negrito
    if (/^#{1,4}\s+/.test(trimmed)) {
      const headerTexto = trimmed.replace(/^#{1,4}\s+/, '')
      elementos.push(
        <p key={`h-${idx}`} className="font-bold text-sm text-stone-900 dark:text-white mt-2 mb-0.5">
          {renderizarFormatacoesLinha(headerTexto, modo)}
        </p>,
      )
      return
    }

    // Lista com bullets (* ou -)
    if (trimmed.startsWith('* ') || trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
      const itemTexto = trimmed.replace(/^([\*\-•])\s+/, '')
      elementos.push(
        <li key={`li-${idx}`} className="ml-4 list-disc text-sm leading-relaxed my-0.5">
          {renderizarFormatacoesLinha(itemTexto, modo)}
        </li>,
      )
      return
    }

    // Lista numerada (1., 2.)
    if (/^\d+\.\s+/.test(trimmed)) {
      const itemTexto = trimmed.replace(/^\d+\.\s+/, '')
      const numero = trimmed.match(/^(\d+)\./)?.[1]
      elementos.push(
        <div key={`ol-${idx}`} className="flex items-start gap-2 text-sm leading-relaxed my-0.5">
          <span
            className={`flex-shrink-0 font-bold text-xs px-1.5 py-0.5 rounded-full ${
              modo === 'pastoral'
                ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300'
                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300'
            }`}
          >
            {numero}
          </span>
          <div className="flex-1">{renderizarFormatacoesLinha(itemTexto, modo)}</div>
        </div>,
      )
      return
    }

    // Parágrafo padrão
    elementos.push(
      <p key={`p-${idx}`} className="text-sm leading-relaxed my-0.5">
        {renderizarFormatacoesLinha(linha, modo)}
      </p>,
    )
  })

  if (emCitacao) {
    fecharCitacao(linhas.length)
  }

  return elementos
}

// Suporta [label](url), **negrito** / __negrito__, *itálico* / _itálico_, `código` e URLs soltas
function renderizarFormatacoesLinha(texto: string, modo: 'tech' | 'pastoral'): React.ReactNode {
  // Captura markdown links, negrito, itálico, código e URLs
  const regex = /(\[.*?\]\(.*?\)|\*\*.*?\*\*|__.*?__|\*.*?\*|_.*?_|`.*?`|https?:\/\/[^\s\)]+)/g
  const partes = texto.split(regex)

  return partes.map((parte, i) => {
    if (!parte) return null

    // Markdown link: [Texto](url)
    const linkMatch = parte.match(/^\[(.*?)\]\((.*?)\)$/)
    if (linkMatch) {
      const rotulo = linkMatch[1]
      let url = linkMatch[2].trim()

      // Tratamento de URL malformada
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        if (
          url.toLowerCase().includes('whatsapp') ||
          rotulo.toLowerCase().includes('whatsapp') ||
          url.includes('98088') ||
          rotulo.includes('98088')
        ) {
          url = 'https://wa.me/5511980888880'
        } else {
          url = `https://${url}`
        }
      }

      const eWhatsApp =
        url.includes('wa.me') ||
        url.includes('whatsapp') ||
        rotulo.toLowerCase().includes('whatsapp')

      return (
        <a
          key={i}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-md transition-all ${
            modo === 'pastoral'
              ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 underline'
              : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 underline'
          }`}
        >
          {eWhatsApp && <WhatsAppIcon className="w-3.5 h-3.5 inline" />}
          {rotulo || 'Acessar Link'}
        </a>
      )
    }

    if (
      (parte.startsWith('**') && parte.endsWith('**')) ||
      (parte.startsWith('__') && parte.endsWith('__'))
    ) {
      return (
        <strong key={i} className="font-bold text-stone-950 dark:text-white not-italic">
          {parte.slice(2, -2)}
        </strong>
      )
    }

    if (
      (parte.startsWith('*') && parte.endsWith('*') && !parte.startsWith('**')) ||
      (parte.startsWith('_') && parte.endsWith('_') && !parte.startsWith('__'))
    ) {
      return (
        <span key={i} className="italic text-stone-800 dark:text-slate-200">
          {parte.slice(1, -1)}
        </span>
      )
    }

    if (parte.startsWith('`') && parte.endsWith('`')) {
      return (
        <code
          key={i}
          className="px-1.5 py-0.5 text-xs font-mono rounded bg-stone-100 dark:bg-slate-800 text-amber-700 dark:text-amber-400 border border-stone-200/60 dark:border-slate-700/60"
        >
          {parte.slice(1, -1)}
        </code>
      )
    }

    if (parte.startsWith('http://') || parte.startsWith('https://')) {
      const eWhatsApp = parte.includes('wa.me') || parte.includes('whatsapp')
      return (
        <a
          key={i}
          href={parte}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-md transition-all break-all ${
            modo === 'pastoral'
              ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 underline'
              : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 underline'
          }`}
        >
          {eWhatsApp && <WhatsAppIcon className="w-3.5 h-3.5 inline" />}
          {eWhatsApp ? 'Falar no WhatsApp' : parte}
        </a>
      )
    }

    return parte
  })
}

// ─── Componente Principal de Mensagens ───────────────────────────────────────

interface ChatMensagensProps {
  mensagens: Mensagem[]
  carregando: boolean
  aguardandoSilencio?: boolean
  modo: 'tech' | 'pastoral'
  onSelectSugestao?: (texto: string) => void
  onWhatsAppClick?: () => void
}

export function ChatMensagens({
  mensagens,
  carregando,
  aguardandoSilencio = false,
  modo,
  onSelectSugestao,
  onWhatsAppClick,
}: ChatMensagensProps) {
  const contemConviteWhatsApp = (texto: string) => {
    const t = texto.toLowerCase()
    return (
      t.includes('wa.me') ||
      t.includes('98088-8880') ||
      /\b(falar|chamar|conversar|agendar|atendimento|disposi[çc][ãa]o|contato|chame|fale)\s+(diretamente\s+)?(com\s+(o\s+)?(márcio|pr\.?\s*márcio|pastor)\s+)?(no|pelo|via)\s+whatsapp\b/i.test(t) ||
      /\b(no|pelo|via)\s+whatsapp\s+(para\s+)?(um\s+)?(diagnóstico|aconselhamento|orçamento|conversa)\b/i.test(t)
    )
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      {mensagens.map((msg) => {
        const eUsuario = msg.role === 'user'
        const modoMsg = msg.modo || modo
        const temCtaWhats = !eUsuario && contemConviteWhatsApp(msg.content)

        return (
          <div
            key={msg.id}
            className={`flex items-start gap-2.5 ${eUsuario ? 'justify-end' : 'justify-start'}`}
          >
            {/* Avatar do Assistente */}
            {!eUsuario && (
              <div className="relative flex-shrink-0 mt-0.5">
                <div
                  className={`w-7 h-7 rounded-full overflow-hidden ring-2 ${
                    modoMsg === 'pastoral'
                      ? 'ring-amber-400/60 dark:ring-amber-500/40'
                      : 'ring-emerald-400/60 dark:ring-emerald-500/40'
                  }`}
                >
                  <Image
                    src={MEDIA.profileImageUrl}
                    alt="Márcio Rolim"
                    width={28}
                    height={28}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span
                  className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-slate-900 ${
                    modoMsg === 'pastoral' ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                />
              </div>
            )}

            {/* Bolha da Mensagem */}
            {/* break-words + overflow-wrap:anywhere — sem isso uma URL longa
                colada pelo usuário transborda a bolha e o container de rolagem
                ganha barra HORIZONTAL. */}
            <div
              className={`max-w-[85%] sm:max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-sm transition-all break-words [overflow-wrap:anywhere] ${
                eUsuario
                  ? modoMsg === 'pastoral'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-tr-none'
                    : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-tr-none'
                  : 'bg-stone-100 text-stone-800 dark:bg-slate-800/90 dark:text-slate-100 border border-stone-200/70 dark:border-slate-700/60 rounded-tl-none'
              }`}
            >
              {eUsuario ? (
                <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
              ) : !msg.content ? (
                /* Indicador de Digitando dentro do próprio balão único da resposta */
                <div className="flex items-center gap-2 py-0.5 text-stone-500 dark:text-slate-400">
                  <div className="flex items-center gap-1">
                    <span
                      className={`w-2 h-2 rounded-full animate-bounce [animation-delay:-0.3s] ${
                        modoMsg === 'pastoral' ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                    />
                    <span
                      className={`w-2 h-2 rounded-full animate-bounce [animation-delay:-0.15s] ${
                        modoMsg === 'pastoral' ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                    />
                    <span
                      className={`w-2 h-2 rounded-full animate-bounce ${
                        modoMsg === 'pastoral' ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                    />
                  </div>
                  <span className="text-xs italic font-medium">
                    {modoMsg === 'pastoral' ? 'Pastor Márcio respondendo...' : 'Márcio digitando...'}
                  </span>
                </div>
              ) : (
                <div className="prose-sm dark:prose-invert">
                  {formatarMarkdown(msg.content, modoMsg)}

                  {/* Botão de Ação Rápida para WhatsApp se mencionado */}
                  {temCtaWhats && (
                    <div className="mt-3 pt-2.5 border-t border-stone-200 dark:border-slate-700">
                      <a
                        href="https://wa.me/5511980888880"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={onWhatsAppClick}
                        className={`inline-flex items-center gap-2 min-h-11 px-4 py-2 rounded-full text-xs font-semibold text-white transition-all shadow-md hover:scale-[1.02] ${
                          modoMsg === 'pastoral'
                            ? 'bg-amber-600 hover:bg-amber-500'
                            : 'bg-emerald-600 hover:bg-emerald-500'
                        }`}
                      >
                        <WhatsAppIcon className="w-4 h-4" />
                        Conversar com Márcio no WhatsApp
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )
      })}

      {/* Indicador de Silêncio / Agrupamento de Mensagens Picadas */}
      {aguardandoSilencio && (
        <div className="flex items-center gap-2 px-3 py-1.5 self-start rounded-full bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-slate-300 border border-stone-200/70 dark:border-slate-700/60 text-xs shadow-sm animate-pulse">
          <span
            className={`w-2 h-2 rounded-full animate-ping ${
              modo === 'pastoral' ? 'bg-amber-500' : 'bg-emerald-500'
            }`}
          />
          <span className="font-medium">Aguardando...</span>
        </div>
      )}
    </div>
  )
}
