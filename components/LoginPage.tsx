import React from 'react';

const LoginPage: React.FC = () => {
    const logoUrl = 'https://images.weserv.nl/?url=sites.arquivo.download/Igreja%20Atos/Logo%20Atos%20APP.png&h=160&output=webp&q=85';

  return (
    <div className="p-0 sm:p-6 md:p-8 min-h-screen flex items-center">
      <main className="w-full max-w-4xl mx-auto bg-brand-dark rounded-2xl shadow-2xl overflow-hidden border-2 border-brand-beige/20">
        <header className="p-6 border-b border-brand-beige/20 text-center relative">
           <a href="/" className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-beige hover:text-brand-beige/80 font-sans">&larr; Voltar</a>
          <img src={logoUrl} alt="Igreja Batista Atos Logo" className="h-20 mx-auto" />
        </header>
        <div className="p-8 md:p-12 text-center text-brand-beige/90" style={{ minHeight: '300px' }}>
            <h1 className="text-4xl font-serif font-bold text-brand-beige mb-4">Login</h1>
            <p className="text-lg font-sans">Funcionalidade em desenvolvimento.</p>
            <p className="text-lg font-sans text-brand-beige/70">Em breve, uma área exclusiva para membros.</p>
        </div>
        <footer className="bg-brand-dark text-brand-beige text-center text-xs p-4 border-t border-brand-beige/20">
            <p>&copy; {new Date().getFullYear()} Marcio Rolim. Eu creio em Deus.</p>
        </footer>
      </main>
    </div>
  );
};

export default LoginPage;