'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import {
  gerarPostCompletoComIaAction,
  obter5OpcoesNoticiasQuentesAction,
  obterSugestoesDeTitulosAction,
  type ResultadoPostIa,
} from '@/actions/gerar-post-ia'
import { Categoria } from '@/lib/blog/constantes'

type Props = {
  aberto: boolean
  onFechar: () => void
  onAplicarAoFormulario: (resultado: ResultadoPostIa) => void
  categoriaAtual?: Categoria
}

export type ItemOpcaoIa = {
  id: string
  titulo: string
  resumo: string
  detalhe?: string
}

export type PostCriadoResumo = {
  titulo: string
  slug: string
  categoria: Categoria
  publicado: boolean
}

export function ModalGeradorIa({
  aberto,
  onFechar,
  onAplicarAoFormulario,
  categoriaAtual = 'tecnologia',
}: Props) {
  const router = useRouter()

  const [apiKey, setApiKey] = useState('')
  const [modeloId, setModeloId] = useState('gemini-2.0-flash')
  const [modeloImagemId, setModeloImagemId] = useState('imagen-3.0-generate-002')

  const [tema, setTema] = useState('')
  const [categoria, setCategoria] = useState<Categoria>(categoriaAtual)

  const [passo, setPasso] = useState<
    'formulario' | 'opcoes' | 'gerando_post' | 'concluido'
  >('formulario')

  const [carregando, setCarregando] = useState(false)
  const [statusMensagem, setStatusMensagem] = useState('')
  const [erro, setErro] = useState<string | null>(null)

  // Lista unificada das 5 opções geradas
  const [opcoes, setOpcoes] = useState<ItemOpcaoIa[]>([])
  const [opcoesSelecionadas, setOpcoesSelecionadas] = useState<string[]>([])

  // Posts criados para exibição na tela final de sucesso
  const [postsConcluidos, setPostsConcluidos] = useState<PostCriadoResumo[]>([])
  const [tempoRestante, setTempoRestante] = useState(5)

  // Carrega a chave e os modelos selecionados no localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && aberto) {
      const salvaKey = localStorage.getItem('gemini_admin_api_key')
      const salvaMod = localStorage.getItem('gemini_admin_model_id')
      const salvaImgMod = localStorage.getItem('gemini_admin_image_model_id')

      if (salvaKey) setApiKey(salvaKey)
      if (salvaMod) setModeloId(salvaMod)
      if (salvaImgMod) setModeloImagemId(salvaImgMod)
    }
  }, [aberto])

  // Timer de contagem regressiva de 5 segundos ao concluir a publicação
  useEffect(() => {
    if (passo === 'concluido') {
      setTempoRestante(5)
      const timer = setInterval(() => {
        setTempoRestante((prev) => {
          if (prev <= 1) {
            clearInterval(timer)
            handleFinalizarERedirecionar()
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [passo])

  if (!aberto) return null

  // Redireciona e fecha o modal
  const handleFinalizarERedirecionar = () => {
    onFechar()
    router.push('/admin/posts')
    router.refresh()
  }

  // ─── BOTÃO ÚNICO DE BUSCA E GERAÇÃO DE 5 SUGESTÕES ────────────────────────
  const handleBuscar5Sugestoes = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()

    setErro(null)
    setCarregando(true)
    setOpcoes([])
    setOpcoesSelecionadas([])

    if (tema.trim()) {
      // Se informou tema: gera sugestões otimizadas focadas no assunto
      setStatusMensagem(`Consultando tendências no Google e gerando 5 sugestões com o modelo ${modeloId}...`)
      const resp = await obterSugestoesDeTitulosAction({
        tema,
        categoria,
        apiKeyInformada: apiKey,
        modeloId,
      })

      setCarregando(false)

      if (!resp.ok || !resp.sugestoes || resp.sugestoes.length === 0) {
        setErro(resp.erro || 'Não foi possível obter sugestões de posts.')
        return
      }

      const listaMapeada: ItemOpcaoIa[] = resp.sugestoes.map((s, idx) => ({
        id: `sug-${idx}-${Date.now()}`,
        titulo: s.titulo,
        resumo: s.subtituloOuJustificativa || `Artigo aprofundado sobre ${s.titulo}.`,
        detalhe: s.palavrasChave ? s.palavrasChave.join(', ') : undefined,
      }))

      setOpcoes(listaMapeada)
      setOpcoesSelecionadas([listaMapeada[0].id])
      setPasso('opcoes')
    } else {
      // Se em branco: busca as 5 principais notícias/tendências quentes no Apify/Google
      const apifyToken =
        typeof window !== 'undefined' ? localStorage.getItem('apify_admin_token') || undefined : undefined
      setStatusMensagem(
        `⚡ Pesquisando as 5 principais tendências em ${
          categoria === 'fe' ? 'Vida Cristã & Fé' : 'Tecnologia & IA'
        }...`
      )

      const resp = await obter5OpcoesNoticiasQuentesAction({
        categoria,
        assuntoOpcional: '',
        apiKeyInformada: apiKey,
        apifyTokenInformado: apifyToken,
        modeloId,
      })

      setCarregando(false)

      if (!resp.ok || !resp.opcoes || resp.opcoes.length === 0) {
        setErro(resp.erro || 'Não foi possível buscar as 5 opções de notícias quentes.')
        return
      }

      const listaMapeada: ItemOpcaoIa[] = resp.opcoes.map((o) => ({
        id: `opt-${o.id}-${Date.now()}`,
        titulo: o.titulo,
        resumo: o.resumo,
        detalhe: o.porQueEQuente ? `🔥 ${o.porQueEQuente}` : undefined,
      }))

      setOpcoes(listaMapeada)
      setOpcoesSelecionadas([listaMapeada[0].id])
      setPasso('opcoes')
    }
  }

  // Toggle de seleção de uma opção
  const toggleOpcao = (id: string) => {
    setOpcoesSelecionadas((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  // Toggle selecionar todas
  const toggleSelecionarTodas = () => {
    if (opcoesSelecionadas.length === opcoes.length) {
      setOpcoesSelecionadas([])
    } else {
      setOpcoesSelecionadas(opcoes.map((o) => o.id))
    }
  }

  // ─── GERAR E PUBLICAR POSTS SELECIONADOS NO BANCO ──────────────────────────
  const handleGerarEPublicarSelecionados = async () => {
    if (opcoesSelecionadas.length === 0) {
      setErro('Selecione pelo menos 1 opção de post para gerar.')
      return
    }

    const selecionadas = opcoes.filter((o) => opcoesSelecionadas.includes(o.id))
    setErro(null)
    setCarregando(true)
    setPasso('gerando_post')
    setPostsConcluidos([])

    const geradosArray: PostCriadoResumo[] = []

    for (let i = 0; i < selecionadas.length; i++) {
      const item = selecionadas[i]
      setStatusMensagem(
        `[${i + 1}/${selecionadas.length}] Redigindo artigo extenso (~1500 palavras), gerando capa por IA e publicando: "${item.titulo}"...`
      )

      const resp = await gerarPostCompletoComIaAction({
        titulo: item.titulo,
        tema: item.resumo,
        categoria,
        apiKeyInformada: apiKey,
        modeloId,
        modeloImagemId,
        publicarDireto: true,
      })

      if (resp.ok && resp.post) {
        geradosArray.push({
          titulo: resp.post.titulo,
          slug: resp.post.slug,
          categoria: resp.post.categoria,
          publicado: Boolean(resp.publicado),
        })

        // Aplica o 1º no formulário de fundo por cortesia
        if (i === 0) {
          onAplicarAoFormulario(resp.post)
        }
      }
    }

    setCarregando(false)

    if (geradosArray.length > 0) {
      setPostsConcluidos(geradosArray)
      setPasso('concluido')
    } else {
      setErro('Falha ao gerar e publicar os posts selecionados.')
      setPasso('opcoes')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md transition-opacity">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 sm:p-8">
        {/* CABEÇALHO DO MODAL */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 text-xl text-amber-600 dark:text-amber-400">
              ✨
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Assistente de Criação & Publicação com IA
                </h3>
                <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 font-mono text-[0.65rem] font-bold text-amber-700 dark:text-amber-300">
                  {modeloId}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Modelo ativo selecionado nas{' '}
                <Link
                  href="/admin/configuracoes"
                  target="_blank"
                  className="text-amber-600 underline dark:text-amber-400"
                >
                  Configurações IA
                </Link>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onFechar}
            className="cursor-pointer rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            ✕
          </button>
        </div>

        {/* MENSAGEM DE ERRO SE HOUVER */}
        {erro && (
          <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs font-semibold text-red-700 dark:border-red-500/40 dark:text-red-300">
            ⚠️ {erro}
          </div>
        )}

        {/* PASSO 1: FORMULÁRIO INICIAL */}
        {passo === 'formulario' && (
          <form onSubmit={handleBuscar5Sugestoes} className="mt-5 flex flex-col gap-5">
            {/* SELETOR DE CATEGORIA */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                📂 1. Área / Categoria dos Posts
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setCategoria('tecnologia')}
                  className={`cursor-pointer rounded-2xl border p-3.5 text-left text-xs font-bold transition-all ${
                    categoria !== 'fe'
                      ? 'border-sky-500 bg-sky-500/15 text-sky-800 dark:bg-sky-500/20 dark:text-sky-300 ring-2 ring-sky-500/30'
                      : 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400'
                  }`}
                >
                  Tecnologia, IA & Automação
                </button>

                <button
                  type="button"
                  onClick={() => setCategoria('fe')}
                  className={`cursor-pointer rounded-2xl border p-3.5 text-left text-xs font-bold transition-all ${
                    categoria === 'fe'
                      ? 'border-amber-500 bg-amber-500/15 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300 ring-2 ring-amber-500/30'
                      : 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400'
                  }`}
                >
                  Vida Cristã & Fé
                </button>
              </div>
            </div>

            {/* CAMPO DE TEMA OU ASSUNTO */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                🎯 2. Tema ou Assunto (Opcional - Deixe em branco para tendências e notícias)
              </label>
              <input
                type="text"
                value={tema}
                onChange={(e) => setTema(e.target.value)}
                placeholder={
                  categoria === 'fe'
                    ? 'Ex: Oração na rotina agitada, Provérbios... ou deixe em branco para tendências'
                    : 'Ex: DeepSeek R1, Agentic AI, No-Code... ou deixe em branco para notícias quentes'
                }
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-all focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              />
              <p className="mt-1 text-[0.7rem] text-slate-500 dark:text-slate-400">
                Se digitado, a IA focará no seu tema. Se em branco, pesquisará notícias em alta no Apify/Google.
              </p>
            </div>

            {/* BOTÃO ÚNICO DE AÇÃO */}
            <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
              <button
                type="button"
                onClick={onFechar}
                className="cursor-pointer rounded-2xl px-4 py-3 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={carregando}
                className="cursor-pointer inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 px-7 py-3 text-xs font-extrabold text-white shadow-lg transition-all hover:scale-[1.02] disabled:opacity-50"
              >
                {carregando ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Pesquisando tendências...
                  </>
                ) : (
                  <>✨ Gerar 5 Sugestões de Posts</>
                )}
              </button>
            </div>
          </form>
        )}

        {/* PASSO: 5 OPÇÕES ENCONTRADAS (COM SELEÇÃO MÚLTIPLA) */}
        {passo === 'opcoes' && (
          <div className="mt-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  🔥 5 Opções Encontradas em {categoria === 'fe' ? 'Fé & Vida Cristã' : 'Tecnologia & IA'}:
                </h4>
                <p className="text-[0.72rem] text-slate-500 dark:text-slate-400">
                  Marque 1 ou mais opções para criar e publicar automaticamente no banco:
                </p>
              </div>

              <button
                type="button"
                onClick={() => setPasso('formulario')}
                className="text-xs font-bold text-amber-600 hover:underline dark:text-amber-400"
              >
                ← Voltar
              </button>
            </div>

            <div className="flex flex-col gap-2.5 max-h-[310px] overflow-y-auto pr-1">
              {opcoes.map((item, idx) => {
                const marcada = opcoesSelecionadas.includes(item.id)
                return (
                  <div
                    key={item.id}
                    onClick={() => toggleOpcao(item.id)}
                    className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-3.5 transition-all ${
                      marcada
                        ? 'border-amber-500 bg-amber-500/10 shadow-sm dark:bg-amber-500/15 ring-2 ring-amber-500/20'
                        : 'border-slate-200 bg-slate-50/60 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950/60'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={marcada}
                      onChange={() => {}}
                      className="mt-1 h-4 w-4 accent-amber-500 cursor-pointer"
                    />

                    <div className="flex flex-1 flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[0.7rem] font-bold text-amber-600 dark:text-amber-400">
                          Opção #{idx + 1}
                        </span>
                        {item.detalhe && (
                          <span className="rounded-full bg-slate-200/60 px-2 py-0.5 font-mono text-[0.65rem] text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            {item.detalhe}
                          </span>
                        )}
                      </div>
                      <h5 className="text-xs font-extrabold text-slate-900 dark:text-white leading-snug">
                        {item.titulo}
                      </h5>
                      <p className="text-[0.72rem] text-slate-500 dark:text-slate-400 leading-tight">
                        {item.resumo}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* BARRA DE AÇÃO INFERIOR */}
            <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
              <button
                type="button"
                onClick={toggleSelecionarTodas}
                className="text-xs font-bold text-slate-600 hover:underline dark:text-slate-300"
              >
                {opcoesSelecionadas.length === opcoes.length ? 'Desmarcar todas' : 'Selecionar todas'}
              </button>

              <button
                type="button"
                onClick={handleGerarEPublicarSelecionados}
                disabled={carregando || opcoesSelecionadas.length === 0}
                className="cursor-pointer inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-2.5 text-xs font-extrabold text-white shadow-lg transition-all hover:scale-105 disabled:opacity-50"
              >
                🚀 Gerar & Publicar {opcoesSelecionadas.length} Post(s)
              </button>
            </div>
          </div>
        )}

        {/* PASSO: CARREGAMENTO DA GERAÇÃO DOS POSTS */}
        {passo === 'gerando_post' && (
          <div className="mt-8 flex flex-col items-center justify-center gap-4 py-8 text-center">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
            <div className="flex flex-col gap-1 max-w-md">
              <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                Redigindo e Publicando Artigos por IA...
              </h4>
              <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold">{statusMensagem}</p>
            </div>
          </div>
        )}

        {/* PASSO: TELA DE SUCESSO E RESUMO FINAL COM CRONÔMETRO */}
        {passo === 'concluido' && (
          <div className="mt-5 flex flex-col gap-5">
            <div className="flex flex-col items-center text-center gap-2">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15 text-3xl text-emerald-600 dark:text-emerald-400">
                🎉
              </div>
              <h4 className="text-lg font-black text-slate-900 dark:text-white">
                {postsConcluidos.length} Post(s) Criado(s) e Publicado(s) com Sucesso!
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Os artigos já estão disponíveis publicamente no seu blog e registrados no painel.
              </p>
            </div>

            {/* LISTA DE POSTS PUBLICADOS */}
            <div className="flex flex-col gap-2.5 max-h-[260px] overflow-y-auto pr-1">
              {postsConcluidos.map((p, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-3.5 dark:border-slate-800 dark:bg-slate-950/60"
                >
                  <div className="flex flex-col gap-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 font-mono text-[0.65rem] font-bold text-emerald-700 dark:text-emerald-300">
                        ✅ Publicado
                      </span>
                      <span className="rounded-full bg-slate-200 px-2 py-0.5 font-mono text-[0.65rem] text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {p.categoria === 'fe' ? 'Fé' : 'Tecnologia'}
                      </span>
                    </div>
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
                      {p.titulo}
                    </h5>
                  </div>

                  <Link
                    href={`/blog/${p.slug}`}
                    target="_blank"
                    className="shrink-0 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-600 hover:bg-amber-500/20 dark:text-amber-400"
                  >
                    🔗 Ver no Blog
                  </Link>
                </div>
              ))}
            </div>

            {/* BARRA INFERIOR DE REDIRECIONAMENTO COM TIMING */}
            <div className="mt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400 animate-pulse">
                ⏱️ Voltando para a lista de posts em {tempoRestante}s...
              </span>

              <button
                type="button"
                onClick={handleFinalizarERedirecionar}
                className="cursor-pointer w-full sm:w-auto rounded-2xl bg-amber-500 px-6 py-2.5 text-xs font-extrabold text-slate-950 shadow-md transition-all hover:bg-amber-400"
              >
                ✅ OK / Ir para Lista de Posts
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
