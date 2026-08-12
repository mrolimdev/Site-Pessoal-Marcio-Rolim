'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

import {
  gerarPostCompletoComIaAction,
  obter5OpcoesNoticiasQuentesAction,
  obterSugestoesDeTitulosAction,
  type OpcaoNoticiaQuente,
  type ResultadoPostIa,
  type SugestaoTitulo,
} from '@/actions/gerar-post-ia'
import { Categoria } from '@/lib/blog/constantes'

type Props = {
  aberto: boolean
  onFechar: () => void
  onAplicarAoFormulario: (resultado: ResultadoPostIa) => void
  categoriaAtual?: Categoria
}

export function ModalGeradorIa({
  aberto,
  onFechar,
  onAplicarAoFormulario,
  categoriaAtual = 'tecnologia',
}: Props) {
  const [apiKey, setApiKey] = useState('')
  const [modeloId, setModeloId] = useState('gemini-2.0-flash')

  const [tema, setTema] = useState('')
  const [categoria, setCategoria] = useState<Categoria>(categoriaAtual)

  const [passo, setPasso] = useState<'formulario' | 'opcoes_5' | 'titulos' | 'gerando_post'>('formulario')
  const [carregando, setCarregando] = useState(false)
  const [statusMensagem, setStatusMensagem] = useState('')
  const [erro, setErro] = useState<string | null>(null)

  // 5 Opções Quentes em 1 Clique
  const [opcoes5, setOpcoes5] = useState<OpcaoNoticiaQuente[]>([])
  const [opcoesSelecionadas, setOpcoesSelecionadas] = useState<number[]>([])

  const [sugestoesTitulos, setSugestoesTitulos] = useState<SugestaoTitulo[]>([])
  const [tituloSelecionado, setTituloSelecionado] = useState<string | null>(null)

  // Carrega a chave e o modelo selecionado no localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && aberto) {
      const salvaKey = localStorage.getItem('gemini_admin_api_key')
      const salvaMod = localStorage.getItem('gemini_admin_model_id')

      if (salvaKey) setApiKey(salvaKey)
      if (salvaMod) setModeloId(salvaMod)
    }
  }, [aberto])

  if (!aberto) return null

  // Passo A do 1-Clique: Buscar 5 Notícias Quentes no Apify/Google
  const handleBuscar5OpcoesUmClique = async () => {
    const apifyToken = typeof window !== 'undefined' ? localStorage.getItem('apify_admin_token') || undefined : undefined
    setErro(null)
    setCarregando(true)
    setStatusMensagem('⚡ Pesquisando as 5 principais notícias e tendências no Apify/Google...')

    const resp = await obter5OpcoesNoticiasQuentesAction({
      apiKeyInformada: apiKey,
      apifyTokenInformado: apifyToken,
      modeloId,
    })

    setCarregando(false)

    if (!resp.ok || !resp.opcoes || resp.opcoes.length === 0) {
      setErro(resp.erro || 'Não foi possível buscar as 5 opções de notícias quentes.')
      return
    }

    setOpcoes5(resp.opcoes)
    // Marca a primeira opção por padrão
    setOpcoesSelecionadas([resp.opcoes[0].id])
    setPasso('opcoes_5')
  }

  // Toggle de seleção de uma opção
  const toggleOpcao = (id: number) => {
    setOpcoesSelecionadas((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  // Toggle selecionar todas
  const toggleSelecionarTodas = () => {
    if (opcoesSelecionadas.length === opcoes5.length) {
      setOpcoesSelecionadas([])
    } else {
      setOpcoesSelecionadas(opcoes5.map((o) => o.id))
    }
  }

  // Passo B do 1-Clique: Gerar os posts selecionados
  const handleGerarPostsSelecionados = async () => {
    if (opcoesSelecionadas.length === 0) {
      setErro('Selecione pelo menos 1 opção de post para gerar.')
      return
    }

    const selecionadas = opcoes5.filter((o) => opcoesSelecionadas.includes(o.id))
    setErro(null)
    setCarregando(true)
    setPasso('gerando_post')

    let primeiroPostResult: ResultadoPostIa | null = null

    for (let i = 0; i < selecionadas.length; i++) {
      const item = selecionadas[i]
      setStatusMensagem(
        `[${i + 1}/${selecionadas.length}] Redigindo artigo extenso (~1500 palavras) e gerando capa com Imagen 3: "${item.titulo}"...`
      )

      const resp = await gerarPostCompletoComIaAction({
        titulo: item.titulo,
        tema: item.resumo,
        categoria: 'tecnologia',
        apiKeyInformada: apiKey,
        modeloId,
      })

      if (resp.ok && resp.post) {
        if (!primeiroPostResult) {
          primeiroPostResult = resp.post
        }
      }
    }

    setCarregando(false)

    if (primeiroPostResult) {
      onAplicarAoFormulario(primeiroPostResult)
      onFechar()
    } else {
      setErro('Falha ao gerar os posts selecionados.')
      setPasso('opcoes_5')
    }
  }

  // Handler do Passo 1 manual: Gerar Sugestões de Título
  const handleGerarTitulos = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tema.trim()) {
      setErro('Informe um tema ou assunto de interesse.')
      return
    }

    setErro(null)
    setCarregando(true)
    setStatusMensagem(`Consultando tendências no Google e gerando títulos com o modelo ${modeloId}...`)

    const resp = await obterSugestoesDeTitulosAction({
      tema,
      categoria,
      apiKeyInformada: apiKey,
      modeloId,
    })

    setCarregando(false)

    if (!resp.ok || !resp.sugestoes) {
      setErro(resp.erro || 'Não foi possível obter sugestões de títulos.')
      return
    }

    setSugestoesTitulos(resp.sugestoes)
    setPasso('titulos')
  }

  // Handler do Passo 2 manual: Gerar Post Completo
  const handleGerarPostCompleto = async (tituloEscolha: string) => {
    setTituloSelecionado(tituloEscolha)
    setErro(null)
    setCarregando(true)
    setPasso('gerando_post')
    setStatusMensagem(
      `Redigindo artigo extenso (~1500 palavras), imagem Imagen 3 e SEO com o modelo ${modeloId}...`
    )

    const resp = await gerarPostCompletoComIaAction({
      titulo: tituloEscolha,
      tema,
      categoria,
      apiKeyInformada: apiKey,
      modeloId,
    })

    setCarregando(false)

    if (!resp.ok || !resp.post) {
      setErro(resp.erro || 'Falha ao gerar o conteúdo completo do post.')
      setPasso('titulos')
      return
    }

    onAplicarAoFormulario(resp.post)
    onFechar()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md transition-opacity">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 sm:p-8">
        {/* Cabeçalho do Modal */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 text-xl text-amber-600 dark:text-amber-400">
              ✨
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Assistente de Criação de Post com IA
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

        {/* Mensagem de Erro se Houver */}
        {erro && (
          <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs font-semibold text-red-700 dark:border-red-500/40 dark:text-red-300">
            ⚠️ {erro}
          </div>
        )}

        {/* BOTÃO ATALHO RÁPIDO DE 1 CLIQUE */}
        {passo === 'formulario' && (
          <div className="mt-4 rounded-2xl border border-sky-500/30 bg-gradient-to-r from-sky-500/10 via-amber-500/10 to-orange-500/10 p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h4 className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span>⚡ Criação Automática com 1 Clique</span>
                </h4>
                <p className="text-[0.75rem] text-slate-600 dark:text-slate-400">
                  Busca 5 notícias quentes no Apify/Google e permite escolher 1 ou mais posts para criar.
                </p>
              </div>

              <button
                type="button"
                onClick={handleBuscar5OpcoesUmClique}
                disabled={carregando}
                className="cursor-pointer whitespace-nowrap rounded-xl bg-gradient-to-r from-sky-600 via-amber-600 to-orange-600 px-4 py-2.5 text-xs font-extrabold text-white shadow-md transition-all hover:scale-[1.02] disabled:opacity-50"
              >
                {carregando ? '🔍 Buscando 5 opções...' : '⚡ Buscar 5 Opções Quentes'}
              </button>
            </div>
          </div>
        )}

        {/* PASSO 5 OPÇÕES EM 1 CLIQUE (MULTI-SELEÇÃO) */}
        {passo === 'opcoes_5' && (
          <div className="mt-5 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Selecione 1 ou mais notícias para criar ({opcoesSelecionadas.length} selecionada{opcoesSelecionadas.length !== 1 ? 's' : ''}):
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Notícias e tendências em alta filtradas sem duplicações do banco.
                </p>
              </div>

              <button
                type="button"
                onClick={toggleSelecionarTodas}
                className="text-xs font-bold text-sky-600 hover:underline dark:text-sky-400"
              >
                {opcoesSelecionadas.length === opcoes5.length ? 'Desmarcar todas' : 'Selecionar todas'}
              </button>
            </div>

            <div className="flex flex-col gap-3 max-h-[340px] overflow-y-auto pr-1">
              {opcoes5.map((item) => {
                const selecionada = opcoesSelecionadas.includes(item.id)
                return (
                  <div
                    key={item.id}
                    onClick={() => toggleOpcao(item.id)}
                    className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-all ${
                      selecionada
                        ? 'border-sky-500 bg-sky-500/10 dark:border-sky-400 dark:bg-sky-500/15'
                        : 'border-slate-200 bg-slate-50/80 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950/60'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selecionada}
                      onChange={() => toggleOpcao(item.id)}
                      className="mt-1 h-4 w-4 rounded border-slate-300 accent-sky-600 dark:border-slate-700"
                    />

                    <div className="flex flex-1 flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <span className="rounded-full bg-sky-500/15 px-2 py-0.5 text-[0.65rem] font-bold text-sky-700 dark:text-sky-300">
                          🔥 Notícia em Alta #{item.id}
                        </span>
                        <span className="text-[0.7rem] font-semibold text-slate-400">
                          {selecionada ? '✓ Selecionado' : 'Clique para selecionar'}
                        </span>
                      </div>

                      <h5 className="text-sm font-extrabold text-slate-900 dark:text-white leading-snug">
                        {item.titulo}
                      </h5>

                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        {item.resumo}
                      </p>

                      <p className="text-[0.7rem] font-medium text-amber-600 dark:text-amber-400 mt-0.5">
                        💡 Tendência: {item.porQueEQuente}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setPasso('formulario')}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              >
                ← Voltar
              </button>

              <button
                type="button"
                onClick={handleGerarPostsSelecionados}
                disabled={carregando || opcoesSelecionadas.length === 0}
                className="cursor-pointer inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-sky-600 via-amber-600 to-orange-600 px-6 py-3 text-xs font-extrabold text-white shadow-lg transition-all hover:scale-105 disabled:opacity-50"
              >
                🚀 Criar {opcoesSelecionadas.length} Post{opcoesSelecionadas.length !== 1 ? 's' : ''} Selecionado{opcoesSelecionadas.length !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        )}

        {/* CONTEÚDO DINÂMICO DOS PASSOS */}
        {passo === 'formulario' && (
          <div className="mt-5 flex flex-col gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                🎯 Tema ou Assunto do Post (Ou use o botão acima)
              </label>
              <input
                type="text"
                value={tema}
                onChange={(e) => setTema(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleGerarTitulos(e)
                  }
                }}
                placeholder="Ex: RAG com Supabase Vector, ou Devocional na Rotina Intensa..."
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-all focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                📂 Área / Categoria Principal
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setCategoria('tecnologia')}
                  className={`cursor-pointer rounded-2xl border p-3.5 text-left text-xs font-bold transition-all ${
                    categoria !== 'fe'
                      ? 'border-sky-500 bg-sky-500/15 text-sky-800 dark:bg-sky-500/20 dark:text-sky-300'
                      : 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400'
                  }`}
                >
                  💻 Tecnologia, IA & Automação
                </button>

                <button
                  type="button"
                  onClick={() => setCategoria('fe')}
                  className={`cursor-pointer rounded-2xl border p-3.5 text-left text-xs font-bold transition-all ${
                    categoria === 'fe'
                      ? 'border-amber-500 bg-amber-500/15 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300'
                      : 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400'
                  }`}
                >
                  ✝️ Vida Cristã & Fé
                </button>
              </div>
            </div>

            <div className="mt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={onFechar}
                className="cursor-pointer rounded-2xl px-5 py-3 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleGerarTitulos}
                disabled={carregando || !tema.trim()}
                className="cursor-pointer inline-flex items-center gap-2 rounded-2xl bg-amber-600 px-6 py-3 text-xs font-bold text-white shadow-lg shadow-amber-500/20 transition-all hover:bg-amber-500 disabled:opacity-50"
              >
                {carregando ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Analisando com {modeloId}...
                  </>
                ) : (
                  <>🔍 Buscar Tendências & Gerar Títulos</>
                )}
              </button>
            </div>
          </div>
        )}

        {/* PASSO 2: SELEÇÃO DE TÍTULOS SUGERIDOS */}
        {passo === 'titulos' && (
          <div className="mt-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Selecione o Título Otimizado desejado:
              </h4>
              <button
                type="button"
                onClick={() => setPasso('formulario')}
                className="text-xs font-bold text-amber-600 hover:underline dark:text-amber-400"
              >
                ← Mudar tema
              </button>
            </div>

            <div className="flex flex-col gap-3 max-h-[340px] overflow-y-auto pr-1">
              {sugestoesTitulos.map((sug, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => handleGerarPostCompleto(sug.titulo)}
                  className="group/item flex cursor-pointer flex-col gap-1.5 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 text-left shadow-2xs transition-all hover:border-amber-500/50 hover:bg-amber-500/10 dark:border-slate-800 dark:bg-slate-950/60 dark:hover:border-amber-400 dark:hover:bg-amber-500/15"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                      Opção #{idx + 1}
                    </span>
                    <span className="text-[0.7rem] font-bold text-slate-400 group-hover/item:text-amber-600 dark:group-hover/item:text-amber-400">
                      Usar este título →
                    </span>
                  </div>
                  <h5 className="text-sm font-extrabold text-slate-900 dark:text-white leading-snug">
                    {sug.titulo}
                  </h5>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    💡 {sug.subtituloOuJustificativa}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* PASSO DE CARREGAMENTO INTENSO DA GERAÇÃO DO POST */}
        {passo === 'gerando_post' && (
          <div className="mt-8 flex flex-col items-center justify-center gap-4 py-8 text-center">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
            <div className="flex flex-col gap-1">
              <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                Redigindo o Post e Gerando Capa por IA...
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">{statusMensagem}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
