import { Metadata } from 'next'
import { obterEstatisticasTags } from '@/actions/categorias-tags'
import { TagsClient } from './tags-client'

export const metadata: Metadata = {
  title: 'Gerenciador de Tags | Painel Admin',
}

export default async function TagsPage() {
  const tags = await obterEstatisticasTags()

  return <TagsClient tagsIniciais={tags} />
}
