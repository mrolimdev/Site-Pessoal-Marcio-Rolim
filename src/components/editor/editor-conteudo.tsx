'use client'

import ExtensaoImagem from '@tiptap/extension-image'
import { EditorContent, useEditor, type JSONContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useEffect, useRef } from 'react'

// CSS base do ProseMirror. NÃO é opcional e o Tiptap não a injeta: sem ela o
// contenteditable perde `white-space: pre-wrap` (espaços múltiplos colapsam),
// `word-wrap: break-word` (URL longa estoura a caixa) e a proteção do
// `img.ProseMirror-separator` contra o reset de imagens do Tailwind.
import 'prosemirror-view/style/prosemirror.css'

import { BarraFerramentas } from './barra-ferramentas'

/** Documento vazio válido. Um `doc` sem `content` é recusado pelo schema. */
export const DOC_VAZIO: JSONContent = { type: 'doc', content: [{ type: 'paragraph' }] }

type Props = {
  conteudoInicial: JSONContent | null
  /** Chamada a cada alteração, com o documento em JSON. */
  aoAtualizar: (documento: JSONContent) => void
}

/**
 * Estilos do conteúdo, escritos como variantes arbitrárias em vez de CSS solto.
 *
 * O projeto não usa o plugin `@tailwindcss/typography`, e o preflight do
 * Tailwind zera `list-style` de `ul`/`ol` e margens de heading — sem as regras
 * abaixo, lista aparece sem marcador e título fica do tamanho do parágrafo
 * dentro do editor. As classes precisam estar literais no arquivo para o
 * Tailwind enxergá-las na varredura.
 */
const CLASSES_CONTEUDO = [
  'min-h-96 w-full px-4 py-4 outline-none',
  'text-[15px] leading-relaxed text-slate-800 dark:text-slate-100',
  '[&_p]:my-3',
  '[&_h2]:mt-7 [&_h2]:mb-2 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-slate-900 dark:[&_h2]:text-white',
  '[&_h3]:mt-5 [&_h3]:mb-2 [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-slate-900 dark:[&_h3]:text-white',
  '[&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6',
  '[&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-6',
  '[&_li]:my-1',
  '[&_blockquote]:my-4 [&_blockquote]:border-l-4 [&_blockquote]:border-amber-500 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-slate-600 dark:[&_blockquote]:text-slate-300',
  '[&_pre]:my-4 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-slate-900 [&_pre]:p-4 [&_pre]:text-sm [&_pre]:text-slate-100',
  '[&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-inherit',
  '[&_code]:rounded [&_code]:bg-slate-200 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[0.9em] dark:[&_code]:bg-slate-700',
  '[&_a]:text-amber-600 [&_a]:underline [&_a]:underline-offset-2 dark:[&_a]:text-amber-400',
  '[&_img]:my-4 [&_img]:max-w-full [&_img]:rounded-lg',
  '[&_hr]:my-6 [&_hr]:border-slate-300 dark:[&_hr]:border-slate-700',
].join(' ')

export function EditorConteudo({ conteudoInicial, aoAtualizar }: Props) {
  // O callback vive num ref porque `useEditor` monta a instância uma vez só e
  // congelaria a primeira versão da função no `onUpdate`.
  const refAtualizar = useRef(aoAtualizar)

  useEffect(() => {
    refAtualizar.current = aoAtualizar
  }, [aoAtualizar])

  const editor = useEditor({
    // OBRIGATÓRIO no App Router. Com `true` (o padrão) o Tiptap monta o
    // ProseMirror já na primeira renderização — que aqui acontece no SERVIDOR,
    // durante o SSR do Client Component — e o HTML gerado lá não bate com o do
    // browser. O React acusa mismatch de hidratação e descarta a árvore.
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        // H1 é o título do post na página pública. Oferecer H1 aqui produziria
        // duas manchetes concorrentes no mesmo documento.
        heading: { levels: [2, 3] },
        link: {
          // Sem isto, clicar num link dentro do editor navega para fora e o
          // trabalho não salvo se perde.
          openOnClick: false,
          autolink: true,
          protocols: ['http', 'https', 'mailto'],
          HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
        },
      }),
      // `allowBase64: false`: uma imagem colada como data URI viraria um
      // `content_json` de megabytes gravado numa coluna jsonb.
      ExtensaoImagem.configure({ inline: false, allowBase64: false }),
    ],
    content: conteudoInicial ?? DOC_VAZIO,
    editorProps: {
      attributes: {
        class: CLASSES_CONTEUDO,
        role: 'textbox',
        'aria-multiline': 'true',
        'aria-label': 'Conteúdo do post',
      },
    },
    onUpdate: ({ editor: instancia }) => {
      refAtualizar.current(instancia.getJSON())
    },
  })

  return (
    <div className="overflow-hidden rounded-xl border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900">
      {editor ? (
        <>
          <BarraFerramentas editor={editor} />
          <EditorContent editor={editor} />
        </>
      ) : (
        // Enquanto o editor não existe (primeira renderização e SSR). A altura
        // acompanha a do editor pronto para a página não pular ao montar.
        <div className="min-h-96 animate-pulse px-4 py-4 text-sm text-slate-400 dark:text-slate-500">
          Carregando editor…
        </div>
      )}
    </div>
  )
}
