import React, { useState } from 'react';
import ChatWidget from './components/ChatWidget';
import CountUp from './components/CountUp';
import ChatBubbleIcon from './components/icons/ChatBubbleIcon';

// Icons
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

// Data
const SKILLS_PASTORAL = [
  {
    icon: '🙏',
    title: 'Liderança Pastoral',
    description: 'Guio pessoas em sua jornada espiritual, fortalecendo famílias e transformando vidas através da fé.',
  },
  {
    icon: '💬',
    title: 'Mentoria e Aconselhamento',
    description: 'Ajudo você a encontrar clareza em momentos difíceis, oferecendo direção baseada em sabedoria e experiência.',
  },
  {
    icon: '❤️',
    title: 'Empatia e Comunicação',
    description: 'Escuto de verdade e me conecto com as pessoas. Cada conversa é uma oportunidade de fazer a diferença.',
  },
  {
    icon: '✨',
    title: 'Visão e Propósito',
    description: 'Acredito que cada pessoa tem um propósito único. Ajudo você a descobrir e viver o seu com excelência.',
  },
];

const SKILLS_TECH = [
  {
    icon: '💻',
    title: 'Desenvolvimento Digital',
    description: 'Aplicativos e websites modernos que geram resultados concretos.',
  },
  {
    icon: '🛒',
    title: 'E-commerce',
    description: 'Lojas virtuais de alta performance com máxima conversão.',
  },
  {
    icon: '📈',
    title: 'Gestão de Tráfego',
    description: 'Campanhas otimizadas para máximo retorno sobre investimento.',
  },
  {
    icon: '🤖',
    title: 'Inteligência Artificial',
    description: 'Soluções inovadoras que automatizam e transformam negócios.',
  },
];

const SOCIAL_LINKS = {
  instagram: 'https://instagram.com/marciorolim',
  youtube: 'https://youtube.com/marciorolim',
  linkedin: 'https://linkedin.com/in/marciorolim',
  email: 'mailto:contato@marciorolim.com.br',
  whatsapp: 'https://wa.me/5511980888880',
};

// Calculate age
const calculateAge = (birthDate: string): number => {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--;
  return age;
};

function App() {
  const [activeTab, setActiveTab] = useState<'pastoral' | 'tech'>('tech');
  const [isScrolled, setIsScrolled] = useState(false);
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const age = calculateAge('1973-04-18');
  const techYears = calculateAge('1998-01-01');
  const ministryYears = calculateAge('2012-01-01');

  // Detect scroll to show/hide profile photo in navbar
  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const profileImageUrl = 'https://images.weserv.nl/?url=sites.arquivo.download/marciorolim/FotoRostoRolim.jpeg&w=100&output=webp&q=85';
  const videoUrl = 'https://sites.arquivo.download/marciorolim/Olhe%20o%20que%20Deus%20fez%20comigo.mp4';

  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        {/* Navigation */}
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white shadow-md' : 'bg-white/80 backdrop-blur-lg'} border-b border-slate-200/50`}>
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <a href="#" className="flex items-center gap-3 font-bold text-xl text-slate-900">
                {/* Profile photo - appears on scroll */}
                <div className={`transition-all duration-300 flex-shrink-0 ${isScrolled ? 'w-8 h-8 opacity-100 mr-0' : 'w-0 h-8 opacity-0 -mr-3'}`}>
                  <img
                    src={profileImageUrl}
                    alt="Marcio Rolim"
                    className="w-8 h-8 rounded-full object-cover border-2 border-slate-200"
                  />
                </div>
                <span>Rolim</span>
              </a>
              <div className="hidden md:flex items-center space-x-8">
                <a href="#sobre" className="text-slate-600 hover:text-slate-900 transition-colors">Sobre</a>
                <a href="#servicos" className="text-slate-600 hover:text-slate-900 transition-colors">Serviços</a>
                <a href="#contato" className="text-slate-600 hover:text-slate-900 transition-colors">Contato</a>
              </div>
              <a
                href={SOCIAL_LINKS.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-full text-sm font-medium transition-all shadow-lg shadow-emerald-500/25 flex items-center gap-2"
              >
                <WhatsAppIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Conversar</span>
              </a>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <header className="pt-24 pb-16 md:pt-32 md:pb-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row items-center gap-8 md:gap-16">
              {/* Profile Image */}
              <div className="relative flex-shrink-0">
                <div className="w-40 h-40 md:w-56 md:h-56 rounded-full overflow-hidden ring-4 ring-white shadow-2xl">
                  <img
                    src="https://images.weserv.nl/?url=sites.arquivo.download/marciorolim/FotoRostoRolim.jpeg&w=500&output=webp&q=85"
                    alt="Marcio Rolim - Consultor de Tecnologia e Pastor"
                    className="w-full h-full object-cover"
                    loading="eager"
                  />
                </div>
                {/* Decorative elements */}
                {/* Decorative elements - REMOVED */}
              </div>

              {/* Hero Content */}
              <div className="text-center md:text-left flex-1">
                <div className="inline-flex items-center gap-2 bg-slate-100 text-slate-600 px-4 py-2 rounded-full text-sm font-medium mb-4">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                  Disponível para projetos
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight mb-4">
                  Olá, eu sou<br />
                  <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
                    Marcio Rolim
                  </span>
                </h1>

                <p className="text-lg sm:text-xl text-slate-600 mb-6 max-w-xl">
                  <strong className="text-slate-800">Consultor de Tecnologia</strong> e <strong className="text-slate-800">Pastor</strong>.
                  Unindo inovação digital e propósito espiritual para transformar vidas e negócios.
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-4 justify-center md:justify-start">
                  <button
                    onClick={() => setIsChatOpen(true)}
                    className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-4 rounded-full font-medium transition-all shadow-xl shadow-emerald-500/30 flex items-center justify-center gap-3"
                  >
                    <ChatBubbleIcon className="h-5 w-5" />
                    Vamos Conversar
                  </button>
                  <a
                    href="#sobre"
                    className="w-full sm:w-auto border-2 border-slate-200 hover:border-slate-300 text-slate-700 px-8 py-4 rounded-full font-medium transition-all flex items-center justify-center gap-2"
                  >
                    Conhecer mais
                    <ChevronDownIcon className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Stats Section */}
        <section className="py-12 bg-gradient-to-r from-slate-900 to-slate-800">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-3xl md:text-4xl font-bold text-white mb-1">
                  <CountUp end={age} />
                </div>
                <div className="text-slate-400 text-sm">Anos de vida</div>
              </div>
              <div>
                <div className="text-3xl md:text-4xl font-bold text-white mb-1">
                  <CountUp end={techYears} suffix="+" />
                </div>
                <div className="text-slate-400 text-sm">Anos em tecnologia</div>
              </div>
              <div>
                <div className="text-3xl md:text-4xl font-bold text-white mb-1">
                  <CountUp end={ministryYears} suffix="+" />
                </div>
                <div className="text-slate-400 text-sm">Anos de ministério</div>
              </div>
              <div>
                <div className="text-3xl md:text-4xl font-bold text-white mb-1">
                  <CountUp end={4} />
                </div>
                <div className="text-slate-400 text-sm">Filhas abençoadas</div>
              </div>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section id="sobre" className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
                Uma jornada de <span className="text-amber-500">fé</span> e <span className="text-emerald-500">tecnologia</span>
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Minha vida é marcada pela união de duas paixões: servir a Deus e inovar através da tecnologia.
                Casado, pai de quatro filhas e avô de dois netos.
              </p>
            </div>

            {/* Dual Identity Cards */}
            <div className="grid md:grid-cols-2 gap-8">
              {/* Pastoral Card */}
              <div className="group relative bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl p-8 border border-amber-100 hover:shadow-xl transition-all duration-300">
                <div className="absolute top-6 right-6 w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                  <HeartIcon className="h-6 w-6 text-amber-600" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">Pastor Evangélico</h3>
                <p className="text-slate-600 mb-6">
                  Dedico meu ministério ao cuidado espiritual, especialmente no acompanhamento de jovens e casais,
                  ajudando-os a superar desafios e construir relacionamentos sólidos à luz da Palavra de Deus.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-sm">Aconselhamento</span>
                  <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-sm">Liderança</span>
                  <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-sm">Mentoria</span>
                </div>
              </div>

              {/* Tech Card */}
              <div className="group relative bg-gradient-to-br from-emerald-50 to-teal-50 rounded-3xl p-8 border border-emerald-100 hover:shadow-xl transition-all duration-300">
                <div className="absolute top-6 right-6 w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                  <CodeIcon className="h-6 w-6 text-emerald-600" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">Especialista em Tecnologia</h3>
                <p className="text-slate-600 mb-6">
                  Atuo com desenvolvimento de aplicativos, websites, gestão de tráfego e automação com Inteligência Artificial,
                  criando soluções inovadoras que unem propósito, estratégia e resultados.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm">IA</span>
                  <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm">Desenvolvimento</span>
                  <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm">Marketing</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section id="servicos" className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
                Como posso ajudar você
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-8">
                Escolha a área que melhor atende às suas necessidades
              </p>

              {/* Tab Selector */}
              <div className="inline-flex bg-white p-1 rounded-full shadow-sm border border-slate-200">
                <button
                  onClick={() => setActiveTab('tech')}
                  className={`px-6 py-3 rounded-full font-medium transition-all flex items-center gap-2 ${activeTab === 'tech'
                    ? 'bg-emerald-500 text-white shadow-lg'
                    : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                  <CodeIcon className="h-4 w-4" />
                  Tecnologia
                </button>
                <button
                  onClick={() => setActiveTab('pastoral')}
                  className={`px-6 py-3 rounded-full font-medium transition-all flex items-center gap-2 ${activeTab === 'pastoral'
                    ? 'bg-amber-500 text-white shadow-lg'
                    : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                  <HeartIcon className="h-4 w-4" />
                  Pastoral
                </button>
              </div>
            </div>

            {/* Skills Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {(activeTab === 'tech' ? SKILLS_TECH : SKILLS_PASTORAL).map((skill, index) => (
                <div
                  key={skill.title}
                  className={`group bg-white rounded-2xl p-6 border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${activeTab === 'tech'
                    ? 'border-emerald-100 hover:border-emerald-200'
                    : 'border-amber-100 hover:border-amber-200'
                    }`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className={`text-4xl mb-4`}>{skill.icon}</div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{skill.title}</h3>
                  <p className="text-slate-600 text-sm">{skill.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              Pronto para dar o próximo passo?
            </h2>
            <p className="text-lg text-slate-300 mb-8 max-w-2xl mx-auto">
              Seja para transformar seu negócio com tecnologia ou buscar orientação espiritual,
              estou aqui para ajudar.
            </p>
            <a
              href={SOCIAL_LINKS.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 bg-emerald-500 hover:bg-emerald-400 text-white px-10 py-5 rounded-full font-bold text-lg transition-all shadow-xl shadow-emerald-500/30 hover:shadow-emerald-500/40 hover:scale-105"
            >
              <WhatsAppIcon className="h-6 w-6" />
              Fale Comigo Agora
            </a>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contato" className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Conecte-se comigo
            </h2>
            <p className="text-lg text-slate-600 mb-12 max-w-2xl mx-auto">
              Me siga nas redes sociais para acompanhar<br />
              conteúdos sobre tecnologia, fé e vida.
            </p>

            <div className="flex justify-center items-center gap-6 mb-12">
              <a
                href={SOCIAL_LINKS.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center text-white hover:scale-110 transition-transform shadow-lg"
                aria-label="Instagram"
              >
                <InstagramIcon className="h-7 w-7" />
              </a>
              <a
                href={SOCIAL_LINKS.youtube}
                target="_blank"
                rel="noopener noreferrer"
                className="w-14 h-14 bg-red-500 rounded-2xl flex items-center justify-center text-white hover:scale-110 transition-transform shadow-lg"
                aria-label="YouTube"
              >
                <YoutubeIcon className="h-7 w-7" />
              </a>
              <a
                href={SOCIAL_LINKS.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white hover:scale-110 transition-transform shadow-lg"
                aria-label="LinkedIn"
              >
                <LinkedInIcon className="h-6 w-6" />
              </a>
              <a
                href={SOCIAL_LINKS.email}
                className="w-14 h-14 bg-slate-700 rounded-2xl flex items-center justify-center text-white hover:scale-110 transition-transform shadow-lg"
                aria-label="Email"
              >
                <MailIcon className="h-7 w-7" />
              </a>
            </div>

            {/* Testimony Video Section */}
            <div className="mt-8 max-w-2xl mx-auto">
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-6 md:p-8 text-white relative overflow-hidden">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
                      <svg className="h-10 w-10 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                  <div className="text-center sm:text-left flex-1">
                    <h3 className="text-xl font-bold mb-2">
                      Olha o que Deus fez comigo
                    </h3>
                    <p className="text-white/90 text-sm mb-4">
                      Conheça minha história de transformação e fé.
                    </p>
                    <button
                      onClick={() => setIsVideoOpen(true)}
                      className="inline-flex items-center gap-2 bg-white text-amber-600 px-6 py-2 rounded-full font-bold text-sm hover:bg-amber-50 transition-all shadow-lg hover:scale-105"
                    >
                      Assistir Testemunho
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-slate-900 text-white py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-center md:text-left">
                <div className="flex items-center gap-3 justify-center md:justify-start font-bold text-xl mb-2">
                  <div className="w-8 h-8 flex-shrink-0">
                    <img
                      src={profileImageUrl}
                      alt="Marcio Rolim"
                      className="w-8 h-8 rounded-full object-cover border-2 border-slate-700"
                    />
                  </div>
                  Rolim
                </div>
                <p className="text-slate-400 text-sm">
                  Transformando vidas através da fé e tecnologia.
                </p>
              </div>
              <div className="text-slate-400 text-sm text-center md:text-right">
                <p>© {new Date().getFullYear()} Marcio Rolim. Todos os direitos reservados.</p>
                <p className="mt-1 text-amber-400/70">Eu creio em Deus.</p>
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* Video Modal */}
      {isVideoOpen && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
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
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <video
              src={videoUrl}
              controls
              autoPlay
              className="w-full h-full object-contain"
            >
              Seu navegador não suporta a tag de vídeo.
            </video>
          </div>
        </div>
      )}

      {/* Chat Widget */}
      <ChatWidget isOpen={isChatOpen} onOpenChange={setIsChatOpen} />
    </>
  );
}

export default App;