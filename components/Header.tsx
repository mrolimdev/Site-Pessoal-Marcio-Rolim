import React from 'react';

const Header: React.FC = () => {
  const logoUrl = 'https://images.weserv.nl/?url=sites.arquivo.download/marciorolim/FotoRostoRolim.jpeg&w=240&h=240&fit=cover&output=webp&q=85';

  return (
    <header className="absolute top-0 w-full z-20 flex justify-center pt-[80px]">
      <div className="h-[120px] w-[120px] rounded-full border-2 border-black shadow-lg shadow-black/40 overflow-hidden">
        <img
          src={logoUrl}
          alt="Marcio Rolim"
          className="h-full w-full object-cover"
          loading="eager"
          fetchPriority="high"
        />
      </div>
    </header>
  );
};

export default Header;