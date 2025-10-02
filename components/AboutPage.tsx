import React from 'react';

const AboutPage: React.FC = () => {
    const logoUrl = 'https://images.weserv.nl/?url=sites.arquivo.download/Igreja%20Atos/Logo%20Atos%20APP.png&h=160&output=webp&q=85';

  return (
    <>
      <div className="p-0 sm:p-6 md:p-8 min-h-screen flex items-center">
        <main className="w-full max-w-4xl mx-auto bg-brand-dark rounded-2xl shadow-2xl overflow-hidden border-2 border-brand-beige/20">
          <header className="p-6 border-b border-brand-beige/20 text-center relative">
            <a href="/" className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-beige hover:text-brand-beige/80 font-sans">&larr; Voltar</a>
            <img src={logoUrl} alt="Igreja Batista Atos Logo" className="h-20 mx-auto" />
          </header>
          <div className="p-8 md:p-12 text-brand-beige/90">
              <h1 className="text-4xl font-serif font-bold text-brand-beige text-center mb-2">Sobre a Igreja Atos</h1>
              <h2 className="text-xl font-sans text-brand-beige/70 text-center mb-8">Seguimos Escrevendo a História</h2>

              <div className="space-y-6 font-sans text-lg text-justify leading-relaxed">
                  <p>
                      O nome **“ATOS”** remete ao livro de Atos dos Apóstolos, que relata o nascimento e a expansão da igreja primitiva. É um nome que carrega ação, movimento e a continuidade da missão de Jesus através da igreja. Representa nossa crença de que não somos meros espectadores do passado, mas participantes ativos no que Deus está fazendo agora.
                  </p>
                  <p>
                      Nossa identidade visual é cheia de propósito. O “T” em forma de cruz em nosso logo reafirma que **Cristo é o centro de nossa missão** e que toda ação da igreja nasce da cruz e aponta para ela. O círculo inacabado simboliza uma missão que continua, pois ainda estamos escrevendo os Atos. Sua abertura representa uma **igreja acolhedora**, com portas sempre abertas para quem busca recomeçar.
                  </p>
                  <p>
                      Cada culto, cada ação e cada vida transformada é uma nova página sendo escrita. Convidamos você a fazer parte dessa construção, aprendendo e registrando conosco o mover de Deus em nosso tempo.
                  </p>
              </div>
          </div>
          <footer className="bg-brand-dark text-brand-beige text-center text-xs p-4 border-t border-brand-beige/20">
              <p>&copy; {new Date().getFullYear()} Marcio Rolim. Eu creio em Deus.</p>
          </footer>
        </main>
      </div>
    </>
  );
};

export default AboutPage;