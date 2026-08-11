# marciorolim.com.br

Site pessoal, currículo, blog de tecnologia e painel administrativo com
analytics próprio.

**Next.js 16.3 (App Router) · React 19.2 · TypeScript · Tailwind 4 · Supabase ·
deploy na Vercel**

## Rodando localmente

```bash
cp env.example .env.local   # preencha as chaves
npm install
npm run dev                 # http://localhost:3000
```

O `dev` sobe com `--max-http-header-size=65536`. Isso não é capricho: cookies no
`localhost` **não são separados por porta**, então todo projeto que você já rodou
nessa máquina divide o mesmo pote de cookies. Passando dos 16 KB padrão do Node,
qualquer requisição morre com `431` — e o sintoma que aparece na tela é um erro
genérico de Server Action, que não ajuda em nada a achar a causa.

## Estrutura

```text
src/
  app/
    (site)/          páginas públicas: home, currículo, privacidade, blog
    admin/           painel — exige sessão e is_admin()
    auth/            login e logout
    api/e            ingestão de analytics
    api/cron/rollup  consolidação diária e expurgo
  analytics/         captura no browser (tracker) e transporte
  components/        ícones, gráficos, editor Tiptap, blocos do site
  content/           todo o texto do site como dado tipado
  lib/               clientes Supabase, autorização, consultas
  actions/           Server Actions
  proxy.ts           renovação de sessão (precisa ficar em src/, veja abaixo)
supabase/migrations/ schema versionado
```

### Conteúdo é dado, não marcação

Currículo, home e política vivem em `src/content/*.ts` como objetos tipados.
Mudança de texto acontece lá, não dentro do JSX.

## Coisas que já custaram caro

Cada item aqui é uma armadilha real que quebrou o projeto uma vez.

**`proxy.ts` tem de ficar em `src/`.** Com layout `src/`, um `proxy.ts` na raiz
**não é registrado** — e não há erro de build. A renovação de sessão
simplesmente nunca roda. `middleware.ts` continua funcionando como nome legado.

**O proxy só redireciona navegação (GET).** Server Actions chegam como POST para
a URL da própria página. Responder a elas com redirect entrega HTML onde o React
espera resposta de action, e o erro que aparece não diz nada sobre a causa.

**`space-y-*` no Tailwind 4 compila para `margin-block-end`**, não `margin-top`
como na v3. Regras que zeram `margin-top` não o alcançam, e os espaçamentos
somam. Prefira `flex flex-col gap-*`.

**As sentinelas de scroll do analytics são ocultadas na impressão.** Elas usam
`top` em pixels calculado sobre a altura da tela; ao imprimir, o leiaute reflui
para A4 mas o deslocamento permanece e estica o documento com páginas em branco.

**Nunca rode `next build` com o `next dev` no ar.** Os dois escrevem em `.next`,
e o build sobrescreve o manifesto de Server Actions que o dev está usando. O
navegador passa a enviar identificadores de um build que já não existe.

**A foto do currículo não pode usar `fill`.** O posicionamento absoluto escapa do
contêiner na impressão e o PDF salta de 2 para 6 páginas.

## Privacidade

O rastreio é próprio e foi desenhado para caber em legítimo interesse:

- `visitor_id` = hash de (salt do dia + IP + user-agent); o salt é destruído em
  48 h, então o identificador não é comparável entre dias
- **IP e user-agent nunca são gravados** — não existe coluna para eles
- retenção de 180 dias, com expurgo automático
- nenhum cliente escreve no banco: a ingestão passa por função `SECURITY DEFINER`

Consequência assumida: "visitantes únicos no mês" e "novos vs. recorrentes" são
matematicamente incalculáveis. Prometer isso na interface seria mentira.

Mudou a finalidade da coleta? Atualize `POLICY_VERSION` em
`src/content/policy.ts` junto com o texto.

## Banco

Migrations em `supabase/migrations/`, aplicadas em ordem. Toda tabela tem RLS
ligado; o público só enxerga posts publicados, e as tabelas de analytics não têm
grant nenhum para `anon`.

`supabase/propostas-camada-api/` guarda o SQL de uma camada de webhooks e API
pública que **ainda não foi revisada nem aplicada**.

## Variáveis de ambiente

| Variável | Onde vive |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | pública, vai ao navegador |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | pública, protegida por RLS |
| `SUPABASE_SECRET_KEY` | **só servidor** — ignora RLS |
| `CRON_SECRET` | protege `/api/cron/rollup` |
| `GEMINI_API_KEY`, `MINIMAX_*` | chat e TTS |

Nunca prefixe as três últimas com `NEXT_PUBLIC_`: isso as embute no bundle do
navegador em tempo de build.
