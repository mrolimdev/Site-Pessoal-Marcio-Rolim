import React, { useState, useEffect } from 'react';
import ChatWidget from './components/ChatWidget';
import CountUp from './components/CountUp';
import ChatBubbleIcon from './components/icons/ChatBubbleIcon';

// ─── Icons ──────────────────────────────────────────────────────────
const ChevronDownIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const YoutubeIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

const LinkedInIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

const MailIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
  </svg>
);

const HeartIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
  </svg>
);

const CodeIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
  </svg>
);

const SparklesIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
  </svg>
);

const SunIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);

const MoonIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

const MenuIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

const CloseIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

// ─── Theme helper ───────────────────────────────────────────────────
const getTheme = (isDark: boolean) => isDark ? {
  // Dark theme
  bg: 'bg-slate-950',
  bgAlt: 'bg-slate-900',
  bgCard: 'bg-slate-900/60 border-slate-800/60',
  bgCardHover: 'hover:bg-slate-800/80 hover:border-slate-700/60',
  bgGlass: 'bg-slate-900/70 backdrop-blur-xl border-slate-800/50',
  text: 'text-slate-100',
  textSecondary: 'text-slate-400',
  textMuted: 'text-slate-500',
  heading: 'text-white',
  accent: 'text-amber-400',
  accentBg: 'bg-amber-500/10 border-amber-500/20',
  navBg: 'bg-slate-950/80 backdrop-blur-xl border-slate-800/50',
  sectionBg: 'bg-slate-900/50',
  statsBg: 'bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-y border-slate-800/50',
  ctaBg: 'bg-gradient-to-br from-amber-500/10 via-slate-900 to-emerald-500/10',
  footerBg: 'bg-slate-950 border-t border-slate-800/50',
  divider: 'border-slate-800',
  inputBg: 'bg-slate-800/50',
  tabBg: 'bg-slate-800/60 border-slate-700/40',
  tabActive: 'bg-slate-700 shadow-lg',
  socialBg: 'bg-slate-800/60 border-slate-700/40 hover:bg-slate-700/60',
  glow1: 'bg-amber-500/8',
  glow2: 'bg-emerald-500/8',
  badgePastor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  badgeTech: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  cardPastor: 'bg-gradient-to-br from-amber-500/5 to-orange-500/5 border-amber-500/10 hover:border-amber-500/30',
  cardTech: 'bg-gradient-to-br from-emerald-500/5 to-teal-500/5 border-emerald-500/10 hover:border-emerald-500/30',
} : {
  // Light theme
  bg: 'bg-stone-50',
  bgAlt: 'bg-white',
  bgCard: 'bg-white/80 border-stone-200/80',
  bgCardHover: 'hover:bg-white hover:border-stone-300',
  bgGlass: 'bg-white/80 backdrop-blur-xl border-stone-200/60',
  text: 'text-stone-800',
  textSecondary: 'text-stone-500',
  textMuted: 'text-stone-400',
  heading: 'text-stone-900',
  accent: 'text-amber-600',
  accentBg: 'bg-amber-50 border-amber-200/50',
  navBg: 'bg-white/80 backdrop-blur-xl border-stone-200/50',
  sectionBg: 'bg-stone-100/50',
  statsBg: 'bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900',
  ctaBg: 'bg-gradient-to-br from-amber-50 via-white to-emerald-50',
  footerBg: 'bg-stone-900',
  divider: 'border-stone-200',
  inputBg: 'bg-stone-100',
  tabBg: 'bg-stone-100 border-stone-200/60',
  tabActive: 'bg-white shadow-lg',
  socialBg: 'bg-white border-stone-200 hover:bg-stone-50',
  glow1: 'bg-amber-200/30',
  glow2: 'bg-emerald-200/30',
  badgePastor: 'bg-amber-50 text-amber-700 border-amber-200/60',
  badgeTech: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
  cardPastor: 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-100 hover:border-amber-300',
  cardTech: 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-100 hover:border-emerald-300',
};

// ─── Data ───────────────────────────────────────────────────────────
const SKILLS_PASTORAL = [
  { icon: '🙏', title: 'Liderança Pastoral', description: 'Orientação espiritual para famílias e comunidades, fortalecendo valores e construindo alicerces sólidos.', color: 'amber' },
  { icon: '💬', title: 'Mentoria & Aconselhamento', description: 'Direcionamento personalizado em momentos de decisão, com sabedoria e escuta ativa.', color: 'orange' },
  { icon: '❤️', title: 'Empatia & Comunicação', description: 'Cada pessoa carrega uma história. Escuto com o coração e me conecto de verdade.', color: 'rose' },
  { icon: '✨', title: 'Visão & Propósito', description: 'Todo ser humano tem um propósito único. Ajudo você a encontrar o seu e vivê-lo com plenitude.', color: 'yellow' },
];

const SKILLS_TECH = [
  { icon: '🤖', title: 'Inteligência Artificial', description: 'Agentes de IA, automação inteligente e soluções que transformam a forma de trabalhar.', color: 'violet' },
  { icon: '💻', title: 'Desenvolvimento Web', description: 'Websites e aplicativos modernos, rápidos e com design que encanta usuários.', color: 'emerald' },
  { icon: '📈', title: 'Gestão de Tráfego', description: 'Campanhas META e Google ADS com estratégia focada em resultados e ROI.', color: 'sky' },
  { icon: '🛒', title: 'E-commerce & Digital', description: 'Lojas virtuais de alta performance e ecossistemas digitais completos.', color: 'teal' },
];

const SOCIAL_LINKS = {
  instagram: 'https://instagram.com/marciorolim',
  youtube: 'https://youtube.com/marciorolim',
  linkedin: 'https://linkedin.com/in/marciorolim',
  email: 'mailto:contato@marciorolim.com.br',
  whatsapp: 'https://wa.me/5511980888880',
};

const calculateAge = (birthDate: string): number => {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--;
  return age;
};

const calculateYearsSince = (year: number): number => new Date().getFullYear() - year;

// ─── App ────────────────────────────────────────────────────────────
function App() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('site-theme');
      return saved === 'dark';
    }
    return false;
  });
  const [activeTab, setActiveTab] = useState<'pastoral' | 'tech'>('tech');
  const [isScrolled, setIsScrolled] = useState(false);
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const age = calculateAge('1973-04-18');
  const techYears = calculateYearsSince(1988);
  const ministryYears = calculateYearsSince(2012);

  const t = getTheme(isDark);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 60);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleTheme = () => {
    setIsDark(prev => {
      const next = !prev;
      localStorage.setItem('site-theme', next ? 'dark' : 'light');
      return next;
    });
  };

  const profileImageUrl = 'https://images.weserv.nl/?url=sites.arquivo.download/marciorolim/FotoRostoRolim.jpeg&w=100&output=webp&q=85';
  const heroImageUrl = 'https://images.weserv.nl/?url=sites.arquivo.download/marciorolim/FotoRostoRolim.jpeg&w=500&output=webp&q=90';
  const videoUrl = 'https://sites.arquivo.download/marciorolim/Olhe%20o%20que%20Deus%20fez%20comigo.mp4';

  const navLinks = [
    { href: '#sobre', label: 'Sobre' },
    { href: '#servicos', label: 'Serviços' },
    { href: '#contato', label: 'Contato' },
  ];

  return (
    <>
      <div className={`min-h-screen ${t.bg} ${t.text} transition-colors duration-500`}>
        {/* ─── Navigation ─── */}
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isScrolled ? `${t.navBg} shadow-xl shadow-black/5` : 'bg-transparent'} border-b ${isScrolled ? t.divider : 'border-transparent'}`}>
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16 md:h-18">
              {/* Logo */}
              <a href="#" className={`flex items-center gap-3 font-bold text-lg ${t.heading} transition-colors`}>
                <div className={`transition-all duration-500 flex-shrink-0 ${isScrolled ? 'w-8 h-8 opacity-100' : 'w-0 h-0 opacity-0'} overflow-hidden`}>
                  <img src={profileImageUrl} alt="Marcio Rolim" className="w-8 h-8 rounded-full object-cover ring-2 ring-amber-500/30" />
                </div>
                <span className="tracking-tight">Marcio <span className={t.accent}>Rolim</span></span>
              </a>

              {/* Desktop Nav */}
              <div className="hidden md:flex items-center gap-1">
                {navLinks.map(link => (
                  <a key={link.href} href={link.href} className={`px-4 py-2 rounded-full text-sm font-medium ${t.textSecondary} hover:${t.heading} transition-colors`}>
                    {link.label}
                  </a>
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleTheme}
                  className={`w-9 h-9 rounded-full flex items-center justify-center ${t.bgCard} border transition-all hover:scale-105`}
                  title={isDark ? 'Modo Claro' : 'Modo Escuro'}
                >
                  {isDark ? <SunIcon className="w-4 h-4 text-amber-400" /> : <MoonIcon className="w-4 h-4 text-indigo-500" />}
                </button>
                <a
                  href={SOCIAL_LINKS.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden sm:flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white px-5 py-2.5 rounded-full text-sm font-semibold transition-all shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30"
                >
                  <WhatsAppIcon className="h-4 w-4" />
                  Conversar
                </a>
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className={`md:hidden w-9 h-9 rounded-full flex items-center justify-center ${t.bgCard} border transition-all`}
                >
                  {mobileMenuOpen ? <CloseIcon className="w-4 h-4" /> : <MenuIcon className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className={`md:hidden ${t.bgGlass} border-t ${t.divider} px-4 py-4 space-y-1`}>
              {navLinks.map(link => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-3 rounded-xl text-sm font-medium ${t.textSecondary} hover:${t.heading} transition-colors`}
                >
                  {link.label}
                </a>
              ))}
              <a
                href={SOCIAL_LINKS.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-emerald-500 text-white px-5 py-3 rounded-xl text-sm font-semibold mt-2"
              >
                <WhatsAppIcon className="h-4 w-4" />
                Conversar pelo WhatsApp
              </a>
            </div>
          )}
        </nav>

        {/* ─── Hero Section ─── */}
        <header className="relative overflow-hidden pt-20 md:pt-24">
          {/* Background decoration */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className={`absolute -top-40 -right-40 w-[600px] h-[600px] ${t.glow1} rounded-full blur-3xl`} />
            <div className={`absolute -bottom-40 -left-40 w-[500px] h-[500px] ${t.glow2} rounded-full blur-3xl`} />
          </div>

          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 lg:py-28">
            <div className="flex flex-col md:flex-row items-center gap-10 md:gap-16">
              {/* Profile */}
              <div className="relative flex-shrink-0">
                <div className="relative">
                  <div className={`w-44 h-44 md:w-56 md:h-56 rounded-3xl overflow-hidden ring-4 ${isDark ? 'ring-amber-500/20' : 'ring-amber-200/60'} shadow-2xl ${isDark ? 'shadow-amber-500/10' : 'shadow-amber-200/40'} hover:rotate-3 transition-transform duration-700`}>
                    <img src={heroImageUrl} alt="Marcio Rolim - Consultor de Tecnologia e Pastor" className="w-full h-full object-cover" loading="eager" />
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 text-center md:text-left">
                <div className={`inline-flex items-center gap-2 ${t.accentBg} border px-4 py-2 rounded-full text-sm font-medium ${t.accent} mb-5`}>
                  <SparklesIcon className="w-4 h-4" />
                  Tecnologia & Propósito
                </div>

                <h1 className={`text-4xl sm:text-5xl lg:text-6xl font-extrabold ${t.heading} leading-[1.1] mb-5 tracking-tight`}>
                  Olá, eu sou<br />
                  <span className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 bg-clip-text text-transparent">
                    Marcio Rolim
                  </span>
                </h1>

                <p className={`text-lg sm:text-xl ${t.textSecondary} mb-4 max-w-xl leading-relaxed`}>
                  <strong className={t.heading}>Consultor de Tecnologia</strong> e{' '}
                  <strong className={t.heading}>Pastor</strong>.
                </p>
                <p className={`text-base ${t.textMuted} mb-8 max-w-lg leading-relaxed`}>
                  Unindo mais de {techYears} anos de experiência em tecnologia com chamado espiritual para transformar vidas e negócios. Especialista em IA, desenvolvimento web e gestão de tráfego.
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-3 justify-center md:justify-start">
                  <a
                    href={SOCIAL_LINKS.whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white px-8 py-4 rounded-full font-semibold transition-all shadow-xl shadow-amber-500/20 hover:shadow-amber-500/30 hover:scale-[1.02] flex items-center justify-center gap-3"
                  >
                    <WhatsAppIcon className="h-5 w-5" />
                    Vamos Conversar
                  </a>
                  <a
                    href="#sobre"
                    className={`w-full sm:w-auto border-2 ${isDark ? 'border-slate-700 hover:border-slate-600 text-slate-300' : 'border-stone-200 hover:border-stone-300 text-stone-600'} px-8 py-4 rounded-full font-medium transition-all flex items-center justify-center gap-2`}
                  >
                    Conhecer mais
                    <ChevronDownIcon className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* ─── Stats Strip ─── */}
        <section className={`${t.statsBg} py-10 md:py-14`}>
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {[
                { end: age, label: 'Anos de vida', suffix: '' },
                { end: techYears, label: 'Anos em tecnologia', suffix: '+' },
                { end: ministryYears, label: 'Anos de ministério', suffix: '+' },
                { end: 4, label: 'Filhas abençoadas', suffix: '' },
              ].map((stat, i) => (
                <div key={i} className="group">
                  <div className="text-3xl md:text-4xl font-bold text-white mb-1.5">
                    <CountUp end={stat.end} suffix={stat.suffix} />
                  </div>
                  <div className="text-slate-400 text-sm font-medium">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── About / Dual Identity ─── */}
        <section id="sobre" className="relative py-20 md:py-28 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <p className={`text-sm font-semibold uppercase tracking-widest ${t.accent} mb-3`}>Quem sou eu</p>
              <h2 className={`text-3xl sm:text-4xl lg:text-5xl font-bold ${t.heading} mb-5`}>
                Uma jornada de{' '}
                <span className="text-amber-500">fé</span> e{' '}
                <span className="text-emerald-500">tecnologia</span>
              </h2>
              <p className={`text-lg ${t.textSecondary} max-w-2xl mx-auto leading-relaxed`}>
                Minha vida é definida pela combinação de duas vocações: servir a Deus com excelência e inovar através da tecnologia.
                Casado, pai de quatro filhas e avô de dois netos — cada experiência fortalece meu propósito.
              </p>
            </div>

            {/* Identity Cards */}
            <div className="grid md:grid-cols-2 gap-6 md:gap-8">
              {/* Pastoral */}
              <div className={`group relative ${t.cardPastor} border rounded-3xl p-8 md:p-10 transition-all duration-500 hover:shadow-xl`}>
                <div className="flex items-start justify-between mb-6">
                  <div className={`w-14 h-14 ${isDark ? 'bg-amber-500/10' : 'bg-amber-100'} rounded-2xl flex items-center justify-center`}>
                    <HeartIcon className={`h-7 w-7 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
                  </div>
                  <span className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${t.badgePastor}`}>Pessoal</span>
                </div>
                <h3 className={`text-2xl font-bold ${t.heading} mb-3`}>Pastor Evangélico</h3>
                <p className={`${t.textSecondary} leading-relaxed mb-6`}>
                  Desde 2012, dedico meu ministério ao cuidado espiritual de famílias, jovens e casais. Acredito que cada ser humano
                  tem um chamado especial. Minha missão é ajudar pessoas a encontrar propósito, superar adversidades e construir
                  relacionamentos sólidos à luz da Palavra de Deus.
                </p>
                <div className="flex flex-wrap gap-2">
                  {['Aconselhamento', 'Liderança', 'Mentoria', 'Família', 'Jovens'].map(tag => (
                    <span key={tag} className={`text-xs font-medium px-3 py-1.5 rounded-full border ${t.badgePastor}`}>{tag}</span>
                  ))}
                </div>
              </div>

              {/* Tech */}
              <div className={`group relative ${t.cardTech} border rounded-3xl p-8 md:p-10 transition-all duration-500 hover:shadow-xl`}>
                <div className="flex items-start justify-between mb-6">
                  <div className={`w-14 h-14 ${isDark ? 'bg-emerald-500/10' : 'bg-emerald-100'} rounded-2xl flex items-center justify-center`}>
                    <CodeIcon className={`h-7 w-7 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                  </div>
                  <span className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${t.badgeTech}`}>Profissional</span>
                </div>
                <h3 className={`text-2xl font-bold ${t.heading} mb-3`}>Especialista em Tecnologia</h3>
                <p className={`${t.textSecondary} leading-relaxed mb-6`}>
                  Com mais de {techYears} anos no mercado de tecnologia, atuo com desenvolvimento de aplicativos, websites, automação com
                  Inteligência Artificial e gestão de tráfego. Transformo ideias em soluções digitais que geram impacto real,
                  unindo estratégia, criatividade e resultados mensuráveis.
                </p>
                <div className="flex flex-wrap gap-2">
                  {['IA', 'Desenvolvimento', 'Tráfego', 'Automação', 'E-commerce'].map(tag => (
                    <span key={tag} className={`text-xs font-medium px-3 py-1.5 rounded-full border ${t.badgeTech}`}>{tag}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Services Section ─── */}
        <section id="servicos" className={`py-20 md:py-28 px-4 sm:px-6 lg:px-8 ${t.sectionBg}`}>
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-14">
              <p className={`text-sm font-semibold uppercase tracking-widest ${t.accent} mb-3`}>O que eu faço</p>
              <h2 className={`text-3xl sm:text-4xl lg:text-5xl font-bold ${t.heading} mb-5`}>
                Como posso ajudar você
              </h2>
              <p className={`text-lg ${t.textSecondary} max-w-2xl mx-auto mb-10`}>
                Duas áreas de atuação, um mesmo propósito: gerar transformação real.
              </p>

              {/* Tab Selector */}
              <div className={`inline-flex ${t.tabBg} border p-1.5 rounded-full`}>
                <button
                  onClick={() => setActiveTab('tech')}
                  className={`px-6 py-3 rounded-full font-semibold text-sm transition-all flex items-center gap-2 ${activeTab === 'tech'
                    ? `${t.tabActive} ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`
                    : `${t.textSecondary} hover:${t.heading}`
                    }`}
                >
                  <CodeIcon className="h-4 w-4" />
                  Tecnologia
                </button>
                <button
                  onClick={() => setActiveTab('pastoral')}
                  className={`px-6 py-3 rounded-full font-semibold text-sm transition-all flex items-center gap-2 ${activeTab === 'pastoral'
                    ? `${t.tabActive} ${isDark ? 'text-amber-400' : 'text-amber-600'}`
                    : `${t.textSecondary} hover:${t.heading}`
                    }`}
                >
                  <HeartIcon className="h-4 w-4" />
                  Pastoral
                </button>
              </div>
            </div>

            {/* Cards Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {(activeTab === 'tech' ? SKILLS_TECH : SKILLS_PASTORAL).map((skill, index) => (
                <div
                  key={skill.title}
                  className={`group ${t.bgCard} border rounded-2xl p-6 transition-all duration-300 ${t.bgCardHover} hover:shadow-xl hover:-translate-y-1`}
                  style={{ animationDelay: `${index * 80}ms` }}
                >
                  <div className="text-4xl mb-5">{skill.icon}</div>
                  <h3 className={`text-lg font-bold ${t.heading} mb-2`}>{skill.title}</h3>
                  <p className={`${t.textSecondary} text-sm leading-relaxed`}>{skill.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── CTA Section ─── */}
        <section className={`${t.ctaBg} py-20 md:py-28 px-4 sm:px-6 lg:px-8 border-y ${t.divider}`}>
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-8">
              <span className="text-5xl">🚀</span>
            </div>
            <h2 className={`text-3xl sm:text-4xl lg:text-5xl font-bold ${t.heading} mb-6`}>
              Pronto para dar o<br />próximo passo?
            </h2>
            <p className={`text-lg ${t.textSecondary} mb-10 max-w-2xl mx-auto leading-relaxed`}>
              Seja para impulsionar seu negócio com tecnologia de ponta ou encontrar orientação espiritual,
              estou aqui para caminhar com você.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href={SOCIAL_LINKS.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-emerald-500 hover:bg-emerald-400 text-white px-10 py-5 rounded-full font-bold text-lg transition-all shadow-xl shadow-emerald-500/20 hover:shadow-emerald-500/30 hover:scale-[1.02]"
              >
                <WhatsAppIcon className="h-6 w-6" />
                Fale Comigo
              </a>
            </div>
          </div>
        </section>

        {/* ─── Contact & Social ─── */}
        <section id="contato" className="py-20 md:py-28 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto text-center">
            <p className={`text-sm font-semibold uppercase tracking-widest ${t.accent} mb-3`}>Redes Sociais</p>
            <h2 className={`text-3xl sm:text-4xl lg:text-5xl font-bold ${t.heading} mb-5`}>
              Conecte-se comigo
            </h2>
            <p className={`text-lg ${t.textSecondary} mb-12 max-w-2xl mx-auto`}>
              Acompanhe conteúdos sobre tecnologia, fé e vida nas minhas redes.
            </p>

            {/* Social Icons */}
            <div className="flex justify-center items-center gap-4 mb-16">
              {[
                { href: SOCIAL_LINKS.instagram, icon: <InstagramIcon className="h-6 w-6" />, label: 'Instagram', gradient: 'from-purple-500 to-pink-500' },
                { href: SOCIAL_LINKS.youtube, icon: <YoutubeIcon className="h-6 w-6" />, label: 'YouTube', gradient: 'from-red-500 to-red-600' },
                { href: SOCIAL_LINKS.linkedin, icon: <LinkedInIcon className="h-5 w-5" />, label: 'LinkedIn', gradient: 'from-blue-600 to-blue-700' },
                { href: SOCIAL_LINKS.email, icon: <MailIcon className="h-6 w-6" />, label: 'Email', gradient: isDark ? 'from-slate-600 to-slate-700' : 'from-stone-600 to-stone-700' },
              ].map(social => (
                <a
                  key={social.label}
                  href={social.href}
                  target={social.label !== 'Email' ? '_blank' : undefined}
                  rel={social.label !== 'Email' ? 'noopener noreferrer' : undefined}
                  className={`w-14 h-14 bg-gradient-to-br ${social.gradient} rounded-2xl flex items-center justify-center text-white hover:scale-110 hover:rotate-3 transition-all duration-300 shadow-lg`}
                  aria-label={social.label}
                >
                  {social.icon}
                </a>
              ))}
            </div>

            {/* Video Testimony */}
            <div className="max-w-md mx-auto">
              <div
                onClick={() => setIsVideoOpen(true)}
                className={`group ${t.cardPastor} border rounded-2xl p-5 cursor-pointer transition-all duration-300 hover:shadow-xl`}
              >
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/25 group-hover:scale-105 transition-transform">
                    <svg className="h-6 w-6 text-white ml-0.5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <h3 className={`text-base font-bold ${t.heading} group-hover:${t.accent} transition-colors`}>
                      Olha o que Deus fez comigo
                    </h3>
                    <p className={`${t.textMuted} text-sm`}>
                      Minha história de transformação e fé
                    </p>
                  </div>
                  <div className={`flex-shrink-0 w-9 h-9 rounded-full ${isDark ? 'bg-slate-800' : 'bg-white/60'} flex items-center justify-center group-hover:${isDark ? 'bg-amber-500/10' : 'bg-amber-100'} transition-colors`}>
                    <svg className={`w-4 h-4 ${isDark ? 'text-amber-400' : 'text-amber-600'} group-hover:translate-x-0.5 transition-transform`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Footer ─── */}
        <footer className={`${t.footerBg} text-white py-12 px-4 sm:px-6 lg:px-8`}>
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-center md:text-left">
                <div className="flex items-center gap-3 justify-center md:justify-start font-bold text-lg mb-2">
                  <div className="w-8 h-8 flex-shrink-0">
                    <img src={profileImageUrl} alt="Marcio Rolim" className="w-8 h-8 rounded-full object-cover ring-2 ring-slate-700" />
                  </div>
                  Marcio <span className="text-amber-400">Rolim</span>
                </div>
                <p className="text-slate-400 text-sm">
                  Transformando vidas através da fé e tecnologia.
                </p>
              </div>
              <div className="text-slate-400 text-sm text-center md:text-right">
                <p>© {new Date().getFullYear()} Marcio Rolim. Todos os direitos reservados.</p>
                <p className="mt-1 text-amber-400/60 italic">❤️ Eu creio em Deus.</p>
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* ─── Video Modal ─── */}
      {isVideoOpen && (
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setIsVideoOpen(false)}
        >
          <div
            className="relative w-full max-w-4xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsVideoOpen(false)}
              className="absolute top-4 right-4 z-10 bg-white/20 hover:bg-white/30 text-white rounded-full p-2 transition-colors"
              aria-label="Fechar vídeo"
            >
              <CloseIcon className="h-6 w-6" />
            </button>
            <video src={videoUrl} controls autoPlay className="w-full h-full object-contain">
              Seu navegador não suporta a tag de vídeo.
            </video>
          </div>
        </div>
      )}

      {/* ─── Chat Widget ─── */}
      {/* ChatWidget temporariamente desativado
      <ChatWidget isOpen={isChatOpen} onOpenChange={setIsChatOpen} />
      */}
    </>
  );
}

export default App;