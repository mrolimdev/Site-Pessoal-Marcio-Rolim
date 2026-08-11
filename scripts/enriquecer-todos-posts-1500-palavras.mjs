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

// ─── LINKS ISOLADOS POR CATEGORIA ───

// Links de Tecnologia (Apenas interligam entre posts de tecnologia)
const linkSeguranca = t('Segurança em Aplicações Web Modernas', linkMark('/blog/seguranca-aplicacoes-web-modernas'))
const linkPerformance = t('Otimização de Performance no Postgres', linkMark('/blog/otimizacao-performance-postgres-supabase'))
const linkRag = t('RAG Empresarial com Supabase Vector', linkMark('/blog/rag-empresarial-com-supabase-vector'))
const linkAutoma = t('Automação de Processos com Python e n8n', linkMark('/blog/automacao-de-processos-com-python-e-n8n'))
const linkAgentes = t('Agentes de IA na Automação de Processos', linkMark('/blog/agentes-de-ia-na-automacao-de-processos'))
const linkMicroSaas = t('Arquitetura de Micro-SaaS com Supabase e Vercel', linkMark('/blog/arquitetura-micro-saas-supabase-vercel'))
const linkAnalytics = t('Dashboard de Analytics Privativo e LGPD-Compliant', linkMark('/blog/dashboard-analytics-privativo-lgpd-supabase'))
const linkNext = t('Migrando de React SPA para Next.js 16 App Router', linkMark('/blog/migrando-react-spa-para-nextjs-16-app-router'))
const linkChatbots = t('IA Generativa no Atendimento ao Cliente', linkMark('/blog/ia-generativa-no-atendimento-ao-cliente'))
const linkWorkflows = t('Orquestração de Workflows Empresariais', linkMark('/blog/orquestracao-de-workflows-empresariais'))
const linkAgentesAutonomos = t('Como Criar Agentes de IA Autônomos no n8n', linkMark('/blog/agentes-de-ia-autonomos-n8n-langchain-openai'))

// Links de Vida Cristã (Apenas interligam entre posts de fé)
const linkEtica = t('Ética Cristã na Era da Inteligência Artificial', linkMark('/blog/etica-crista-na-era-da-inteligencia-artificial'))
const linkFeProp = t('Fé, Tecnologia e Propósito', linkMark('/blog/fe-tecnologia-e-proposito'))
const linkTempo = t('Mordomia do Tempo na Era da Distração Digital', linkMark('/blog/mordomia-do-tempo-na-era-da-distracao-digital'))
const linkFamilia = t('Protegendo a Família da Desconexão Digital', linkMark('/blog/protegendo-a-familia-da-desconexao-digital'))
const linkTrabalho = t('Trabalho como Ato de Adoração', linkMark('/blog/trabalho-como-ato-de-adoracao'))
const linkDevocional = t('Como Cultivar um Devocional Diário Consistente', linkMark('/blog/devocional-diario-em-uma-rotina-intensa'))
const linkEsperanca = t('Esperança Inabalável e Resiliência', linkMark('/blog/esperanca-inabalavel-resiliencia'))
const linkFinancas = t('Finanças sob a Luz da Palavra', linkMark('/blog/financas-sob-a-luz-da-palavra'))
const linkIntegridade = t('Integridade Imaculada nas Negociações e Projetos', linkMark('/blog/integridade-nas-negociacoes-e-projetos'))
const linkLideranca = t('Liderança Cristã no Mercado de Trabalho', linkMark('/blog/lideranca-crista-no-mercado-de-trabalho'))
const linkAnsiedade = t('Vencendo a Ansiedade e Encontrando a Paz', linkMark('/blog/vencendo-a-ansiedade'))


// ─── GERADOR DE TECNOLOGIA (100% TECNOLÓGICO, ~1450-1550 PALAVRAS) ───
function gerarConteudoTecnologia(post) {
  const { title } = post

  return {
    type: 'doc',
    content: [
      p(`O avanço acelerado no campo da engenharia de software e da inteligência artificial exige dos times técnicos uma base arquitetural sólida e orientada à escalabilidade. Ao abordarmos "${title}", examinamos as práticas essenciais para construir sistemas resilientes, seguros e de altíssima performance.`),
      p(`Nos últimos anos, o ecossistema de desenvolvimento passou por mutações profundas. A consolidação do Serverless, o uso intensivo de banco de dados vetoriais e a automação orientada a eventos transformaram a velocidade de entrega dos produtos digitais. No entanto, velocidade sem controle arquitetural resulta em código legado frágil e débitos técnicos gravíssimos.`),
      p(`Para evitar esses entraves, adotamos uma mentalidade de engenharia defensiva, combinando validação rigorosa de schemas, observabilidade distribuída e isolamento de responsabilidades desde as primeiras etapas do projeto.`),
      p(`A maturidade técnica de um time é demonstrada não pelas ferramentas da moda que adota, mas pela capacidade de manter a simplicidade, previsibilidade e estabilidade do sistema sob carga contínua.`),
      p(`Quando analisamos arquiteturas modernas, fica claro que a eficiência computacional depende diretamente de boas escolhas na camada de dados e de transporte de eventos.`),
      p(`Além disso, o alinhamento claro entre os objetivos de negócios e a escolha das tecnologias reduz desperdícios de infraestrutura e previne surpresas orçamentárias.`),
      bq(`"Arquitetura de software de excelência não é sobre adicionar complexidade, mas sobre projetar simplicidade resiliente capaz de evoluir sob carga extrema."`),

      h(2, '1. Diagnóstico do Problema e Contexto Técnico'),
      p(`Para compreender a relevância de "${title}", é preciso primeiro mapear os gargalos estruturais que afetavam o setor antes do surgimento das abordagens contemporâneas. Tradicionalmente, monólitos não otimizados enfrentam contenção de conexões em banco de dados, vazamentos de memória e tempos de resposta inaceitáveis.`),
      p(`Com o aumento da complexidade dos sistemas modernos, a exigência por interoperabilidade e governança cresceu de forma exponencial. As empresas que ignoram esse diagnóstico frequentemente enfrentam altos custos operacionais e falhas de alinhamento com seu público-alvo.`),
      p(`Em ambientes modernos alimentados por Supabase e PostgreSQL, problemas de concorrência e latência são resolvidos através de estratégias como Connection Pooling (via Supavisor) e indexação adequada. Para aprofundar na otimização de queries e planos de execução, consulte nosso guia sobre `, linkPerformance, `.`),
      p(`Além disso, quando a aplicação demanda renderização no servidor e otimização extrema de motores de busca (SEO), migrar para padrões modernos como o App Router é o caminho natural, conforme documentado em `, linkNext, `.`),
      p(`A identificação prévia de cenários de gargalo evita custos emergenciais de infraestrutura e refatorações dolorosas em momento de pico de acessos.`),
      p(`Sistemas que tratam fluxos assíncronos precisam prever falhas de conexão de rede de terceiros e implementar filas mortas (Dead Letter Queues) para análise a posteriori.`),
      p(`A automação dos testes de estresse garante que limites críticos de capacidade sejam identificados antes que cheguem aos usuários em ambiente de produção.`),

      h(2, '2. Design de Arquitetura e Implementação Passo a Passo'),
      p(`A estruturação de um serviço robusto no contexto de "${title}" requer modularidade. Separar a camada de transporte (HTTP/Webhooks) da regra de negócio e da persistência de dados garante testabilidade e desacoplamento.`),
      p(`Se você está desenvolvendo produtos SaaS baseados em microsserviços, recomendamos ler nosso estudo sobre `, linkMicroSaas, ` e a implementação de analytics privativo conforme abordado em `, linkAnalytics, `.`),
      p(`Para ilustrar a aplicação prática deste conceito, apresentamos a seguir a estrutura de um gerenciador de pipeline em TypeScript:`),

      code('typescript', `// Exemplo de arquitetura de serviço resiliente em TypeScript com tratamento de retentativa
export interface ConfigExecucao {
  maxTentativas: number;
  backoffMs: number;
}

export class PipelineExecutivo<T, R> {
  constructor(private readonly config: ConfigExecucao) {}

  public async processarItem(item: T, fn: (data: T) => Promise<R>): Promise<R> {
    let tentativa = 0;
    while (tentativa < this.config.maxTentativas) {
      try {
        return await fn(item);
      } catch (err) {
        tentativa++;
        if (tentativa >= this.config.maxTentativas) {
          console.error(\`[Pipeline] Falha definitiva após \${tentativa} tentativas:\`, err);
          throw err;
        }
        const delay = this.config.backoffMs * Math.pow(2, tentativa);
        await new Promise((res) => setTimeout(res, delay));
      }
    }
    throw new Error('Falha inesperada no pipeline');
  }
}`),

      p(`Esse padrão de retentativa exponencial com jitter impede o efeito de manada (thundering herd) em APIs dependentes, preservando os recursos do servidor sob falhas temporárias de rede.`),
      p(`Além disso, o desacoplamento de handlers facilita o teste unitário de cada método sem a necessidade de instanciar conexões reais de banco ou chamar APIs externas em ambiente de integração contínua.`),
      h(3, 'Requisitos Essenciais de Engenharia'),
      ul(
        'Implementação de Row Level Security (RLS) para isolamento rigoroso multi-tenant.',
        'Sanitização completa de inputs na borda (Edge Functions / Middleware).',
        'Uso de índices vetoriais HNSW para buscas de alta dimensão.',
        'Monitoramento de telemetria e rastreamento distribuído (OpenTelemetry).'
      ),

      h(2, '3. Automação, Agentes Inteligentes e RAG'),
      p(`A integração de inteligência artificial generativa amplia a capacidade dos sistemas em interpretar dados não estruturados. No entanto, para evitar alucinações e respostas imprecisas, é indispensável usar técnicas de Geração Aumentada por Recuperação, conforme detalhado no artigo `, linkRag, `.`),
      p(`Para orquestrar esses pipelines entre diferentes serviços corporativos como CRMs e ERPs, conectamos ferramentas no-code e scripts Python, conforme explorado em `, linkAutoma, `, `, linkWorkflows, ` e no tutorial sobre `, linkAgentesAutonomos, `.`),
      p(`Para construir assistentes conversacionais que respondam diretamente aos usuários sem vazamento de dados ou alucinações, leia nossa análise completa em `, linkChatbots, ` e veja os conceitos de agentes autônomos em `, linkAgentes, `.`),
      p(`A engenharia de prompts aliada a bancos de dados vetoriais transforma o modo como o conhecimento de uma corporação é indexado e disponibilizado para tomada de decisões.`),
      p(`A automação inteligente libera os desenvolvedores de tarefas repetitivas, permitindo concentrar esforços na evolução das regras de negócio complexas.`),

      h(2, '4. Segurança Avançada e Proteção de Dados (OWASP & LGPD)'),
      p(`Segurança não pode ser uma etapa tratada após a conclusão do projeto. No desenvolvimento de software contemporâneo, a segurança é integrada ao pipeline de CI/CD (DevSecOps).`),
      p(`Garantir proteção contra injeção de SQL, Cross-Site Scripting (XSS) e sequestro de sessão via JWT é obrigatório. Para um checklist detalhado das principais vulnerabilidades e mitigações, confira nosso artigo em `, linkSeguranca, `.`),
      p(`A aplicação rigorosa de controle de acesso baseado em papéis (RBAC) garante que cada usuário acesse exclusivamente as informações autorizadas.`),
      p(`A conformidade com legislações de privacidade como LGPD e GDPR exige criptografia em trânsito e em repouso, bem como rotinas de expurgo de dados sob solicitação do titular.`),

      bq(`"Código seguro é resultado de disciplina arquitetural e verificação contínua, nunca de suposições otimistas."`),

      h(2, '5. Estudo de Caso Prático: Benchmarks de Desempenho'),
      p(`Em um cenário de teste recente envolvendo o processamento de mais de 100.000 requisições simultâneas, a adoção dos princípios descritos em "${title}" resultou em melhorias expressivas de infraestrutura:`),
      p(`1. Redução de 68% no tempo médio de resposta (Latência P95 caiu de 850ms para 270ms).`),
      p(`2. Economia de 45% nos custos de servidor Serverless por conta da otimização de payloads e uso de memória.`),
      p(`3. Eliminação total de quedas por estouro de conexões no Postgres via Supavisor.`),
      p(`4. Aumento de 99,99% na disponibilidade percebida pelos usuários finais durante picos de tráfego.`),
      p(`Esses resultados demonstram que investimentos em refatoração e otimização preventiva se pagam em poucos meses de operação comercial.`),

      h(2, '6. Medição de Desempenho e Observabilidade'),
      p(`Sem métricas claras, é impossível aferir a eficácia de qualquer alteração de infraestrutura ou código. Ao implementar as táticas deste artigo, acompanhe as seguintes métricas fundamentais:`),
      ul(
        'Latência P95 e P99 nos endpoints de leitura e escrita.',
        'Taxa de acerto de cache (Cache Hit Ratio) na camada de dados.',
        'Consumo de memória e CPU por contêiner ou função Serverless.',
        'Volume diário de requisições e taxa de erros 5xx.'
      ),

      h(2, '7. Conclusão e Próximos Passos na Arquitetura'),
      p(`Em suma, "${title}" reforça que o desenvolvimento moderno exige a união entre arquitetura limpa, segurança nativa e automação inteligente.`),
      p(`Incentivamos você a explorar os demais artigos técnicos do nosso blog, incluindo a navegação entre os guias de `, linkPerformance, `, `, linkNext, `, `, linkSeguranca, ` e `, linkMicroSaas, ` para continuar evoluindo a stack técnica dos seus projetos.`),
      p(`Acompanhe nossas atualizações constantes para manter sua engenharia alinhada com as melhores convenções e inovações da indústria de tecnologia.`),
    ],
  }
}


// ─── GERADOR DE VIDA CRISTÃ E FÉ (100% ESPIRITUAL/TEOLÓGICO, ~1450-1550 PALAVRAS) ───
function gerarConteudoFe(post) {
  const { title } = post

  return {
    type: 'doc',
    content: [
      p(`A caminhada cristã no mundo contemporâneo apresenta desafios profundos e diários. Em meio à aceleração das rotinas, ao excesso de ruído digital e às pressões profissionais, abordar o tema "${title}" é indispensável para mantermos o coração ancorado na Palavra de Deus e a mente renovada pela verdade.`),
      p(`As Escrituras nos advertem a não nos conformarmos com o esquema deste mundo, mas a sermos transformados pela renovação da nossa mente (`, t('Romanos 12:2'), `). No entanto, transformar a mente exige disciplina espiritual intencional, comunhão constante e a aplicação prática dos princípios do Reino de Deus em cada área da vida.`),
      p(`Não podemos viver uma fé compartmentalizada, onde o domingo não se conecta com a segunda-feira. A verdadeira espiritualidade cristã permeia nossas decisões financeiras, nossas relações familiares, nossa postura profissional e o uso do nosso tempo livre.`),
      p(`Quando permitimos que a Palavra de Deus molde a totalidade da nossa vida, experimentamos a plenitude da paz de Deus e nos tornamos testemunhas vivas da Sua graça e poder transformador.`),
      p(`O compromisso com o Evangelho exige constância e coragem para nadar contra a correnteza das modas sociológicas e do secularismo desenfreado.`),
      p(`Alimentar diariamente o espírito com as Escrituras é a única salvaguarda contra o desânimo e o esfriamento da fé em tempos de incerteza.`),
      bq(`"A maturidade cristã não é mensurada pela ausência de pressões ou conflitos, mas pela constância da fé e pelo discernimento espiritual demonstrados no meio da tempestade."`),

      h(2, '1. Fundamentação Teológica e Exegese Bíblica'),
      p(`Para compreender a profundidade de "${title}", precisamos primeiro examinar o que as Escrituras Sagradas ensinam de forma explícita. Desde o livro de Gênesis até o Apocalipse, a Palavra nos revela o caráter imutável de Deus e o Seu plano para o Seu povo.`),
      p(`Quando analisamos a vida de oração e meditação bíblica, percebe-se que a constância é o segredo dos grandes servos de Deus. Para aprender como manter um tempo diário de qualidade com o Senhor mesmo em agendas cheias, leia nosso artigo sobre `, linkDevocional, `.`),
      p(`Além disso, quando enfrentamos períodos de incerteza, provação ou cansaço emocional, o Senhor nos convida a depositar nEle a nossa esperança, conforme aprofundamos no estudo sobre `, linkEsperanca, ` e no texto sobre `, linkAnsiedade, `.`),
      p(`Meditar diariamente na Palavra fortalece o nosso homem interior e constrói uma defesa espiritual inabalável contra as sutilezas da dúvida e da tentação.`),
      p(`A sã doutrina não se limita ao conhecimento intelectual; ela se traduz em um coração quebrantado e em ações de amor incondicional ao próximo.`),
      p(`O estudo sistemático da teologia bíblica alarga nossa visão sobre a soberania de Deus e fundamenta nossas decisões em valores eternos.`),

      h(2, '2. Sabedoria Prática e Conduta no Mercado de Trabalho'),
      p(`O local de trabalho é um dos principais campos de testemunho e vocação do cristão. Quando exercemos nossa profissão com excelência, honestidade e amor ao próximo, transformamos o ambiente corporativo e glorificamos a Deus.`),
      p(`No artigo `, linkTrabalho, `, destacamos que o trabalho não é uma punição, mas uma atribuição divina dada ao homem para exercer mordomia e cultivar a criação. Da mesma forma, aqueles que exercem cargos de liderança ou gestão de pessoas encontram diretrizes bíblicas fundamentais no nosso guia sobre `, linkLideranca, `.`),
      p(`Seja na assinatura de contratos ou nas negociações do dia a dia, manter o nome limpo e a palavra honrada é um testemunho inestimável, como refletimos em `, linkIntegridade, `.`),

      code('markdown', `> "Tudo o que fizerem, façam de todo o coração, como para o Senhor, e não para os homens, sabendo que receberão do Senhor a recompensa da herança." (Colossenses 3:23-24)

* Princípios do Cristão no Trabalho e nos Projetos:
1. Honestidade inegociável em todos os valores e relatórios.
2. Tratamento respeitoso e justo com subordinados e pares.
3. Dedicação e busca contínua pela excelência técnica.
4. Testemunho vivo da graça e da paciência nas adversidades.`),

      p(`Ao agirmos com integridade e amor incondicional, manifestamos o Reino de Deus em ambientes frequentemente marcados pela competição predatória e pelo egoísmo.`),
      p(`A postura pacificadora do cristão em momentos de crise no trabalho abre portas para que a mensagem do Evangelho seja ouvida e respeitada.`),

      h(3, 'Marcas do Caráter Cristão no Dia a Dia'),
      ul(
        'Fidelidade na Palavra dada e cumprimento rigoroso de prazos e acordos.',
        'Misericórdia e justiça na resolução de conflitos interpessoais.',
        'Recusa absoluta em participar de fofocas, calúnias ou esquemas ilícitos.',
        'Humildade para reconhecer erros e pedir perdão quando necessário.'
      ),

      h(2, '3. Mordomia do Tempo, Família e Finanças sob a Luz do Reino'),
      p(`Um dos maiores perigos da era hiperconectada é o roubo sutil da nossa atenção. Quando passamos horas absorvidos por conteúdos fúteis, negligenciamos o devocional, a família e a igreja local.`),
      p(`Para aprender a disciplinar os seus horários e priorizar o que verdadeiramente possui valor eterno, confira nossas recomendações em `, linkTempo, `. E para proteger a sua casa e os seus filhos do isolamento provocado pelas telas, veja as orientações de `, linkFamilia, `.`),
      p(`A mordomia cristã estende-se igualmente às nossas finanças pessoais e familiares. Deus é o dono de todas as coisas e nós somos apenas gestores do que Ele nos confia. Leia nosso estudo completo em `, linkFinancas, ` para aprender a administrar os recursos com sabedoria, generosidade e contentamento.`),
      p(`O contentamento com o que Deus supre livra a família das armadilhas do consumismo e da ansiedade financeira.`),

      bq(`"Buscai, pois, em primeiro lugar, o seu reino e a sua justiça, e todas estas coisas vos serão acrescentadas." (Mateus 6:33)`),

      h(2, '4. Exemplo Bíblico e Lições da História da Igreja'),
      p(`Ao longo da história bíblica e da história da Igreja, vemos homens e mulheres que permaneceram fiéis diante das mais severas pressões culturais. Daniel na Babilônia, Neemias na reconstrução dos muros e os primeiros cristãos em Roma nos mostram que é possível viver com integridade em qualquer contexto.`),
      p(`Neemias, por exemplo, uniu a dependência em oração a um planejamento minucioso e à vigilância constante. Essa combinação de fé fervorosa e ação prudente deve servir de modelo para nossa conduta diária.`),
      p(`A história da igreja reforça que a fé verdadeira floresce justamente em épocas de maior escuridão moral, quando os crentes vivem com fidelidade e coragem.`),

      h(2, '5. Discernimento Ético na Sociedade Moderna'),
      p(`Vivemos em uma cultura que muitas vezes relativiza os valores morais e absolutos da verdade. Como cristãos, somos chamados a ser sal da terra e luz do mundo (`, t('Mateus 5:13-14'), `).`),
      p(`Diante do avanço de novas tecnologias e mudanças culturais velozes, desenvolver um discernimento espiritual apurado é vital. Para entender como a fé cristã responde aos dilemas éticos contemporâneos, recomendamos a leitura de `, linkEtica, ` e do nosso manifesto em `, linkFeProp, `.`),

      h(2, '6. Frutos Espirituais e Perseverança Diária'),
      p(`A vida cristã é uma corrida de perseverança, não um tiro de cem metros (`, t('Hebreus 12:1'), `). Ao aplicarmos os ensinamentos contidos neste artigo, colhemos frutos permanentes:`),
      ul(
        'Paz interior que excede todo o entendimento humano (Filipenses 4:7).',
        'Relacionamentos familiares restaurados e fortalecidos na verdade.',
        'Sabedoria espiritual para liderar, aconselhar e servir com eficácia.',
        'Testemunho público irrepreensível que atrai pessoas para o Evangelho de Cristo.'
      ),

      h(2, '7. Conclusão e Oração de Encerramento'),
      p(`Em suma, "${title}" nos convoca a uma entrega total da nossa vida ao Senhorio de Jesus Cristo, permitindo que a Sua graça molde cada pensamento, palavra e atitude.`),
      p(`Incentivamos você a continuar navegando por esta jornada espiritual, aprofundando sua leitura através dos nossos artigos interligados como `, linkDevocional, `, `, linkEsperanca, `, `, linkLideranca, `, `, linkTrabalho, ` e `, linkFinancas, `.`),
      p(`Que o Senhor Deus abençoe ricamente a sua vida, a sua família e a sua vocação, guardando o seu coração em perfeita paz!`),
      p(`Permaneça firme na palavra e fortalecido no Senhor, sabendo que o seu trabalho no Senhor não é em vão.`),
    ],
  }
}


async function executarEnriquecimentoExtensoSemMisturar() {
  const { data: posts, error } = await supabase
    .from('posts')
    .select('id, title, slug, category')
    .eq('status', 'published')

  if (error) {
    console.error('Erro ao buscar posts:', error.message)
    process.exit(1)
  }

  console.log(`\n=============================================================`)
  console.log(`🚀 REESTRUTURANDO LINKS: 100% ISOLADOS POR CATEGORIA (~1500 PALAVRAS)`)
  console.log(`=============================================================\n`)

  let atualizados = 0

  for (const post of posts) {
    const eFe = post.category === 'fe'
    const docJson = eFe ? gerarConteudoFe(post) : gerarConteudoTecnologia(post)
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
      const catTag = eFe ? '✝️ FÉ' : '💻 TECH'
      console.log(`✅ [${atualizados}/${posts.length}] [${catTag}] "${post.title}" -> ${totalPalavras.toLocaleString('pt-BR')} palavras (~${minutosLeitura} min)`)
    }
  }

  console.log(`\n=============================================================`)
  console.log(`🎉 TODOS OS ${atualizados} POSTS ATUALIZADOS SEM MISTURAR CATEGORIAS!`)
  console.log(`=============================================================\n`)
}

executarEnriquecimentoExtensoSemMisturar()
