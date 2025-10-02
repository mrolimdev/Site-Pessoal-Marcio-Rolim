import React from 'react';
import InstagramIcon from './icons/InstagramIcon';
import YoutubeIcon from './icons/YoutubeIcon';
import FacebookIcon from './icons/FacebookIcon';
import MailIcon from './icons/MailIcon';
import { SOCIAL_LINKS } from '../constants';

const Contact: React.FC = () => {
  const socialIconClass = "h-8 w-8 text-brand-gold hover:opacity-80 transition-opacity duration-300";

  return (
    <section id="contact" className="bg-brand-grey text-center py-20 px-6">
      <h2 className="text-3xl sm:text-4xl font-serif font-bold text-brand-light mb-4">Minhas Redes</h2>
      <p className="text-lg text-brand-light/80 font-sans mb-8 max-w-2xl mx-auto">Estou sempre aberto a novas oportunidades e colaborações. Sinta-se à vontade para entrar em contato.</p>
      <div className="flex justify-center items-center space-x-8">
        <a href={SOCIAL_LINKS.youtube} target="_blank" rel="noopener noreferrer" aria-label="Siga-me no Youtube">
          <YoutubeIcon className={socialIconClass} />
        </a>
        <a href={SOCIAL_LINKS.facebook} target="_blank" rel="noopener noreferrer" aria-label="Siga-me no Facebook">
          <FacebookIcon className={socialIconClass} />
        </a>
        <a href={SOCIAL_LINKS.instagram} target="_blank" rel="noopener noreferrer" aria-label="Siga-me no Instagram">
          <InstagramIcon className={socialIconClass} />
        </a>
        <a href={SOCIAL_LINKS.email} aria-label="Envie-me um e-mail">
          <MailIcon className={socialIconClass} />
        </a>
      </div>
    </section>
  );
};

export default Contact;