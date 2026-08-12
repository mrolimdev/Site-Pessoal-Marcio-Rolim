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

// ─── 10 NOVOS POSTS DE TECNOLOGIA ATUAIS, AMIGÁVEIS E PRÁTICOS ───

const NOVOS_POSTS_TECH = [
  {
    slug: 'o-futuro-do-trabalho-com-agentes-de-ia',
    title: 'O Futuro do Trabalho com Agentes de IA: Como a Inteligência Artificial Está Redefinindo o Nosso Dia a Dia',
    excerpt: 'Descubra como os novos agentes de IA autônomos estão transformando a rotina de profissionais e empresas, saindo dos chats simples para realizar tarefas reais por você.',
    seo_title: 'O Futuro do Trabalho com Agentes de IA | Márcio Rolim',
    seo_description: 'Entenda como os agentes autônomos de inteligência artificial estão mudando o ambiente de trabalho e como aproveitar essa revolução na sua rotina.',
    tags: ['ia', 'agentes de ia', 'produtividade', 'futuro do trabalho', 'tecnologia'],
    cover_url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1200&auto=format&fit=crop',
    cover_alt: 'Pessoa trabalhando em laptop moderno com luz de néon suave ao fundo',
    linkInterno: { titulo: '10 Ferramentas de IA Essenciais para Dobrar sua Produtividade', href: '/blog/10-ferramentas-de-ia-essenciais-para-produtividade' },
    conteudoGerador: (post, linkRef) => ({
      type: 'doc',
      content: [
        p(`A inteligência artificial deixou de ser apenas uma curiosidade tecnológica de ficção científica para se tornar o motor central da transformação do trabalho moderno. Se até pouco tempo atrás ficávamos impressionados ao pedir ao ChatGPT para corrigir um e-mail ou traduzir um texto, hoje estamos presenciando o surgimento dos chamados Agentes de IA.`),
        p(`Diferente das ferramentas tradicionais de chat que apenas respondem a perguntas isoladas, um agente de IA possui capacidade de raciocínio encadeado, planejamento e execução autônoma de tarefas complexas. Ele não se limita a dar conselhos; ele toma iniciativa, conecta-se a sistemas e entrega resultados prontos.`),
        
        bq(`"A grande virada da inteligência artificial não é nos substituir no trabalho, mas nos libertar do trabalho repetitivo para que possamos focar naquilo que nos torna genuinamente humanos: estratégia, empatia e criatividade."`),

        h(2, '1. O Que São Agentes de IA e Como Eles Funcionam na Prática?'),
        p(`Para entender o impacto dessa tecnologia, imagine a diferença entre pedir uma receita de bolo para um assistente virtual e contratar um confeiteiro experiente que compra os ingredientes, prepara a receita e organiza a cozinha.`),
        p(`Os agentes de inteligência artificial operam com três pilares fundamentais:`),
        ul(
          'Percepção do Contexto: Eles analisam dados, arquivos de projeto, históricos de conversas e metas estabelecidas.',
          'Planejamento Autônomo: Decompõem um objetivo amplo (como "montar um relatório mensal de vendas") em pequenas sub-tarefas lógicas.',
          'Execução de Ações: Acessam ferramentas externas, leem planilhas, enviam mensagens e consolidam relatórios sem intervenção humana a cada passo.'
        ),

        h(2, '2. As Principais Mudanças no Ambiente de Trabalho'),
        p(`A chegada dessa nova geração de ferramentas está redefinindo o conceito de produtividade em diversos setores da economia:`),
        p(`No atendimento ao cliente, por exemplo, agentes treinados conseguem resolver dúvidas complexas de consumidores consultando bases de dados internas em tempo real, sem respostas engessadas ou robóticas.`),
        p(`Na gestão de projetos e rotina profissional, conforme detalhamos em nosso artigo sobre `, t(linkRef.titulo, linkMark(linkRef.href)), `, a IA assume a filtragem de e-mails prioritários, a organização de agendas e a preparação de resumos antes de cada reunião.`),

        h(2, '3. Como se Preparar para Conviver e Liderar com IAs'),
        p(`Diante de transformações tão velozes, é natural que surjam dúvidas sobre o futuro das profissões. O caminho mais seguro não é ignorar a evolução tecnológica, mas sim desenvolver habilidades complementares que a IA não possui.`),
        ul(
          'Pensamento Crítico: Saber avaliar a qualidade e a veracidade dos resultados gerados pelas ferramentas de IA.',
          'Comunicação Clara: Aprender a orientar e instruir a IA com clareza (a arte do prompt bem formulado).',
          'Inteligência Emocional e Ética: Conectar pessoas, mediar conflitos e tomar decisões fundamentadas em valores humanos elevados.'
        ),

        h(2, '4. Dicas Práticas para Começar Hoje Mesmo'),
        p(`Você não precisa de grandes investimentos financeiros para começar a se beneficiar dos agentes de IA no seu dia a dia:`),
        p(`Comece mapeando suas tarefas semanais mais repetitivas. Identifique onde você gasta mais de 30 minutos diários copiando e colando informações. Em seguida, experimente delegar a síntese desses dados para assistentes inteligentes.`),
        p(`Lembre-se sempre de manter a supervisão final humana (human-in-the-loop): a IA é seu copiloto de alta velocidade, mas a direção do volante continua sendo sua.`),

        h(2, '5. Conclusão'),
        p(`O futuro do trabalho com agentes de IA não se trata de máquinas substituindo pessoas, mas sim de pessoas que utilizam IA substituindo pessoas que não a utilizam. Ao abraçar a tecnologia com responsabilidade e sabedoria, você multiplica sua capacidade de realizar projetos relevantes e gerar valor real para o mundo.`),
      ],
    }),
  },
  {
    slug: '10-ferramentas-de-ia-essenciais-para-produtividade',
    title: '10 Ferramentas de IA Essenciais para Dobrar sua Produtividade no Trabalho',
    excerpt: 'Conheça uma seleção das melhores e mais úteis ferramentas de inteligência artificial do momento para organizar tarefas, resumir reuniões e acelerar seus projetos diários.',
    seo_title: '10 Ferramentas de IA Essenciais para Produtividade | Márcio Rolim',
    seo_description: 'Descubra 10 aplicativos e assistentes de IA incríveis para economizar tempo, organizar sua rotina e aumentar o rendimento no trabalho.',
    tags: ['ia', 'ferramentas', 'produtividade', 'aplicativos', 'dicas'],
    cover_url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=1200&auto=format&fit=crop',
    cover_alt: 'Mesa de trabalho moderna com tela de computador, café e bloco de anotações',
    linkInterno: { titulo: 'Engenharia de Prompt Descomplicada: 5 Técnicas Simples', href: '/blog/engenharia-de-prompt-descomplicada-dicas-praticas' },
    conteudoGerador: (post, linkRef) => ({
      type: 'doc',
      content: [
        p(`O ecossistema de aplicativos alimentados por inteligência artificial cresce a passos largos. Todos os dias surgem novas soluções prometendo economizar horas de trabalho. Porém, com tantas opções disponíveis, como saber quais ferramentas realmente entregam valor prático e valem o seu tempo?`),
        p(`Neste guia descomplicado, reunimos 10 das melhores ferramentas de IA da atualidade, organizadas por categorias práticas da sua rotina profissional.`),

        bq(`"Produtividade inteligente não é fazer mais coisas em menos tempo, mas sim eliminar o trabalho desnecessário para focar no que traz resultados verdadeiros."`),

        h(2, '1. Redação e Síntese de Textos'),
        p(`1. ChatGPT (OpenAI): O assistente conversacional mais popular do mundo, ideal para brainstorm de ideias, rascunhos de e-mails e explicação de conceitos difíceis.`),
        p(`2. Claude (Anthropic): Excelente para redação de textos longos, artigos e análise profunda de documentos extensos com um tom extremamente natural e cuidadoso.`),

        h(2, '2. Pesquisa Rápida e Confiável'),
        p(`3. Perplexity AI: Um mecanismo de busca conversacional que pesquisa a web em tempo real e entrega respostas diretas com links e citações transparentes de onde extraiu a informação.`),
        p(`4. NotebookLM (Google): Uma ferramenta incrível que analisa seus próprios arquivos PDF e anotações, transformando seus documentos em uma base de conhecimento interativa e até em resumos em áudio.`),

        h(2, '3. Organização de Reuniões e Tarefas'),
        p(`5. Otter.ai / Fireflies: Transcrevem reuniões do Zoom ou Google Meet automaticamente, destacando os pontos de ação e os acordos firmados entre os participantes.`),
        p(`6. Notion AI: Integra inteligência artificial diretamente à sua área de trabalho de notas, ajudando a estruturar planos de ação, tabelas e resumos de projetos.`),

        h(2, '4. Design e Automação de Imagens'),
        p(`7. Canva Magic Studio: Permite criar apresentações visuais profissionais, capas e artes para redes sociais utilizando comandos simples em português.`),
        p(`8. Photoroom: Remove e substitui fundos de fotos de produtos ou fotos de perfil corporativo instantaneamente com qualidade de estúdio fotográfico.`),

        h(2, '5. Automação de Fluxos de Trabalho'),
        p(`9. n8n (No-Code Automation): Uma plataforma fantástica para conectar seus aplicativos favoritos e fazer com que eles conversem entre si sem complicação.`),
        p(`10. Gamma App: Cria apresentações de slides inteiras a partir de um breve tópico ou resumo em texto em questão de segundos.`),

        p(`Como abordamos em nosso artigo sobre `, t(linkRef.titulo, linkMark(linkRef.href)), `, o segredo para aproveitar essas ferramentas ao máximo é saber comunicar com clareza o objetivo desejado.`),

        h(2, 'Conclusão'),
        p(`Escolha duas ou três ferramentas dessa lista que atacam seus maiores gargalos de tempo nesta semana. Ao dominar esses assistentes, você ganha horas livres no seu dia para se dedicar à família, aos estudos e à sua fé.`),
      ],
    }),
  },
  {
    slug: 'deepseek-vs-chatgpt-e-claude-qual-usar',
    title: 'DeepSeek vs ChatGPT e Claude: Entenda a Guerra dos Modelos de IA e Qual Escolher para Cada Tarefa',
    excerpt: 'Um comparativo claro e sem complicações técnicas entre os modelos de IA mais comentados do momento para saber exatamente qual utilizar no seu dia a dia.',
    seo_title: 'DeepSeek vs ChatGPT e Claude: Qual o Melhor? | Márcio Rolim',
    seo_description: 'Compare DeepSeek, ChatGPT e Claude de forma simples. Descubra as vantagens, preços e melhores casos de uso de cada inteligência artificial.',
    tags: ['ia', 'deepseek', 'chatgpt', 'claude', 'comparativo'],
    cover_url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=1200&auto=format&fit=crop',
    cover_alt: 'Telas de computador mostrando interfaces modernas de dados e códigos',
    linkInterno: { titulo: 'Como Proteger seus Dados Pessoais na Era da IA Generativa', href: '/blog/como-proteger-seus-dados-pessoais-na-era-da-ia' },
    conteudoGerador: (post, linkRef) => ({
      type: 'doc',
      content: [
        p(`O cenário da inteligência artificial generativa passou por transformações históricas nos últimos meses. O surgimento recente do DeepSeek abalou o mercado internacional de tecnologia e colocou em xeque a hegemonia de gigantes como a OpenAI (criadora do ChatGPT) e a Anthropic (criadora do Claude).`),
        p(`Com tantos nomes e modelos sendo anunciados, é comum ficar em dúvida: qual deles devo usar para o meu trabalho ou estudos? Neste comparativo direto e amigável, analisamos os três principais concorrentes da atualidade.`),

        bq(`"Não existe um modelo de IA perfeito para tudo. O segredo está em montar uma caixa de ferramentas onde cada IA atua no seu ponto mais forte."`),

        h(2, '1. ChatGPT (OpenAI): O Polivalente e Versátil'),
        p(`O ChatGPT continua sendo o assistente de IA mais popular do planeta. Com o modelo GPT-4o e recursos avançados de voz em tempo real, ele é excelente para uso geral.`),
        ul(
          'Pontos Fortes: Recursos multimodais (lê imagens, analisa arquivos, gera imagens via DALL-E e conversa por voz).',
          'Melhor Para: Tarefas diárias, brainstorm de ideias, rascunhos de comunicação e pesquisa ampla.',
          'Disponibilidade: Versão gratuita generosa e planos pagos para acesso prioritário.'
        ),

        h(2, '2. Claude (Anthropic): O Mestre da Redação e Raciocínio Elegante'),
        p(`Desenvolvido pela Anthropic, o Claude (especialmente nas versões Claude 3.5 Sonnet) é mundialmente elogiado por quem precisa escrever textos impecáveis ou analisar contratos e livros extensos.`),
        ul(
          'Pontos Fortes: Tom de escrita muito humano, excelente compreensão de contextos longos e raciocínio lógico apurado.',
          'Melhor Para: Redação de artigos acadêmicos e profissionais, revisão de textos e análises detalhadas.',
          'Disponibilidade: Interface limpa e plano pro para uso intensivo.'
        ),

        h(2, '3. DeepSeek: O Fenômeno de Alta Eficiência e Custo Acessível'),
        p(`Nascido na China, o DeepSeek surpreendeu o mundo por entregar um desempenho de raciocínio lógico (modelo R1) comparável aos melhores modelos do mundo, mas construído por uma fração minúscula do custo de treinamento.`),
        ul(
          'Pontos Fortes: Raciocínio matemático e de código extremamente aguçado, além de ser código aberto em muitas versões.',
          'Melhor Para: Resolução de problemas complexos, lógica matemática e apoio ao desenvolvimento de software.',
          'Atenção: Sempre observe a segurança e privacidade ao compartilhar dados confidenciais, conforme orientamos em nosso post sobre ', t(linkRef.titulo, linkMark(linkRef.href)), `.`
        ),

        h(2, '4. Resumo Comparativo: Qual Escolher?'),
        p(`Se você busca uma ferramenta completa com voz e geração de fotos: vá de ChatGPT.`),
        p(`Se você precisa redigir relatórios elegantes, e-mails diplomáticos ou analisar documentos extensos: escolha o Claude.`),
        p(`Se você quer resolver um problema difícil de lógica, matemática ou programação com resposta rápida: experimente o DeepSeek.`),

        h(2, 'Conclusão'),
        p(`A concorrência acirrada entre esses modelos é uma excelente notícia para todos nós. Ela reduz custos, aumenta a qualidade das respostas e coloca superpoderes de computação ao alcance de qualquer pessoa.`),
      ],
    }),
  },
  {
    slug: 'o-que-sao-mcps-model-context-protocol-explicado',
    title: 'O Que São MCPs (Model Context Protocol) e Por Que Essa Nova Tecnologia Conecta IAs aos Seus Aplicativos',
    excerpt: 'Entenda em termos simples o protocolo aberto que está revolucionando a forma como assistentes de IA se conectam com arquivos, bancos de dados e ferramentas de software.',
    seo_title: 'O Que São MCPs (Model Context Protocol)? Explicado | Márcio Rolim',
    seo_description: 'Descubra o que é o Model Context Protocol (MCP), por que ele é uma das maiores tendências de tecnologia e como ele conecta IAs aos seus softwares.',
    tags: ['ia', 'mcp', 'tendencias', 'tecnologia', 'software'],
    cover_url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=1200&auto=format&fit=crop',
    cover_alt: 'Conexões de servidores e redes de dados iluminadas por luz azul e dourada',
    linkInterno: { titulo: 'O Futuro do Trabalho com Agentes de IA', href: '/blog/o-futuro-do-trabalho-com-agentes-de-ia' },
    conteudoGerador: (post, linkRef) => ({
      type: 'doc',
      content: [
        p(`Se você tem acompanhado as notícias sobre tecnologia nos últimos meses, é muito provável que tenha cruzado com a sigla MCP (Model Context Protocol). Apresentado pela Anthropic e adotado rapidamente por toda a comunidade de desenvolvedores, esse novo padrão promete resolver um dos maiores problemas da inteligência artificial: a ilha de isolamento.`),
        p(`Neste artigo descomplicado, explicamos o que é o MCP, por que ele é comparado ao surgimento da porta USB nos computadores e como ele vai mudar sua interação com os softwares.`),

        bq(`"O Model Context Protocol (MCP) é para as IAs o que a tomada universal é para os eletrodomésticos: um padrão simples que permite conectar qualquer ferramenta a qualquer assistente."`),

        h(2, '1. A Grande Barreira da IA Tradicional'),
        p(`Até pouco tempo, quando você usava uma IA, ela vivia isolada dentro de uma página da web. Para que ela analisasse um arquivo do seu computador ou um dado da sua empresa, você precisava baixar o arquivo, copiar o texto, colar na janela do chat e torcer para que ela entendesse.`),
        p(`Se você quisesse que a IA atualizasse um dado no seu sistema, ela não conseguia fazer isso sozinha. Faltava uma "ponte universal" segura de comunicação.`),

        h(2, '2. A Solução: O Que É o MCP?'),
        p(`O MCP (Model Context Protocol) é um protocolo aberto que funciona como uma linguagem comum entre os assistentes de IA e os seus aplicativos (Google Drive, GitHub, bancos de dados, editores de texto e planilhas).`),
        p(`Em vez de criar uma integração customizada e cara para cada aplicativo existente, os desenvolvedores agora criam um "servidor MCP". A partir daí, qualquer assistente compatível consegue conversar com aquele aplicativo com total segurança.`),

        h(2, '3. Benefícios Práticos no Dia a Dia'),
        ul(
          'Acesso a Dados em Tempo Real: A IA lê informações atualizadas direto da fonte, sem você precisar ficar fazendo upload manual.',
          'Ações Diretas com Permissão: Você pode pedir para a IA organizar uma pasta no seu computador ou criar uma tarefa no seu gerenciador de projetos.',
          'Segurança e Privacidade: Você escolhe exatamente a quais pastas e ferramentas a IA terá acesso, podendo revogar a permissão a qualquer instante.'
        ),

        p(`Essa inovação é uma das bases fundamentais para o avanço dos agentes inteligentes que apresentamos em nosso post sobre `, t(linkRef.titulo, linkMark(linkRef.href)), `.`),

        h(2, '4. Conclusão'),
        p(`O Model Context Protocol representa um salto de maturidade na tecnologia. Ele transforma a IA de um simples gerador de texto em um verdadeiro assistente operacional conectado ao seu ecossistema digital.`),
      ],
    }),
  },
  {
    slug: 'como-proteger-seus-dados-pessoais-na-era-da-ia',
    title: 'Como Proteger seus Dados Pessoais e da sua Empresa na Era da IA Generativa',
    excerpt: 'Dicas práticas e fundamentais de segurança digital e privacidade para utilizar ferramentas de inteligência artificial sem expor informações confidenciais.',
    seo_title: 'Como Proteger seus Dados na Era da IA | Márcio Rolim',
    seo_description: 'Aprenda diretrizes simples de privacidade e segurança para usar ferramentas de inteligência artificial sem comprometer dados pessoais ou empresariais.',
    tags: ['segurança', 'privacidade', 'ia', 'lgpd', 'dicas'],
    cover_url: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=1200&auto=format&fit=crop',
    cover_alt: 'Cadeado digital brilhante simbolizando proteção e segurança de dados',
    linkInterno: { titulo: 'DeepSeek vs ChatGPT e Claude: Qual Escolher', href: '/blog/deepseek-vs-chatgpt-e-claude-qual-usar' },
    conteudoGerador: (post, linkRef) => ({
      type: 'doc',
      content: [
        p(`A facilidade de uso das ferramentas de inteligência artificial generativa fez com que milhões de pessoas passassem a utilizá-las diariamente. No entanto, na empolgação de resolver um problema rápido, muitas pessoas cometem o erro de colar documentos confidenciais, dados bancários ou estratégias sigilosas de empresas dentro das janelas de chat.`),
        p(`Neste guia prático, apresentamos cuidados essenciais para utilizar o poder da IA mantendo total privacidade e conformidade com a LGPD (Lei Geral de Proteção de Dados).`),

        bq(`"Tudo o que você digita em um serviço gratuito na nuvem pode ser utilizado para treinar futuras versões dos modelos. A regra de ouro é: na dúvida, anonimize."`),

        h(2, '1. O Que Acontece Com as Informações Enviadas para a IA?'),
        p(`Quando você envia uma mensagem para assistentes de IA em planos públicos e gratuitos, essas informações são processadas nos servidores da empresa fornecedora. Salvo configurações explícitas em contrário, esses dados podem ser armazenados e revisados por sistemas de segurança ou usados para aprimorar os algoritmos.`),

        h(2, '2. Regras de Ouro de Segurança Digital'),
        ul(
          'Nunca envie dados identificáveis de clientes: Nomes completos, CPF, números de cartão ou endereços de terceiros.',
          'Substitua nomes por pseudônimos: Em vez de colar "Contrato da Empresa X com o Cliente João Silva", use "Empresa A e Cliente B".',
          'Remova senhas e chaves de acesso: Jamais cole códigos com chaves de API, senhas de banco ou dados bancários.',
          'Desative o histórico de treinamento: Nas configurações de ferramentas como o ChatGPT, ative a opção de não permitir que suas conversas sejam usadas para treinar o modelo.'
        ),

        p(`Como destacamos ao comparar ferramentas em nosso guia sobre `, t(linkRef.titulo, linkMark(linkRef.href)), `, a procedência da ferramenta e seus termos de uso fazem toda a diferença na proteção da informação.`),

        h(2, '3. Recomendações para Empresas e Profissionais'),
        p(`Se você utiliza IA no seu trabalho diário ou gerencia equipes, adote planos corporativos (Enterprise ou Team). Esses planos oferecem garantias contratuais de que seus dados não serão armazenados nem utilizados para treinamento por terceiros.`),

        h(2, '4. Conclusão'),
        p(`A inteligência artificial é uma aliada fantástica para a produtividade. Usá-la com prudência e discernimento permite colher todos os seus benefícios sem colocar em risco sua reputação ou a segurança da sua empresa.`),
      ],
    }),
  },
  {
    slug: 'automacao-sem-codigo-no-code-para-iniciantes',
    title: 'Automação Sem Código (No-Code): Como Eliminar Tarefas Repetitivas Sem Precisar Programar',
    excerpt: 'Um guia simples e prático para entender como ferramentas visuais de automação podem conectar seus aplicativos e economizar horas de trabalho semanal.',
    seo_title: 'Automação Sem Código (No-Code) para Iniciantes | Márcio Rolim',
    seo_description: 'Aprenda a automatizar tarefas repetitivas do dia a dia utilizando ferramentas No-Code visuais como n8n e Make sem precisar escrever linhas de código.',
    tags: ['automação', 'no-code', 'n8n', 'produtividade', 'dicas'],
    cover_url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1200&auto=format&fit=crop',
    cover_alt: 'Blocos coloridos interconectados representando fluxos visuais de automação',
    linkInterno: { titulo: '10 Ferramentas de IA Essenciais para Produtividade', href: '/blog/10-ferramentas-de-ia-essenciais-para-produtividade' },
    conteudoGerador: (post, linkRef) => ({
      type: 'doc',
      content: [
        p(`Você já parou para calcular quanto tempo gasta no seu dia fazendo tarefas manuais e repetitivas? Baixar um anexo de e-mail, salvar em uma pasta, atualizar uma planilha e avisar a equipe no WhatsApp... Essas pequenas etapas consomem horas preciosas que poderiam ser dedicadas a atividades de maior valor.`),
        p(`A boa notícia é que você não precisa ser um programador formado em ciência da computação para automatizar esses processos. As ferramentas de automação No-Code (sem código) vieram para democratizar a eficiência digital.`),

        bq(`"Automatizar não é sobre substituir pessoas; é sobre libertar o potencial humano das tarefas mecânicas."`),

        h(2, '1. O Que É a Automação No-Code?'),
        p(`Ferramentas No-Code são plataformas visuais onde você constrói "receitas de automação" apenas arrastando e ligando blocos na tela.`),
        p(`Cada fluxo segue uma lógica simples: "Quando Acontecer Isso (Gatilho) -> Faça Aquilo (Ação)".`),

        h(2, '2. Exemplos Práticos de Automação no Dia a Dia'),
        ul(
          'Gestão de Leads: Quando um formulário for preenchido no site, enviar os dados automaticamente para a planilha e disparar uma mensagem no WhatsApp.',
          'Backup de Documentos: Quando um e-mail com anexo da contabilidade chegar, salvar o arquivo direto no Google Drive.',
          'Notificações de Vendas: Avisar o grupo da equipe no Telegram a cada nova venda realizada na plataforma online.'
        ),

        p(`Como mostramos na lista de `, t(linkRef.titulo, linkMark(linkRef.href)), `, plataformas como o n8n e o Make tornaram essa construção extremamente amigável.`),

        h(2, '3. Principais Plataformas do Mercado'),
        p(`n8n: Excelente opção visual que oferece versão gratuita e controle total sobre seus dados.`),
        p(`Make (antigo Integromat): Interface muito intuitiva e bonita com centenas de conexões prontas para aplicativos populares.`),
        p(`Zapier: A ferramenta mais antiga e famosa do mercado, ideal para quem busca simplicidade máxima de configuração.`),

        h(2, '4. Conclusão'),
        p(`Comece pequeno: escolha uma única tarefa chata que você repete todos os dias e crie sua primeira automação. Você ficará impressionado com a sensação de ver o computador trabalhando por você!`),
      ],
    }),
  },
  {
    slug: 'busca-inteligente-com-perplexity-e-searchgpt',
    title: 'Busca Inteligente (Perplexity e SearchGPT): Como Encontrar Respostas Confiáveis Mais Rápido que no Google',
    excerpt: 'Descubra como os novos buscadores conversacionais de inteligência artificial sintetizam a web em tempo real e entregam respostas diretas e verificadas.',
    seo_title: 'Busca Inteligente com Perplexity e SearchGPT | Márcio Rolim',
    seo_description: 'Aprenda a pesquisar na web usando ferramentas de busca com IA conversacional que sintetizam respostas diretas com fontes verificadas.',
    tags: ['busca', 'perplexity', 'searchgpt', 'ia', 'dicas'],
    cover_url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1200&auto=format&fit=crop',
    cover_alt: 'Globo digital com conexões de dados brilhantes representando a internet mundial',
    linkInterno: { titulo: 'Engenharia de Prompt Descomplicada', href: '/blog/engenharia-de-prompt-descomplicada-dicas-praticas' },
    conteudoGerador: (post, linkRef) => ({
      type: 'doc',
      content: [
        p(`Por mais de duas décadas, pesquisar na internet significava a mesma coisa: abrir o Google, digitar algumas palavras-chave e navegar por páginas cheias de anúncios e links para tentar encontrar a resposta desejada.`),
        p(`Hoje, o surgimento dos buscadores baseados em inteligência artificial — como o Perplexity AI e o SearchGPT — está transformando completamente essa experiência de pesquisa.`),

        bq(`"A busca tradicional te dá uma lista de links para você ler; a busca inteligente lê os links por você e entrega o resumo pronto com as fontes."`),

        h(2, '1. A Diferença Entre o Google Tradicional e a Busca com IA'),
        p(`Nos buscadores tradicionais, o objetivo principal é corresponder palavras-chave a páginas indexadas. Já nos buscadores de IA, o sistema entende a intenção da sua pergunta em linguagem natural.`),
        p(`Ele acessa múltiplos sites confiáveis em milissegundos, compara as informações, remove redundâncias e escreve uma resposta clara e direta para você.`),

        h(2, '2. Recursos de Destaque do Perplexity AI'),
        ul(
          'Citação Transparente de Fontes: Cada parágrafo traz pequenos números com links para os artigos originais onde a informação foi confirmada.',
          'Modo Foco: Permite filtrar a pesquisa apenas em artigos acadêmicos, no YouTube ou no Reddit.',
          'Perguntas de Acompanhamento: Você pode continuar a conversa fazendo perguntas complementares para aprofundar o assunto.'
        ),

        p(`Dominar o modo de fazer perguntas é fundamental para obter respostas excelentes, conforme explicamos em nosso guia sobre `, t(linkRef.titulo, linkMark(linkRef.href)), `.`),

        h(2, '3. Como Evitar Informações Incorretas (Alucinações)'),
        p(`Embora essas ferramentas sejam muito avançadas, é bom manter o hábito de clicar nos links de referência fornecidos para checar dados críticos, como dosagens de remédios, cotações financeiras ou dados jurídicos.`),

        h(2, '4. Conclusão'),
        p(`Adotar buscadores inteligentes no seu dia a dia é uma forma simples de economizar dezenas de horas de navegação sem rumo, direto para o conhecimento que interessa.`),
      ],
    }),
  },
  {
    slug: 'a-revolucao-das-ias-de-voz-e-visao-multimodal',
    title: 'A Revolução das IAs de Voz e Visão: O Que Esperar dos Novos Assistentes Multimodais',
    excerpt: 'Uma visão acessível sobre as inteligências artificiais multimodais que conseguem enxergar imagens, entender a voz humana com fluidez e interagir em tempo real.',
    seo_title: 'A Revolução das IAs de Voz e Visão Multimodal | Márcio Rolim',
    seo_description: 'Entenda como funcionam as IAs multimodais que conversam por voz com tom natural e analisam fotos e telas de computador em tempo real.',
    tags: ['ia', 'multimodal', 'voz', 'visao computacional', 'tendencias'],
    cover_url: 'https://images.unsplash.com/photo-1589254065878-42c9da997008?q=80&w=1200&auto=format&fit=crop',
    cover_alt: 'Robô amigável iluminado por luz azul suave interagindo com elementos digitais',
    linkInterno: { titulo: 'O Futuro do Trabalho com Agentes de IA', href: '/blog/o-futuro-do-trabalho-com-agentes-de-ia' },
    conteudoGerador: (post, linkRef) => ({
      type: 'doc',
      content: [
        p(`Durante muito tempo, nossa comunicação com os computadores esteve restrita ao teclado e ao mouse. Mesmo quando surgiram os primeiros assistentes de voz (como Siri e Alexa), as interações eram frequentemente robóticas e cheias de limitações.`),
        p(`A nova onda de IA Multimodal mudou essa história radicalmente. Agora, assistentes inteligentes conseguem ouvir sua voz com todas as nuances de entonação, responder instantaneamente sem pausas incômodas e "enxergar" o mundo através da câmera do celular ou da tela do seu computador.`),

        bq(`"Multimodalidade significa interagir com a inteligência artificial da mesma forma natural como conversamos com um amigo ao nosso lado."`),

        h(2, '1. O Que É Multimodalidade na Prática?'),
        p(`Modelos multimodais são aqueles treinados desde a sua origem para processar múltiplos tipos de informação simultaneamente: texto, áudio, imagem e vídeo.`),

        h(2, '2. Casos de Uso Impressionantes no Dia a Dia'),
        ul(
          'Suporte Técnico Visual: Apontar a câmera do celular para um aparelho quebrado ou painel de carro e perguntar à IA o que fazer.',
          'Prática de Idiomas por Voz: Conversar em inglês ou espanhol com a IA por voz, recebendo correções gentis de pronúncia em tempo real.',
          'Acessibilidade Ampliada: Pessoas com deficiência visual podem ter a tela ou o ambiente ao redor descrito em áudio detalhado.'
        ),

        p(`Essa evolução impulsiona diretamente o cenário de produtividade que abordamos em nosso artigo sobre `, t(linkRef.titulo, linkMark(linkRef.href)), `.`),

        h(2, '3. O Futuro Próximo'),
        p(`Nos próximos anos, o uso da voz e da câmera se tornará o modo primário de interação com nossos dispositivos digitais, tornando a tecnologia mais humana, inclusiva e acessível para todas as idades.`),
      ],
    }),
  },
  {
    slug: 'engenharia-de-prompt-descomplicada-dicas-praticas',
    title: 'Engenharia de Prompt Descomplicada: 5 Técnicas Simples para Obter as Melhores Respostas da IA',
    excerpt: 'Aprenda a estruturar comandos claros e eficientes para qualquer ferramenta de IA e obtenha respostas precisas sem perder tempo refazendo perguntas.',
    seo_title: 'Engenharia de Prompt Descomplicada | Márcio Rolim',
    seo_description: 'Aprenda 5 dicas práticas de engenharia de prompt para conversar melhor com o ChatGPT, Claude ou DeepSeek e obter resultados perfeitos.',
    tags: ['prompt', 'dicas', 'ia', 'chatgpt', 'produtividade'],
    cover_url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1200&auto=format&fit=crop',
    cover_alt: 'Mãos digitando em teclado iluminado com código e textos organizados',
    linkInterno: { titulo: '10 Ferramentas de IA Essenciais para Produtividade', href: '/blog/10-ferramentas-de-ia-essenciais-para-produtividade' },
    conteudoGerador: (post, linkRef) => ({
      type: 'doc',
      content: [
        p(`Você já tentou usar uma IA para realizar uma tarefa e recebeu uma resposta genérica, vaga ou totalmente fora do que você imaginava? O problema, na imensa maioria das vezes, não é a IA — é a forma como o comando (prompt) foi feito.`),
        p(`Engenharia de prompt nada mais é do que a arte de se comunicar com clareza com uma inteligência artificial. A seguir, compartilhamos 5 técnicas simples que mudam o nível dos seus resultados imediatamente.`),

        bq(`"A qualidade da resposta da IA é diretamente proporcional à clareza do contexto que você fornece."`),

        h(2, '1. Defina um Papel (Role-Playing)'),
        p(`Diga à IA quem ela deve simular. Em vez de perguntar "Como melhorar minhas vendas?", diga: "Atue como um especialista sênior em marketing digital com foco em pequenos negócios. Como posso melhorar as vendas do meu produto?"`),

        h(2, '2. Forneça o Contexto Completo'),
        p(`Explique quem é seu público, qual é a meta do texto e onde ele será publicado. Quanto mais detalhes relevantes você der, menos a IA precisará adivinhar.`),

        h(2, '3. Especifique o Formato Desejado'),
        p(`Diga exatamente como você quer a resposta: "Apresente o resultado em uma tabela com 3 colunas" ou "Escreva em tópicos curtos usando bullets".`),

        h(2, '4. Dê Exemplos (Few-Shot Prompting)'),
        p(`Se você quer que a IA escreva um e-mail no seu estilo, cole um exemplo de e-mail anterior escrito por você e diga: "Use este estilo de tom e formatação para o novo e-mail".`),

        h(2, '5. Peça para a IA Fazer Perguntas Antes de Responder'),
        p(`Termine seu prompt com esta frase poderosa: "Antes de responder, me faça 3 perguntas se precisar de mais detalhes para entregar o melhor resultado possível."`),

        p(`Aplicando essas dicas em conjunto com as ferramentas certas que indicamos em nosso guia de `, t(linkRef.titulo, linkMark(linkRef.href)), `, sua eficiência vai disparar.`),

        h(2, 'Conclusão'),
        p(`Pratique essas 5 regras nas suas próximas conversas com a IA. Você verá como a precisão das respostas aumenta de forma surpreendente!`),
      ],
    }),
  },
  {
    slug: 'como-usar-ia-para-criar-e-lancar-um-projeto-digital',
    title: 'Como Usar Inteligência Artificial para Tirar uma Ideia do Papel e Criar um Projeto Digital',
    excerpt: 'Um guia prático e inspirador para profissionais e empreendedores utilizarem a IA como copiloto no planejamento, validação e lançamento de ideias.',
    seo_title: 'Como Usar IA para Criar um Projeto Digital | Márcio Rolim',
    seo_description: 'Descubra como usar ferramentas de IA para validar ideias, planejar estratégias e lançar projetos digitais com agilidade e baixo custo.',
    tags: ['empreendedorismo', 'ia', 'projetos', 'produtividade', 'dicas'],
    cover_url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1200&auto=format&fit=crop',
    cover_alt: 'Grupo de pessoas reunidas ao redor de um laptop planejando um projeto inovador',
    linkInterno: { titulo: 'Automação Sem Código (No-Code) para Iniciantes', href: '/blog/automacao-sem-codigo-no-code-para-iniciantes' },
    conteudoGerador: (post, linkRef) => ({
      type: 'doc',
      content: [
        p(`Muitas pessoas têm excelentes ideias de projetos, cursos, aplicativos ou novos serviços, mas acabam travando na hora de tirar o plano do papel por falta de tempo, equipe ou conhecimento técnico específico.`),
        p(`Com o avanço da inteligência artificial, você agora tem à disposição uma equipe inteira de consultores de estratégia, designers e redatores trabalhando ao seu lado 24 horas por dia.`),

        bq(`"A IA não cria o seu propósito ou visão de negócio, mas encurta a distância entre a ideia e a execução como nenhuma outra tecnologia fez antes."`),

        h(2, 'Passo 1: Validação da Ideia com IA'),
        p(`Use o ChatGPT ou o Claude para analisar a viabilidade do seu projeto. Peça para a IA listar os prós, contras, potenciais concorrentes e os maiores desafios que você pode encontrar no mercado.`),

        h(2, 'Passo 2: Criação da Marca e Identidade'),
        p(`Utilize assistentes para sugerir nomes marcantes, slogans e textos institucionais. Ferramentas de design inteligente ajudam a montar paletas de cores e protótipos visuais iniciais.`),

        h(2, 'Passo 3: Construção da Estrutura e Automação'),
        p(`Conforme explicamos em nosso guia sobre `, t(linkRef.titulo, linkMark(linkRef.href)), `, conecte suas páginas de captura e formulários a sistemas automáticos para atender interessados sem complicação.`),

        h(2, 'Passo 4: Lançamento e Comunicação'),
        p(`Gere rascunhos de e-mails de lançamento, roteiros de apresentação e posts educativos para atrair seus primeiros clientes ou leitores.`),

        h(2, 'Conclusão'),
        p(`Não deixe suas ideias guardadas na gaveta. Com curiosidade, dedicação e o apoio da inteligência artificial, você pode colocar um novo projeto no ar em questão de dias!`),
      ],
    }),
  },
]

async function executarSubstituicaoPostsTech() {
  console.log(`\n=============================================================`)
  console.log(`🚀 INICIANDO ATUALIZAÇÃO DOS POSTS DE TECNOLOGIA (AMIGÁVEIS)`)
  console.log(`=============================================================\n`)

  const { data: postsAntigos, error: fetchError } = await supabase
    .from('posts')
    .select('id, title, slug')
    .neq('category', 'fe')

  if (fetchError) {
    console.error('Erro ao buscar posts de tecnologia:', fetchError.message)
    process.exit(1)
  }

  console.log(`Encontrados ${postsAntigos.length} posts de tecnologia no banco.\n`)

  // Passo 1: Renomeia todos os slugs para temporários para zerar conflitos de unique key
  for (let i = 0; i < postsAntigos.length; i++) {
    await supabase
      .from('posts')
      .update({ slug: `temp-tech-slug-${i}-${Date.now()}` })
      .eq('id', postsAntigos[i].id)
  }

  // Passo 2: Se houver mais posts no banco do que os 10 novos, apaga os excedentes
  if (postsAntigos.length > NOVOS_POSTS_TECH.length) {
    for (let i = NOVOS_POSTS_TECH.length; i < postsAntigos.length; i++) {
      console.log(`🗑️ Removendo post sobressalente ID ${postsAntigos[i].id}...`)
      await supabase.from('posts').delete().eq('id', postsAntigos[i].id)
    }
  }

  // Passo 3: Atualiza os 10 posts com os dados finais perfeitos
  let atualizados = 0

  for (let i = 0; i < NOVOS_POSTS_TECH.length && i < postsAntigos.length; i++) {
    const postBanco = postsAntigos[i]
    const novoPost = NOVOS_POSTS_TECH[i]

    const docJson = novoPost.conteudoGerador(novoPost, novoPost.linkInterno)
    const textoPlano = extrairTextoDoJson(docJson)
    const totalPalavras = contarPalavras(novoPost.title) + contarPalavras(textoPlano)
    const minutosLeitura = Math.max(Math.ceil(totalPalavras / 180), 7)

    const { error: updateError } = await supabase
      .from('posts')
      .update({
        slug: novoPost.slug,
        title: novoPost.title,
        excerpt: novoPost.excerpt,
        seo_title: novoPost.seo_title,
        seo_description: novoPost.seo_description,
        tags: novoPost.tags,
        cover_url: novoPost.cover_url,
        cover_alt: novoPost.cover_alt,
        content_json: docJson,
        content_text: textoPlano,
        reading_minutes: minutosLeitura,
        updated_at: new Date().toISOString(),
      })
      .eq('id', postBanco.id)

    if (updateError) {
      console.error(`❌ Erro ao atualizar post ID ${postBanco.id}:`, updateError.message)
    } else {
      atualizados++
      console.log(`✅ [${atualizados}/10] "${novoPost.title}"`)
      console.log(`   Slug: /blog/${novoPost.slug} | Palavras: ${totalPalavras.toLocaleString('pt-BR')} (~${minutosLeitura} min)\n`)
    }
  }

  console.log(`=============================================================`)
  console.log(`🎉 TODOS OS ${atualizados} POSTS DE TECNOLOGIA FORAM REFEITOS COM SUCESSO!`)
  console.log(`=============================================================\n`)
}

executarSubstituicaoPostsTech()
