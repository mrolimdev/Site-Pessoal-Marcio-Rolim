'use client'

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertTriangleIcon,
  BotIcon,
  MessageSquareIcon,
  SearchIcon,
  CheckIcon,
  CloseIcon,
  CodeIcon,
  HeartIcon,
  WhatsAppIcon,
  CalendarIcon,
  ClockIcon,
  CopyIcon,
  DownloadIcon,
  ExchangeIcon,
  RefreshCwIcon,
  StarIcon,
  TrashIcon,
  UserIcon,
} from '@/components/icons'
import { excluirAtendimentosIaAction } from '@/actions/chat-ia'
import type { ChatSessaoRow, ChatMensagemRow, EstatisticasChat } from '@/lib/chat/queries'

interface SessaoItem extends ChatSessaoRow {
  primeiraMensagem?: string
}

type PeriodoData = 'hoje' | 'ontem' | '3dias' | '7dias' | '15dias' | '30dias' | 'todos'
type FiltroModo = 'todos' | 'qualificados' | 'tech' | 'pastoral' | 'whatsapp' | 'transferencias'
type Ordenacao = 'recentes' | 'antigos' | 'mensagens'
type Tom = 'slate' | 'amber' | 'emerald' | 'blue'

interface IaDashboardClientProps {
  sessoesIniciais: SessaoItem[]
  estatisticas: EstatisticasChat
  sessaoSelecionadaInicial: {
    sessao: ChatSessaoRow
    mensagens: ChatMensagemRow[]
  } | null
}

const OPCOES_PERIODO: { id: PeriodoData; label: string }[] = [
  { id: 'hoje', label: 'Hoje' },
  { id: 'ontem', label: 'Ontem' },
  { id: '3dias', label: '3 dias' },
  { id: '7dias', label: '7 dias' },
  { id: '15dias', label: '15 dias' },
  { id: '30dias', label: '30 dias' },
  { id: 'todos', label: 'Todos' },
]

const ROTULO_FILTRO: Record<FiltroModo, string> = {
  todos: 'Todos os atendimentos',
  qualificados: 'Leads qualificados',
  tech: 'Tecnologia & IA',
  pastoral: 'Pastoral & Fé',
  whatsapp: 'Clicaram no WhatsApp',
  transferencias: 'Houve transferência',
}

/**
 * Paleta por tom. Fica em um mapa (e não interpolada na className) porque o
 * Tailwind varre o código como texto: `bg-${cor}-500` nunca é gerado no CSS.
 */
const TONS: Record<Tom, { icone: string; selecionado: string; sufixo: string }> = {
  slate: {
    icone: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
    selecionado: 'border-slate-400 ring-slate-400/30 dark:border-slate-500',
    sufixo: 'text-slate-500 dark:text-slate-400',
  },
  amber: {
    icone: 'bg-amber-500 text-white',
    selecionado: 'border-amber-500 ring-amber-500/30',
    sufixo: 'text-amber-600 dark:text-amber-400',
  },
  emerald: {
    icone: 'bg-emerald-500 text-white',
    selecionado: 'border-emerald-500 ring-emerald-500/30',
    sufixo: 'text-emerald-600 dark:text-emerald-400',
  },
  blue: {
    icone: 'bg-blue-500 text-white',
    selecionado: 'border-blue-500 ring-blue-500/30',
    sufixo: 'text-blue-600 dark:text-blue-400',
  },
}

// ─── Formatadores ────────────────────────────────────────────────────────────

const HORA_CURTA = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' })
const DATA_CURTA = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
})
const DATA_COMPLETA = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' })

function formatarDataRelativa(iso: string) {
  const data = new Date(iso)
  if (isNaN(data.getTime())) return '—'

  const agora = new Date()
  const diffMin = Math.floor((agora.getTime() - data.getTime()) / 60000)

  if (diffMin < 1) return 'Agora'
  if (diffMin < 60) return `${diffMin} min`
  if (data.toDateString() === agora.toDateString()) return HORA_CURTA.format(data)

  const ontem = new Date(agora)
  ontem.setDate(agora.getDate() - 1)
  if (data.toDateString() === ontem.toDateString()) return `Ontem ${HORA_CURTA.format(data)}`

  return DATA_CURTA.format(data)
}

function formatarDataCompleta(iso: string) {
  const data = new Date(iso)
  return isNaN(data.getTime()) ? '—' : DATA_COMPLETA.format(data)
}

function extrairLinkContato(contato?: string | null) {
  if (!contato) return null
  if (contato.includes('@')) return `mailto:${contato.trim()}`

  const numeros = contato.replace(/\D/g, '')
  if (numeros.length >= 8) {
    const ddi = numeros.startsWith('55') ? '' : '55'
    return `https://wa.me/${ddi}${numeros}`
  }
  return null
}

async function copiarParaAreaTransferencia(texto: string) {
  try {
    await navigator.clipboard.writeText(texto)
    return true
  } catch {
    return false
  }
}

// ─── Componente principal ────────────────────────────────────────────────────

export function IaDashboardClient({
  sessoesIniciais,
  estatisticas,
  sessaoSelecionadaInicial,
}: IaDashboardClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Ids já excluídos que ainda podem estar no payload do servidor. Some da tela
  // no mesmo instante do clique; quando o revalidatePath da action chega, a prop
  // já não os traz e este filtro vira inócuo.
  const [idsRemovidos, setIdsRemovidos] = useState<ReadonlySet<string>>(() => new Set())

  // Sem cópia em useState: um estado inicializado pela prop congela na primeira
  // renderização e o botão "Atualizar" (router.refresh) traria dados novos do
  // servidor que a tela nunca mostraria.
  const sessoes = useMemo(
    () =>
      idsRemovidos.size === 0
        ? sessoesIniciais
        : sessoesIniciais.filter((s) => !idsRemovidos.has(s.id)),
    [sessoesIniciais, idsRemovidos],
  )

  const [periodo, setPeriodo] = useState<PeriodoData>('7dias')
  const [filtroModo, setFiltroModo] = useState<FiltroModo>('todos')
  const [ordenacao, setOrdenacao] = useState<Ordenacao>('recentes')
  const [termoBusca, setTermoBusca] = useState('')
  const [idSessaoAtiva, setIdSessaoAtiva] = useState<string | null>(
    sessaoSelecionadaInicial?.sessao.id || sessoesIniciais[0]?.id || null,
  )
  const [mensagensCarregadas, setMensagensCarregadas] = useState<Record<string, ChatMensagemRow[]>>(
    () =>
      sessaoSelecionadaInicial
        ? { [sessaoSelecionadaInicial.sessao.id]: sessaoSelecionadaInicial.mensagens }
        : {},
  )
  const [carregandoId, setCarregandoId] = useState<string | null>(null)
  // Guarda o id que falhou, não só a mensagem: um erro em uma conversa não pode
  // aparecer no painel de outra.
  const [erroId, setErroId] = useState<string | null>(null)
  const [copiado, setCopiado] = useState<'texto' | 'json' | 'id' | null>(null)

  // ─── Seleção e exclusão em lote ────────────────────────────────────────────
  const [selecionados, setSelecionados] = useState<ReadonlySet<string>>(() => new Set())
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false)
  const [excluindo, setExcluindo] = useState(false)
  const [erroExclusao, setErroExclusao] = useState<string | null>(null)

  const painelRef = useRef<HTMLDivElement>(null)
  const timelineRef = useRef<HTMLDivElement>(null)
  // Contador de requisição: a resposta de um clique antigo não pode sobrescrever
  // a de um clique novo quando o usuário percorre a lista rápido.
  const requisicaoRef = useRef(0)

  // ─── 1. Recorte por período ────────────────────────────────────────────────
  const sessoesPorData = useMemo(() => {
    if (periodo === 'todos') return sessoes

    const agora = new Date()

    return sessoes.filter((s) => {
      const dataSessao = new Date(s.created_at || s.updated_at)
      if (isNaN(dataSessao.getTime())) return true

      if (periodo === 'hoje') {
        const inicioHoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate())
        return dataSessao >= inicioHoje
      }

      if (periodo === 'ontem') {
        const inicioOntem = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() - 1)
        const fimOntem = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate(), 0, 0, 0, -1)
        return dataSessao >= inicioOntem && dataSessao <= fimOntem
      }

      const dias = periodo === '3dias' ? 3 : periodo === '7dias' ? 7 : periodo === '15dias' ? 15 : 30
      return dataSessao >= new Date(agora.getTime() - dias * 24 * 60 * 60 * 1000)
    })
  }, [sessoes, periodo])

  // ─── 2. Métricas do recorte ────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const total = sessoesPorData.length
    const totalMsgs = sessoesPorData.reduce((acc, s) => acc + (s.total_mensagens || 0), 0)
    const tech = sessoesPorData.filter((s) => s.modo_atual === 'tech').length
    const pastoral = sessoesPorData.filter((s) => s.modo_atual === 'pastoral').length
    const leads = sessoesPorData.filter((s) => s.qualificado).length
    const whatsapp = sessoesPorData.filter((s) => s.clicou_whatsapp).length
    const transferencias = sessoesPorData.filter((s) => s.houve_transferencia).length
    const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0)

    return {
      total,
      totalMsgs,
      tech,
      pastoral,
      leads,
      whatsapp,
      transferencias,
      pctLeads: pct(leads),
      pctWhatsapp: pct(whatsapp),
      pctTech: pct(tech),
      pctPastoral: pct(pastoral),
      pctTransferencias: pct(transferencias),
      mediaMsgs: total > 0 ? (totalMsgs / total).toFixed(1) : '0',
    }
  }, [sessoesPorData])

  // ─── 3. Filtro, busca e ordenação ──────────────────────────────────────────
  const sessoesFiltradas = useMemo(() => {
    const termo = termoBusca.trim().toLowerCase()

    const lista = sessoesPorData.filter((s) => {
      if (filtroModo === 'qualificados' && !s.qualificado) return false
      if (filtroModo === 'tech' && s.modo_atual !== 'tech') return false
      if (filtroModo === 'pastoral' && s.modo_atual !== 'pastoral') return false
      if (filtroModo === 'whatsapp' && !s.clicou_whatsapp) return false
      if (filtroModo === 'transferencias' && !s.houve_transferencia) return false

      if (termo) {
        const alvos = [s.id, s.nome_lead, s.contato_lead, s.resumo_conversa, s.primeiraMensagem]
        if (!alvos.some((campo) => (campo || '').toLowerCase().includes(termo))) return false
      }

      return true
    })

    const quando = (s: SessaoItem) => new Date(s.updated_at || s.created_at).getTime() || 0

    return [...lista].sort((a, b) => {
      if (ordenacao === 'antigos') return quando(a) - quando(b)
      if (ordenacao === 'mensagens') return (b.total_mensagens || 0) - (a.total_mensagens || 0)
      return quando(b) - quando(a)
    })
  }, [sessoesPorData, filtroModo, termoBusca, ordenacao])

  const sessaoAtiva = useMemo(() => {
    if (idSessaoAtiva) {
      const encontrada = sessoes.find((s) => s.id === idSessaoAtiva)
      if (encontrada) return encontrada
    }
    return sessoesFiltradas[0] || null
  }, [sessoes, sessoesFiltradas, idSessaoAtiva])

  const mensagensAtivas = sessaoAtiva ? mensagensCarregadas[sessaoAtiva.id] || [] : []
  const carregando = !!sessaoAtiva && carregandoId === sessaoAtiva.id
  const falhou = !!sessaoAtiva && erroId === sessaoAtiva.id
  // "Sem mensagens" e "ainda não busquei as mensagens" são estados diferentes e
  // a tela precisa dizer qual dos dois é.
  const historicoEmCache = !!sessaoAtiva && sessaoAtiva.id in mensagensCarregadas
  const foraDoFiltro =
    !!sessaoAtiva && sessoesFiltradas.length > 0 && !sessoesFiltradas.some((s) => s.id === sessaoAtiva.id)

  // ─── Carregamento de mensagens ─────────────────────────────────────────────
  const carregarMensagens = useCallback(async (sessaoId: string, forcar = false) => {
    if (!forcar && mensagensCarregadas[sessaoId]) return

    const requisicao = ++requisicaoRef.current
    setCarregandoId(sessaoId)
    setErroId(null)

    try {
      const res = await fetch(`/api/admin/chat-sessao?id=${encodeURIComponent(sessaoId)}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const dados = await res.json()
      if (requisicao !== requisicaoRef.current) return // resposta obsoleta

      setMensagensCarregadas((prev) => ({ ...prev, [sessaoId]: dados?.mensagens || [] }))
    } catch (err) {
      if (requisicao !== requisicaoRef.current) return
      console.error('Erro ao carregar mensagens:', err)
      setErroId(sessaoId)
    } finally {
      if (requisicao === requisicaoRef.current) setCarregandoId(null)
    }
    // mensagensCarregadas entra na dependência só para o curto-circuito do cache
  }, [mensagensCarregadas])

  const selecionarSessao = (sessaoId: string) => {
    setIdSessaoAtiva(sessaoId)
    void carregarMensagens(sessaoId)

    // No celular as colunas viram pilha e o painel fica abaixo da lista: sem
    // isso o clique parece não ter feito nada.
    if (window.matchMedia('(max-width: 1023px)').matches) {
      painelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  // Trocou de conversa: a timeline volta ao topo, senão a nova abre no meio.
  useEffect(() => {
    timelineRef.current?.scrollTo({ top: 0 })
  }, [idSessaoAtiva])

  /**
   * "Atualizar" busca de novo TUDO: as sessões (via refresh do servidor) e o
   * histórico da conversa aberta. Só invalidar o cache não bastaria — nada
   * dispararia a releitura e o painel ficaria vazio até o próximo clique.
   */
  const recarregarDados = () => {
    requisicaoRef.current++ // invalida respostas ainda em voo
    const idAberto = sessaoAtiva?.id
    setMensagensCarregadas({})
    if (idAberto) void carregarMensagens(idAberto, true)
    startTransition(() => router.refresh())
  }

  /**
   * Seleção efetiva = marcados ∩ visíveis. Marcar itens, mudar o filtro e
   * apagar não pode levar junto conversas que sumiram da tela: em operação
   * destrutiva, o que se apaga é exatamente o que se vê.
   */
  const idsSelecionados = useMemo(
    () => sessoesFiltradas.filter((s) => selecionados.has(s.id)).map((s) => s.id),
    [sessoesFiltradas, selecionados],
  )

  const sessoesSelecionadas = useMemo(
    () => sessoesFiltradas.filter((s) => selecionados.has(s.id)),
    [sessoesFiltradas, selecionados],
  )

  const todasMarcadas = sessoesFiltradas.length > 0 && idsSelecionados.length === sessoesFiltradas.length

  const alternarSelecao = (sessaoId: string) => {
    setSelecionados((prev) => {
      const proximo = new Set(prev)
      if (proximo.has(sessaoId)) proximo.delete(sessaoId)
      else proximo.add(sessaoId)
      return proximo
    })
  }

  const alternarTodas = () => {
    setSelecionados(todasMarcadas ? new Set() : new Set(sessoesFiltradas.map((s) => s.id)))
  }

  const abrirConfirmacao = () => {
    if (idsSelecionados.length === 0) return
    setErroExclusao(null)
    setConfirmandoExclusao(true)
  }

  const fecharConfirmacao = () => {
    if (excluindo) return // não some no meio da requisição
    setConfirmandoExclusao(false)
    setErroExclusao(null)
  }

  const excluirSelecionados = async () => {
    const ids = idsSelecionados
    if (ids.length === 0) return

    setExcluindo(true)
    setErroExclusao(null)

    const resposta = await excluirAtendimentosIaAction({ ids })

    setExcluindo(false)

    if (!resposta.ok) {
      setErroExclusao(resposta.erro || 'Não foi possível excluir os atendimentos.')
      return
    }

    const apagados = new Set(ids)

    setIdsRemovidos((prev) => new Set([...prev, ...ids]))
    setSelecionados(new Set())
    setMensagensCarregadas((prev) => {
      const copia = { ...prev }
      ids.forEach((id) => delete copia[id])
      return copia
    })
    setConfirmandoExclusao(false)

    // Apagou a conversa aberta: abre a próxima que sobrou, senão o painel fica
    // exibindo algo que não existe mais.
    if (idSessaoAtiva && apagados.has(idSessaoAtiva)) {
      const proxima = sessoesFiltradas.find((s) => !apagados.has(s.id)) || null
      setIdSessaoAtiva(proxima?.id ?? null)
      if (proxima) void carregarMensagens(proxima.id)
    }
  }

  const sinalizarCopia = (tipo: 'texto' | 'json' | 'id') => {
    setCopiado(tipo)
    setTimeout(() => setCopiado(null), 2000)
  }

  const copiarConversaJson = async () => {
    if (!sessaoAtiva) return
    const ok = await copiarParaAreaTransferencia(
      JSON.stringify({ sessao: sessaoAtiva, mensagens: mensagensAtivas }, null, 2),
    )
    if (ok) sinalizarCopia('json')
  }

  const copiarTranscricaoTexto = async () => {
    if (!sessaoAtiva) return

    const cabecalho = [
      `=== ATENDIMENTO IA (ID: ${sessaoAtiva.id}) ===`,
      `Data: ${formatarDataCompleta(sessaoAtiva.created_at)}`,
      `Modo: ${sessaoAtiva.modo_atual === 'pastoral' ? 'Pastoral & Fé' : 'Tecnologia & IA'}`,
      sessaoAtiva.nome_lead ? `Lead: ${sessaoAtiva.nome_lead}` : null,
      sessaoAtiva.contato_lead ? `Contato: ${sessaoAtiva.contato_lead}` : null,
      sessaoAtiva.resumo_conversa ? `Resumo: ${sessaoAtiva.resumo_conversa}` : null,
      `WhatsApp clicado: ${sessaoAtiva.clicou_whatsapp ? 'Sim' : 'Não'}`,
      '----------------------------------------\n',
    ].filter(Boolean)

    const corpo = mensagensAtivas.map(
      (m) =>
        `[${m.role === 'user' ? 'VISITANTE' : 'IA'}] ${HORA_CURTA.format(new Date(m.created_at))}:\n${m.content}\n`,
    )

    const ok = await copiarParaAreaTransferencia([...cabecalho, ...corpo].join('\n'))
    if (ok) sinalizarCopia('texto')
  }

  const copiarId = async () => {
    if (!sessaoAtiva) return
    if (await copiarParaAreaTransferencia(sessaoAtiva.id)) sinalizarCopia('id')
  }

  const exportarCsvPeriodo = () => {
    if (sessoesPorData.length === 0) return

    const colunas = [
      'ID',
      'Data',
      'Modo',
      'Qualificado',
      'Nome Lead',
      'Contato Lead',
      'WhatsApp Clicado',
      'Transferido',
      'Total Mensagens',
      'Resumo do Atendimento',
    ]

    const celula = (valor: string | number) => `"${String(valor).replace(/"/g, '""')}"`

    const linhas = sessoesPorData.map((s) =>
      [
        celula(s.id),
        celula(formatarDataCompleta(s.created_at)),
        celula(s.modo_atual),
        celula(s.qualificado ? 'Sim' : 'Não'),
        celula(s.nome_lead || ''),
        celula(s.contato_lead || ''),
        celula(s.clicou_whatsapp ? 'Sim' : 'Não'),
        celula(s.houve_transferencia ? 'Sim' : 'Não'),
        s.total_mensagens || 0,
        celula(s.resumo_conversa || s.primeiraMensagem || ''),
      ].join(','),
    )

    // BOM na frente: sem ele o Excel abre os acentos quebrados.
    const csv = '﻿' + [colunas.join(','), ...linhas].join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `atendimentos-ia-${periodo}-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const filtrosAtivos = filtroModo !== 'todos' || termoBusca.trim().length > 0

  return (
    <div className="flex flex-col gap-5">
      {/* ─── Barra de período e ações ─── */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/90 bg-white p-3 shadow-sm lg:flex-row lg:items-center lg:justify-between dark:border-slate-800 dark:bg-slate-900">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="hidden shrink-0 items-center gap-1.5 text-xs font-semibold text-slate-500 sm:flex dark:text-slate-400">
            <CalendarIcon className="size-4 shrink-0 text-amber-500" />
            Período
          </span>

          <div
            role="group"
            aria-label="Período de análise"
            className="scrollbar-hide flex min-w-0 items-center gap-1 overflow-x-auto rounded-xl bg-slate-100/90 p-1 dark:bg-slate-800/80"
          >
            {OPCOES_PERIODO.map((op) => {
              const ativo = periodo === op.id
              return (
                <button
                  key={op.id}
                  type="button"
                  onClick={() => setPeriodo(op.id)}
                  aria-pressed={ativo}
                  className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors ${
                    ativo
                      ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  {op.label}
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={exportarCsvPeriodo}
            disabled={sessoesPorData.length === 0}
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-200 disabled:opacity-50 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            title="Exportar os atendimentos do período em CSV"
          >
            <DownloadIcon className="size-3.5 shrink-0" />
            <span className="hidden sm:inline">Exportar CSV</span>
          </button>

          <button
            type="button"
            onClick={recarregarDados}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-amber-600 active:scale-95 disabled:opacity-75"
            title="Buscar os atendimentos mais recentes"
          >
            <RefreshCwIcon className={`size-3.5 shrink-0 ${isPending ? 'animate-spin' : ''}`} />
            <span>{isPending ? 'Atualizando…' : 'Atualizar'}</span>
          </button>
        </div>
      </div>

      {/* ─── Cards KPI: cada um é também o filtro daquela métrica ─── */}
      <section aria-label="Indicadores do período">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
          <CartaoKpi
            rotulo="Atendimentos"
            valor={kpis.total}
            detalhe={`${kpis.totalMsgs} msgs · ${kpis.mediaMsgs} por conversa`}
            Icone={MessageSquareIcon}
            tom="slate"
            ativo={filtroModo === 'todos'}
            aoSelecionar={() => setFiltroModo('todos')}
          />
          <CartaoKpi
            rotulo="Leads qualificados"
            valor={kpis.leads}
            sufixo={`${kpis.pctLeads}%`}
            detalhe="Nome ou contato obtido"
            Icone={StarIcon}
            tom="amber"
            destacado
            ativo={filtroModo === 'qualificados'}
            aoSelecionar={() => setFiltroModo('qualificados')}
          />
          <CartaoKpi
            rotulo="Tecnologia & IA"
            valor={kpis.tech}
            sufixo={`${kpis.pctTech}%`}
            detalhe="Consultoria e projetos"
            Icone={CodeIcon}
            tom="emerald"
            ativo={filtroModo === 'tech'}
            aoSelecionar={() => setFiltroModo('tech')}
          />
          <CartaoKpi
            rotulo="Pastoral & Fé"
            valor={kpis.pastoral}
            sufixo={`${kpis.pctPastoral}%`}
            detalhe="Aconselhamento e oração"
            Icone={HeartIcon}
            tom="amber"
            ativo={filtroModo === 'pastoral'}
            aoSelecionar={() => setFiltroModo('pastoral')}
          />
          <CartaoKpi
            rotulo="WhatsApp"
            valor={kpis.whatsapp}
            sufixo={`${kpis.pctWhatsapp}%`}
            detalhe="Conversão direta"
            Icone={WhatsAppIcon}
            tom="emerald"
            ativo={filtroModo === 'whatsapp'}
            aoSelecionar={() => setFiltroModo('whatsapp')}
          />
          <CartaoKpi
            rotulo="Transferências"
            valor={kpis.transferencias}
            sufixo={`${kpis.pctTransferencias}%`}
            detalhe="Troca de persona na conversa"
            Icone={ExchangeIcon}
            tom="blue"
            ativo={filtroModo === 'transferencias'}
            aoSelecionar={() => setFiltroModo('transferencias')}
          />
        </div>
      </section>

      {/* ─── Lista + painel de depuração ─── */}
      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-12">
        {/* Coluna esquerda: conversas do recorte */}
        <div className="flex flex-col gap-3 lg:col-span-5 lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)]">
          <div className="flex flex-col gap-2.5 rounded-2xl border border-slate-200/90 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={termoBusca}
                onChange={(e) => setTermoBusca(e.target.value)}
                placeholder="Buscar por nome, contato ou texto…"
                aria-label="Buscar atendimentos"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pr-9 pl-9 text-xs text-slate-900 placeholder-slate-400 transition-colors focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 focus:outline-none dark:border-slate-700 dark:bg-slate-800/80 dark:text-white"
              />
              {termoBusca && (
                <button
                  type="button"
                  onClick={() => setTermoBusca('')}
                  aria-label="Limpar busca"
                  className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-white"
                >
                  <CloseIcon className="size-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center justify-between gap-2">
              {/* Sem <label> em volta do texto: a contagem é informação, e
                  clicar nela para ler não pode marcar a lista inteira. */}
              <div className="flex min-w-0 items-center gap-2 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                <CaixaSelecao
                  marcada={todasMarcadas}
                  parcial={idsSelecionados.length > 0 && !todasMarcadas}
                  onChange={alternarTodas}
                  disabled={sessoesFiltradas.length === 0}
                  rotulo="Selecionar todas as conversas da lista"
                />
                <span className="min-w-0 truncate">
                  <span className="font-bold text-slate-900 dark:text-white">
                    {sessoesFiltradas.length}
                  </span>{' '}
                  {sessoesFiltradas.length === 1 ? 'conversa' : 'conversas'} ·{' '}
                  {ROTULO_FILTRO[filtroModo]}
                </span>
              </div>

              <div className="flex shrink-0 items-center gap-1.5">
                {filtrosAtivos && (
                  <button
                    type="button"
                    onClick={() => {
                      setFiltroModo('todos')
                      setTermoBusca('')
                    }}
                    className="rounded-lg px-2 py-1 text-[11px] font-semibold text-amber-600 transition-colors hover:bg-amber-500/10 dark:text-amber-400"
                  >
                    Limpar
                  </button>
                )}

                <label className="sr-only" htmlFor="ordenacao-sessoes">
                  Ordenar conversas
                </label>
                <select
                  id="ordenacao-sessoes"
                  value={ordenacao}
                  onChange={(e) => setOrdenacao(e.target.value as Ordenacao)}
                  className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-600 transition-colors hover:border-slate-300 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                >
                  <option value="recentes">Mais recentes</option>
                  <option value="antigos">Mais antigas</option>
                  <option value="mensagens">Mais mensagens</option>
                </select>
              </div>
            </div>

            {/* Barra de lote: só existe quando há algo marcado, para não ficar
                um botão de apagar permanentemente à espreita na tela. */}
            {idsSelecionados.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-amber-500/10 px-2.5 py-2 dark:bg-amber-500/15">
                <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300">
                  {idsSelecionados.length}{' '}
                  {idsSelecionados.length === 1 ? 'selecionada' : 'selecionadas'}
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSelecionados(new Set())}
                    className="rounded-lg px-2 py-1 text-[11px] font-semibold text-slate-600 transition-colors hover:bg-white/60 dark:text-slate-300 dark:hover:bg-slate-800/60"
                  >
                    Desmarcar
                  </button>

                  <button
                    type="button"
                    onClick={abrirConfirmacao}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-2.5 py-1.5 text-[11px] font-bold text-white transition-colors hover:bg-rose-700 active:scale-95"
                  >
                    <TrashIcon className="size-3.5 shrink-0" />
                    Apagar ({idsSelecionados.length})
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex min-h-0 flex-col gap-2.5 overflow-y-auto pr-1 max-lg:max-h-[560px]">
            {sessoesFiltradas.length === 0 ? (
              <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900">
                <BotIcon className="mb-3 size-9 text-slate-300 dark:text-slate-700" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Nenhum atendimento neste recorte
                </p>
                <p className="mt-1 max-w-xs text-xs text-slate-400">
                  {estatisticas.totalSessoes > 0
                    ? `Nos últimos 30 dias houve ${estatisticas.totalSessoes} atendimentos. Amplie o período ou limpe os filtros.`
                    : 'Ainda não há conversas registradas com as IAs.'}
                </p>
              </div>
            ) : (
              sessoesFiltradas.map((sessao) => (
                <CartaoSessao
                  key={sessao.id}
                  sessao={sessao}
                  ativa={sessao.id === sessaoAtiva?.id}
                  carregando={carregandoId === sessao.id}
                  marcada={selecionados.has(sessao.id)}
                  aoMarcar={() => alternarSelecao(sessao.id)}
                  aoSelecionar={() => selecionarSessao(sessao.id)}
                />
              ))
            )}
          </div>
        </div>

        {/* Coluna direita: depuração da conversa */}
        <div
          ref={painelRef}
          className="flex flex-col rounded-2xl border border-slate-200/90 bg-white shadow-sm lg:col-span-7 dark:border-slate-800 dark:bg-slate-900"
        >
          {sessaoAtiva ? (
            <>
              {/* Cabeçalho do painel */}
              <div className="flex flex-col gap-3 border-b border-slate-200/80 p-4 sm:p-5 dark:border-slate-800">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className={`grid size-10 shrink-0 place-items-center rounded-xl ${
                        sessaoAtiva.modo_atual === 'pastoral'
                          ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                          : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {sessaoAtiva.modo_atual === 'pastoral' ? (
                        <HeartIcon className="size-5" />
                      ) : (
                        <CodeIcon className="size-5" />
                      )}
                    </span>

                    <div className="min-w-0">
                      <h2 className="truncate text-base font-bold text-slate-900 dark:text-white">
                        {sessaoAtiva.nome_lead || 'Visitante anônimo'}
                      </h2>
                      <p className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <ClockIcon className="size-3.5 shrink-0" />
                        <span className="truncate">
                          {formatarDataCompleta(sessaoAtiva.created_at)}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <BotaoAcao
                      onClick={copiarTranscricaoTexto}
                      ativo={copiado === 'texto'}
                      rotulo="Copiar texto"
                      rotuloAtivo="Copiado!"
                      titulo="Copiar a transcrição em texto puro"
                      Icone={CopyIcon}
                    />
                    <BotaoAcao
                      onClick={copiarConversaJson}
                      ativo={copiado === 'json'}
                      rotulo="JSON"
                      rotuloAtivo="Copiado!"
                      titulo="Copiar sessão e mensagens em JSON"
                      Icone={CodeIcon}
                    />
                  </div>
                </div>

                {/* Selos de estado — cada um com ícone de tamanho fixo */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <Selo
                    tom={sessaoAtiva.modo_atual === 'pastoral' ? 'amber' : 'emerald'}
                    Icone={sessaoAtiva.modo_atual === 'pastoral' ? HeartIcon : CodeIcon}
                  >
                    {sessaoAtiva.modo_atual === 'pastoral' ? 'Pastoral & Fé' : 'Tecnologia & IA'}
                  </Selo>
                  <Selo tom="slate" Icone={MessageSquareIcon}>
                    {sessaoAtiva.total_mensagens || mensagensAtivas.length} mensagens
                  </Selo>
                  {sessaoAtiva.qualificado && (
                    <Selo tom="amber" solido Icone={StarIcon}>
                      Lead qualificado
                    </Selo>
                  )}
                  {sessaoAtiva.clicou_whatsapp && (
                    <Selo tom="emerald" solido Icone={WhatsAppIcon}>
                      Clicou no WhatsApp
                    </Selo>
                  )}
                  {sessaoAtiva.houve_transferencia && (
                    <Selo tom="blue" Icone={ExchangeIcon}>
                      Transferido
                    </Selo>
                  )}
                  {foraDoFiltro && (
                    <Selo tom="slate">Fora do filtro atual</Selo>
                  )}

                  <button
                    type="button"
                    onClick={copiarId}
                    title="Copiar o ID completo da sessão"
                    className="inline-flex max-w-[160px] items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 font-mono text-[10px] text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-800 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white"
                  >
                    {copiado === 'id' ? (
                      <>
                        <CheckIcon className="size-3 shrink-0 text-emerald-500" /> ID copiado
                      </>
                    ) : (
                      <>
                        <CopyIcon className="size-3 shrink-0" />
                        <span className="truncate">{sessaoAtiva.id.slice(0, 8)}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Resumo da IA e dados do lead */}
              {(sessaoAtiva.resumo_conversa || sessaoAtiva.nome_lead || sessaoAtiva.contato_lead) && (
                <div className="border-b border-slate-200/80 p-4 sm:p-5 dark:border-slate-800">
                  <div className="flex flex-col gap-3 rounded-2xl border border-amber-300/70 bg-gradient-to-br from-amber-500/12 via-amber-500/8 to-transparent p-4 dark:border-amber-500/35">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-wide text-amber-800 uppercase dark:text-amber-300">
                        <StarIcon className="size-3.5 shrink-0" />
                        {sessaoAtiva.qualificado ? 'Lead qualificado' : 'Resumo da IA'}
                      </span>

                      {sessaoAtiva.contato_lead &&
                        (extrairLinkContato(sessaoAtiva.contato_lead) ? (
                          <a
                            href={extrairLinkContato(sessaoAtiva.contato_lead)!}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex max-w-full items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-emerald-500"
                          >
                            <WhatsAppIcon className="size-3.5 shrink-0" />
                            <span className="truncate">{sessaoAtiva.contato_lead}</span>
                          </a>
                        ) : (
                          <span className="max-w-full truncate rounded-xl border border-amber-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 dark:border-amber-800 dark:bg-slate-800 dark:text-slate-200">
                            {sessaoAtiva.contato_lead}
                          </span>
                        ))}
                    </div>

                    {sessaoAtiva.resumo_conversa && (
                      <p className="border-t border-amber-300/50 pt-3 text-xs leading-relaxed text-amber-950 dark:border-amber-700/40 dark:text-amber-100">
                        {sessaoAtiva.resumo_conversa}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Timeline */}
              <div
                ref={timelineRef}
                className="flex flex-col gap-4 overflow-y-auto p-4 sm:p-5 lg:max-h-[calc(100vh-22rem)] lg:min-h-[380px] max-lg:max-h-[560px]"
              >
                {carregando ? (
                  <div className="flex flex-col items-center gap-2 py-20 text-sm text-slate-400">
                    <RefreshCwIcon className="size-6 animate-spin text-amber-500" />
                    <span>Carregando o histórico da conversa…</span>
                  </div>
                ) : falhou ? (
                  <div className="flex flex-col items-center gap-3 py-20 text-center">
                    <p className="text-sm font-semibold text-rose-600 dark:text-rose-400">
                      Não foi possível carregar o histórico desta conversa.
                    </p>
                    <button
                      type="button"
                      onClick={() => carregarMensagens(sessaoAtiva.id, true)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                    >
                      <RefreshCwIcon className="size-3.5 shrink-0" />
                      Tentar novamente
                    </button>
                  </div>
                ) : !historicoEmCache ? (
                  <div className="flex flex-col items-center gap-3 py-20 text-center">
                    <p className="text-sm text-slate-400">
                      O histórico desta conversa ainda não foi carregado.
                    </p>
                    <button
                      type="button"
                      onClick={() => carregarMensagens(sessaoAtiva.id, true)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-amber-600"
                    >
                      <DownloadIcon className="size-3.5 shrink-0" />
                      Carregar mensagens
                    </button>
                  </div>
                ) : mensagensAtivas.length === 0 ? (
                  <div className="py-20 text-center text-sm text-slate-400">
                    Nenhuma mensagem registrada nesta sessão.
                  </div>
                ) : (
                  mensagensAtivas.map((mensagem, idx) => (
                    <BolhaMensagem key={mensagem.id || idx} mensagem={mensagem} />
                  ))
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <BotIcon className="mb-3 size-12 text-slate-300 dark:text-slate-700" />
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                Selecione um atendimento
              </h3>
              <p className="mt-1 max-w-xs text-xs text-slate-400">
                Escolha uma conversa na lista para revisar as mensagens, o resumo da IA e os dados do
                lead.
              </p>
            </div>
          )}
        </div>
      </div>

      <ModalConfirmacao
        aberto={confirmandoExclusao}
        quantidade={idsSelecionados.length}
        amostra={sessoesSelecionadas}
        excluindo={excluindo}
        erro={erroExclusao}
        aoConfirmar={excluirSelecionados}
        aoCancelar={fecharConfirmacao}
      />
    </div>
  )
}

/**
 * Confirmação de exclusão.
 *
 * <dialog> nativo com showModal(): a armadilha de foco, o Esc, o backdrop e o
 * inerte no resto da página vêm do browser. Um window.confirm() não conseguiria
 * listar as conversas nem mostrar o erro do servidor sem fechar antes.
 */
function ModalConfirmacao({
  aberto,
  quantidade,
  amostra,
  excluindo,
  erro,
  aoConfirmar,
  aoCancelar,
}: {
  aberto: boolean
  quantidade: number
  amostra: SessaoItem[]
  excluindo: boolean
  erro: string | null
  aoConfirmar: () => void
  aoCancelar: () => void
}) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialogo = ref.current
    if (!dialogo) return
    if (aberto && !dialogo.open) dialogo.showModal()
    if (!aberto && dialogo.open) dialogo.close()
  }, [aberto])

  const totalMensagens = amostra.reduce((acc, s) => acc + (s.total_mensagens || 0), 0)
  const visiveis = amostra.slice(0, 4)
  const restantes = quantidade - visiveis.length

  return (
    <dialog
      ref={ref}
      aria-labelledby="titulo-exclusao-ia"
      onCancel={(e) => {
        e.preventDefault() // o fechamento passa pelo handler, que respeita o "excluindo"
        aoCancelar()
      }}
      onClick={(e) => {
        // Clique no backdrop: o alvo é o próprio <dialog>, nunca o conteúdo.
        if (e.target === ref.current) aoCancelar()
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-3xl border border-slate-200 bg-white p-0 text-slate-800 shadow-2xl backdrop:bg-slate-950/60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
    >
      <div className="flex flex-col gap-4 p-5">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400">
            <AlertTriangleIcon className="size-5" />
          </span>
          <div className="min-w-0">
            <h2 id="titulo-exclusao-ia" className="text-base font-bold text-slate-900 dark:text-white">
              Apagar {quantidade} {quantidade === 1 ? 'atendimento' : 'atendimentos'}?
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              As {totalMensagens} mensagens dessas conversas serão apagadas junto. A ação é
              permanente e não há como desfazer pelo painel.
            </p>
          </div>
        </div>

        <ul className="flex max-h-40 flex-col gap-1.5 overflow-y-auto rounded-2xl bg-slate-50 p-3 dark:bg-slate-800/60">
          {visiveis.map((s) => (
            <li key={s.id} className="flex items-center gap-2 text-xs">
              <span
                className={`size-1.5 shrink-0 rounded-full ${
                  s.modo_atual === 'pastoral' ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
              />
              <span className="min-w-0 flex-1 truncate font-medium text-slate-700 dark:text-slate-200">
                {s.nome_lead || s.resumo_conversa || s.primeiraMensagem || 'Visitante anônimo'}
              </span>
              <span className="shrink-0 text-[11px] text-slate-400 tabular-nums">
                {formatarDataRelativa(s.updated_at || s.created_at)}
              </span>
            </li>
          ))}
          {restantes > 0 && (
            <li className="pt-1 text-[11px] font-semibold text-slate-400">
              e mais {restantes} {restantes === 1 ? 'conversa' : 'conversas'}…
            </li>
          )}
        </ul>

        {erro && (
          <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 dark:bg-rose-500/10 dark:text-rose-400">
            {erro}
          </p>
        )}

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={aoCancelar}
            disabled={excluindo}
            className="rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={aoConfirmar}
            disabled={excluindo}
            className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-3.5 py-2 text-xs font-bold text-white transition-colors hover:bg-rose-700 active:scale-95 disabled:opacity-70"
          >
            {excluindo ? (
              <>
                <RefreshCwIcon className="size-3.5 shrink-0 animate-spin" />
                Apagando…
              </>
            ) : (
              <>
                <TrashIcon className="size-3.5 shrink-0" />
                Apagar definitivamente
              </>
            )}
          </button>
        </div>
      </div>
    </dialog>
  )
}

// ─── Peças da interface ──────────────────────────────────────────────────────

type ComponenteIcone = (props: { className?: string }) => React.ReactElement

/**
 * Card de métrica que também é o botão de filtro da lista.
 *
 * O ícone fica em uma linha só dele e o rótulo ocupa a largura inteira do card:
 * é o que impede o texto de encavalar no ícone quando são seis colunas em uma
 * tela de 1280px (cada card fica com ~145px).
 */
function CartaoKpi({
  rotulo,
  valor,
  sufixo,
  detalhe,
  Icone,
  tom,
  ativo,
  destacado = false,
  aoSelecionar,
}: {
  rotulo: string
  valor: number | string
  sufixo?: string
  detalhe: string
  Icone: ComponenteIcone
  tom: Tom
  ativo: boolean
  destacado?: boolean
  aoSelecionar: () => void
}) {
  const cores = TONS[tom]

  return (
    <button
      type="button"
      onClick={aoSelecionar}
      aria-pressed={ativo}
      title={`Filtrar a lista por: ${rotulo}`}
      className={`flex flex-col gap-2.5 rounded-2xl border p-3.5 text-left transition-all sm:p-4 ${
        destacado
          ? 'border-amber-300/80 bg-gradient-to-br from-amber-500/12 to-transparent dark:border-amber-500/35'
          : 'border-slate-200/90 bg-white dark:border-slate-800 dark:bg-slate-900'
      } ${
        ativo
          ? `shadow-sm ring-2 ${cores.selecionado}`
          : 'hover:border-slate-300 hover:shadow-sm dark:hover:border-slate-700'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className={`grid size-8 shrink-0 place-items-center rounded-lg ${cores.icone}`}>
          <Icone className="size-4" />
        </span>
        {sufixo && (
          <span className={`shrink-0 text-[11px] font-bold tabular-nums ${cores.sufixo}`}>
            {sufixo}
          </span>
        )}
      </div>

      <div>
        <div className="text-2xl font-bold tracking-tight tabular-nums text-slate-900 dark:text-white">
          {valor}
        </div>
        <div className="mt-0.5 text-xs leading-tight font-semibold text-slate-700 dark:text-slate-200">
          {rotulo}
        </div>
        <div className="mt-1 text-[11px] leading-snug text-slate-400 dark:text-slate-500">
          {detalhe}
        </div>
      </div>
    </button>
  )
}

function Selo({
  children,
  tom,
  solido = false,
  Icone,
}: {
  children: React.ReactNode
  tom: Tom
  solido?: boolean
  Icone?: ComponenteIcone
}) {
  const cores: Record<Tom, { suave: string; solido: string }> = {
    slate: {
      suave: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
      solido: 'bg-slate-700 text-white',
    },
    amber: {
      suave: 'bg-amber-100 text-amber-900 dark:bg-amber-500/20 dark:text-amber-300',
      solido: 'bg-amber-500 text-white',
    },
    emerald: {
      suave: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-500/20 dark:text-emerald-300',
      solido: 'bg-emerald-600 text-white',
    },
    blue: {
      suave: 'bg-blue-100 text-blue-900 dark:bg-blue-500/20 dark:text-blue-300',
      solido: 'bg-blue-600 text-white',
    },
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold whitespace-nowrap ${
        solido ? cores[tom].solido : cores[tom].suave
      }`}
    >
      {Icone && <Icone className="size-3 shrink-0" />}
      {children}
    </span>
  )
}

function BotaoAcao({
  onClick,
  ativo,
  rotulo,
  rotuloAtivo,
  titulo,
  Icone,
}: {
  onClick: () => void
  ativo: boolean
  rotulo: string
  rotuloAtivo: string
  titulo: string
  Icone: ComponenteIcone
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={titulo}
      className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
    >
      {ativo ? (
        <CheckIcon className="size-3.5 shrink-0 text-emerald-500" />
      ) : (
        <Icone className="size-3.5 shrink-0" />
      )}
      <span className="hidden sm:inline">{ativo ? rotuloAtivo : rotulo}</span>
    </button>
  )
}

/**
 * Item da lista de conversas.
 *
 * É <button> e não <div onClick>: assim entra na ordem de tabulação, responde a
 * Enter/Espaço e anuncia o estado selecionado para leitores de tela.
 */
function CartaoSessao({
  sessao,
  ativa,
  carregando,
  marcada,
  aoMarcar,
  aoSelecionar,
}: {
  sessao: SessaoItem
  ativa: boolean
  carregando: boolean
  marcada: boolean
  aoMarcar: () => void
  aoSelecionar: () => void
}) {
  const ePastoral = sessao.modo_atual === 'pastoral'

  // Wrapper <div> com <button> dentro, e não um <button> envolvendo tudo: um
  // checkbox dentro de um botão é HTML inválido e o clique vira loteria.
  return (
    <div
      className={`flex items-start gap-2 rounded-2xl border p-3.5 transition-all ${
        marcada
          ? 'border-rose-400 bg-rose-50/60 dark:border-rose-500/50 dark:bg-rose-950/20'
          : ativa
            ? 'border-amber-500 bg-white shadow-sm ring-2 ring-amber-500/25 dark:bg-slate-900'
            : 'border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-sm dark:border-slate-800/80 dark:bg-slate-900/90 dark:hover:border-slate-700'
      }`}
    >
      <div className="pt-0.5">
        <CaixaSelecao
          marcada={marcada}
          onChange={aoMarcar}
          rotulo={`Selecionar o atendimento de ${sessao.nome_lead || 'visitante anônimo'}`}
        />
      </div>

      <button
        type="button"
        onClick={aoSelecionar}
        aria-current={ativa ? 'true' : undefined}
        className="flex min-w-0 flex-1 items-start gap-3 text-left"
      >
        <span
          className={`grid size-9 shrink-0 place-items-center rounded-xl ${
            ePastoral
              ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
              : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
          }`}
        >
          {ePastoral ? <HeartIcon className="size-4" /> : <CodeIcon className="size-4" />}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                {sessao.nome_lead || 'Visitante anônimo'}
              </p>
              {sessao.contato_lead && (
                <p className="truncate text-[11px] font-medium text-amber-700 dark:text-amber-400">
                  {sessao.contato_lead}
                </p>
              )}
            </div>

            <span className="shrink-0 text-[11px] font-medium whitespace-nowrap text-slate-400 tabular-nums">
              {carregando ? (
                <RefreshCwIcon className="size-3.5 animate-spin text-amber-500" />
              ) : (
                formatarDataRelativa(sessao.updated_at || sessao.created_at)
              )}
            </span>
          </div>

          <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
            {sessao.resumo_conversa || sessao.primeiraMensagem || 'Conversa sem texto inicial.'}
          </p>

          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <Selo tom={ePastoral ? 'amber' : 'emerald'}>{ePastoral ? 'Pastoral' : 'Tech'}</Selo>
            {sessao.qualificado && (
              <Selo tom="amber" solido Icone={StarIcon}>
                Lead
              </Selo>
            )}
            {sessao.clicou_whatsapp && (
              <Selo tom="emerald" solido Icone={WhatsAppIcon}>
                WhatsApp
              </Selo>
            )}
            {sessao.houve_transferencia && (
              <Selo tom="blue" Icone={ExchangeIcon}>
                Transferido
              </Selo>
            )}
            <span className="ml-auto shrink-0 text-[11px] font-medium text-slate-400 tabular-nums">
              {sessao.total_mensagens || 0} msgs
            </span>
          </div>
        </div>
      </button>
    </div>
  )
}

/**
 * Checkbox nativo estilizado. Nativo mesmo, e não uma <div> com aparência de
 * caixa: entra na tabulação, responde a Espaço e o leitor de tela já sabe
 * anunciar marcado/desmarcado sem precisar de ARIA.
 */
function CaixaSelecao({
  marcada,
  parcial = false,
  onChange,
  rotulo,
  disabled = false,
}: {
  marcada: boolean
  parcial?: boolean
  onChange: () => void
  rotulo: string
  disabled?: boolean
}) {
  const ref = useRef<HTMLInputElement>(null)

  // `indeterminate` não existe como atributo HTML — só como propriedade do DOM.
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = parcial
  }, [parcial])

  return (
    <input
      ref={ref}
      type="checkbox"
      checked={marcada}
      onChange={onChange}
      disabled={disabled}
      aria-label={rotulo}
      title={rotulo}
      className="size-4 shrink-0 cursor-pointer rounded border-slate-300 accent-rose-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600"
    />
  )
}

function BolhaMensagem({ mensagem }: { mensagem: ChatMensagemRow }) {
  const eUsuario = mensagem.role === 'user'

  return (
    <div className={`flex items-start gap-2.5 ${eUsuario ? 'flex-row-reverse' : ''}`}>
      <span
        className={`grid size-8 shrink-0 place-items-center rounded-full ${
          eUsuario
            ? 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-200'
            : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
        }`}
      >
        {eUsuario ? <UserIcon className="size-4" /> : <BotIcon className="size-4" />}
      </span>

      <div className={`flex min-w-0 max-w-[85%] flex-col gap-1 ${eUsuario ? 'items-end' : 'items-start'}`}>
        <div className="flex flex-wrap items-center gap-1.5 px-1 text-[10px] text-slate-400">
          <span className="font-semibold text-slate-600 dark:text-slate-300">
            {eUsuario ? 'Visitante' : 'IA · Márcio Rolim'}
          </span>
          {mensagem.modelo_usado && (
            <span className="max-w-[150px] truncate rounded bg-slate-100 px-1.5 py-0.5 font-mono dark:bg-slate-800">
              {mensagem.modelo_usado}
            </span>
          )}
          <span className="tabular-nums">{HORA_CURTA.format(new Date(mensagem.created_at))}</span>
        </div>

        {/* break-words: URLs longas do chat estouravam a bolha e passavam por
            cima da coluna vizinha. whitespace-pre-wrap nos dois lados: o
            visitante também manda texto com quebras de linha. */}
        <div
          className={`rounded-2xl px-4 py-2.5 text-xs leading-relaxed break-words whitespace-pre-wrap ${
            eUsuario
              ? 'rounded-tr-sm bg-slate-900 text-white dark:bg-amber-600'
              : 'rounded-tl-sm border border-slate-200/80 bg-slate-50 text-slate-800 dark:border-slate-700/80 dark:bg-slate-800 dark:text-slate-100'
          }`}
        >
          {mensagem.content}
        </div>
      </div>
    </div>
  )
}
