'use client'

import { useEffect, useState } from 'react'

import {
  testarChaveApifyAction,
  testarConfiguracaoModeloAction,
  validarEListarModelosGeminiAction,
  type ModeloGemini,
} from '@/actions/gerar-post-ia'
import { MODELOS_IMAGEM_DISPONIVEIS } from '@/lib/blog/constantes'

/**
 * Configuração da IA.
 *
 * O QUE MUDOU E POR QUÊ. Esta tela guardava a chave do Gemini e o token do
 * Apify em `localStorage`, e os mandava de volta ao servidor em cada action.
 * Segredo em `localStorage` é legível por qualquer JavaScript que rode na
 * página — um XSS no painel, ou uma extensão comprometida do navegador, levava
 * as duas chaves inteiras.
 *
 * Agora as chaves vivem só no ambiente do servidor (`GEMINI_API_KEY` e
 * `APIFY_API_TOKEN`). Esta tela nunca as vê: recebe do Server Component apenas
 * um booleano dizendo se estão presentes, e as actions leem o valor direto do
 * ambiente.
 *
 * O que CONTINUA no `localStorage` é a escolha de modelo — que não é segredo,
 * é preferência, e serve para o modal do editor abrir já no modelo certo.
 */

const CHAVE_MODELO_TEXTO = 'gemini_admin_model_id'
const CHAVE_MODELO_IMAGEM = 'gemini_admin_image_model_id'

type Props = {
  geminiConfigurada: boolean
  apifyConfigurado: boolean
}

export function ConfiguracoesIaClient({ geminiConfigurada, apifyConfigurado }: Props) {
  const [modelos, setModelos] = useState<ModeloGemini[]>([])
  const [modeloSelecionado, setModeloSelecionado] = useState<string>('gemini-2.0-flash')
  const [modeloImagemSelecionado, setModeloImagemSelecionado] = useState<string>(
    'imagen-3.0-generate-002',
  )

  const [apifyStatus, setApifyStatus] = useState<{ usuario?: string; plano?: string } | null>(null)

  const [validando, setValidando] = useState(false)
  const [validandoApify, setValidandoApify] = useState(false)
  const [testando, setTestando] = useState(false)

  const [erro, setErro] = useState<string | null>(null)
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null)

  const handleSelecionarModeloTexto = (id: string) => {
    setModeloSelecionado(id)
    localStorage.setItem(CHAVE_MODELO_TEXTO, id)
  }

  const handleSelecionarModeloImagem = (id: string) => {
    setModeloImagemSelecionado(id)
    localStorage.setItem(CHAVE_MODELO_IMAGEM, id)
  }

  const handleListarModelos = async () => {
    setErro(null)
    setMensagemSucesso(null)
    setValidando(true)

    const resp = await validarEListarModelosGeminiAction()
    setValidando(false)

    if (!resp.ok || !resp.modelos) {
      setErro(resp.erro || 'Falha ao consultar os modelos do Gemini.')
      setModelos([])
      return
    }

    setModelos(resp.modelos)

    const salvo = localStorage.getItem(CHAVE_MODELO_TEXTO) || modeloSelecionado
    const alvo = resp.modelos.some((m) => m.id === salvo)
      ? salvo
      : (resp.modelos.find((m) => m.eRecomendado) ?? resp.modelos[0])?.id

    if (alvo) handleSelecionarModeloTexto(alvo)

    setMensagemSucesso(
      `Chave do Gemini válida! ${resp.modelos.length} modelos disponíveis na sua conta.`,
    )
  }

  const handleValidarApify = async () => {
    setErro(null)
    setValidandoApify(true)

    const resp = await testarChaveApifyAction()
    setValidandoApify(false)

    if (!resp.ok) {
      setApifyStatus(null)
      setErro(resp.erro || 'Falha ao validar o token do Apify.')
      return
    }

    setApifyStatus({ usuario: resp.usuario, plano: resp.plano })
  }

  const handleTestar = async (e: React.FormEvent) => {
    e.preventDefault()

    setErro(null)
    setMensagemSucesso(null)
    setTestando(true)

    const resp = await testarConfiguracaoModeloAction({
      modeloId: modeloSelecionado,
      modeloImagemId: modeloImagemSelecionado,
    })

    setTestando(false)

    if (!resp.ok) {
      setErro(resp.erro || 'Falha no teste de comunicação com o modelo selecionado.')
      return
    }

    setMensagemSucesso(`🎉 ${resp.mensagem} Preferências de modelo salvas neste navegador.`)
  }

  // Depois dos handlers, de propósito: o efeito chama dois deles, e declarar o
  // efeito antes deixaria a leitura dependendo de hoisting.
  useEffect(() => {
    const modSalvo = localStorage.getItem(CHAVE_MODELO_TEXTO)
    const modImgSalvo = localStorage.getItem(CHAVE_MODELO_IMAGEM)

    if (modSalvo) setModeloSelecionado(modSalvo)
    if (modImgSalvo) setModeloImagemSelecionado(modImgSalvo)

    // Migração silenciosa. A chave do Gemini e o token do Apify ficavam aqui em
    // versões anteriores desta tela — remover é PARTE da correção: enquanto o
    // valor antigo continuar no navegador, o segredo segue exposto mesmo com a
    // tela nova no ar.
    localStorage.removeItem('gemini_admin_api_key')
    localStorage.removeItem('apify_admin_token')

    if (geminiConfigurada) void handleListarModelos()
    if (apifyConfigurado) void handleValidarApify()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="flex flex-col gap-6">
      {/* CABEÇALHO */}
      <div className="flex flex-col gap-2 rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-sm backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/80">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 text-2xl text-amber-600 dark:text-amber-400">
            ⚙️
          </span>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Configurações de IA &amp; Web Scraping
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              As chaves ficam no ambiente do servidor. Aqui você confere o status e escolhe os
              modelos de texto e imagem.
            </p>
          </div>
        </div>
      </div>

      {/* ALERTAS */}
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

      <form onSubmit={handleTestar} className="flex flex-col gap-6">
        {/* CARD 1: STATUS DAS CREDENCIAIS */}
        <div className="flex flex-col gap-4 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              🔐 1. Credenciais (variáveis de ambiente)
            </h2>
          </div>

          <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            As chaves nunca chegam ao navegador. Defina-as em <code>.env.local</code> para
            desenvolvimento e em <strong>Project Settings › Environment Variables</strong> na
            Vercel para produção — e faça um novo deploy, porque variáveis novas não valem para
            builds já executados.
          </p>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <LinhaCredencial
              nome="GEMINI_API_KEY"
              rotulo="Google Gemini (redação e imagem)"
              configurada={geminiConfigurada}
              detalhe={modelos.length > 0 ? `${modelos.length} modelos ativos` : undefined}
              acao={{
                rotulo: validando ? 'Validando...' : '🔍 Validar & listar modelos',
                onClick: handleListarModelos,
                desabilitada: !geminiConfigurada || validando,
              }}
            />

            <LinhaCredencial
              nome="APIFY_API_TOKEN"
              rotulo="Apify (scraping de notícias e URLs)"
              configurada={apifyConfigurado}
              detalhe={apifyStatus ? `${apifyStatus.usuario} · ${apifyStatus.plano}` : undefined}
              acao={{
                rotulo: validandoApify ? 'Validando...' : '⚡ Validar token',
                onClick: handleValidarApify,
                desabilitada: !apifyConfigurado || validandoApify,
              }}
            />
          </div>
        </div>

        {/* CARD 2: MODELOS DE TEXTO */}
        {modelos.length > 0 && (
          <div className="animate-fade-in flex flex-col gap-4 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                📝 2. Modelo padrão para redação de texto
              </h2>
              <span className="font-mono text-xs text-slate-400">
                {modelos.length} modelos ativos
              </span>
            </div>

            <div className="flex max-h-[300px] flex-col gap-2.5 overflow-y-auto pr-1">
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
                    <div className="flex min-w-0 items-center gap-3">
                      <input
                        type="radio"
                        name="modelo_ia"
                        checked={selecionado}
                        onChange={() => handleSelecionarModeloTexto(mod.id)}
                        className="h-4 w-4 accent-amber-500"
                      />
                      <div className="flex min-w-0 flex-col">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            {mod.nome}
                          </span>
                          <span className="font-mono text-[0.7rem] text-slate-400">({mod.id})</span>
                          {mod.eRecomendado && (
                            <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 font-mono text-[0.65rem] font-extrabold text-amber-700 dark:text-amber-300">
                              ⭐ RECOMENDADO
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 truncate text-[0.75rem] text-slate-500 dark:text-slate-400">
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

        {/* CARD 3: MODELO DE IMAGEM */}
        <div className="flex flex-col gap-4 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              🖼️ 3. Modelo padrão para geração de imagem
            </h2>
            <span className="font-mono text-xs text-slate-400">Google Imagen 3</span>
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
                      ? 'border-amber-500 bg-amber-500/10 shadow-sm ring-2 ring-amber-500/30 dark:bg-amber-500/15'
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

        {/* TESTAR */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={testando || !geminiConfigurada || !modeloSelecionado}
            className="inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-amber-600 px-7 py-3.5 font-mono text-xs font-bold text-white shadow-lg shadow-amber-500/20 transition-all hover:bg-amber-500 disabled:opacity-50"
          >
            {testando ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Testando conexão com os modelos...
              </>
            ) : (
              <>💾 Salvar preferências &amp; testar conexão</>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

function LinhaCredencial({
  nome,
  rotulo,
  configurada,
  detalhe,
  acao,
}: {
  nome: string
  rotulo: string
  configurada: boolean
  detalhe?: string
  acao: { rotulo: string; onClick: () => void; desabilitada: boolean }
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-950/40">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <code className="font-mono text-xs font-bold text-slate-900 dark:text-white">{nome}</code>
          <p className="mt-0.5 text-[0.72rem] text-slate-500 dark:text-slate-400">{rotulo}</p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 font-mono text-[0.65rem] font-bold ${
            configurada
              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
              : 'bg-slate-300/40 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
          }`}
        >
          {configurada ? '✅ DEFINIDA' : '— AUSENTE'}
        </span>
      </div>

      {detalhe && (
        <p className="font-mono text-[0.68rem] text-emerald-700 dark:text-emerald-300">{detalhe}</p>
      )}

      <button
        type="button"
        onClick={acao.onClick}
        disabled={acao.desabilitada}
        className="cursor-pointer self-start rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-xs font-bold text-amber-700 transition-colors hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-40 dark:text-amber-300"
      >
        {acao.rotulo}
      </button>
    </div>
  )
}
