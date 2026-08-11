'use client'

import { useEffect, useState } from 'react'

import {
  testarConfiguracaoModeloAction,
  validarEListarModelosGeminiAction,
  type ModeloGemini,
} from '@/actions/gerar-post-ia'

export function ConfiguracoesIaClient() {
  const [apiKey, setApiKey] = useState('')
  const [mostrarApiKey, setMostrarApiKey] = useState(false)

  const [modelos, setModelos] = useState<ModeloGemini[]>([])
  const [modeloSelecionado, setModeloSelecionado] = useState<string>('gemini-2.0-flash')

  const [validando, setValidando] = useState(false)
  const [testando, setTestando] = useState(false)

  const [erro, setErro] = useState<string | null>(null)
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null)

  // Carrega chave e modelo salvos do localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const keySalva = localStorage.getItem('gemini_admin_api_key')
      const modSalvo = localStorage.getItem('gemini_admin_model_id')

      if (keySalva) {
        setApiKey(keySalva)
        handleValidarEListarModelos(keySalva)
      }

      if (modSalvo) {
        setModeloSelecionado(modSalvo)
      }
    }
  }, [])

  // Passo 1: Validar Chave e Buscar Modelos
  const handleValidarEListarModelos = async (chaveUsar?: string) => {
    const key = chaveUsar ?? apiKey
    if (!key.trim()) {
      setErro('Por favor, insira a sua chave de API do Gemini (API Key).')
      return
    }

    setErro(null)
    setMensagemSucesso(null)
    setValidando(true)

    const resp = await validarEListarModelosGeminiAction(key)
    setValidando(false)

    if (!resp.ok || !resp.modelos) {
      setErro(resp.erro || 'Falha ao validar chave de API.')
      setModelos([])
      return
    }

    setModelos(resp.modelos)

    const existe = resp.modelos.some((m) => m.id === modeloSelecionado)
    if (!existe && resp.modelos.length > 0) {
      const recomendado = resp.modelos.find((m) => m.eRecomendado) || resp.modelos[0]
      setModeloSelecionado(recomendado.id)
    }

    setMensagemSucesso(`Chave de API válida! ${resp.modelos.length} modelos Gemini disponíveis na sua conta.`)
  }

  // Passo 2: Salvar e Testar Configuração
  const handleSalvarETestar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!apiKey.trim()) {
      setErro('Informe uma chave de API válida.')
      return
    }

    if (!modeloSelecionado) {
      setErro('Selecione um modelo de IA na lista.')
      return
    }

    setErro(null)
    setMensagemSucesso(null)
    setTestando(true)

    const resp = await testarConfiguracaoModeloAction({
      apiKeyInformada: apiKey,
      modeloId: modeloSelecionado,
    })

    setTestando(false)

    if (!resp.ok) {
      setErro(resp.erro || 'Falha ao realizar o teste de comunicação com o modelo selecionado.')
      return
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem('gemini_admin_api_key', apiKey.trim())
      localStorage.setItem('gemini_admin_model_id', modeloSelecionado)
    }

    setMensagemSucesso(
      `🎉 ${resp.mensagem} Chave e Modelo salvos com sucesso!`
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* CABEÇALHO DA PÁGINA */}
      <div className="flex flex-col gap-2 rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-sm backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/80">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 text-2xl text-amber-600 dark:text-amber-400">
            ⚙️
          </span>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Configurações da API de IA (Google Gemini)
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Valide sua chave de API, visualize os modelos ativos e defina o modelo recomendado para criar artigos do Blog.
            </p>
          </div>
        </div>
      </div>

      {/* ALERTAS DE SUCESSO E ERRO */}
      {mensagemSucesso && (
        <div className="animate-fade-in flex items-center gap-3 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm font-semibold text-emerald-800 dark:border-emerald-500/50 dark:bg-emerald-500/15 dark:text-emerald-300">
          <span className="text-xl">✅</span>
          <p>{mensagemSucesso}</p>
        </div>
      )}

      {erro && (
        <div className="animate-fade-in flex items-center gap-3 rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm font-semibold text-rose-800 dark:border-rose-500/50 dark:bg-rose-500/15 dark:text-rose-300">
          <span className="text-xl">⚠️</span>
          <p>{erro}</p>
        </div>
      )}

      <form onSubmit={handleSalvarETestar} className="flex flex-col gap-6">
        {/* CARD 1: VALIDAÇÃO DA CHAVE */}
        <div className="flex flex-col gap-4 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              1. Chave da API Gemini (API Key)
            </h2>
            <button
              type="button"
              onClick={() => setMostrarApiKey(!mostrarApiKey)}
              className="cursor-pointer text-xs font-bold text-amber-600 hover:underline dark:text-amber-400"
            >
              {mostrarApiKey ? '👁️ Ocultar' : '👁️ Mostrar'}
            </button>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              type={mostrarApiKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Digite sua Gemini API Key (ex: AIzaSy...)"
              className="w-full flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs text-slate-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              required
            />
            <button
              type="button"
              onClick={() => handleValidarEListarModelos()}
              disabled={validando || !apiKey.trim()}
              className="cursor-pointer whitespace-nowrap rounded-2xl border border-amber-500/40 bg-amber-500/10 px-5 py-2.5 text-xs font-bold text-amber-700 hover:bg-amber-500/20 disabled:opacity-50 dark:text-amber-300"
            >
              {validando ? 'Validando...' : '🔍 Validar Chave & Listar Modelos'}
            </button>
          </div>
        </div>

        {/* CARD 2: LISTA RESUMIDA DE MODELOS COM RECOMENDADOS */}
        {modelos.length > 0 && (
          <div className="animate-fade-in flex flex-col gap-4 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                2. Modelos Disponíveis (Selecione o desejado):
              </h2>
              <span className="text-xs text-slate-400 font-mono">
                {modelos.length} modelos ativos
              </span>
            </div>

            <div className="flex flex-col gap-2.5 max-h-[380px] overflow-y-auto pr-1">
              {modelos.map((mod) => {
                const selecionado = modeloSelecionado === mod.id

                return (
                  <label
                    key={mod.id}
                    onClick={() => setModeloSelecionado(mod.id)}
                    className={`flex cursor-pointer items-center justify-between gap-4 rounded-2xl border p-3.5 transition-all ${
                      selecionado
                        ? 'border-amber-500 bg-amber-500/10 shadow-sm dark:bg-amber-500/15'
                        : 'border-slate-200 bg-slate-50/50 hover:border-slate-300 dark:border-slate-800/80 dark:bg-slate-950/40 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <input
                        type="radio"
                        name="modelo_ia"
                        checked={selecionado}
                        onChange={() => setModeloSelecionado(mod.id)}
                        className="h-4 w-4 accent-amber-500"
                      />
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            {mod.nome}
                          </span>
                          <span className="font-mono text-[0.7rem] text-slate-400">
                            ({mod.id})
                          </span>
                          {mod.eRecomendado && (
                            <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 font-mono text-[0.65rem] font-extrabold text-amber-700 dark:text-amber-300">
                              ⭐ RECOMENDADO PARA POSTS
                            </span>
                          )}
                        </div>
                        <p className="truncate text-[0.75rem] text-slate-500 dark:text-slate-400 mt-0.5">
                          {mod.descricao}
                        </p>
                      </div>
                    </div>

                    <div className="hidden shrink-0 text-right font-mono text-[0.7rem] text-slate-400 sm:block">
                      <div>Input: {(mod.limiteTokensInput / 1000).toFixed(0)}k</div>
                      <div>Output: {(mod.limiteTokensOutput / 1000).toFixed(0)}k</div>
                    </div>
                  </label>
                )
              })}
            </div>
          </div>
        )}

        {/* BOTÃO SALVAR E TESTAR */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={testando || !apiKey.trim() || !modeloSelecionado}
            className="cursor-pointer inline-flex items-center gap-2 rounded-2xl bg-amber-600 px-7 py-3.5 font-mono text-xs font-bold text-white shadow-lg shadow-amber-500/20 transition-all hover:bg-amber-500 disabled:opacity-50"
          >
            {testando ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Testando Conexão com a API...
              </>
            ) : (
              <>💾 Salvar & Testar Modelo {modeloSelecionado}</>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
