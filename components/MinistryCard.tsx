import React from 'react';
import type { Skill } from '../types';

interface SkillCardProps {
  skill: Skill;
}

const SkillCard: React.FC<SkillCardProps> = ({ skill }) => {
  return (
    <div className="bg-brand-grey p-6 rounded-lg shadow-lg border border-brand-light/10 flex items-start gap-6 transition-all duration-300 hover:border-brand-gold/50 hover:shadow-brand-gold/10 h-full hover:-translate-y-1 hover:scale-[1.02]">
      <div className="flex-shrink-0 mt-1">
        {skill.icon}
      </div>
      <div className="flex-grow">
        <h3 className="text-xl font-sans font-bold text-brand-light mb-2">
          {skill.title}
        </h3>
        <p className="text-brand-light/70 font-sans leading-relaxed">
          {skill.description}
        </p>
      </div>
    </div>
  );
};

export default SkillCard;