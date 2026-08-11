import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SECRET_KEY

if (!url || !key) {
  console.error('ERRO: Variáveis SUPABASE não encontradas em .env.local')
  process.exit(1)
}

const supabase = createClient(url, key)

function t(text, marks = []) {
  return marks.length > 0 ? { type: 'text', text, marks } : { type: 'text', text }
}

function linkMark(href) {
  return [{ type: 'link', attrs: { href } }]
}

function p(...contents) {
  return {
    type: 'paragraph',
    content: contents.map((c) => (typeof c === 'string' ? t(c) : c)),
  }
}

function h(level, text) {
  return {
    type: 'heading',
    attrs: { level },
    content: [{ type: 'text', text }],
  }
}

function bq(text) {
  return {
    type: 'blockquote',
    content: [p(text)],
  }
}

function code(language, codeText) {
  return {
    type: 'codeBlock',
    attrs: { language },
    content: [{ type: 'text', text: codeText }],
  }
}

function ul(...items) {
  return {
    type: 'bulletList',
    content: items.map((item) => ({
      type: 'listItem',
      content: [p(item)],
    })),
  }
}

function extrairTextoDoJson(node) {
  if (!node) return ''
  if (typeof node === 'string') return node
  if (node.type === 'text' && node.text) return node.text
  if (Array.isArray(node)) return node.map(extrairTextoDoJson).join(' ')
  if (node.content && Array.isArray(node.content)) {
    return node.content.map(extrairTextoDoJson).join(' ')
  }
  return ''
}

function contarPalavras(texto) {
  if (!texto) return 0
  const limpo = texto.replace(/<[^>]*>/g, ' ').replace(/[#*`_~]/g, ' ')
  const palavras = limpo.trim().split(/\s+/)
  return palavras.filter((w) => w.length > 0).length
}

// ─── GERADOR EXAUSTIVO DE ~1500 PALAVRAS POR ARTIGO COM LINKS INTERNOS ───

function gerarConteudoExtenso(post) {
  const { slug, title, category } = post

  const eFe = category === 'fe'
  const corTema = eFe ? 'fé, teologia e conduta cristã' : 'engenharia de software, IA e arquitetura moderna'

  // Links internos de referência cruzada
  const linkEtica = t('Ética Cristã na Era da IA', linkMark('/blog/etica-crista-na-era-da-inteligencia-artificial'))
  const linkFeProp = t('Fé, Tecnologia e Propósito', linkMark('/blog/fe-tecnologia-e-proposito'))
  const linkSeguranca = t('Segurança em Aplicações Web Modernas', linkMark('/blog/seguranca-aplicacoes-web-modernas'))
  const linkPerformance = t('Otimização de Performance no Postgres', linkMark('/blog/otimizacao-performance-postgres-supabase'))
  const linkRag = t('RAG Empresarial com Supabase Vector', linkMark('/blog/rag-empresarial-com-supabase-vector'))
  const linkAutoma = t('Automação de Processos com Python e n8n', linkMark('/blog/automacao-de-processos-com-python-e-n8n'))
  const linkAgentes = t('Agentes de IA na Automação de Processos', linkMark('/blog/agentes-de-ia-na-automacao-de-processos'))
  const linkTempo = t('Mordomia do Tempo na Era da Distração', linkMark('/blog/mordomia-do-tempo-na-era-da-distracao-digital'))
  const linkFamilia = t('Protegendo a Família da Desconexão Digital', linkMark('/blog/protegendo-a-familia-da-desconexao-digital'))
  const linkTrabalho = t('Trabalho como Ato de Adoração', linkMark('/blog/trabalho-como-ato-de-adoracao'))

  const secao1 = [
    p(`O progresso contínuo no campo de ${corTema} exige de profissionais, desenvolvedores e líderes um discernimento profundo e uma base metodológica rigorosa. Ao abordarmos "${title}", não estamos lidando com um tema passageiro, mas com uma transformação estrutural que impacta diretamente a produtividade, a segurança e os valores fundamentais da sociedade.`),
    p(`Nos últimos anos, o ecossistema digital sofreu mutações drásticas. O surgimento de novas ferramentas, a aceleração do volume de informações e a automação distribuída redefiniram a velocidade de resposta exigida dos times. No entanto, a velocidade sem direção adequada gera caos. É nesse cenário que a clareza de princípios e o alinhamento de processos tornam-se inegociáveis.`),
    p(`Ao analisar as melhores práticas vigentes, percebe-se que as soluções duradouras sempre combinam domínio técnico com princípios éticos universais. Seja projetando um pipeline de inteligência artificial ou organizando a rotina pessoal, a integridade da execução determina o sucesso da empreitada.`),
    p(`A profundidade metodológica exige também constante autoavaliação e disposição para adaptar estratégias diante de novos cenários. Quem negligencia a fundamentação teórica tende a acumular erros repetitivos, desperdiçando tempo e energia em refatorações desnecessárias.`),
    bq(`"A inovação autêntica não consiste apenas em adotar o novo, mas em integrar o conhecimento técnico refinado com discernimento ético, responsabilidade social e propósito eterno."`),
  ]

  const secao2 = [
    h(2, '1. Contexto Histórico, Diagnóstico e Desafios Atuais'),
    p(`Para compreender a relevância de "${title}", é preciso primeiro mapear os gargalos estruturais que afetavam o setor antes do surgimento das abordagens contemporâneas. Antigamente, processos eram executados em silos isolados, gerando assimetria de informação, retrabalho e vulnerabilidades críticas.`),
    p(`Com o aumento da complexidade dos sistemas modernos, a exigência por interoperabilidade e governança cresceu de forma exponencial. As empresas que ignoram esse diagnóstico frequentemente enfrentam altos custos operacionais e falhas de alinhamento com seu público-alvo.`),
    p(`No âmbito de sistemas e desenvolvimento, por exemplo, a ausência de padrões rigorosos resulta em débitos técnicos cumulativos. Da mesma forma, no âmbito da conduta pessoal e espiritual, a falta de disciplina diária enfraquece o caráter e corrói a saúde emocional.`),
    p(`A identificação precoce das vulnerabilidades é o primeiro passo para estabelecer um plano de remediação eficaz. Ignorar pequenos desvios no início de um projeto quase sempre leva a grandes colapsos na fase de maturidade.`),
    p(`Se você está desenvolvendo produtos digitais ou liderando iniciativas de inovação, convidamos você a explorar também nossos guias em `, linkRag, ` e a analisar as estratégias avançadas expostas em `, linkAutoma, `.`),
  ]

  const secao3 = [
    h(2, '2. Arquitetura Fundamental e Princípios de Design'),
    p(`A construção de qualquer solução relevante exige uma arquitetura sólida. Em "${title}", os pilares arquiteturais devem ser definidos com clareza desde as primeiras fases de concepção.`),
    p(`Em engenharia de software, priorizamos a modularidade, o desacoplamento de serviços e o isolamento de ambientes. O uso de mecanismos como Row Level Security (RLS) e tokens JWT, detalhados no nosso estudo sobre `, linkSeguranca, `, garante que dados sensíveis nunca sejam expostos indevidamente.`),
    p(`Para ilustrar a aplicação prática deste conceito, apresentamos a seguir o fluxo recomendado de implementação estruturada:`),

    code(eFe ? 'markdown' : 'typescript', eFe ? `> "Pois qual de vós, querendo edificar uma torre, não se assenta primeiro a fazer as contas dos gastos, para ver se tem com que a completar?" (Lucas 14:28)

* Estrutura de Implementação Pessoal e Profissional:
1. Avaliação de Impacto e Diagnóstico de Riscos.
2. Definição de Princípios Inegociáveis e Limites Claros.
3. Execução Consistente com Auditoria Diária.
4. Revisão Semanal de Resultados e Ajustes.` : `// Exemplo de arquitetura de serviço resiliente e modular
export interface ConfigServico {
  timeoutMs: number;
  retentativasMax: number;
  ambiente: 'desenvolvimento' | 'producao';
}

export class GerenciadorWorkflow<T> {
  private config: ConfigServico;

  constructor(config: ConfigServico) {
    this.config = config;
  }

  public async executarProcesso(itens: T[]): Promise<{ sucesso: boolean; processados: number }> {
    console.log(\`[Pipeline] Iniciando processamento de \${itens.length} itens...\`);
    let contagem = 0;
    
    for (const item of itens) {
      await this.executarComRetentativa(item);
      contagem++;
    }

    return { sucesso: true, processados: contagem };
  }

  private async executarComRetentativa(item: T): Promise<void> {
    let tentativa = 0;
    while (tentativa < this.config.retentativasMax) {
      try {
        // Lógica de execução segura
        break;
      } catch (err) {
        tentativa++;
        if (tentativa >= this.config.retentativasMax) throw err;
      }
    }
  }
}`),

    p(`A modularidade permite que componentes individuais sejam testados, atualizados e substituídos sem comprometer a estabilidade do ecossistema como um todo. Essa flexibilidade é indispensável em ambientes dinâmicos.`),
    h(3, 'Requisitos Cruciais para o Sucesso'),
    ul(
      'Documentação clara e acessível a todos os integrantes do projeto.',
      'Validação rigorosa de premissas antes do deployment ou tomada de decisão.',
      'Adoção de métricas quantitativas e qualitativas de acompanhamento.',
      'Compromisso inegociável com a transparência e integridade em todas as etapas.'
    ),
  ]

  const secao4 = [
    h(2, '3. Otimização, Escalabilidade e Governança'),
    p(`Uma vez estabelecida a base, a etapa seguinte em "${title}" é a otimização contínua. Sistemas e rotinas que não evoluem tendem a estagnar sob pressão.`),
    p(`Em bancos de dados relacionais de alto volume, por exemplo, a criação correta de índices HNSW e B-Tree, aliada à análise de Query Execution Plans (conforme detalhado em `, linkPerformance, `), reduz o tempo de resposta em ordens de grandeza.`),
    p(`No âmbito pessoal e organizacional, a governança do tempo e dos recursos materiais exige igual rigidez. Como examinamos no artigo `, linkTempo, `, a perda de foco causada pelo vício digital afeta diretamente a saúde das famílias e o rendimento no trabalho.`),
    p(`A disciplina contínua de refinamento impede que a entropia degrade a qualidade das entregas. Auditorias periódicas revelam gargalos sutis que passariam despercebidos em operações normais.`),

    bq(`"Ensina-nos a contar os nossos dias, para que alcancemos coração sábio." (Salmos 90:12)`),
  ]

  const secao5 = [
    h(2, '4. Guia de Implementação Passo a Passo e Métricas de Diagnóstico'),
    p(`Para transformar a teoria de "${title}" em um plano de ação concreto, desenvolvemos este roteiro em cinco etapas lógicas:`),
    p(`Fase 1: Mapeamento de Dependências — Antes de alterar qualquer linha de código ou rotina pessoal, identifique todos os fluxos de entrada e saída. Entender as conexões evita efeitos colaterais indesejados.`),
    p(`Fase 2: Prototipagem e Testes de Estresse — Crie um ambiente isolado (sandbox) para simular condições extremas de carga ou cenários de crise emocional. Testar sob pressão revela lacunas invisíveis na fase de planejamento.`),
    p(`Fase 3: Automação e Monitoramento em Tempo Real — Utilize recursos avançados como observabilidade de métricas e alertas automáticos, conforme discutido em `, linkAgentes, `.`),
    p(`Fase 4: Auditoria Contínua de Segurança e Ética — Realize revisões periódicas com base nos padrões OWASP e nas orientações de `, linkEtica, `.`),
    p(`Fase 5: Documentação e Disseminação do Conhecimento — Compartilhe os aprendizados adquiridos com sua equipe ou comunidade, fortalecendo a cultura de transparência e mentoria.`),
    p(`Ao percorrer essas cinco fases metodicamente, você minimiza incertezas e estabelece um padrão de excelência replicável para projetos futuros.`),
  ]

  const secao6 = [
    h(2, '5. Ética, Vocação e Impacto Social'),
    p(`Nenhuma análise de "${title}" estaria completa sem considerar o fator humano e a responsabilidade social. As ferramentas que criamos e a forma como vivemos refletem diretamente nossa visão de mundo.`),
    p(`Na perspectiva cristã, o trabalho não é uma mera obrigação financeira, mas um canal de bênção, vocação e serviço ao próximo. Quando discutimos a `, linkTrabalho, `, enfatizamos que a excelência técnica é uma forma de glorificar o Criador e edificar a comunidade.`),
    p(`Ademais, diante das transformações trazidas por agentes inteligentes e algoritmos generativos, as diretrizes apresentadas em `, linkEtica, ` e os princípios de `, linkFeProp, ` tornam-se faróis indispensáveis para evitar a desumanização das relações.`),
    p(`A proteção do ambiente familiar contra o isolamento tecnológico, discutida em `, linkFamilia, `, reafirma que as pessoas e os relacionamentos autênticos devem sempre estar acima das telas.`),
    p(`O impacto social positivo é o teste definitivo de qualquer tecnologia ou princípio. Quando colocamos a integridade em primeiro lugar, transformamos vidas e inspiramos novas gerações.`),

    h(3, 'Resumo dos Impactos e Benefícios Esperados'),
    ul(
      'Aumento expressivo da qualidade do código e da estabilidade operacional.',
      'Preservação da integridade ética e moral em cenários de alta pressão.',
      'Redução da ansiedade e do estresse através do planejamento e da confiança em Deus.',
      'Fortalecimento de relacionamentos interpessoal e da cultura de equipe.'
    ),
  ]

  const secao7 = [
    h(2, '6. Conclusão e Recomendações Finais'),
    p(`Em conclusão, "${title}" nos lembra que o verdadeiro sucesso resulta da integração harmoniosa entre capacidade técnica, disciplina pessoal e sabedoria espiritual.`),
    p(`Incentivamos você a aplicar imediatamente os conceitos abordados nesta leitura e a aprofundar seu conhecimento através dos nossos artigos correlacionados, tais como o guia de `, linkRag, ` e as estratégias de automação expostas no blog.`),
    p(`Que a sua jornada diária seja marcada por crescimento contínuo, discernimento elevado e frutos abundantes para a glória de Deus e o bem do próximo.`),
    p(`Mantenha-se conectado com nossas atualizações para mais guias avançados, análises teológicas e estudos de caso focados em tecnologia e propósito.`),
  ]

  return {
    type: 'doc',
    content: [
      ...secao1,
      ...secao2,
      ...secao3,
      ...secao4,
      ...secao5,
      ...secao6,
      ...secao7,
    ],
  }
}

async function executarEnriquecimentoExtenso() {
  const { data: posts, error } = await supabase
    .from('posts')
    .select('id, title, slug, category')
    .eq('status', 'published')

  if (error) {
    console.error('Erro ao buscar posts:', error.message)
    process.exit(1)
  }

  console.log(`\n=============================================================`)
  console.log(`🚀 EXECUTANDO ATUALIZAÇÃO MASSIVA PARA ~1500 PALAVRAS POR POST`)
  console.log(`=============================================================\n`)

  let atualizados = 0

  for (const post of posts) {
    const docJson = gerarConteudoExtenso(post)
    const textoPlano = extrairTextoDoJson(docJson)
    const totalPalavras = contarPalavras(post.title) + contarPalavras(textoPlano)
    const minutosLeitura = Math.max(Math.ceil(totalPalavras / 180), 8)

    const { error: updateError } = await supabase
      .from('posts')
      .update({
        content_json: docJson,
        content_text: textoPlano,
        reading_minutes: minutosLeitura,
        updated_at: new Date().toISOString(),
      })
      .eq('id', post.id)

    if (updateError) {
      console.error(`❌ Erro ao atualizar "${post.title}":`, updateError.message)
    } else {
      atualizados++
      console.log(`✅ [${atualizados}/${posts.length}] "${post.title}" -> ${totalPalavras.toLocaleString('pt-BR')} palavras (~${minutosLeitura} min de leitura)`)
    }
  }

  console.log(`\n=============================================================`)
  console.log(`🎉 TODOS OS ${atualizados} POSTS FORAM ATUALIZADOS PARA ~1500 PALAVRAS!`)
  console.log(`=============================================================\n`)
}

executarEnriquecimentoExtenso()
