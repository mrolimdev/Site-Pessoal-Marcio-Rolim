import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

import { obterIcone } from '@/components/icon-registry'
import {
  ArrowLeftIcon,
  BriefcaseIcon,
  GraduationCapIcon,
  HeartIcon,
  SparklesIcon,
  TargetIcon,
} from '@/components/icons'
import { ThemeToggle } from '@/components/theme-toggle'
import {
  BADGE_DISPONIBILIDADE,
  CARDS_HABILIDADES,
  CONTATOS,
  CURSOS_COMPLEMENTARES,
  CURSOS_TITULO,
  DATA_NASCIMENTO,
  DIFERENCIAIS,
  DIFERENCIAIS_TITULO,
  EXPERIENCIA_TITULO,
  EXPERIENCIAS,
  FERRAMENTAS,
  FERRAMENTAS_TITULO,
  FORMACAO_ACADEMICA,
  FORMACAO_TITULO,
  FOTO_PERFIL_URL,
  HABILIDADES_TITULO,
  HEADLINE,
  IDIOMAS,
  IDIOMAS_TITULO,
  INFORMACOES_PESSOAIS,
  INFORMACOES_PESSOAIS_TITULO,
  NOME,
  PROPOSITO_PARAGRAFOS,
  PROPOSITO_TITULO,
  calcularIdade,
  criarTagsTopo,
  type ChaveCorFerramenta,
  type EnfaseTexto,
  type ParagrafoProposito,
} from '@/content/curriculum'

import { PrintButton } from './print-button'
// Importado por ÚLTIMO e sem @layer: no Tailwind 4 as utilities vivem em
// @layer utilities, e CSS não-layered vence CSS layered. É o que faz as regras
// de impressão se sobreporem às utilities sem depender só de !important.
import './print.css'

export const metadata: Metadata = {
  title: 'Curriculum Vitae',
  description:
    'Curriculum Vitae de Marcio Rolim. Mais de 30 anos de experiência estratégica em tecnologia, especialista em IA, desenvolvimento e transformação digital.',
  alternates: { canonical: '/curriculum' },
  // Decisão do dono: o CV fica fora dos buscadores.
  robots: { index: false, follow: false },
}

const ENFASE: Record<EnfaseTexto, string> = {
  accent: 'text-amber-600 dark:text-amber-400',
  green: 'text-emerald-600 dark:text-emerald-400',
  white: 'text-slate-900 dark:text-white',
}

const COR_FERRAMENTA: Record<ChaveCorFerramenta, string> = {
  claude:
    'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-300 dark:border-orange-500/20',
  openai:
    'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20',
  gemini:
    'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/20',
  cursor:
    'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-500/10 dark:text-violet-300 dark:border-violet-500/20',
  antigravity:
    'bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-500/10 dark:text-cyan-300 dark:border-cyan-500/20',
  vibe: 'bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-500/10 dark:text-pink-300 dark:border-pink-500/20',
  websites:
    'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20',
  apps: 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-300 dark:border-indigo-500/20',
  agents:
    'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/20',
}

const CARD = 'bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50'
const TITULO_SECAO = 'text-slate-900 dark:text-white'

function CabecalhoSecao({
  titulo,
  gradiente,
  children,
  espacamento = 'mb-6',
}: {
  titulo: string
  gradiente: string
  children: React.ReactNode
  espacamento?: string
}) {
  return (
    <div className={`cv-section-head flex items-center gap-3 ${espacamento}`}>
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br shadow-lg ${gradiente}`}
      >
        {children}
      </div>
      <h2 className={`cv-section-title text-2xl font-bold ${TITULO_SECAO}`}>{titulo}</h2>
    </div>
  )
}

function BarraNivel({ percentual, gradiente }: { percentual: number; gradiente: string }) {
  return (
    <div className="cv-bar-track h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
      <div
        className={`cv-bar-fill h-full rounded-full ${gradiente}`}
        style={{ width: `${percentual}%` }}
      />
    </div>
  )
}

export default function CurriculumPage() {
  const idade = calcularIdade(DATA_NASCIMENTO)
  const tags = criarTagsTopo(idade)

  return (
    <div className="cv-root min-h-screen bg-stone-50 text-slate-800 transition-colors duration-500 dark:bg-slate-950 dark:text-slate-100">
      {/* Barra flutuante */}
      <div className="no-print fixed inset-x-4 top-4 z-50 mx-auto flex max-w-5xl items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-4 py-2.5 text-slate-600 shadow-xl backdrop-blur-xl transition-all hover:border-slate-400 hover:text-slate-900 dark:border-slate-700/50 dark:bg-slate-800/90 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:text-white"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          <span className="text-sm font-medium">Voltar</span>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <PrintButton />
        </div>
      </div>

      {/* Cabeçalho */}
      <header className="cv-header relative overflow-hidden">
        <div className="cv-deco absolute inset-0 bg-gradient-to-br from-white via-stone-50 to-emerald-50 transition-colors duration-500 dark:from-slate-900 dark:via-slate-900 dark:to-emerald-950" />
        <div className="cv-deco absolute inset-0 opacity-20">
          <div className="absolute top-20 left-10 h-72 w-72 rounded-full bg-amber-300/20 blur-3xl dark:bg-amber-500/20" />
          <div className="absolute right-10 bottom-10 h-96 w-96 rounded-full bg-emerald-300/15 blur-3xl dark:bg-emerald-500/10" />
        </div>

        <div className="cv-header-inner relative mx-auto max-w-5xl px-6 pt-24 pb-16 md:pt-28 md:pb-20">
          <div className="cv-header-row flex flex-col items-center gap-10 md:flex-row md:items-start">
            <div className="cv-photo animate-scale-in shrink-0">
              <div className="relative">
                <div className="cv-photo-frame h-40 w-40 rotate-3 overflow-hidden rounded-2xl shadow-2xl shadow-amber-500/10 ring-4 ring-amber-500/30 transition-transform duration-500 hover:rotate-0 md:h-48 md:w-48">
                  <Image
                    src={FOTO_PERFIL_URL}
                    alt={NOME}
                    width={192}
                    height={192}
                    priority
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="cv-badge absolute -right-2 -bottom-2 flex items-center gap-1.5 rounded-full bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white shadow-lg">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
                  {BADGE_DISPONIBILIDADE}
                </div>
              </div>
            </div>

            <div className="cv-identity animate-fade-in-up flex-1 text-center md:text-left">
              <h1 className="cv-name mb-2 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl dark:text-white">
                {NOME}
              </h1>
              <p className="cv-headline mb-4 text-xl font-semibold text-amber-600 dark:text-amber-400">
                {HEADLINE}
              </p>

              <div className="cv-tags mb-6 flex flex-wrap justify-center gap-3 md:justify-start">
                {tags.map((tag) => {
                  const Icone = obterIcone(tag.icone)
                  return (
                    <span
                      key={tag.id}
                      className="cv-tag flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white/80 px-3 py-1.5 text-sm text-slate-600 dark:border-slate-700/50 dark:bg-slate-800/60 dark:text-slate-400"
                    >
                      {Icone && <Icone className={`h-3.5 w-3.5 ${tag.corIcone}`} />} {tag.texto}
                    </span>
                  )
                })}
              </div>

              <div className="cv-contacts flex flex-wrap justify-center gap-3 md:justify-start">
                {CONTATOS.map((contato) => {
                  const Icone = obterIcone(contato.icone)
                  return (
                    <a
                      key={contato.id}
                      href={contato.href}
                      {...(contato.externo
                        ? { target: '_blank', rel: 'noopener noreferrer' }
                        : {})}
                      data-track="contato_click"
                      className={`cv-contact flex items-center gap-2 rounded-lg border border-slate-200/80 bg-white/60 px-4 py-2 text-sm text-slate-600 transition-all dark:border-slate-700/30 dark:bg-slate-800/40 dark:text-slate-300 ${contato.corHover}`}
                    >
                      {Icone && <Icone className="h-4 w-4" />} {contato.rotulo}
                    </a>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="cv-main mx-auto max-w-5xl space-y-16 px-6 py-12">
        {/* Propósito */}
        <section className="cv-section animate-fade-in-up">
          <CabecalhoSecao titulo={PROPOSITO_TITULO} gradiente="from-amber-500 to-orange-500 shadow-amber-500/20">
            <TargetIcon className="h-5 w-5 text-white" />
          </CabecalhoSecao>
          <div className="cv-card cv-purpose rounded-2xl border border-slate-200 bg-gradient-to-r from-white to-stone-50 p-6 md:p-8 dark:border-slate-700/50 dark:from-slate-800/80 dark:to-slate-800/40">
            {/* Anotado como ParagrafoProposito: o `as const` do módulo de conteúdo
                produz uma união em que só alguns segmentos têm `enfase`. */}
            {PROPOSITO_PARAGRAFOS.map((paragrafo: ParagrafoProposito, i) => (
              <p
                key={i}
                className={`text-base leading-relaxed text-slate-600 md:text-lg dark:text-slate-300 ${i > 0 ? 'mt-4' : ''}`}
              >
                {paragrafo.map((segmento, j) =>
                  segmento.enfase ? (
                    <strong key={j} className={ENFASE[segmento.enfase]}>
                      {segmento.texto}
                    </strong>
                  ) : (
                    <span key={j}>{segmento.texto}</span>
                  ),
                )}
              </p>
            ))}
          </div>
        </section>

        {/* Formação */}
        <section className="cv-section">
          <CabecalhoSecao titulo={FORMACAO_TITULO} gradiente="from-blue-500 to-indigo-600 shadow-blue-500/20">
            <GraduationCapIcon className="h-5 w-5 text-white" />
          </CabecalhoSecao>
          <div className={`cv-card cv-degree rounded-2xl border p-6 ${CARD}`}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="cv-degree-icon flex h-14 w-14 items-center justify-center rounded-xl border border-blue-500/20 bg-gradient-to-br from-blue-500/20 to-indigo-500/20">
                <GraduationCapIcon className="h-7 w-7 text-blue-400" />
              </div>
              <div>
                <h3 className={`cv-degree-name text-lg font-bold ${TITULO_SECAO}`}>
                  {FORMACAO_ACADEMICA.curso}
                </h3>
                <p className="cv-degree-year text-sm text-slate-500 dark:text-slate-400">
                  {FORMACAO_ACADEMICA.ano}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Cursos */}
        <section className="cv-section">
          <CabecalhoSecao titulo={CURSOS_TITULO} gradiente="from-teal-500 to-cyan-600 shadow-teal-500/20">
            <GraduationCapIcon className="h-5 w-5 text-white" />
          </CabecalhoSecao>
          <div className="cv-grid cv-grid-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {CURSOS_COMPLEMENTARES.map((curso) => (
              <div
                key={curso.nome}
                className={`cv-chipcard flex items-center gap-3 rounded-xl border px-4 py-3 ${CARD}`}
              >
                <span className="cv-chipcard-icon text-xl">{curso.emoji}</span>
                <span className="cv-chipcard-name text-sm font-medium text-slate-600 dark:text-slate-300">
                  {curso.nome}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Idiomas */}
        <section className="cv-section">
          <CabecalhoSecao titulo={IDIOMAS_TITULO} gradiente="from-sky-500 to-blue-600 shadow-sky-500/20">
            <SparklesIcon className="h-5 w-5 text-white" />
          </CabecalhoSecao>
          <div className="cv-grid cv-grid-2 grid gap-4 sm:grid-cols-2">
            {IDIOMAS.map((idioma) => (
              <div key={idioma.nome} className={`cv-card cv-lang rounded-xl border p-5 ${CARD}`}>
                <div className="cv-lang-head mb-3 flex items-center gap-3">
                  <span className="cv-langflag text-2xl">{idioma.bandeira}</span>
                  <div>
                    <h3 className={`cv-lang-name text-base font-bold ${TITULO_SECAO}`}>
                      {idioma.nome}
                    </h3>
                    <p className="cv-lang-level text-xs text-slate-500 dark:text-slate-400">
                      {idioma.nivel}
                    </p>
                  </div>
                </div>
                <BarraNivel percentual={idioma.percentual} gradiente={idioma.gradiente} />
              </div>
            ))}
          </div>
        </section>

        {/* Habilidades */}
        <section className="cv-section">
          <CabecalhoSecao titulo={HABILIDADES_TITULO} gradiente="from-emerald-500 to-teal-600 shadow-emerald-500/20">
            <SparklesIcon className="h-5 w-5 text-white" />
          </CabecalhoSecao>
          <div className="cv-grid cv-grid-2 grid gap-6 md:grid-cols-2">
            {CARDS_HABILIDADES.map((card) => {
              const Icone = obterIcone(card.icone)
              return (
                <div
                  key={card.titulo}
                  className={`cv-card cv-skillcard rounded-2xl border p-6 ${CARD}`}
                >
                  <div className="cv-card-head mb-5 flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-500/10">
                      {Icone && <Icone className={`h-4 w-4 ${card.corIcone}`} />}
                    </div>
                    <h3 className={`cv-card-title text-base font-bold ${TITULO_SECAO}`}>
                      {card.titulo}
                    </h3>
                  </div>
                  <div className="space-y-4">
                    {card.habilidades.map((habilidade) => (
                      <div key={habilidade.nome} className="cv-skill group">
                        <div className="mb-1.5 flex items-center justify-between">
                          <span className="cv-skill-name text-sm font-medium text-slate-700 dark:text-slate-300">
                            {habilidade.nome}
                          </span>
                          <span className="cv-skill-pct font-mono text-xs text-slate-400 dark:text-slate-500">
                            {habilidade.nivel}%
                          </span>
                        </div>
                        <BarraNivel
                          percentual={habilidade.nivel}
                          gradiente={habilidade.gradiente}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}

            {/* Ferramentas */}
            <div className={`cv-card cv-skillcard rounded-2xl border p-6 ${CARD}`}>
              <div className="cv-card-head mb-5 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10">
                  <SparklesIcon className="h-4 w-4 text-amber-400" />
                </div>
                <h3 className={`cv-card-title text-base font-bold ${TITULO_SECAO}`}>
                  {FERRAMENTAS_TITULO}
                </h3>
              </div>
              <div className="cv-chips flex flex-wrap gap-2">
                {FERRAMENTAS.map((ferramenta) => (
                  <span
                    key={ferramenta.nome}
                    className={`cv-chip rounded-lg border px-3 py-1.5 text-xs font-medium ${COR_FERRAMENTA[ferramenta.chaveCor]}`}
                  >
                    {ferramenta.nome}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Experiência */}
        <section className="cv-section cv-section--exp">
          <CabecalhoSecao
            titulo={EXPERIENCIA_TITULO}
            gradiente="from-amber-500 to-orange-600 shadow-amber-500/20"
            espacamento="mb-8"
          >
            <BriefcaseIcon className="h-5 w-5 text-white" />
          </CabecalhoSecao>
          <div className="cv-timeline space-y-0">
            {EXPERIENCIAS.map((exp, i) => (
              <div key={exp.empresa} className="cv-tl-item group relative pb-10 pl-8">
                {i < EXPERIENCIAS.length - 1 && (
                  <div className="cv-tl-line absolute top-8 left-[11px] h-full w-[2px] bg-gradient-to-b from-amber-500/50 to-transparent" />
                )}
                <div className="cv-tl-dot absolute top-1 left-0 flex h-6 w-6 items-center justify-center rounded-full border-2 border-amber-500 bg-white transition-colors duration-300 group-hover:bg-amber-500 dark:bg-slate-900">
                  <div className="h-2 w-2 rounded-full bg-amber-400 transition-colors duration-300 group-hover:bg-slate-900" />
                </div>
                <div
                  className={`cv-tl-card rounded-2xl border p-6 transition-all duration-300 hover:border-amber-500/30 ${CARD}`}
                >
                  <div className="cv-tl-meta mb-2 flex flex-wrap items-center gap-3">
                    <span className="cv-period rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 font-mono text-xs text-amber-600 dark:text-amber-400">
                      {exp.periodo}
                    </span>
                    <span className="cv-sep text-xs text-slate-400 dark:text-slate-500">•</span>
                    <span className="cv-company text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                      {exp.empresa}
                    </span>
                  </div>
                  <h3 className={`cv-role mb-2 text-lg font-bold ${TITULO_SECAO}`}>{exp.cargo}</h3>
                  <p className="cv-desc mb-3 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                    {exp.descricao}
                  </p>
                  <div className="cv-chips flex flex-wrap gap-2">
                    {exp.destaques.map((destaque) => (
                      <span
                        key={destaque}
                        className="cv-chip rounded-lg border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs text-slate-600 dark:border-slate-600/30 dark:bg-slate-700/50 dark:text-slate-300"
                      >
                        {destaque}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Informações pessoais */}
        <section className="cv-section">
          <CabecalhoSecao
            titulo={INFORMACOES_PESSOAIS_TITULO}
            gradiente="from-rose-500 to-pink-600 shadow-rose-500/20"
          >
            <HeartIcon className="h-5 w-5 text-white" />
          </CabecalhoSecao>
          <div className="cv-grid cv-grid-2 grid gap-6 md:grid-cols-2">
            {[INFORMACOES_PESSOAIS.slice(0, 3), INFORMACOES_PESSOAIS.slice(3)].map((grupo, i) => (
              <div key={i} className={`cv-card cv-info rounded-2xl border p-6 ${CARD}`}>
                <div className="space-y-4">
                  {grupo.map((info) => {
                    const Icone = obterIcone(info.icone)
                    return (
                      <div key={info.rotulo} className="cv-info-row flex items-start gap-3">
                        {Icone && (
                          <Icone className={`mt-0.5 h-5 w-5 shrink-0 ${info.corIcone}`} />
                        )}
                        <div>
                          <span className="cv-label text-xs tracking-wider text-slate-400 uppercase dark:text-slate-500">
                            {info.rotulo}
                          </span>
                          <p className="cv-value font-medium text-slate-700 dark:text-slate-200">
                            {info.valor}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Diferenciais */}
        <section className="cv-section">
          <CabecalhoSecao
            titulo={DIFERENCIAIS_TITULO}
            gradiente="from-cyan-500 to-blue-600 shadow-cyan-500/20"
          >
            <SparklesIcon className="h-5 w-5 text-white" />
          </CabecalhoSecao>
          <div className="cv-grid cv-grid-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {DIFERENCIAIS.map((item) => (
              <div
                key={item.titulo}
                className="cv-card cv-diff group rounded-2xl border border-slate-200 bg-white/80 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-cyan-500/30 hover:bg-white dark:border-slate-700/40 dark:bg-slate-800/40 dark:hover:bg-slate-800/60"
              >
                <div className="cv-diff-icon mb-3 text-3xl">{item.emoji}</div>
                <h3 className={`cv-diff-title mb-1.5 text-sm font-bold ${TITULO_SECAO}`}>
                  {item.titulo}
                </h3>
                <p className="cv-diff-desc text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                  {item.descricao}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="cv-footer border-t border-slate-200 px-6 py-10 dark:border-slate-800">
        <div className="mx-auto max-w-5xl text-center">
          <p className="mb-2 text-sm text-slate-400 dark:text-slate-500">
            © {new Date().getFullYear()} {NOME}.{' '}
            <Link href="/privacidade" className="underline-offset-4 hover:text-amber-400">
              Privacidade
            </Link>
          </p>
          <p className="text-xs text-amber-600/60 dark:text-amber-500/50">Eu creio em Deus.</p>
        </div>
      </footer>
    </div>
  )
}
