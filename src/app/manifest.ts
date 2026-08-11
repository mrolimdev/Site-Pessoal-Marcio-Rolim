import type { MetadataRoute } from 'next'

import { PWA } from '@/content/site'

// Portado de manifest.json (raiz do repositório).
//
// BUG CORRIGIDO — ícones. O manifest antigo declarava o MESMO arquivo remoto
// (files.restaure.online/marciorolim/FotoRostoRolim.jpeg) duas vezes, uma como
// 192x192 e outra como 512x512. Nenhuma das duas medidas era verdadeira: o
// bitmap tem 1440x1440. O Chrome valida `sizes` contra as dimensões reais e
// descarta o ícone quando não batem — sem nenhum ícone válido de pelo menos
// 192px, o app não passa no critério de instalabilidade e o prompt "Instalar"
// nunca aparece. Um único ícone honesto instala; dois mentirosos não.
//
// O arquivo também sai do CDN e passa a vir do próprio domínio
// (public/FotoRostoRolim.jpeg): o manifest é buscado com credenciais e um
// ícone same-origin não depende de terceiro para o app abrir instalado.
//
// Os outros dois arquivos de public/ ficam de fora porque não acrescentam nada:
// profile.png é byte a byte o mesmo JPEG (md5 idêntico), e FotoRostoRolim.png,
// apesar da extensão, também é JPEG — 1024x1024. Declará-los só repetiria a
// mesma imagem e criaria um novo descompasso entre extensão e conteúdo.
//
// Para um PWA completo o próximo passo é gerar PNGs reais de 192, 512 e um
// 512 `maskable` com margem de segurança. Isso exige arte nova (recorte com
// padding), não um redimensionamento, e por isso fica fora desta migração.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: PWA.name,
    short_name: PWA.shortName,
    description: PWA.description,
    start_url: PWA.startUrl,
    display: 'standalone',
    background_color: PWA.backgroundColor,
    theme_color: PWA.themeColor,
    icons: [
      {
        src: '/FotoRostoRolim.jpeg',
        sizes: '1440x1440',
        type: 'image/jpeg',
        purpose: 'any',
      },
    ],
  }
}
