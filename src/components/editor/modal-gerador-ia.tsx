'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import {
  gerarCapaDoPostAction,
  gerarOpcoesApartirDeUrlAction,
  gerarPostCompletoComIaAction,
  obter5OpcoesNoticiasQuentesAction,
  obterSugestoesDeTitulosAction,
  type ResultadoPostIa,
} from '@/actions/gerar-post-ia'
import {
  Categoria,
  MODELOS_IMAGEM_DISPONIVEIS,
  MODELO_TEXTO_PADRAO,
} from '@/lib/blog/constantes'

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
  /** Preenchido quando o texto foi gerado mas a gravação no banco falhou. */
  erro?: string
  /** Capa gerada no passo 2. Ausente = ficou a foto de reserva. */
  capaUrl?: string
  /** Passo 2 falhou. NÃO é falha do post: ele está publicado mesmo assim. */
  avisoCapa?: string
}

export function ModalGeradorIa({
  aberto,
  onFechar,
  onAplicarAoFormulario,
  categoriaAtual = 'tecnologia',
}: Props) {
  const router = useRouter()

  // Os defaults antigos ('gemini-2.0-flash' / 'imagen-3.0-generate-002') foram
  // aposentados pelo Google e respondiam 404. Um navegador sem preferência
  // salva no localStorage caía direto na falha.
  const [modeloId, setModeloId] = useState(MODELO_TEXTO_PADRAO)
  const [modeloImagemId, setModeloImagemId] = useState(MODELOS_IMAGEM_DISPONIVEIS[0]!.id)

  const [tema, setTema] = useState('')
  const [categoria, setCategoria] = useState<Categoria>(categoriaAtual)

  // Modo de geração: por Tema/Tendências ou por URL (Apify)
  const [modoGeracao, setModoGeracao] = useState<'tema' | 'url'>('tema')
  const [urlFonte, setUrlFonte] = useState('')

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

  // Só a PREFERÊNCIA de modelo vem do localStorage. A chave do Gemini e o token
  // do Apify ficavam aqui também — foram para o ambiente do servidor, e as
  // actions os leem de lá. Nenhum segredo passa mais pelo navegador.
  useEffect(() => {
    if (!aberto) return

    const salvaMod = localStorage.getItem('gemini_admin_model_id')
    const salvaImgMod = localStorage.getItem('gemini_admin_image_model_id')

    if (salvaMod) setModeloId(salvaMod)
    if (salvaImgMod) setModeloImagemId(salvaImgMod)
  }, [aberto])

  // Redireciona e fecha o modal
  const handleFinalizarERedirecionar = useCallback(() => {
    onFechar()
    router.push('/admin/posts')
    router.refresh()
  }, [onFechar, router])

  // Redefine a contagem regressiva de 5 segundos ao entrar no passo 'concluido'
  useEffect(() => {
    if (passo === 'concluido') {
      setTempoRestante(5)
    }
  }, [passo])

  // Timer de contagem regressiva de 5 segundos ao concluir a publicação
  useEffect(() => {
    if (passo !== 'concluido') return

    if (tempoRestante <= 0) {
      handleFinalizarERedirecionar()
      return
    }

    const timer = setTimeout(() => {
      setTempoRestante((prev) => prev - 1)
    }, 1000)

    return () => clearTimeout(timer)
  }, [passo, tempoRestante, handleFinalizarERedirecionar])

  if (!aberto) return null

  // ─── BOTÃO ÚNICO DE BUSCA E GERAÇÃO DE 5 SUGESTÕES ────────────────────────
  const handleBuscar5Sugestoes = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()

    setErro(null)
    setCarregando(true)
    setOpcoes([])
    setOpcoesSelecionadas([])

    if (modoGeracao === 'url') {
      if (!urlFonte.trim()) {
        setErro('Por favor, informe uma URL válida de artigo ou post de rede social.')
        setCarregando(false)
        return
      }

      setStatusMensagem(`🕸️ Fazendo scraping do link com Apify & gerando 5 propostas de artigos com ${modeloId}...`)

      const resp = await gerarOpcoesApartirDeUrlAction({
        url: urlFonte.trim(),
        categoria,
        modeloId,
      })

      setCarregando(false)

      if (!resp.ok || !resp.opcoes || resp.opcoes.length === 0) {
        setErro(resp.erro || 'Não foi possível extrair o conteúdo da URL informada.')
        return
      }

      const listaMapeada: ItemOpcaoIa[] = resp.opcoes.map((o) => ({
        id: `url-opt-${o.id}-${Date.now()}`,
        titulo: o.titulo,
        resumo: o.resumo,
        detalhe: `Fonte: ${resp.tituloFonte || resp.urlFonte || urlFonte}`,
      }))

      setOpcoes(listaMapeada)
      setOpcoesSelecionadas([listaMapeada[0].id])
      setPasso('opcoes')
      return
    }

    if (tema.trim()) {
      // Se informou tema: gera sugestões otimizadas focadas no assunto
      setStatusMensagem(`Consultando tendências no Google e gerando 5 sugestões com o modelo ${modeloId}...`)
      const resp = await obterSugestoesDeTitulosAction({
        tema,
        categoria,
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
      setStatusMensagem(
        `⚡ Pesquisando as 5 principais tendências em ${
          categoria === 'fe' ? 'Vida Cristã & Fé' : 'Tecnologia & IA'
        }...`
      )

      const resp = await obter5OpcoesNoticiasQuentesAction({
        categoria,
        assuntoOpcional: '',
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

    // DOIS passos por post, e não um.
    //
    // Antes era uma chamada só: redigir (~28s) + gerar capa (~55s) = ~83s, que
    // estourava o limite de execução da plataforma e perdia o artigo já escrito
    // junto com a capa. Agora o passo 1 publica o post com uma foto do banco e o
    // passo 2 troca pela capa gerada. Se o passo 2 falhar, o post continua no
    // ar — e dá para refazer só a capa pelo botão do editor.
    for (let i = 0; i < selecionadas.length; i++) {
      const item = selecionadas[i]
      const posicao = `[${i + 1}/${selecionadas.length}]`

      setStatusMensagem(`${posicao} Redigindo o artigo (~1500 palavras): "${item.titulo}"...`)

      const resp = await gerarPostCompletoComIaAction({
        titulo: item.titulo,
        tema: item.resumo,
        categoria,
        modeloId,
        publicarDireto: true,
      })

      if (!resp.ok || !resp.post) {
        geradosArray.push({
          titulo: item.titulo,
          slug: '',
          categoria,
          publicado: false,
          erro: resp.erro ?? 'Falha ao redigir o artigo.',
        })
        continue
      }

      const registro: PostCriadoResumo = {
        titulo: resp.post.titulo,
        slug: resp.post.slug,
        categoria: resp.post.categoria,
        publicado: Boolean(resp.publicado),
        // A action devolve `erro` mesmo com ok:true quando o texto foi gerado
        // mas o banco recusou a gravação. É o que permite a tela final dizer a
        // verdade em vez de "✅ Publicado" para todos.
        erro: resp.erro,
      }

      // Passo 2: só faz sentido se o post existe de fato no banco.
      if (resp.postCriadoId) {
        setStatusMensagem(`${posicao} Post publicado. Gerando a capa por IA: "${resp.post.titulo}"...`)

        const capa = await gerarCapaDoPostAction({
          postId: resp.postCriadoId,
          promptVisual: resp.post.promptVisualCapa,
          modeloImagemId,
        })

        if (capa.ok && capa.capaUrl) {
          registro.capaUrl = capa.capaUrl
          resp.post.capaUrl = capa.capaUrl
        } else {
          // Não é falha do post: ele está publicado, com a capa de reserva.
          registro.avisoCapa = capa.erro ?? 'A capa por IA não pôde ser gerada; ficou uma foto do banco.'
        }
      }

      geradosArray.push(registro)

      // Aplica o 1º no formulário de fundo por cortesia
      if (i === 0) onAplicarAoFormulario(resp.post)
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

  const publicadosOk = postsConcluidos.filter((p) => p.publicado).length

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
            {/* SELETOR DE MODO */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                ⚡ Modo de Criação
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setModoGeracao('tema')}
                  className={`cursor-pointer rounded-2xl border p-3 text-center text-xs font-bold transition-all ${
                    modoGeracao === 'tema'
                      ? 'border-amber-500 bg-amber-500/15 text-amber-900 dark:bg-amber-500/20 dark:text-amber-300 ring-2 ring-amber-500/30'
                      : 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400'
                  }`}
                >
                  💡 Por Tema ou Tendências
                </button>

                <button
                  type="button"
                  onClick={() => setModoGeracao('url')}
                  className={`cursor-pointer rounded-2xl border p-3 text-center text-xs font-bold transition-all ${
                    modoGeracao === 'url'
                      ? 'border-amber-500 bg-amber-500/15 text-amber-900 dark:bg-amber-500/20 dark:text-amber-300 ring-2 ring-amber-500/30'
                      : 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400'
                  }`}
                >
                  🔗 A partir de URL (Apify)
                </button>
              </div>
            </div>

            {/* SELETOR DE CATEGORIA */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                📂 Categoria do Post
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

            {/* CAMPO DEPENDENTE DO MODO */}
            {modoGeracao === 'url' ? (
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  🔗 Cole o Link da Notícia ou Rede Social (Apify Scraping)
                </label>
                <input
                  type="url"
                  value={urlFonte}
                  onChange={(e) => setUrlFonte(e.target.value)}
                  placeholder="https://techcrunch.com/... ou https://instagram.com/p/..."
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-all focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
                <p className="mt-1 text-[0.7rem] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Raspagem automática via <strong>Apify</strong>. Se for link de rede social com URL externa na legenda, o artigo completo de origem será extraído!
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  🎯 Tema ou Assunto (Opcional - Deixe em branco para notícias quentes)
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
            )}

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
                    {modoGeracao === 'url' ? 'Extraindo URL via Apify...' : 'Pesquisando tendências...'}
                  </>
                ) : (
                  <>
                    {modoGeracao === 'url' ? '🕸️ Extrair URL & Gerar 5 Sugestões' : '✨ Gerar 5 Sugestões de Posts'}
                  </>
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
              <div
                className={`flex h-14 w-14 items-center justify-center rounded-2xl text-3xl ${
                  publicadosOk === postsConcluidos.length
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                    : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                }`}
              >
                {publicadosOk === postsConcluidos.length ? '🎉' : '⚠️'}
              </div>
              <h4 className="text-lg font-black text-slate-900 dark:text-white">
                {publicadosOk === postsConcluidos.length
                  ? `${publicadosOk} Post(s) Criado(s) e Publicado(s) com Sucesso!`
                  : `${publicadosOk} de ${postsConcluidos.length} Post(s) Publicado(s)`}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {publicadosOk === postsConcluidos.length
                  ? 'Os artigos já estão disponíveis publicamente no seu blog e registrados no painel.'
                  : 'Os que falharam estão detalhados abaixo. O texto foi gerado, mas a gravação no banco não foi concluída.'}
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
                      {/* Este badge era fixo em "✅ Publicado" e ignorava o
                          resultado real. Com o INSERT falhando em silêncio, a
                          tela anunciava sucesso e oferecia um link 404. */}
                      <span
                        className={`rounded-full px-2 py-0.5 font-mono text-[0.65rem] font-bold ${
                          p.publicado
                            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                            : 'bg-rose-500/15 text-rose-700 dark:text-rose-300'
                        }`}
                      >
                        {p.publicado ? '✅ Publicado' : '⚠️ Não publicado'}
                      </span>
                      <span className="rounded-full bg-slate-200 px-2 py-0.5 font-mono text-[0.65rem] text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {p.categoria === 'fe' ? 'Fé' : 'Tecnologia'}
                      </span>
                    </div>
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
                      {p.titulo}
                    </h5>
                    {p.erro && (
                      <p className="text-[0.68rem] leading-snug text-rose-600 dark:text-rose-400">
                        {p.erro}
                      </p>
                    )}
                    {p.avisoCapa && (
                      <p className="text-[0.68rem] leading-snug text-amber-600 dark:text-amber-400">
                        🖼️ {p.avisoCapa}
                      </p>
                    )}
                  </div>

                  {/* Link só existe se a página existir. */}
                  {p.publicado && (
                    <Link
                      href={`/blog/${p.slug}`}
                      target="_blank"
                      className="shrink-0 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-600 hover:bg-amber-500/20 dark:text-amber-400"
                    >
                      🔗 Ver no Blog
                    </Link>
                  )}
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
