import React from 'react';

const Header: React.FC = () => {
  const logoUrl = 'https://files.restaure.online/marciorolim/FotoRostoRolim.jpeg';

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