import React, { useState, useRef, useEffect } from 'react';
import CloseIcon from './icons/CloseIcon';
import PlayIcon from './icons/PlayIcon';
import PauseIcon from './icons/PauseIcon';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      audioRef.current?.pause();
      setIsVideoModalOpen(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const video = videoRef.current;
    if (isVideoModalOpen && video) {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          setIsVideoPlaying(false);
          console.log("Video autoplay was prevented by browser:", error);
        });
      }
    } else if (video) {
      video.pause();
      video.currentTime = 0;
      setIsVideoPlaying(false);
    }
  }, [isVideoModalOpen]);

  const toggleVideoPlay = () => {
    const video = videoRef.current;
    if (video) {
      if (video.paused) {
        video.play();
      } else {
        video.pause();
      }
    }
  };


  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      const handlePlay = () => setIsPlaying(true);
      const handlePause = () => setIsPlaying(false);
      const handleEnded = () => setIsPlaying(false);

      audio.addEventListener('play', handlePlay);
      audio.addEventListener('pause', handlePause);
      audio.addEventListener('ended', handleEnded);

      return () => {
        audio.removeEventListener('play', handlePlay);
        audio.removeEventListener('pause', handlePause);
        audio.removeEventListener('ended', handleEnded);
      };
    }
  }, []);


  if (!isOpen) return null;

  const profileImageUrl = 'https://images.weserv.nl/?url=sites.arquivo.download/marciorolim/FotoRostoRolim.jpeg&w=500&output=webp&q=85';
  const audioUrl = 'https://sites.arquivo.download/Diversos/Audio%20sobre%20mim%20marcio%20rolim.mp3';

  const calculateAge = (birthDate: string): number => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDifference = today.getMonth() - birth.getMonth();
    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const age = calculateAge('1973-04-18');

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
    }
  };

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-start justify-center p-4 pt-16 sm:pt-24"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="about-modal-title"
      >
        <div 
          className="relative bg-brand-dark rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border-2 border-brand-light/10 scrollbar-hide animate-slide-in-up"
          onClick={(e) => e.stopPropagation()}
        >
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 bg-brand-grey rounded-full p-2 text-brand-light/70 hover:bg-brand-light/20 transition-all duration-300 z-10"
            aria-label="Fechar modal"
          >
            <CloseIcon className="h-6 w-6" />
          </button>
          
          <div className="p-8 md:p-12">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-12">
              <div className="md:w-1/3 flex-shrink-0">
                <img
                  src={profileImageUrl}
                  alt="Foto de Marcio Rolim"
                  className="w-48 h-48 md:w-full md:h-auto rounded-full md:rounded-lg object-cover object-center mx-auto border-4 border-brand-grey shadow-lg"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <div className="md:w-2/3 text-center md:text-left">
                <h2 id="about-modal-title" className="text-3xl sm:text-4xl font-serif font-bold text-brand-light mb-4">
                  Sobre Mim
                </h2>
                <div className="mb-6">
                  <audio ref={audioRef} src={audioUrl} preload="metadata">
                    Seu navegador não suporta o elemento de áudio.
                  </audio>
                  <button
                    onClick={togglePlayPause}
                    className="w-full bg-brand-grey border border-brand-light/20 text-brand-light font-sans font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-4 transition-all duration-300 hover:bg-brand-gold hover:text-brand-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-dark focus:ring-brand-gold"
                    aria-label={isPlaying ? 'Pausar áudio' : 'Ouvir sobre mim'}
                  >
                    {isPlaying ? (
                      <PauseIcon className="h-6 w-6" />
                    ) : (
                      <PlayIcon className="h-6 w-6" />
                    )}
                    <span>{isPlaying ? 'Pausar' : 'Ouvir Áudio'}</span>
                  </button>
                </div>
                <div className="space-y-4 text-brand-light/80 font-sans text-lg leading-relaxed">
                  <p>
                    Olá, eu sou Marcio Rolim. Sou casado, pai de quatro filhas e avô de dois netos — minha maior alegria e motivação diária.
                  </p>
                  <p>
                    Minha trajetória é marcada pela união de duas áreas que moldam minha vida: a fé e a tecnologia. Como Pastor Evangélico, dedico meu ministério ao cuidado espiritual, especialmente no acompanhamento de jovens e casais, ajudando-os a superar desafios e a construir relacionamentos sólidos à luz da Palavra de Deus.
                  </p>
                  <p>
                    No campo profissional, atuo como Especialista em Tecnologia, com ampla experiência em desenvolvimento de aplicativos, websites, gestão de tráfego e conversão. Também sou especialista em Inteligência Artificial, criando soluções inovadoras que unem propósito, estratégia e resultados.
                  </p>
                  <p>
                    Minha missão é clara: crescer e contribuir. Acredito que cada conhecimento adquirido deve ser compartilhado e colocado a serviço das pessoas, seja através da transformação espiritual ou da inovação digital.
                  </p>
                  <p>
                    Hoje, aos {age} anos, sigo construindo um legado que une fé, família e tecnologia, sempre com o objetivo de impactar vidas de forma positiva e duradoura.
                  </p>
                </div>

                <div className="mt-8 text-center border-t border-brand-light/10 pt-8">
                  <div className="bg-brand-grey p-6 rounded-lg border border-brand-gold/30 shadow-lg">
                    <h3 className="text-2xl font-serif font-bold text-brand-light mb-4">
                      Meu Testemunho
                    </h3>
                    <button
                        onClick={() => setIsVideoModalOpen(true)}
                        className="font-sans font-bold bg-brand-gold text-brand-dark py-3 px-8 rounded-full hover:opacity-90 transition-all duration-300 shadow-lg shadow-brand-gold/20 text-lg inline-flex items-center transform hover:scale-105"
                        aria-label="Assistir ao testemunho em vídeo: Olha o que Deus fez comigo"
                    >
                        Olha o que Deus fez comigo
                    </button>
                  </div>
                   <p className="md:hidden text-brand-light/70 font-sans mt-4">
                    Eu creio em Deus
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {isVideoModalOpen && (
        <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-fade-in"
            onClick={() => setIsVideoModalOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="video-modal-title"
        >
          <div
            className="relative w-full max-w-4xl aspect-video bg-black rounded-lg shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <h4 id="video-modal-title" className="sr-only">Testemunho em vídeo: Meu Testemunho</h4>
            <button
              onClick={() => setIsVideoModalOpen(false)}
              className="absolute top-2 right-2 z-30 bg-black/50 text-white rounded-full p-1.5 hover:bg-black/70 transition-colors"
              aria-label="Fechar vídeo"
            >
                <CloseIcon className="h-6 w-6" />
            </button>
            <div className="relative w-full h-full cursor-pointer" onClick={toggleVideoPlay}>
                <video
                    ref={videoRef}
                    className="relative z-10 w-full h-full object-contain"
                    src="https://sites.arquivo.download/marciorolim/Olhe%20o%20que%20Deus%20fez%20comigo.mp4"
                    title="Meu Testemunho"
                    playsInline
                    onPlay={() => setIsVideoPlaying(true)}
                    onPause={() => setIsVideoPlaying(false)}
                    onEnded={() => setIsVideoPlaying(false)}
                >
                    Seu navegador não suporta a tag de vídeo.
                </video>
                
                {!isVideoPlaying && (
                    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 transition-opacity duration-300" aria-hidden="true">
                        <div className="bg-brand-gold text-brand-dark rounded-full p-4 shadow-lg transform transition-transform hover:scale-110">
                            <PlayIcon className="h-12 w-12" />
                        </div>
                    </div>
                )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AboutModal;