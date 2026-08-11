// Kill-switch do service worker legado.
//
// Não é um service worker: é o que substitui um. O SW antigo (cache-first sobre
// o shell do Vite) continua instalado no navegador de quem já visitou o site, e
// service workers sobrevivem a deploys — o navegador só troca o script quando
// busca /sw.js de novo e encontra bytes diferentes. Este arquivo PRECISA ficar
// nesta URL: apagá-lo deixaria o antigo no ar para sempre.
//
// Por que o antigo é destrutivo agora: ele responde do cache antes da rede e
// tem no cache o index.html do Vite, que referencia /assets/*.js. No Next esses
// caminhos não existem — o HTML carrega, o script 404, e o visitante recebe uma
// tela branca sem erro visível. O cache também guarda /sobre.html e /login.html,
// rotas que já viraram redirect no next.config.ts.
//
// Nenhum listener de 'fetch' aqui: sem ele, toda requisição vai direto à rede,
// que é o comportamento correto durante o desmonte.

self.addEventListener('install', () => {
  // Sem skipWaiting este script ficaria em 'waiting' até que TODAS as abas do
  // site fossem fechadas — e até lá o SW antigo continuaria servindo a tela
  // branca. Um kill-switch que espera não mata nada.
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Tira o registro: nenhum SW deste escopo depois desta ativação.
      await self.registration.unregister()

      // Esvazia tudo o que o SW antigo guardou. caches.keys() em vez de deletar
      // 'marcio-rolim-pessoal-v2' pelo nome: versões anteriores usaram outras
      // chaves, e todas precisam sair.
      const chaves = await caches.keys()
      await Promise.all(chaves.map((chave) => caches.delete(chave)))

      // unregister() não solta as abas já abertas: elas seguem controladas pelo
      // SW até navegarem. Sem este recarregamento, quem está com a tela branca
      // continua com a tela branca até fechar a aba.
      const clientes = await self.clients.matchAll({ type: 'window' })
      for (const cliente of clientes) {
        cliente.navigate(cliente.url)
      }
    })(),
  )
})
