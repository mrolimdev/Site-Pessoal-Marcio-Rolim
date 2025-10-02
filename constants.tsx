import React from 'react';
import type { Skill } from './types';
import MobileIcon from './components/icons/SocialIcon'; // Repurposed to MobileIcon
import AiIcon from './components/icons/AiIcon';
import TrafficIcon from './components/icons/TrafficIcon';
import PeaceHouseIcon from './components/icons/PeaceHouseIcon';
import MentoringIcon from './components/icons/MentoringIcon';
import PrayerIcon from './components/icons/PrayerIcon';
import EcommerceIcon from './components/icons/EcommerceIcon';
import EmpathyIcon from './components/icons/EmpathyIcon';

const iconClass = "h-10 w-10 text-brand-gold";

export const SKILLS: Skill[] = [
  {
    icon: <PeaceHouseIcon className={iconClass} />,
    title: 'Liderança Pastoral',
    description: 'Conduzo jovens e casais a superarem crises e fortalecerem relacionamentos, guiando-os em seu crescimento espiritual e pessoal.',
    category: 'personal',
  },
  {
    icon: <MobileIcon className={iconClass} />,
    title: 'Desenvolvimento de Soluções Digitais',
    description: 'Desenvolvo aplicativos e websites modernos, transformando ideias em soluções digitais que geram resultados concretos.',
    category: 'professional',
  },
  {
    icon: <EcommerceIcon className={iconClass} />,
    title: 'Desenvolvimento de E-commerce',
    description: 'Crio lojas virtuais de alta performance, otimizadas para a melhor experiência do usuário e máxima conversão de vendas.',
    category: 'professional',
  },
  {
    icon: <TrafficIcon className={iconClass} />,
    title: 'Gestão de Tráfego e Conversão',
    description: 'Otimizo campanhas de tráfego pago para maximizar a conversão e o retorno sobre o investimento em marketing digital.',
    category: 'professional',
  },
  {
    icon: <AiIcon className={iconClass} />,
    title: 'Inteligência Artificial Aplicada',
    description: 'Aplico Inteligência Artificial para criar soluções inovadoras que automatizam processos e transformam a experiência do cliente.',
    category: 'professional',
  },
  {
    icon: <MentoringIcon className={iconClass} />,
    title: 'Mentoria e Aconselhamento',
    description: 'Ofereço aconselhamento prático, unindo princípios bíblicos e ferramentas modernas para guiar pessoas em momentos decisivos.',
    category: 'personal',
  },
  {
    icon: <EmpathyIcon className={iconClass} />,
    title: 'Empatia e Comunicação',
    description: 'Comunicação clara e empática para construir conexões de confiança, transmitindo mensagens inspiradoras em qualquer ambiente.',
    category: 'personal',
  },
  {
    icon: <PrayerIcon className={iconClass} />,
    title: 'Visão Estratégica e Propósito',
    description: 'Alinho tecnologia, fé e impacto social com uma visão estratégica, focado em criar soluções com propósito e deixar um legado positivo.',
    category: 'personal',
  }
];


export const SOCIAL_LINKS = {
    instagram: 'https://instagram.com/marciorolim',
    youtube: 'https://youtube.com/marciorolim',
    facebook: 'https://facebook.com/marciorolim',
    email: 'mailto:contato@marciorolim.com.br'
};