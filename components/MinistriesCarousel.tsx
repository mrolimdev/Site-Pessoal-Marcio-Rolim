import React, { useState } from 'react';
import { SKILLS } from '../constants';
import SkillCard from './MinistryCard'; // Repurposed to SkillCard

const SkillsSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'professional' | 'personal'>('professional');

  const filteredSkills = SKILLS.filter(skill => skill.category === activeTab);

  const TabButton: React.FC<{
    label: string;
    category: 'professional' | 'personal';
  }> = ({ label, category }) => (
    <button
      onClick={() => setActiveTab(category)}
      className={`font-sans font-bold text-lg py-2 px-6 rounded-full transition-all duration-300 ${
        activeTab === category
          ? 'bg-brand-gold text-brand-dark'
          : 'bg-brand-grey text-brand-light/70 hover:bg-brand-light/90 hover:shadow-md'
      }`}
      aria-pressed={activeTab === category}
    >
      {label}
    </button>
  );

  return (
    <section id="skills" className="bg-brand-dark py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-serif font-bold text-brand-light text-center mb-8">Minhas Habilidades</h2>
        
        <div className="flex justify-center gap-4 mb-12">
          <TabButton label="Profissionais" category="professional" />
          <TabButton label="Pessoais" category="personal" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {filteredSkills.map((skill) => (
            <SkillCard key={skill.title} skill={skill} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default SkillsSection;