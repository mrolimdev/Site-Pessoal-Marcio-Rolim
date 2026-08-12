import { Metadata } from 'next'
import { obterEstatisticasCategorias } from '@/actions/categorias-tags'
import { CategoriasClient } from './categorias-client'

export const metadata: Metadata = {
  title: 'Gerenciador de Categorias | Painel Admin',
}

export default async function CategoriasPage() {
  const dadosCategorias = await obterEstatisticasCategorias()

  return <CategoriasClient dadosIniciais={dadosCategorias} />
}
