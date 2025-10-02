import React, { useState } from 'react';
import Header from './components/Header';
import Hero from './components/ElfsightInstagramFeed'; // Repurposed to Hero
import SkillsSection from './components/MinistriesCarousel'; // Repurposed to SkillsSection
import Contact from './components/Connect'; // Repurposed to Contact
import UserIcon from './components/icons/UserIcon';
import AboutModal from './components/AboutModal.tsx';
import ChatWidget from './components/ChatWidget.tsx';

function App() {
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);

  return (
    <>
      {isAboutModalOpen && <AboutModal isOpen={isAboutModalOpen} onClose={() => setIsAboutModalOpen(false)} />}

      <div>
        <main className="relative w-full max-w-7xl mx-auto bg-brand-dark rounded-none sm:rounded-2xl shadow-2xl overflow-hidden border-0 sm:border-2 border-brand-light/10">
          <button
            onClick={() => setIsAboutModalOpen(true)}
            className="absolute top-6 left-6 z-30 text-brand-light/70 hover:text-brand-gold transition-colors duration-300"
            aria-label="Sobre mim"
          >
            <UserIcon className="h-8 w-8" />
          </button>

          <Header />
          <Hero />
          <SkillsSection />
          <Contact />
          <footer className="bg-brand-dark text-brand-light/50 text-center text-xs p-4 border-t border-brand-light/10">
            <p>&copy; {new Date().getFullYear()} Marcio Rolim. Eu creio em Deus.</p>
          </footer>
        </main>
      </div>
      <ChatWidget />
    </>
  );
}

export default App;