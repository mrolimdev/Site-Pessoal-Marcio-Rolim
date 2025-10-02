import React from 'react';
import WhatsAppIcon from './icons/WhatsAppIcon';

const Hero: React.FC = () => {
  return (
    <section className="bg-brand-dark min-h-[500px] flex flex-col justify-start items-center text-center px-6 relative">
       {/* Removed gradient overlay for performance and simplicity */}
       <div className="z-10 pt-[225px] sm:pt-[220px]">
        <h1 className="text-4xl sm:text-5xl md:text-7xl font-serif font-bold text-brand-light leading-tight">
          Marcio Rolim
        </h1>
        <p className="text-lg sm:text-xl md:text-2xl font-sans text-brand-light/80 mt-2 mb-20">
          Consultor de Tecnologia
        </p>
        <a
          href="https://wa.me/5511980888880"
          target="_blank"
          rel="noopener noreferrer"
          className="font-sans font-bold bg-brand-gold text-brand-dark py-3 px-8 rounded-full hover:opacity-90 transition-opacity duration-300 shadow-lg text-lg inline-flex items-center"
        >
          <WhatsAppIcon className="h-5 w-5 mr-3" />
          Entrar em Contato
        </a>
        <div className="h-12"></div>
      </div>
    </section>
  );
};

export default Hero;