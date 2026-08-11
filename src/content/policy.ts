// Texto da Política de Privacidade como dado puro: sem JSX, sem React.
// Quem renderiza é app/(site)/privacidade/page.tsx.
//
// ─── Por que este arquivo existe ────────────────────────────────────────────
// A política anterior (components/PrivacyPolicy.tsx, do site Vite) tinha o texto
// entranhado no markup. Isso impedia três coisas que a LGPD e a ANPD pedem:
//   1. versionar o documento (POLICY_VERSION, gravada junto de cada pedido de
//      direitos em privacy_log — art. 8º, §2º: o ônus da prova é do controlador);
//   2. montar um sumário navegável a partir das próprias seções, sem duplicar
//      títulos à mão (Guia de Cookies da ANPD, Exemplo 7);
//   3. revisar o texto legal sem ler Tailwind.
//
// ─── Nota sobre a modelagem ─────────────────────────────────────────────────
// Cada seção tem `id`, `titulo`, `resumo` e `blocos`. Um bloco é um parágrafo,
// uma lista, um destaque ou uma TABELA — as tabelas não são um enfeite: o
// inventário de cookies e o quadro de prazos são exatamente o que a ANPD
// recomenda tabelar, e não caberiam em `paragrafos: string[]`.
//
// Dentro de um parágrafo, um trecho pode ser texto puro, um link ou uma ênfase.
// É o mesmo padrão de SegmentoTexto já usado em content/curriculum.ts.

import { ADDRESS, CONTACT, SITE } from './site'

// ─── Versão ─────────────────────────────────────────────────────────────────

/**
 * Versão desta política, no formato ISO da data em que passa a valer.
 *
 * Grave este valor em CADA registro de exercício de direitos (privacy_log) e em
 * cada consentimento. A ANPD é explícita: "Qualquer alteração das premissas
 * adotadas para a obtenção do consentimento macula a hipótese legal adotada,
 * exigindo novo consentimento" (Guia de Cookies, p. 19). Sem a versão gravada
 * não há como saber a que texto a pessoa disse sim.
 *
 * Mudou finalidade, base legal, prazo ou destinatário? Suba a versão.
 */
export const POLICY_VERSION = '2026-09-01' as const

/** A mesma data de POLICY_VERSION, por extenso, para exibir ao leitor. */
export const POLICY_VERSION_LABEL = '1º de setembro de 2026' as const

export const POLICY_TITLE = 'Política de Privacidade' as const

export const POLICY_SUBTITLE =
  'Como o site marciorolim.com.br trata os seus dados: o que é coletado, por quê, por quanto tempo, e o que você pode exigir a qualquer momento.' as const

export const POLICY_META_DESCRIPTION =
  'Política de Privacidade de marciorolim.com.br em conformidade com a LGPD: base legal, prazos de retenção, inventário de cookies, transferência internacional e direitos do titular.' as const

// ─── Tipos ──────────────────────────────────────────────────────────────────

export type TrechoLink = {
  readonly texto: string
  readonly href: string
}

export type TrechoForte = {
  readonly texto: string
  readonly forte: true
}

/** Um pedaço de parágrafo: texto puro, link ou ênfase. */
export type Trecho = string | TrechoLink | TrechoForte

/** Um parágrafo é a sequência dos seus trechos. */
export type Paragrafo = readonly Trecho[]

export type BlocoParagrafo = {
  readonly tipo: 'paragrafo'
  readonly conteudo: Paragrafo
}

export type BlocoLista = {
  readonly tipo: 'lista'
  readonly itens: readonly Paragrafo[]
}

/** Caixa de aviso. Usada onde a informação não pode passar batida. */
export type BlocoDestaque = {
  readonly tipo: 'destaque'
  readonly titulo: string
  readonly conteudo: readonly Paragrafo[]
}

export type BlocoTabela = {
  readonly tipo: 'tabela'
  readonly legenda: string
  readonly colunas: readonly string[]
  readonly linhas: readonly (readonly string[])[]
  readonly nota?: string
}

export type Bloco = BlocoParagrafo | BlocoLista | BlocoDestaque | BlocoTabela

export type SecaoPolitica = {
  /** Âncora da seção. É o que o sumário aponta e o que vai na URL. */
  readonly id: string
  readonly titulo: string
  /** Uma linha, para o sumário. Não repete o título. */
  readonly resumo: string
  readonly blocos: readonly Bloco[]
}

// ─── Seções ─────────────────────────────────────────────────────────────────

export const POLICY_SECTIONS = [
  // ── 1 ────────────────────────────────────────────────────────────────────
  {
    id: 'resumo',
    titulo: 'O essencial, em poucas linhas',
    resumo: 'O resumo honesto, antes dos detalhes',
    blocos: [
      {
        tipo: 'paragrafo',
        conteudo: [
          'Esta política está escrita para ser lida, não para ser aceita sem ler. Se você só tiver um minuto, é isto:',
        ],
      },
      {
        tipo: 'lista',
        itens: [
          [
            { texto: 'O site mede audiência com ferramenta própria.', forte: true },
            ' Quero saber quais páginas são mais visitadas, de onde vem o tráfego e onde acontecem erros. Nada além disso.',
          ],
          [
            { texto: 'Seu endereço IP não é gravado. A identificação do seu navegador também não.', forte: true },
            ' Os dois entram numa conta matemática que gera um código do dia e são descartados na mesma requisição. Não existe coluna, arquivo ou log deste site que os contenha.',
          ],
          [
            { texto: 'Não há publicidade, perfil de comportamento nem rastreio entre sites.', forte: true },
            ' Não uso Google Analytics, pixel de rede social ou cookie de terceiro. Nenhum dado seu é vendido, alugado ou trocado.',
          ],
          [
            { texto: 'A medição não conversa com o resto.', forte: true },
            ' Os registros de navegação não são cruzados com as conversas da Rolim IA nem com pedidos de orçamento.',
          ],
          [
            { texto: 'Você pode dizer não, a qualquer momento, sem explicar por quê.', forte: true },
            ' É o direito de oposição, e ele existe justamente porque eu não peço o seu consentimento para medir audiência.',
          ],
        ],
      },
      {
        tipo: 'paragrafo',
        conteudo: [
          'O resto do documento detalha cada uma dessas cinco frases, com os prazos e os artigos da lei. Use o sumário para ir direto ao ponto que te interessa.',
        ],
      },
    ],
  },

  // ── 2 ────────────────────────────────────────────────────────────────────
  {
    id: 'controlador',
    titulo: 'Quem é responsável pelos seus dados',
    resumo: 'O controlador e o canal exclusivo de privacidade',
    blocos: [
      {
        tipo: 'paragrafo',
        conteudo: [
          `O controlador dos dados tratados neste site é ${SITE.name}, pessoa natural, em ${ADDRESS.addressLocality}/${ADDRESS.addressRegion}. Controlador é o termo que a LGPD usa (art. 5º, VI) para quem decide o que é tratado e por quê. Neste caso é uma pessoa só, e é a mesma que responde os e-mails.`,
        ],
      },
      {
        tipo: 'paragrafo',
        conteudo: [
          'Para qualquer assunto de proteção de dados — dúvida, pedido, reclamação, exercício de direitos — existe um canal exclusivo: ',
          { texto: CONTACT.privacyEmail, href: CONTACT.privacyEmailHref },
          '. Ele é lido por mim. Assuntos que não sejam de privacidade continuam em ',
          { texto: CONTACT.email, href: CONTACT.emailHref },
          '.',
        ],
      },
      {
        tipo: 'paragrafo',
        conteudo: [
          'Este site se enquadra como ',
          { texto: 'agente de tratamento de pequeno porte', forte: true },
          ' (Resolução CD/ANPD nº 2/2022): pessoa natural, operação pequena, sem tratamento de alto risco. Isso tem duas consequências práticas que aparecem mais adiante: não sou obrigado a nomear um encarregado (o "DPO"), e os prazos legais para eu responder aos seus pedidos contam em dobro. Mesmo dispensado do encarregado, mantenho o canal acima identificado como canal de proteção de dados — que é o que interessa a você.',
        ],
      },
    ],
  },

  // ── 3 ────────────────────────────────────────────────────────────────────
  {
    id: 'dados',
    titulo: 'Quais dados são tratados — e quais não são',
    resumo: 'O que entra, o que nunca é gravado, e como o identificador funciona',
    blocos: [
      {
        tipo: 'paragrafo',
        conteudo: [
          { texto: 'Dados que você mesmo fornece.', forte: true },
          ' O conteúdo das mensagens que você escreve para a Rolim IA, o assistente virtual do site — inclusive o nome, se você resolver dizer. E o que você escrever ao me procurar por WhatsApp ou e-mail, através dos links do site.',
        ],
      },
      {
        tipo: 'paragrafo',
        conteudo: [
          { texto: 'Dados gerados pela sua navegação.', forte: true },
          ' Qual página foi aberta, a data e a hora, de onde você veio (o site ou a busca que te trouxe até aqui), quanto da página foi lida, quanto tempo ela ficou ativa na sua tela, cliques em elementos que eu marquei para acompanhar, e os erros que o site apresentou. Também guardo a categoria genérica do seu aparelho e do navegador — "celular", "computador", "Chrome" — derivada da identificação que o navegador envia, mas nunca essa identificação inteira.',
        ],
      },
      {
        tipo: 'destaque',
        titulo: 'O que este site nunca grava',
        conteudo: [
          [
            { texto: 'Seu endereço IP.', forte: true },
            ' Ele chega ao servidor, porque sem endereço não haveria como te devolver a página. Mas não é escrito em nenhuma tabela, nenhum log de aplicação e nenhum arquivo.',
          ],
          [
            { texto: 'O User-Agent completo', forte: true },
            ' — a linha em que o navegador se identifica, com versão de sistema e do próprio navegador. Também não é gravado.',
          ],
          [
            'Nada de ',
            { texto: 'fingerprinting', forte: true },
            ': não leio a lista de fontes instaladas, não desenho no canvas para te reconhecer, não consulto bateria, sensores nem resolução exata.',
          ],
          [
            'Nada de ',
            { texto: 'dados sensíveis nem documentos', forte: true },
            ': não peço CPF, endereço, dado bancário, nem dado sobre saúde, religião, opinião política ou orientação sexual (art. 5º, II). Se você escrever algo assim espontaneamente no chat, escreva também para o canal de privacidade que eu apago.',
          ],
        ],
      },
      {
        tipo: 'paragrafo',
        conteudo: [
          { texto: 'Então como o site conta visitantes sem saber quem eles são?', forte: true },
          ' Com uma conta de mão única. No momento em que a página é aberta, o servidor combina três coisas — o seu IP, a identificação do navegador e uma chave secreta que muda todo dia (o ',
          { texto: 'salt', forte: true },
          ') — e produz um código embaralhado. É esse código que fica gravado, e só ele. O IP e a identificação do navegador são descartados assim que a conta termina, ainda dentro da mesma requisição.',
        ],
      },
      {
        tipo: 'paragrafo',
        conteudo: [
          'A chave do dia é destruída em até 48 horas. Sem ela, ninguém — nem eu — consegue refazer o cálculo, descobrir de que IP veio o código, ou ligar o código de hoje ao de ontem. É por isso que o site não sabe dizer se você é visitante novo ou recorrente: essa informação simplesmente não sobrevive à virada do dia.',
        ],
      },
      {
        tipo: 'paragrafo',
        conteudo: [
          'Uma questão de vocabulário que eu faço questão de não maquiar: enquanto a chave do dia existe, esse código é um dado ',
          { texto: 'pseudonimizado', forte: true },
          ', não anônimo. São regimes diferentes na LGPD — o dado anonimizado sai do alcance da lei (art. 12), o pseudonimizado continua sendo dado pessoal e continua protegido por esta política. A política antiga deste site dizia "anônimos ou pseudo-anonimizados", como se fosse a mesma coisa. Não é, e este documento não repete o erro.',
        ],
      },
    ],
  },

  // ── 4 ────────────────────────────────────────────────────────────────────
  {
    id: 'medicao',
    titulo: 'Medição de audiência: para que serve e com que base legal',
    resumo: 'Legítimo interesse, finalidade declarada e os limites que aceitei',
    blocos: [
      {
        tipo: 'paragrafo',
        conteudo: [
          'A LGPD exige que eu diga a finalidade ',
          { texto: 'específica', forte: true },
          ' do tratamento (art. 9º, I), e a ANPD não aceita finalidade genérica — aquelas fórmulas vagas sobre aprimoramento do site que aparecem em toda política e não dizem nada a ninguém. A minha é esta, sem rodeios: ',
          {
            texto: 'medir audiência — quais páginas são mais visitadas, qual a origem do tráfego e onde o site apresenta erros.',
            forte: true,
          },
        ],
      },
      {
        tipo: 'paragrafo',
        conteudo: [
          'Serve para eu decidir sobre o que escrever, saber que um link quebrou antes que alguém precise me avisar, e descobrir qual página trava no celular. Não serve para montar perfil de comportamento, para prever suas preferências, para publicidade, para remarketing, nem para te acompanhar por outros sites.',
        ],
      },
      {
        tipo: 'paragrafo',
        conteudo: [
          { texto: 'A base legal é o legítimo interesse', forte: true },
          ' (art. 7º, IX, combinado com o art. 10 da LGPD). Em português: eu trato esses dados sem pedir o seu consentimento, porque tenho um interesse concreto e legítimo em saber como o meu site é usado, e porque o impacto sobre você é pequeno. A ANPD admite essa base para medição de audiência, mas sob condições estreitas — e a contrapartida, para você, é o direito de se opor a qualquer momento.',
        ],
      },
      {
        tipo: 'paragrafo',
        conteudo: [
          'As condições que aceitei para poder usar essa base — e que valem como compromisso, não como intenção:',
        ],
      },
      {
        tipo: 'lista',
        itens: [
          ['A coleta se limita ao estritamente necessário para a finalidade acima (art. 10, §1º).'],
          ['O identificador vive um dia. Não há perfil montado ao longo do tempo.'],
          ['Os dados não são compartilhados com terceiros para fins próprios deles.'],
          [
            'Os dados de navegação não são cruzados com nenhum outro banco: nem com as conversas da Rolim IA, nem com pedidos de orçamento, nem com contatos.',
          ],
          ['O que eu efetivamente olho no dia a dia são números agregados, não a trilha de ninguém.'],
          [
            'Os prazos de guarda estão declarados nesta política, e o apagamento é automático — não depende de eu lembrar.',
          ],
        ],
      },
      {
        tipo: 'paragrafo',
        conteudo: [
          'Antes de ligar a medição eu fiz e datei uma ',
          { texto: 'avaliação de legítimo interesse', forte: true },
          ' — o exercício, em três etapas, de confrontar a finalidade, a necessidade real do dado e o impacto sobre você, registrando as salvaguardas adotadas. Se você quiser saber o que ficou escrito ali, peça pelo canal de privacidade.',
        ],
      },
      {
        tipo: 'destaque',
        titulo: 'A linha que eu me comprometo a não cruzar sem avisar',
        conteudo: [
          [
            'Se um dia eu quiser distinguir visitantes novos de recorrentes entre dias diferentes, cruzar a medição com as conversas da Rolim IA, ou usar esses dados para publicidade, o legítimo interesse deixa de sustentar o tratamento. Nesse dia eu passo a ',
            { texto: 'pedir o seu consentimento antes', forte: true },
            ', e a versão desta política muda. Está escrito aqui para que não seja uma surpresa depois.',
          ],
        ],
      },
    ],
  },

  // ── 5 ────────────────────────────────────────────────────────────────────
  {
    id: 'cookies',
    titulo: 'Cookies e o que fica guardado no seu dispositivo',
    resumo: 'Inventário completo: nome, tipo, finalidade e prazo',
    blocos: [
      {
        tipo: 'paragrafo',
        conteudo: [
          'Este é o inventário completo do que o site grava — ou deixa de gravar — no seu navegador. Não há cookies de terceiros nesta lista porque não existem: nenhum script de outra empresa é carregado nas páginas deste site.',
        ],
      },
      {
        tipo: 'tabela',
        legenda: 'Inventário de cookies e rastreadores do site',
        colunas: ['Nome', 'Tipo', 'Finalidade', 'Prazo'],
        linhas: [
          [
            'site-theme',
            'localStorage — próprio, de preferência',
            'Lembrar se você escolheu o modo claro ou o modo escuro, para o site não voltar ao padrão a cada visita.',
            'Até você limpar os dados do site no navegador',
          ],
          [
            'mr_optout',
            'Cookie — próprio, de exercício de direitos',
            'Registrar que você se opôs à medição de audiência. É o que faz o servidor descartar, antes de gravar qualquer coisa, tudo que vier do seu navegador.',
            '12 meses',
          ],
          [
            'mr_analytics_ignore',
            'localStorage — próprio, de exercício de direitos',
            'Espelho local da mesma oposição: impede que o navegador chegue a enviar o evento, poupando até a requisição.',
            'Até você limpar os dados do site no navegador',
          ],
          [
            'Identificador diário de visitante',
            'Rastreador próprio, analítico — calculado no servidor; nada é gravado no seu dispositivo',
            'Contar visitantes e sessões do dia e agrupar as páginas de uma mesma visita, sem saber quem você é.',
            'A chave que o gera é destruída em até 48 h; os registros são apagados em 180 dias',
          ],
        ],
        nota: 'Um cookie de sessão técnico pode ser criado pela hospedagem para equilibrar a carga entre servidores. Ele não identifica você, não é lido pelo site e desaparece ao fechar o navegador.',
      },
      {
        tipo: 'destaque',
        titulo: 'As configurações de cookies do navegador não bloqueiam tudo',
        conteudo: [
          [
            'Duas das linhas acima — ',
            { texto: 'site-theme', forte: true },
            ' e ',
            { texto: 'mr_analytics_ignore', forte: true },
            ' — ficam no ',
            { texto: 'localStorage', forte: true },
            ', que é um espaço de armazenamento diferente dos cookies. ',
            {
              texto: 'Bloquear cookies nas configurações do navegador não impede que elas sejam gravadas.',
              forte: true,
            },
            ' Estou obrigado a te avisar disso, e prefiro avisar em caixa alta do que em nota de rodapé.',
          ],
          [
            'Para removê-las, é preciso limpar os dados do site: em geral, clicando no cadeado ao lado do endereço → "Cookies e dados do site" → "Gerenciar" ou "Limpar"; ou pelo histórico do navegador → "Limpar dados de navegação" → "Cookies e outros dados de sites".',
          ],
          [
            'Repare na ironia útil: limpar tudo apaga também a sua oposição, porque ela mora exatamente nesses dois lugares. Se você limpar os dados do site, registre a oposição de novo.',
          ],
        ],
      },
      {
        tipo: 'paragrafo',
        conteudo: [
          { texto: 'Como bloquear pelo navegador.', forte: true },
          ' No Chrome: Configurações → Privacidade e segurança → Cookies de terceiros. No Firefox: Configurações → Privacidade e Segurança → Proteção aprimorada contra rastreamento. No Safari: Ajustes → Privacidade. No Edge: Configurações → Cookies e permissões do site.',
        ],
      },
      {
        tipo: 'paragrafo',
        conteudo: [
          'Vale dizer o que a própria ANPD diz: a configuração do navegador tem função ',
          { texto: 'complementar', forte: true },
          ' e não substitui um canal direto de oposição. Por isso a oposição também se exerce diretamente comigo, pelo canal de privacidade, sem depender de você mexer em configuração nenhuma.',
        ],
      },
    ],
  },

  // ── 6 ────────────────────────────────────────────────────────────────────
  {
    id: 'retencao',
    titulo: 'Por quanto tempo cada coisa é guardada',
    resumo: 'Prazos declarados, um por um, e o apagamento automático',
    blocos: [
      {
        tipo: 'paragrafo',
        conteudo: [
          'A LGPD me obriga a informar a duração do tratamento (art. 9º, II) e proíbe prazos indeterminados ou desproporcionais. A política anterior deste site não trazia prazo nenhum. Estes são os prazos, todos eles:',
        ],
      },
      {
        tipo: 'tabela',
        legenda: 'Prazos de retenção por categoria de dado',
        colunas: ['Dado', 'Prazo', 'O que acontece no fim do prazo'],
        linhas: [
          [
            'Eventos de navegação e sessões (páginas abertas, cliques marcados, rolagem, erros)',
            '180 dias',
            'Apagados do banco por rotina automática agendada. Não é limpeza manual.',
          ],
          [
            'Chave (salt) que gera o identificador diário',
            '48 horas',
            'Destruída. Sem ela o identificador não pode ser recalculado nem ligado a outro dia — é o que torna a separação definitiva.',
          ],
          [
            'Cookie de oposição (mr_optout)',
            '12 meses',
            'Expira no seu navegador. Se você quiser mantê-la além disso, ou se limpar os dados do site antes, registre a oposição de novo.',
          ],
          [
            'Preferência de tema (site-theme)',
            'Até você limpar',
            'Fica no seu navegador por tempo indeterminado, porque só você pode removê-la. Eu não tenho acesso a ela.',
          ],
          [
            'Estatísticas agregadas e anônimas (ex.: "1.240 visitas em março")',
            'Prazo indeterminado',
            'Permanecem. São números que não identificam ninguém e, por isso, deixam de ser dado pessoal (art. 12).',
          ],
          [
            'Conversas com a Rolim IA',
            'Enquanto durar a sessão no seu navegador',
            'A conversa não é gravada em banco de dados do site. Ao fechar ou recarregar a página, ela some.',
          ],
          [
            'Registro dos pedidos de direitos (oposição, exclusão, acesso)',
            'Pelo tempo necessário para comprovar que atendi',
            'Guardo a data, qual foi o pedido e a versão desta política vigente naquele momento. É a minha prova de que cumpri — a lei põe esse ônus em mim (art. 8º, §2º).',
          ],
        ],
        nota: 'Mensagens que você me enviar por e-mail ou WhatsApp seguem a vida normal de uma conversa: ficam na caixa de entrada e no aplicativo. Se quiser que eu apague uma conversa específica, peça.',
      },
      {
        tipo: 'paragrafo',
        conteudo: [
          'O apagamento dos dois primeiros prazos é executado por uma rotina agendada no próprio banco de dados. Isso importa: prazo que depende de alguém lembrar de rodar não é prazo, é intenção.',
        ],
      },
    ],
  },

  // ── 7 ────────────────────────────────────────────────────────────────────
  {
    id: 'compartilhamento',
    titulo: 'Com quem os dados são compartilhados',
    resumo: 'Os operadores que executam parte do serviço por minha conta',
    blocos: [
      {
        tipo: 'paragrafo',
        conteudo: [
          'Não vendo, não alugo e não troco dados com ninguém. Não há parceiro de publicidade, corretor de dados nem rede social recebendo qualquer coisa deste site.',
        ],
      },
      {
        tipo: 'paragrafo',
        conteudo: [
          'Existem, porém, empresas que executam parte da operação por minha conta e sob minhas instruções. A LGPD as chama de ',
          { texto: 'operadores', forte: true },
          ' (art. 5º, VII). São estas, e só estas:',
        ],
      },
      {
        tipo: 'lista',
        itens: [
          [
            { texto: 'Vercel', forte: true },
            ' — hospeda o site e executa o código do servidor. Toda requisição passa por lá, incluindo o seu IP, que é usado para entregar a página e para calcular o identificador do dia.',
          ],
          [
            { texto: 'Supabase', forte: true },
            ' — é o banco de dados onde ficam os registros de navegação já pseudonimizados. Sem IP e sem User-Agent, porque eles nunca chegam a ser gravados.',
          ],
          [
            { texto: 'Google (Gemini)', forte: true },
            ' — recebe o texto das mensagens que você escreve para a Rolim IA e devolve a resposta. Sem isso o assistente não funciona.',
          ],
          [
            { texto: 'MiniMax', forte: true },
            ' — recebe o texto da resposta da Rolim IA e devolve o áudio, quando você clica para ouvir. Se você não usar o recurso de voz, nada é enviado.',
          ],
        ],
      },
      {
        tipo: 'paragrafo',
        conteudo: [
          { texto: 'Um detalhe que não é meu, mas que você merece saber.', forte: true },
          ' O botão de microfone do chat usa o reconhecimento de voz do próprio navegador. Em alguns navegadores — Chrome e Edge, notadamente — o áudio é enviado aos servidores do fabricante para ser transcrito. Esse fluxo acontece antes de o texto chegar ao meu site, é do navegador e não passa por mim. Se isso te incomoda, digite em vez de falar.',
        ],
      },
      {
        tipo: 'paragrafo',
        conteudo: [
          'Além disso, posso compartilhar dados para cumprir obrigação legal ou ordem de autoridade competente (art. 7º, II e VI). Se acontecer e a lei permitir avisar, eu aviso.',
        ],
      },
    ],
  },

  // ── 8 ────────────────────────────────────────────────────────────────────
  {
    id: 'internacional',
    titulo: 'Transferência internacional de dados',
    resumo: 'Todos os fornecedores estão fora do Brasil — o que sai daqui',
    blocos: [
      {
        tipo: 'paragrafo',
        conteudo: [
          'Todos os operadores da seção anterior ficam fora do Brasil. Isso caracteriza transferência internacional de dados, tratada no Capítulo V da LGPD (arts. 33 a 36), e a política anterior deste site não dizia uma palavra sobre o assunto. Aqui está o que sai do país, para onde e por quê:',
        ],
      },
      {
        tipo: 'tabela',
        legenda: 'Transferências internacionais: destinatário, finalidade e conteúdo',
        colunas: ['Destinatário', 'Para que serve', 'O que sai daqui'],
        linhas: [
          [
            'Vercel Inc. (Estados Unidos)',
            'Hospedagem do site e execução do código de servidor',
            'A requisição inteira, incluindo o IP — que é necessário para a página chegar até você e para o cálculo do identificador do dia, e que não é gravado.',
          ],
          [
            'Supabase Inc. (Estados Unidos)',
            'Banco de dados dos registros de navegação',
            'Registros já pseudonimizados: página, data e hora, identificador do dia, categoria de dispositivo. Sem IP, sem User-Agent.',
          ],
          [
            'Google LLC — Gemini (Estados Unidos e outros países)',
            'Gerar as respostas da Rolim IA',
            'O texto das mensagens que você escreve no chat, com o histórico daquela conversa.',
          ],
          [
            'MiniMax (fora do Brasil)',
            'Converter em áudio a resposta da Rolim IA',
            'O texto que será falado, quando você pede para ouvir a resposta.',
          ],
        ],
      },
      {
        tipo: 'paragrafo',
        conteudo: [
          'Essas transferências se apoiam nas cláusulas contratuais de proteção de dados que cada fornecedor publica e nas quais eu aceito ao contratar o serviço; no caso do chat e do áudio, também no fato de a transferência ser necessária para executar exatamente aquilo que você pediu ao clicar. A regulamentação brasileira sobre transferência internacional ainda está amadurecendo; conforme ela evoluir, atualizo esta seção e subo a versão da política.',
        ],
      },
      {
        tipo: 'destaque',
        titulo: 'Se você prefere que nada saia do Brasil',
        conteudo: [
          [
            'Não use o chat da Rolim IA nem o botão de ouvir a resposta, e registre a sua oposição à medição de audiência. O site continua funcionando inteiro: ler as páginas, ver o conteúdo e me chamar no WhatsApp não dependem de nenhum desses serviços. A hospedagem, essa, é inevitável — é ela que entrega a página.',
          ],
        ],
      },
    ],
  },

  // ── 9 ────────────────────────────────────────────────────────────────────
  {
    id: 'direitos',
    titulo: 'Seus direitos, e como exercer',
    resumo: 'A lista completa do art. 18, incluindo o direito de oposição',
    blocos: [
      {
        tipo: 'paragrafo',
        conteudo: [
          'A Lei Geral de Proteção de Dados (LGPD, Lei nº 13.709/2018) garante a você os direitos abaixo. Todos eles se exercem pelo mesmo lugar: ',
          { texto: CONTACT.privacyEmail, href: CONTACT.privacyEmailHref },
          '.',
        ],
      },
      {
        tipo: 'lista',
        itens: [
          [
            { texto: 'Confirmação de que existe tratamento', forte: true },
            ' (art. 18, I) — saber se eu trato algum dado seu.',
          ],
          [
            { texto: 'Acesso aos dados', forte: true },
            ' (art. 18, II) — receber o que existe a seu respeito.',
          ],
          [
            { texto: 'Correção', forte: true },
            ' (art. 18, III) — de dado incompleto, inexato ou desatualizado.',
          ],
          [
            {
              texto: 'Anonimização, bloqueio ou eliminação de dados desnecessários, excessivos ou tratados fora da lei',
              forte: true,
            },
            ' (art. 18, IV) — e repare: este direito ',
            { texto: 'não depende de você ter consentido com nada', forte: true },
            '. Ele vale inclusive para a medição de audiência, que é feita com base em legítimo interesse.',
          ],
          [
            { texto: 'Portabilidade', forte: true },
            ' (art. 18, V) — receber os dados em formato aberto, para levar a outro fornecedor. Entrego em JSON ou CSV.',
          ],
          [
            { texto: 'Eliminação dos dados tratados com base no seu consentimento', forte: true },
            ' (art. 18, VI).',
          ],
          [
            { texto: 'Informação sobre compartilhamento', forte: true },
            ' (art. 18, VII) — com quem eu compartilhei dados seus. A resposta padrão está na seção sobre compartilhamento; se você quiser por escrito e nominalmente, peça.',
          ],
          [
            { texto: 'Informação sobre a possibilidade de não consentir', forte: true },
            ' (art. 18, VIII) — e sobre o que acontece se você não consentir.',
          ],
          [
            { texto: 'Revogação do consentimento', forte: true },
            ' (art. 18, IX) — quando algum tratamento depender de consentimento, revogar deve ser tão fácil quanto foi consentir, e é.',
          ],
          [
            { texto: 'Oposição (art. 18, §2º)', forte: true },
            ' — opor-se a tratamento feito com base em legítimo interesse. ',
            { texto: 'É o direito que mais importa aqui', forte: true },
            ': a medição de audiência é exatamente esse caso. Você pode dizer não sem justificar, e a coleta para.',
          ],
          [
            { texto: 'Revisão de decisões automatizadas', forte: true },
            ' (art. 20) — este site não toma decisões automatizadas que afetem seus interesses. A Rolim IA responde perguntas; ela não decide sobre crédito, contratação, preço ou perfil.',
          ],
          [
            { texto: 'Peticionar à ANPD', forte: true },
            ' (art. 18, §1º) — se você achar que eu não resolvi, pode reclamar diretamente à Autoridade Nacional de Proteção de Dados. Não precisa da minha autorização, e eu prefiro que você tenha essa porta.',
          ],
        ],
      },
      {
        tipo: 'destaque',
        titulo: 'Prazo de resposta',
        conteudo: [
          [
            'Pedidos simples de confirmação ou acesso são respondidos em formato simplificado, imediatamente. Para a declaração completa, a lei me dá ',
            { texto: '15 dias', forte: true },
            ' (art. 19, II). Por eu ser agente de tratamento de pequeno porte, a Resolução CD/ANPD nº 2/2022 conta esse prazo ',
            { texto: 'em dobro', forte: true },
            ' — o limite legal, na prática, é de 30 dias. Isso é o teto, não a meta: a intenção é responder em poucos dias.',
          ],
        ],
      },
      {
        tipo: 'paragrafo',
        conteudo: [
          { texto: 'Um problema honesto sobre acesso e exclusão dos dados de navegação.', forte: true },
          ' O identificador do dia só existe no meu banco: o seu navegador não guarda cópia dele. Se você me escrever pedindo acesso aos seus registros de navegação, eu não tenho como descobrir quais são os seus — e a lei não me autoriza a pedir o seu documento só para procurar, porque isso coletaria mais dado seu do que eu tenho hoje.',
        ],
      },
      {
        tipo: 'paragrafo',
        conteudo: [
          'Por isso o caminho prático costuma ser outro, e ele é mais forte: registre a ',
          { texto: 'oposição', forte: true },
          ', que interrompe a coleta imediatamente, e o que já existia desaparece sozinho no prazo de 180 dias. Se você tiver como me informar o identificador do dia, aí sim eu localizo, exporto e apago em um passo.',
        ],
      },
    ],
  },

  // ── 10 ───────────────────────────────────────────────────────────────────
  {
    id: 'seguranca',
    titulo: 'Segurança',
    resumo: 'As medidas em vigor e o que acontece se algo der errado',
    blocos: [
      {
        tipo: 'paragrafo',
        conteudo: [
          'Todo o tráfego do site é criptografado (HTTPS). As chaves de acesso aos serviços de IA ficam no servidor e nunca são expostas ao navegador. O banco de dados tem regras de acesso por linha, e a aplicação usa a menor permissão que consegue funcionar. O acesso administrativo é individual e autenticado.',
        ],
      },
      {
        tipo: 'paragrafo',
        conteudo: [
          'A melhor medida de segurança, porém, é o dado que não existe: como IP e User-Agent nunca são gravados, um vazamento do banco não os expõe, porque não há o que expor.',
        ],
      },
      {
        tipo: 'paragrafo',
        conteudo: [
          'Nenhum sistema é totalmente seguro, e prometer o contrário seria mentira. Se acontecer um incidente de segurança que possa acarretar risco ou dano relevante a você, comunico você e a ANPD, como determina o art. 48 da LGPD.',
        ],
      },
    ],
  },

  // ── 11 ───────────────────────────────────────────────────────────────────
  {
    id: 'criancas',
    titulo: 'Crianças e adolescentes',
    resumo: 'Por que o site não trata esses dados, e o que fazer se acontecer',
    blocos: [
      {
        tipo: 'paragrafo',
        conteudo: [
          'Este site é dirigido a adultos: apresenta serviços de consultoria de tecnologia e conteúdo pastoral. Não há cadastro, não há área de membros e não peço dados de ninguém — muito menos de criança ou adolescente.',
        ],
      },
      {
        tipo: 'paragrafo',
        conteudo: [
          'O art. 14 da LGPD trata desses dados com rigor maior: o melhor interesse da criança e do adolescente vem primeiro, e o tratamento de dados de criança (até 12 anos incompletos) exige consentimento específico e em destaque de pelo menos um dos pais ou do responsável legal. Como este site não faz cadastro, eu não teria como obter esse consentimento — e é por isso que não trato esses dados intencionalmente.',
        ],
      },
      {
        tipo: 'paragrafo',
        conteudo: [
          'A medição de audiência não distingue idade, porque não sabe quem é a pessoa do outro lado. Vale para ela a mesma regra de sempre, que reduz o risco a quase nada: o IP e a identificação do navegador não são gravados, e o identificador morre em 48 horas.',
        ],
      },
      {
        tipo: 'paragrafo',
        conteudo: [
          'Se você é pai, mãe ou responsável e acredita que uma criança ou adolescente forneceu algum dado por aqui — escrevendo o nome no chat, por exemplo — escreva para ',
          { texto: CONTACT.privacyEmail, href: CONTACT.privacyEmailHref },
          ' e eu apago, sem burocracia e sem pedir explicação.',
        ],
      },
    ],
  },

  // ── 12 ───────────────────────────────────────────────────────────────────
  {
    id: 'alteracoes',
    titulo: 'Mudanças nesta política',
    resumo: 'Como o documento é versionado e por que isso te protege',
    blocos: [
      {
        tipo: 'paragrafo',
        conteudo: [
          `Esta política tem versão, e a versão em vigor é ${POLICY_VERSION} — de ${POLICY_VERSION_LABEL}, indicada no topo e no rodapé da página. Não é enfeite de rodapé: toda vez que eu registro um pedido seu de exercício de direitos, guardo junto a versão vigente naquele momento.`,
        ],
      },
      {
        tipo: 'paragrafo',
        conteudo: [
          'Quando mudar a finalidade, a base legal, um prazo ou um destinatário, a versão sobe. E se algum tratamento passar a depender do seu consentimento, o consentimento anterior deixa de valer e será pedido de novo — porque um "sim" dado para uma finalidade não vale para outra.',
        ],
      },
      {
        tipo: 'paragrafo',
        conteudo: [
          'Mudanças relevantes são anunciadas no próprio site. Mudanças de redação, que não alterem o que é tratado, apenas sobem a versão.',
        ],
      },
    ],
  },

  // ── 13 ───────────────────────────────────────────────────────────────────
  {
    id: 'contato',
    titulo: 'Como falar comigo',
    resumo: 'Canal de privacidade, canal geral e a ANPD',
    blocos: [
      {
        tipo: 'paragrafo',
        conteudo: [
          'Para exercer qualquer direito, tirar dúvida sobre esta política ou reclamar de alguma coisa que eu tenha feito com os seus dados: ',
          { texto: CONTACT.privacyEmail, href: CONTACT.privacyEmailHref },
          '. Diga o que você quer em uma frase; não precisa de formulário nem de linguagem jurídica.',
        ],
      },
      {
        tipo: 'paragrafo',
        conteudo: [
          'Para os demais assuntos — orçamento, conversa, ministério — continuam valendo ',
          { texto: CONTACT.email, href: CONTACT.emailHref },
          ' e o WhatsApp ',
          { texto: CONTACT.phone.formatted, href: CONTACT.whatsappUrl },
          '.',
        ],
      },
      {
        tipo: 'paragrafo',
        conteudo: [
          'Se a minha resposta não te satisfizer, a Autoridade Nacional de Proteção de Dados recebe reclamações de titulares: ',
          { texto: 'gov.br/anpd', href: 'https://www.gov.br/anpd/pt-br' },
          '.',
        ],
      },
    ],
  },
] as const satisfies readonly SecaoPolitica[]

/** Itens do sumário, derivados das próprias seções — nunca digitados duas vezes. */
export const POLICY_SUMMARY = POLICY_SECTIONS.map((secao) => ({
  id: secao.id,
  titulo: secao.titulo,
  resumo: secao.resumo,
}))

export const POLICY_FOOTER_NOTE =
  `Versão ${POLICY_VERSION}. Documento escrito à luz da LGPD (Lei nº 13.709/2018) e dos guias orientativos da ANPD sobre cookies e sobre legítimo interesse.` as const
