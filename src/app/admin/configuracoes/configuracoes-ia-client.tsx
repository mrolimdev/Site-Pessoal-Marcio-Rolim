'use client'

import { useEffect, useState } from 'react'

import {
  testarChaveApifyAction,
  testarConfiguracaoModeloAction,
  validarEListarModelosGeminiAction,
  type ModeloGemini,
} from '@/actions/gerar-post-ia'
import { MODELOS_IMAGEM_DISPONIVEIS } from '@/lib/blog/constantes'

export function ConfiguracoesIaClient() {
  const [apiKey, setApiKey] = useState('')
  const [mostrarApiKey, setMostrarApiKey] = useState(false)

  const [apifyToken, setApifyToken] = useState('')
  const [mostrarApifyToken, setMostrarApifyToken] = useState(false)
  const [validandoApify, setValidandoApify] = useState(false)
  const [apifyStatus, setApifyStatus] = useState<{
    ok: boolean
    usuario?: string
    plano?: string
  } | null>(null)

  const [modelos, setModelos] = useState<ModeloGemini[]>([])
  const [modeloSelecionado, setModeloSelecionado] = useState<string>('gemini-2.0-flash')
  const [modeloImagemSelecionado, setModeloImagemSelecionado] = useState<string>('imagen-3.0-generate-002')

  const [validando, setValidando] = useState(false)
  const [testando, setTestando] = useState(false)

  const [erro, setErro] = useState<string | null>(null)
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null)

  // Carrega chaves e modelos salvos do localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const keySalva = localStorage.getItem('gemini_admin_api_key')
      const modSalvo = localStorage.getItem('gemini_admin_model_id')
      const modImgSalvo = localStorage.getItem('gemini_admin_image_model_id')
      const apifySalvo = localStorage.getItem('apify_admin_token')

      if (modSalvo) {
        setModeloSelecionado(modSalvo)
      }

      if (modImgSalvo) {
        setModeloImagemSelecionado(modImgSalvo)
      }

      if (keySalva) {
        setApiKey(keySalva)
        handleValidarEListarModelos(keySalva)
      }

      if (apifySalvo) {
        setApifyToken(apifySalvo)
        handleValidarApify(apifySalvo)
      }
    }
  }, [])

  // Handler para trocar modelo de texto e salvar imediatamente
  const handleSelecionarModeloTexto = (id: string) => {
    setModeloSelecionado(id)
    if (typeof window !== 'undefined') {
      localStorage.setItem('gemini_admin_model_id', id)
    }
  }

  // Handler para trocar modelo de imagem e salvar imediatamente
  const handleSelecionarModeloImagem = (id: string) => {
    setModeloImagemSelecionado(id)
    if (typeof window !== 'undefined') {
      localStorage.setItem('gemini_admin_image_model_id', id)
    }
  }

  // Passo 1: Validar Chave e Buscar Modelos Gemini
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

    // Respeita estritamente o modelo salvo no localStorage ou estado atual
    const salvoNoStorage = typeof window !== 'undefined' ? localStorage.getItem('gemini_admin_model_id') : null
    const modeloAlvo = salvoNoStorage || modeloSelecionado

    const existe = resp.modelos.some((m) => m.id === modeloAlvo)
    if (existe) {
      setModeloSelecionado(modeloAlvo)
      if (typeof window !== 'undefined') {
        localStorage.setItem('gemini_admin_model_id', modeloAlvo)
      }
    } else if (resp.modelos.length > 0) {
      const recomendado = resp.modelos.find((m) => m.eRecomendado) || resp.modelos[0]
      setModeloSelecionado(recomendado.id)
      if (typeof window !== 'undefined') {
        localStorage.setItem('gemini_admin_model_id', recomendado.id)
      }
    }

    setMensagemSucesso(`Chave do Gemini válida! ${resp.modelos.length} modelos Gemini disponíveis na sua conta.`)
  }

  // Passo 2: Validar Chave do Apify
  const handleValidarApify = async (tokenUsar?: string) => {
    const token = tokenUsar ?? apifyToken
    if (!token.trim()) {
      setErro('Por favor, insira um Token de API do Apify.')
      return
    }

    setErro(null)
    setValidandoApify(true)

    const resp = await testarChaveApifyAction(token)
    setValidandoApify(false)

    if (!resp.ok) {
      setApifyStatus(null)
      setErro(resp.erro || 'Falha ao validar token do Apify.')
      return
    }

    setApifyStatus({
      ok: true,
      usuario: resp.usuario,
      plano: resp.plano,
    })

    if (typeof window !== 'undefined') {
      localStorage.setItem('apify_admin_token', token.trim())
    }

    setMensagemSucesso(`✅ Token do Apify validado com sucesso! Conta ativa: ${resp.usuario} (${resp.plano})`)
  }

  // Passo 3: Salvar e Testar Configuração Geral
  const handleSalvarETestar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!apiKey.trim()) {
      setErro('Informe uma chave de API válida para o Gemini.')
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
      modeloImagemId: modeloImagemSelecionado,
    })

    setTestando(false)

    if (!resp.ok) {
      setErro(resp.erro || 'Falha ao realizar o teste de comunicação com o modelo selecionado.')
      return
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem('gemini_admin_api_key', apiKey.trim())
      localStorage.setItem('gemini_admin_model_id', modeloSelecionado)
      localStorage.setItem('gemini_admin_image_model_id', modeloImagemSelecionado)

      if (apifyToken.trim()) {
        localStorage.setItem('apify_admin_token', apifyToken.trim())
      }
    }

    setMensagemSucesso(
      `🎉 ${resp.mensagem} Configurações salvas com sucesso!`
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
              Configurações de IA & Web Scraping (Gemini + Apify)
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Gerencie suas chaves de API, escolha os modelos de texto e imagem e conecte o Apify para busca de tendências em tempo real.
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
        {/* CARD 1: CHAVE DA API GEMINI */}
        <div className="flex flex-col gap-4 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>🤖 1. Chave da API Gemini (Google AI)</span>
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

        {/* CARD 2: CHAVE DA API DO APIFY */}
        <div className="flex flex-col gap-4 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>🌐 2. Token da API do Apify (Web Scraping de Notícias)</span>
              </h2>
              {apifyStatus?.ok && (
                <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 font-mono text-[0.65rem] font-bold text-emerald-700 dark:text-emerald-300">
                  ✅ CONECTADO ({apifyStatus.usuario})
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setMostrarApifyToken(!mostrarApifyToken)}
              className="cursor-pointer text-xs font-bold text-amber-600 hover:underline dark:text-amber-400"
            >
              {mostrarApifyToken ? '👁️ Ocultar' : '👁️ Mostrar'}
            </button>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            Permite extrair notícias atuais e artigos em tempo real da web para alimentar a criação de posts no blog. Obtenha seu token gratuito em <a href="https://apify.com" target="_blank" rel="noreferrer" className="text-amber-600 underline font-bold dark:text-amber-400">apify.com</a>.
          </p>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              type={mostrarApifyToken ? 'text' : 'password'}
              value={apifyToken}
              onChange={(e) => setApifyToken(e.target.value)}
              placeholder="Digite seu Token do Apify (ex: apify_api_...)"
              className="w-full flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs text-slate-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            />
            <button
              type="button"
              onClick={() => handleValidarApify()}
              disabled={validandoApify || !apifyToken.trim()}
              className="cursor-pointer whitespace-nowrap rounded-2xl border border-sky-500/40 bg-sky-500/10 px-5 py-2.5 text-xs font-bold text-sky-700 hover:bg-sky-500/20 disabled:opacity-50 dark:text-sky-300"
            >
              {validandoApify ? 'Validando...' : '⚡ Validar Token Apify'}
            </button>
          </div>
        </div>

        {/* CARD 3: MODELOS DE REDAÇÃO DE TEXTO */}
        {modelos.length > 0 && (
          <div className="animate-fade-in flex flex-col gap-4 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                📝 3. Modelo Padrão para Redação de Texto (Gemini):
              </h2>
              <span className="text-xs text-slate-400 font-mono">
                {modelos.length} modelos ativos
              </span>
            </div>

            <div className="flex flex-col gap-2.5 max-h-[300px] overflow-y-auto pr-1">
              {modelos.map((mod) => {
                const selecionado = modeloSelecionado === mod.id

                return (
                  <label
                    key={mod.id}
                    onClick={() => handleSelecionarModeloTexto(mod.id)}
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
                        onChange={() => handleSelecionarModeloTexto(mod.id)}
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
                              ⭐ RECOMENDADO
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

        {/* CARD 4: MODELO DE GERAÇÃO DE IMAGEM (IMAGEN 3) */}
        <div className="flex flex-col gap-4 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              🖼️ 4. Modelo Padrão para Geração de Imagem (Imagen 3):
            </h2>
            <span className="text-xs text-slate-400 font-mono">
              Google Imagen 3
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {MODELOS_IMAGEM_DISPONIVEIS.map((imgMod) => {
              const selecionado = modeloImagemSelecionado === imgMod.id
              return (
                <div
                  key={imgMod.id}
                  onClick={() => handleSelecionarModeloImagem(imgMod.id)}
                  className={`flex cursor-pointer flex-col justify-between gap-2 rounded-2xl border p-4 transition-all ${
                    selecionado
                      ? 'border-amber-500 bg-amber-500/10 shadow-sm dark:bg-amber-500/15 ring-2 ring-amber-500/30'
                      : 'border-slate-200 bg-slate-50/50 hover:border-slate-300 dark:border-slate-800/80 dark:bg-slate-950/40'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="modelo_imagem_ia"
                      checked={selecionado}
                      onChange={() => handleSelecionarModeloImagem(imgMod.id)}
                      className="h-4 w-4 accent-amber-500"
                    />
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {imgMod.nome}
                    </span>
                  </div>
                  <p className="text-[0.72rem] text-slate-500 dark:text-slate-400">
                    {imgMod.descricao}
                  </p>
                </div>
              )
            })}
          </div>
        </div>

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
                Testando Conexão com os Modelos...
              </>
            ) : (
              <>💾 Salvar & Testar Configurações</>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

