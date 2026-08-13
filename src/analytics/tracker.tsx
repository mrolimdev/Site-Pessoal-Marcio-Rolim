'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
import { KIND, ehRotaPrivada, enviar, optOut } from './client'
import type { EntradaEvento } from './shared'

/**
 * Captura de audiência. Um único componente, montado uma vez no layout do site,
 * DENTRO de um <Suspense> — `useSearchParams` sem Suspense joga a rota inteira
 * para renderização no cliente.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * Por que o estado mora no MÓDULO, e não em useRef
 * ────────────────────────────────────────────────────────────────────────────
 * Em desenvolvimento o React roda em StrictMode, que monta o componente, o
 * desmonta e o monta de novo. Um `useRef` é recriado nesse remonte, então um
 * guard baseado em ref começa zerado e o mesmo pageview sai duas vezes. O
 * escopo de módulo sobrevive ao remonte porque pertence ao módulo, não à
 * instância — e como este componente é singleton por definição, não há risco
 * de duas instâncias disputarem o mesmo estado.
 *
 * O guard compara o VALOR da URL, não um booleano "já enviei": é o valor que
 * distingue "remontaram o componente na mesma rota" de "o usuário navegou".
 */

/** URL do último pageview efetivamente enviado. Chave da deduplicação. */
let urlUltimoPageview: string | null = null

/**
 * `document.referrer` não muda em navegação de SPA: ele descreve como o
 * documento foi carregado. Mandá-lo em toda rota atribuiria a origem externa a
 * páginas internas. Vai só no primeiro pageview do carregamento.
 */
let refJaEnviado = false

// ── Engajamento ──────────────────────────────────────────────────────────────
// Tempo ATIVO: o cronômetro para quando a aba deixa de estar visível. Sem isso,
// uma aba esquecida aberta por seis horas viraria "sessão de seis horas".

let caminhoEngajamento: string | null = null
let buscaEngajamento = ''
let msAcumulados = 0
let inicioFatiaAtiva: number | null = null
let profundidadeMaxima = 0

/**
 * `analytics_ingest` faz `active_ms = active_ms + durationMs`. Como o
 * engajamento é enviado toda vez que a aba some — e a mesma aba pode sumir e
 * voltar muitas vezes — o que sai é sempre o DELTA desde o último envio.
 * Mandar o acumulado somaria a mesma permanência de novo a cada ocultação.
 */
let msJaEnviados = 0

/** Scroll vai absoluto: o banco resolve com `greatest()`, então reenviar é inócuo. */
let profundidadeJaEnviada = 0

function iniciarFatia() {
  if (inicioFatiaAtiva !== null) return
  if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return
  inicioFatiaAtiva = performance.now()
}

function pausarFatia() {
  if (inicioFatiaAtiva === null) return
  msAcumulados += performance.now() - inicioFatiaAtiva
  inicioFatiaAtiva = null
}

function descarregarEngajamento() {
  pausarFatia()
  if (caminhoEngajamento === null) return

  const total = Math.round(msAcumulados)
  const delta = total - msJaEnviados
  const ganhouScroll = profundidadeMaxima > profundidadeJaEnviada

  // Menos de um segundo novo e nenhuma profundidade nova não é informação:
  // é ruído que custa uma linha em analytics_event.
  if (delta < 1000 && !ganhouScroll) return

  enviar(KIND.engajamento, {
    name: 'engajamento',
    path: caminhoEngajamento,
    query: buscaEngajamento || undefined,
    durationMs: Math.max(0, delta),
    scrollDepth: profundidadeMaxima,
  })

  msJaEnviados = total
  profundidadeJaEnviada = profundidadeMaxima
}

function reiniciarEngajamento(caminho: string, busca: string) {
  caminhoEngajamento = caminho
  buscaEngajamento = busca
  msAcumulados = 0
  msJaEnviados = 0
  inicioFatiaAtiva = null
  profundidadeMaxima = 0
  profundidadeJaEnviada = 0
  iniciarFatia()
}

/**
 * Desliga a medição. Usado ao entrar no painel: `caminhoEngajamento = null` faz
 * `descarregarEngajamento()` sair na primeira linha, então nem o tempo nem a
 * rolagem do /admin viram evento — e, principalmente, não sobram no acumulador
 * para serem creditados na próxima página pública.
 */
function pararEngajamento() {
  caminhoEngajamento = null
  buscaEngajamento = ''
  msAcumulados = 0
  msJaEnviados = 0
  inicioFatiaAtiva = null
  profundidadeMaxima = 0
  profundidadeJaEnviada = 0
}

// ── Profundidade de rolagem ──────────────────────────────────────────────────
// Sentinelas + IntersectionObserver, e não um listener de scroll: ler
// scrollY/scrollHeight dentro de um handler de scroll força layout síncrono a
// cada pixel rolado, que é exatamente o padrão que produz travamento em
// celular. O IntersectionObserver faz a mesma conta fora da thread principal e
// só acorda nas quatro vezes que importam.

const MARCAS = [25, 50, 75, 100] as const

let containerSentinelas: HTMLDivElement | null = null
let sentinelas: HTMLDivElement[] = []
let observador: IntersectionObserver | null = null
let redimensionador: ResizeObserver | null = null
let alturaConhecida = 0

function marcaDe(elemento: Element): number {
  return Number((elemento as HTMLElement).dataset.marca ?? 0)
}

function aoIntersectar(entradas: IntersectionObserverEntry[]) {
  for (const entrada of entradas) {
    if (!entrada.isIntersecting) continue
    const marca = marcaDe(entrada.target)
    if (marca > profundidadeMaxima) profundidadeMaxima = marca
    // Marca atingida não volta atrás: parar de observar evita trabalho à toa.
    observador?.unobserve(entrada.target)
    sentinelas = sentinelas.filter((s) => s !== entrada.target)
  }
}

/**
 * Reposiciona as sentinelas ainda não atingidas em N% da ALTURA DO DOCUMENTO.
 *
 * O `top` é calculado em pixels, não em porcentagem de CSS: um filho absoluto
 * com `top: 50%` se mede contra o bloco contentor — que aqui é o bloco contentor
 * inicial, do tamanho da viewport — e daria 50% da janela, não da página.
 */
function reposicionar() {
  if (containerSentinelas === null) return

  const altura = document.documentElement.scrollHeight
  alturaConhecida = altura

  for (const sentinela of sentinelas) {
    observador?.unobserve(sentinela)
    const alvo = Math.round((altura * marcaDe(sentinela)) / 100)
    // -1px para a sentinela de 100% terminar exatamente no fim do documento,
    // em vez de esticá-lo em 1px e realimentar o ResizeObserver.
    sentinela.style.top = `${Math.max(0, alvo - 1)}px`
  }

  for (const sentinela of sentinelas) observador?.observe(sentinela)
}

function montarSentinelas() {
  const container = document.createElement('div')
  container.setAttribute('aria-hidden', 'true')
  // O atributo existe para o CSS poder esconder isto na impressão. As
  // sentinelas recebem `top` em pixels calculado sobre o scrollHeight DA TELA;
  // ao imprimir, o leiaute reflui para A4 mas esses deslocamentos permanecem,
  // e um `top: 3000px` estica o documento com páginas em branco no fim.
  // Custou 4 páginas fantasma no PDF do currículo até ser encontrado.
  container.dataset.mrSentinelas = ''
  container.style.cssText =
    'position:absolute;top:0;left:0;width:0;height:0;pointer-events:none;'

  sentinelas = MARCAS.map((marca) => {
    const sentinela = document.createElement('div')
    sentinela.dataset.marca = String(marca)
    sentinela.style.cssText =
      'position:absolute;left:0;width:1px;height:1px;pointer-events:none;'
    container.appendChild(sentinela)
    return sentinela
  })

  document.body.appendChild(container)
  containerSentinelas = container

  observador = new IntersectionObserver(aoIntersectar)

  // Página que cresce depois de renderizar (imagem carregando, conteúdo em
  // streaming) muda onde ficam os 50%. Sem isto, as marcas ficariam ancoradas
  // na altura do primeiro paint.
  redimensionador = new ResizeObserver(() => {
    if (document.documentElement.scrollHeight === alturaConhecida) return
    reposicionar()
  })
  redimensionador.observe(document.documentElement)

  // Depois do paint: medir a altura no mesmo tick em que a rota trocou pegaria
  // o documento ainda com o conteúdo da rota anterior.
  requestAnimationFrame(reposicionar)
}

function desmontarSentinelas() {
  observador?.disconnect()
  redimensionador?.disconnect()
  containerSentinelas?.remove()
  observador = null
  redimensionador = null
  containerSentinelas = null
  sentinelas = []
  alturaConhecida = 0
}

function reiniciarSentinelas() {
  if (containerSentinelas === null) return
  sentinelas = Array.from(containerSentinelas.children) as HTMLDivElement[]
  requestAnimationFrame(reposicionar)
}

// ── Cliques ──────────────────────────────────────────────────────────────────

function ehExterno(link: HTMLAnchorElement): boolean {
  const protocolo = link.protocol
  // mailto:, tel: e sms: também tiram a pessoa do site — contam como saída.
  if (protocolo === 'mailto:' || protocolo === 'tel:' || protocolo === 'sms:') return true
  if (protocolo !== 'http:' && protocolo !== 'https:') return false
  return link.host !== location.host
}

function rotulo(elemento: Element): string | undefined {
  const texto = (elemento.textContent ?? '').replace(/\s+/g, ' ').trim()
  return texto ? texto.slice(0, 120) : undefined
}

/**
 * UM listener, delegado, em `document`.
 *
 * `capture: true` para registrar o clique mesmo quando um handler intermediário
 * chama stopPropagation — na fase de captura o evento ainda está descendo.
 * `passive: true` promete ao browser que nada aqui chama preventDefault, o que
 * o libera para não esperar este handler antes de navegar.
 */
function aoClicar(evento: MouseEvent) {
  // O listener é montado uma vez, no efeito de infraestrutura, e sobrevive à
  // navegação de SPA — então a checagem tem de ser aqui, a cada clique, e não
  // na montagem. Sem ela, um clique dentro do painel ainda geraria evento.
  if (ehRotaPrivada(location.pathname)) return

  const alvo = evento.target
  if (!(alvo instanceof Element)) return

  const marcado = alvo.closest('[data-track]')
  if (marcado instanceof HTMLElement) {
    const nome = marcado.dataset.track
    if (nome) {
      enviar(KIND.custom, {
        name: nome.slice(0, 64),
        path: location.pathname,
        label: marcado.dataset.trackLabel?.slice(0, 120) ?? rotulo(marcado),
        href:
          marcado instanceof HTMLAnchorElement ? marcado.href.slice(0, 500) : undefined,
      })
      return
    }
  }

  const link = alvo.closest('a[href]')
  if (!(link instanceof HTMLAnchorElement)) return
  if (!ehExterno(link)) return

  enviar(KIND.custom, {
    name: 'saida_externa',
    path: location.pathname,
    href: link.href.slice(0, 500),
    label: rotulo(link),
  })
}

// ── Ciclo de vida da aba ─────────────────────────────────────────────────────

function aoMudarVisibilidade() {
  if (document.visibilityState === 'hidden') descarregarEngajamento()
  else iniciarFatia()
}

function aoEsconderPagina() {
  descarregarEngajamento()
}

function aoMostrarPagina(evento: PageTransitionEvent) {
  // Volta do cache de retrocesso (bfcache): a página não recarregou, o
  // cronômetro só precisa voltar a andar.
  if (evento.persisted) iniciarFatia()
}

export function Tracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Efeito de infraestrutura. Declarado ANTES do efeito de pageview porque o
  // React executa os efeitos na ordem de declaração: as sentinelas precisam
  // existir quando a primeira rota for registrada.
  useEffect(() => {
    if (optOut()) return

    montarSentinelas()

    document.addEventListener('visibilitychange', aoMudarVisibilidade)
    // `pagehide` e `visibilitychange` são o par confiável. `beforeunload` e
    // `unload` NÃO entram: em iOS e Android eles frequentemente não disparam —
    // o sistema descarta a aba sem avisar — e a simples presença de um listener
    // de `unload` torna a página inelegível para o bfcache.
    window.addEventListener('pagehide', aoEsconderPagina)
    window.addEventListener('pageshow', aoMostrarPagina)
    document.addEventListener('click', aoClicar, { capture: true, passive: true })

    // Religa o cronômetro. Necessário porque a limpeza deste mesmo efeito o
    // pausa: no remonte do StrictMode a sequência é setup → cleanup → setup, e
    // o segundo setup encontraria o relógio parado. O efeito de pageview não
    // resolveria, porque na volta ele cai no guard de URL e não reinicia nada.
    // Sem isto, em desenvolvimento o tempo ativo simplesmente pararia de contar
    // até a próxima troca de visibilidade.
    iniciarFatia()

    return () => {
      // Fecha a conta antes de perder os listeners: sem isto, uma navegação
      // dura no meio da sessão descartaria o tempo já acumulado.
      descarregarEngajamento()
      document.removeEventListener('visibilitychange', aoMudarVisibilidade)
      window.removeEventListener('pagehide', aoEsconderPagina)
      window.removeEventListener('pageshow', aoMostrarPagina)
      document.removeEventListener('click', aoClicar, { capture: true })
      desmontarSentinelas()
    }
  }, [])

  useEffect(() => {
    if (optOut()) return

    const busca = searchParams.toString()
    const url = busca ? `${pathname}?${busca}` : pathname

    // O guard que torna o StrictMode inofensivo.
    if (url === urlUltimoPageview) return

    // A página que está saindo fecha a conta dela antes de o alvo mudar — vale
    // inclusive quando o destino é o painel: o tempo na página pública anterior
    // foi real e precisa ser registrado antes de a medição parar.
    descarregarEngajamento()

    urlUltimoPageview = url

    // Painel e autenticação não são audiência. O servidor já descarta o que vem
    // dessas rotas (`ehInterno` + o descarte em `analytics_ingest`); o corte
    // aqui poupa uma requisição por navegação e, sobretudo, PARA o cronômetro.
    // Só ignorar o pageview não bastaria: o tempo gasto no painel continuaria
    // no acumulador e seria creditado à próxima página pública.
    if (ehRotaPrivada(pathname)) {
      pararEngajamento()
      return
    }

    reiniciarEngajamento(pathname, busca)
    reiniciarSentinelas()

    const evento: EntradaEvento = {
      path: pathname,
      query: busca || undefined,
      title: document.title.slice(0, 300),
      screen: window.screen ? `${window.screen.width}x${window.screen.height}` : undefined,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      language: navigator.language,
    }

    if (!refJaEnviado) {
      refJaEnviado = true
      if (document.referrer) evento.ref = document.referrer.slice(0, 1000)
    }

    enviar(KIND.pageview, evento)
  }, [pathname, searchParams])

  return null
}
