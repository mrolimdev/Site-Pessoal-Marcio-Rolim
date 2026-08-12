import { Metadata } from 'next'
import { obterEstatisticasCategorias } from '@/actions/categorias-tags'
import { CategoriasClient } from './categorias-client'

export const metadata: Metadata = {
  title: 'Gerenciador de Categorias | Painel Admin',
}

export default async function CategoriasPage() {
  const categorias = await obterEstatisticasCategorias()

  return <CategoriasClient categoriasIniciais={categorias} />
}
