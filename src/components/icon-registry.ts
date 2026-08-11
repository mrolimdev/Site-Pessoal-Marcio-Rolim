import type { ComponentType } from 'react'
import {
  BriefcaseIcon,
  CalendarIcon,
  CodeIcon,
  CpuIcon,
  DatabaseIcon,
  GlobeIcon,
  GraduationCapIcon,
  HeartIcon,
  InstagramIcon,
  LinkedInIcon,
  MailIcon,
  MapPinIcon,
  SparklesIcon,
  WhatsAppIcon,
  WrenchIcon,
} from '@/components/icons'

export type IconeComponente = ComponentType<{ className?: string }>

/**
 * Os módulos de src/content guardam o ícone como string, para continuarem
 * sendo dados puros (sem JSX, compiláveis fora do React). Este registro é a
 * ponte entre aquele nome e o componente.
 */
const REGISTRO = {
  Briefcase: BriefcaseIcon,
  Calendar: CalendarIcon,
  Code: CodeIcon,
  Cpu: CpuIcon,
  Database: DatabaseIcon,
  Globe: GlobeIcon,
  GraduationCap: GraduationCapIcon,
  Heart: HeartIcon,
  Instagram: InstagramIcon,
  LinkedIn: LinkedInIcon,
  Mail: MailIcon,
  MapPin: MapPinIcon,
  Sparkles: SparklesIcon,
  WhatsApp: WhatsAppIcon,
  Wrench: WrenchIcon,
} satisfies Record<string, IconeComponente>

export type NomeIcone = keyof typeof REGISTRO

export function obterIcone(nome: string): IconeComponente | null {
  return (REGISTRO as Record<string, IconeComponente>)[nome] ?? null
}
