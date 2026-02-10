import React, { useState, useEffect } from 'react';

// --- Icons ---
const MapPinIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
    </svg>
);

const CalendarIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
);

const BriefcaseIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
);

const GraduationCapIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" />
    </svg>
);

const CodeIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
    </svg>
);

const DatabaseIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    </svg>
);

const CpuIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="4" width="16" height="16" rx="2" ry="2" /><rect x="9" y="9" width="6" height="6" /><line x1="9" y1="1" x2="9" y2="4" /><line x1="15" y1="1" x2="15" y2="4" /><line x1="9" y1="20" x2="9" y2="23" /><line x1="15" y1="20" x2="15" y2="23" /><line x1="20" y1="9" x2="23" y2="9" /><line x1="20" y1="14" x2="23" y2="14" /><line x1="1" y1="9" x2="4" y2="9" /><line x1="1" y1="14" x2="4" y2="14" />
    </svg>
);

const WrenchIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
);

const TargetIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
    </svg>
);

const HeartIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
);

const MailIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
    </svg>
);

const PhoneIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
);

const LinkedInIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
);

const GlobeIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
);

const InstagramIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
);

const WhatsAppIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
);

const PrinterIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" />
    </svg>
);

const DownloadIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
    </svg>
);

const ArrowLeftIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
    </svg>
);

const SparklesIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
    </svg>
);

const SunIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
);

const MoonIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
);

// --- Theme helper ---
const getTheme = (dark: boolean) => ({
    bg: dark ? 'bg-slate-950' : 'bg-stone-50',
    text: dark ? 'text-slate-100' : 'text-slate-800',
    headerBg: dark ? 'from-slate-900 via-slate-900 to-emerald-950' : 'from-white via-stone-50 to-emerald-50',
    headerGlow1: dark ? 'bg-amber-500/20' : 'bg-amber-300/20',
    headerGlow2: dark ? 'bg-emerald-500/10' : 'bg-emerald-300/15',
    barBg: dark ? 'bg-slate-800/90' : 'bg-white/90',
    barText: dark ? 'text-slate-300' : 'text-slate-600',
    barBorder: dark ? 'border-slate-700/50' : 'border-slate-200',
    barHover: dark ? 'hover:text-white hover:border-slate-600' : 'hover:text-slate-900 hover:border-slate-400',
    name: dark ? 'text-white' : 'text-slate-900',
    subtitle: dark ? 'text-amber-400' : 'text-amber-600',
    tagBg: dark ? 'bg-slate-800/60' : 'bg-white/80',
    tagBorder: dark ? 'border-slate-700/50' : 'border-slate-200',
    tagText: dark ? 'text-slate-400' : 'text-slate-600',
    contactBg: dark ? 'bg-slate-800/40' : 'bg-white/60',
    contactBorder: dark ? 'border-slate-700/30' : 'border-slate-200/80',
    contactText: dark ? 'text-slate-300' : 'text-slate-600',
    sectionTitle: dark ? 'text-white' : 'text-slate-900',
    cardBg: dark ? 'bg-slate-800/50' : 'bg-white',
    cardBorder: dark ? 'border-slate-700/50' : 'border-slate-200',
    cardGradient: dark ? 'from-slate-800/80 to-slate-800/40' : 'from-white to-stone-50',
    bodyText: dark ? 'text-slate-300' : 'text-slate-600',
    bodyTextLight: dark ? 'text-slate-400' : 'text-slate-500',
    labelText: dark ? 'text-slate-500' : 'text-slate-400',
    infoValue: dark ? 'text-slate-200' : 'text-slate-700',
    skillBarBg: dark ? 'bg-slate-800' : 'bg-slate-200',
    skillName: dark ? 'text-slate-300' : 'text-slate-700',
    skillPercent: dark ? 'text-slate-500' : 'text-slate-400',
    timelineDotBg: dark ? 'bg-slate-900' : 'bg-white',
    highlightBg: dark ? 'bg-slate-700/50' : 'bg-slate-100',
    highlightText: dark ? 'text-slate-300' : 'text-slate-600',
    highlightBorder: dark ? 'border-slate-600/30' : 'border-slate-200',
    diffCardBg: dark ? 'bg-slate-800/40' : 'bg-white/80',
    diffCardBorder: dark ? 'border-slate-700/40' : 'border-slate-200',
    diffDesc: dark ? 'text-slate-400' : 'text-slate-500',
    footerBorder: dark ? 'border-slate-800' : 'border-slate-200',
    footerText: dark ? 'text-slate-500' : 'text-slate-400',
    footerAccent: dark ? 'text-amber-500/50' : 'text-amber-600/60',
    strongAccent: dark ? 'text-amber-400' : 'text-amber-600',
    strongGreen: dark ? 'text-emerald-400' : 'text-emerald-600',
    strongWhite: dark ? 'text-white' : 'text-slate-900',
    toolColors: dark ? {
        claude: 'bg-orange-500/10 text-orange-300 border-orange-500/20',
        openai: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
        gemini: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
        cursor: 'bg-violet-500/10 text-violet-300 border-violet-500/20',
        antigravity: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20',
        vibe: 'bg-pink-500/10 text-pink-300 border-pink-500/20',
        websites: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
        apps: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20',
        agents: 'bg-rose-500/10 text-rose-300 border-rose-500/20',
    } : {
        claude: 'bg-orange-100 text-orange-700 border-orange-200',
        openai: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        gemini: 'bg-blue-100 text-blue-700 border-blue-200',
        cursor: 'bg-violet-100 text-violet-700 border-violet-200',
        antigravity: 'bg-cyan-100 text-cyan-700 border-cyan-200',
        vibe: 'bg-pink-100 text-pink-700 border-pink-200',
        websites: 'bg-amber-100 text-amber-700 border-amber-200',
        apps: 'bg-indigo-100 text-indigo-700 border-indigo-200',
        agents: 'bg-rose-100 text-rose-700 border-rose-200',
    },
});


// --- Helpers ---
const calculateAge = (birthDate: string): number => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--;
    return age;
};

const calculateYearsSince = (year: number): number => {
    return new Date().getFullYear() - year;
};

// --- Skill Bar Component ---
const SkillBar: React.FC<{ name: string; level: number; color: string; delay: number; isDark?: boolean }> = ({ name, level, color, delay, isDark = true }) => (
    <div className="group" style={{ animationDelay: `${delay}ms` }}>
        <div className="flex justify-between items-center mb-1.5">
            <span className={`text-sm font-medium ${isDark ? 'text-slate-300 group-hover:text-white' : 'text-slate-700 group-hover:text-slate-900'} transition-colors`}>{name}</span>
            <span className={`text-xs font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{level}%</span>
        </div>
        <div className={`w-full h-2 ${isDark ? 'bg-slate-800' : 'bg-slate-200'} rounded-full overflow-hidden`}>
            <div
                className={`h-full rounded-full transition-all duration-1000 ease-out ${color}`}
                style={{ width: `${level}%` }}
            />
        </div>
    </div>
);

// --- Timeline Item ---
const TimelineItem: React.FC<{
    period: string;
    company: string;
    role: string;
    description: string;
    highlights?: string[];
    isLast?: boolean;
    isDark?: boolean;
}> = ({ period, company, role, description, highlights, isLast, isDark = true }) => (
    <div className="relative pl-8 pb-10 group">
        {!isLast && (
            <div className="absolute left-[11px] top-8 w-[2px] h-full bg-gradient-to-b from-amber-500/50 to-transparent" />
        )}
        <div className={`absolute left-0 top-1 w-6 h-6 ${isDark ? 'bg-slate-900' : 'bg-white'} border-2 border-amber-500 rounded-full flex items-center justify-center group-hover:bg-amber-500 transition-colors duration-300`}>
            <div className="w-2 h-2 bg-amber-400 rounded-full group-hover:bg-slate-900 transition-colors duration-300" />
        </div>
        <div className={`${isDark ? 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-800/80' : 'bg-white border-slate-200 hover:bg-stone-50'} border rounded-2xl p-6 hover:border-amber-500/30 transition-all duration-300`}>
            <div className="flex flex-wrap items-center gap-3 mb-2">
                <span className={`text-xs font-mono ${isDark ? 'text-amber-400' : 'text-amber-600'} bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20`}>
                    {period}
                </span>
                <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>•</span>
                <span className={`text-sm font-semibold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>{company}</span>
            </div>
            <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'} mb-2`}>{role}</h3>
            <p className={`${isDark ? 'text-slate-400' : 'text-slate-500'} text-sm leading-relaxed mb-3`}>{description}</p>
            {highlights && highlights.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {highlights.map((h, i) => (
                        <span key={i} className={`text-xs ${isDark ? 'bg-slate-700/50 text-slate-300 border-slate-600/30' : 'bg-slate-100 text-slate-600 border-slate-200'} px-2.5 py-1 rounded-lg border`}>
                            {h}
                        </span>
                    ))}
                </div>
            )}
        </div>
    </div>
);


// --- Main Component ---
const CurriculumPage: React.FC = () => {
    const [isDark, setIsDark] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('cv-theme');
            return saved === 'dark';
        }
        return false;
    });
    const age = calculateAge('1973-04-18');
    const techYears = calculateYearsSince(1988);
    const profileImageUrl = 'https://images.weserv.nl/?url=sites.arquivo.download/marciorolim/FotoRostoRolim.jpeg&w=400&output=webp&q=90';
    const t = getTheme(isDark);

    const toggleTheme = () => {
        setIsDark(prev => {
            const next = !prev;
            localStorage.setItem('cv-theme', next ? 'dark' : 'light');
            return next;
        });
    };

    return (
        <div className={`min-h-screen ${t.bg} ${t.text} transition-colors duration-500`}>
            {/* Floating Action Bar */}
            <div className="no-print fixed top-4 left-4 right-4 z-50 flex items-center justify-between max-w-5xl mx-auto">
                <a
                    href="/"
                    className={`flex items-center gap-2 ${t.barBg} backdrop-blur-xl ${t.barText} px-4 py-2.5 rounded-full border ${t.barBorder} ${t.barHover} transition-all shadow-xl`}
                >
                    <ArrowLeftIcon className="w-4 h-4" />
                    <span className="text-sm font-medium">Voltar</span>
                </a>
                <div className="flex items-center gap-2">
                    <button
                        onClick={toggleTheme}
                        className={`flex items-center gap-2 ${t.barBg} backdrop-blur-xl ${t.barText} px-3 py-2.5 rounded-full border ${t.barBorder} ${t.barHover} transition-all shadow-xl`}
                        title={isDark ? 'Modo Claro' : 'Modo Escuro'}
                    >
                        {isDark ? <SunIcon className="w-4 h-4 text-amber-400" /> : <MoonIcon className="w-4 h-4 text-indigo-500" />}
                    </button>
                    <button
                        onClick={() => window.print()}
                        className="flex items-center gap-2 bg-amber-500/90 backdrop-blur-xl text-slate-900 hover:bg-amber-400 px-4 py-2.5 rounded-full transition-all shadow-xl font-medium"
                    >
                        <PrinterIcon className="w-4 h-4" />
                        <span className="text-sm">Imprimir CV</span>
                    </button>
                </div>
            </div>

            {/* Hero / Header Section */}
            <header className="relative overflow-hidden">
                <div className={`absolute inset-0 bg-gradient-to-br ${t.headerBg} transition-colors duration-500`} />
                <div className="absolute inset-0 opacity-20">
                    <div className={`absolute top-20 left-10 w-72 h-72 ${t.headerGlow1} rounded-full blur-3xl`} />
                    <div className={`absolute bottom-10 right-10 w-96 h-96 ${t.headerGlow2} rounded-full blur-3xl`} />
                </div>

                <div className="relative max-w-5xl mx-auto px-6 pt-24 pb-16 md:pt-28 md:pb-20">
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-10">
                        <div className="flex-shrink-0 animate-scale-in">
                            <div className="relative">
                                <div className="w-40 h-40 md:w-48 md:h-48 rounded-2xl overflow-hidden ring-4 ring-amber-500/30 shadow-2xl shadow-amber-500/10 rotate-3 hover:rotate-0 transition-transform duration-500">
                                    <img src={profileImageUrl} alt="Marcio Rolim" className="w-full h-full object-cover" loading="eager" />
                                </div>
                                <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
                                    <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                                    Disponível
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 text-center md:text-left animate-fade-in-up">
                            <h1 className={`text-4xl sm:text-5xl font-extrabold ${t.name} mb-2 tracking-tight`}>
                                Marcio Rolim
                            </h1>
                            <p className={`text-xl ${t.subtitle} font-semibold mb-4`}>
                                Especialista em Tecnologia & Inteligência Artificial
                            </p>

                            <div className="flex flex-wrap justify-center md:justify-start gap-3 mb-6">
                                <span className={`flex items-center gap-1.5 text-sm ${t.tagText} ${t.tagBg} px-3 py-1.5 rounded-lg border ${t.tagBorder}`}>
                                    <MapPinIcon className="w-3.5 h-3.5 text-emerald-400" /> São Paulo, SP
                                </span>
                                <span className={`flex items-center gap-1.5 text-sm ${t.tagText} ${t.tagBg} px-3 py-1.5 rounded-lg border ${t.tagBorder}`}>
                                    <CalendarIcon className="w-3.5 h-3.5 text-amber-400" /> {age} anos
                                </span>
                                <span className={`flex items-center gap-1.5 text-sm ${t.tagText} ${t.tagBg} px-3 py-1.5 rounded-lg border ${t.tagBorder}`}>
                                    <HeartIcon className="w-3.5 h-3.5 text-rose-400" /> Casado · 4 filhas
                                </span>
                                <span className={`flex items-center gap-1.5 text-sm ${t.tagText} ${t.tagBg} px-3 py-1.5 rounded-lg border ${t.tagBorder}`}>
                                    <BriefcaseIcon className="w-3.5 h-3.5 text-blue-400" /> +{techYears} anos em TI
                                </span>
                            </div>

                            <div className="flex flex-wrap justify-center md:justify-start gap-3">
                                <a href="mailto:contato@marciorolim.com.br" className={`flex items-center gap-2 text-sm ${t.contactText} hover:text-amber-400 ${t.contactBg} px-4 py-2 rounded-lg border ${t.contactBorder} hover:border-amber-500/30 transition-all`}>
                                    <MailIcon className="w-4 h-4" /> contato@marciorolim.com.br
                                </a>
                                <a href="https://wa.me/5511980888880" target="_blank" rel="noopener noreferrer" className={`flex items-center gap-2 text-sm ${t.contactText} hover:text-emerald-400 ${t.contactBg} px-4 py-2 rounded-lg border ${t.contactBorder} hover:border-emerald-500/30 transition-all`}>
                                    <WhatsAppIcon className="w-4 h-4" /> (11) 98088-8880
                                </a>
                                <a href="https://instagram.com/marciorolim" target="_blank" rel="noopener noreferrer" className={`flex items-center gap-2 text-sm ${t.contactText} hover:text-pink-400 ${t.contactBg} px-4 py-2 rounded-lg border ${t.contactBorder} hover:border-pink-500/30 transition-all`}>
                                    <InstagramIcon className="w-4 h-4" /> @marciorolim
                                </a>
                                <a href="https://linkedin.com/in/marciorolim" target="_blank" rel="noopener noreferrer" className={`flex items-center gap-2 text-sm ${t.contactText} hover:text-blue-400 ${t.contactBg} px-4 py-2 rounded-lg border ${t.contactBorder} hover:border-blue-500/30 transition-all`}>
                                    <LinkedInIcon className="w-4 h-4" /> /marciorolim
                                </a>
                                <a href="https://marciorolim.com.br" target="_blank" rel="noopener noreferrer" className={`flex items-center gap-2 text-sm ${t.contactText} hover:text-violet-400 ${t.contactBg} px-4 py-2 rounded-lg border ${t.contactBorder} hover:border-violet-500/30 transition-all`}>
                                    <GlobeIcon className="w-4 h-4" /> marciorolim.com.br
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-5xl mx-auto px-6 py-12 space-y-16">

                {/* Propósito / Objetivo Profissional */}
                <section className="animate-fade-in-up">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                            <TargetIcon className="w-5 h-5 text-white" />
                        </div>
                        <h2 className={`text-2xl font-bold ${t.sectionTitle}`}>Propósito & Objetivo</h2>
                    </div>
                    <div className={`bg-gradient-to-r ${t.cardGradient} border ${t.cardBorder} rounded-2xl p-6 md:p-8`}>
                        <p className={`${t.bodyText} leading-relaxed text-base md:text-lg`}>
                            Profissional com mais de <strong className={t.strongAccent}>{techYears} anos de experiência em tecnologia</strong>,
                            unindo visão estratégica e capacidade técnica para gerar resultados concretos. Minha trajetória abrange desde
                            o suporte técnico até a gestão completa de infraestrutura de TI, implementação de ERPs corporativos e, mais recentemente,
                            o desenvolvimento de soluções inovadoras com <strong className={t.strongGreen}>Inteligência Artificial</strong>,
                            automação e desenvolvimento web moderno.
                        </p>
                        <p className={`${t.bodyText} leading-relaxed text-base md:text-lg mt-4`}>
                            Meu propósito é <strong className={t.strongWhite}>transformar vidas e negócios através da tecnologia</strong>.
                            Acredito que cada pessoa e cada organização tem um potencial único que pode ser amplificado com as ferramentas
                            e estratégias certas. Busco oportunidades onde possa aplicar minha experiência em IA, desenvolvimento e
                            gestão de tecnologia para criar impacto real e duradouro.
                        </p>
                    </div>
                </section>

                {/* Formação Acadêmica */}
                <section>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <GraduationCapIcon className="w-5 h-5 text-white" />
                        </div>
                        <h2 className={`text-2xl font-bold ${t.sectionTitle}`}>Formação Acadêmica</h2>
                    </div>
                    <div className={`${t.cardBg} border ${t.cardBorder} rounded-2xl p-6 hover:border-blue-500/30 transition-all duration-300`}>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                            <div className="w-14 h-14 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-xl flex items-center justify-center border border-blue-500/20">
                                <GraduationCapIcon className="w-7 h-7 text-blue-400" />
                            </div>
                            <div>
                                <h3 className={`text-lg font-bold ${t.sectionTitle}`}>Ciências da Computação</h3>
                                <p className={`${t.bodyTextLight} text-sm`}>Graduação</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Cursos Complementares */}
                <section>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/20">
                            <GraduationCapIcon className="w-5 h-5 text-white" />
                        </div>
                        <h2 className={`text-2xl font-bold ${t.sectionTitle}`}>Cursos Complementares</h2>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {[
                            { name: 'Redes e Infraestrutura', icon: '🌐' },
                            { name: 'Gestão de Negócios', icon: '📊' },
                            { name: 'Engenharia de Prompt (IA)', icon: '🤖' },
                            { name: 'Contabilidade Básica', icon: '📋' },
                            { name: 'Lógica de Programação', icon: '💻' },
                            { name: 'Automação Industrial com C#', icon: '⚙️' },
                            { name: 'Banco de Dados SQL', icon: '🗄️' },
                        ].map((curso, index) => (
                            <div
                                key={curso.name}
                                className={`${t.cardBg} border ${t.cardBorder} rounded-xl px-4 py-3 flex items-center gap-3 hover:border-teal-500/30 transition-all duration-300`}
                                style={{ animationDelay: `${index * 60}ms` }}
                            >
                                <span className="text-xl">{curso.icon}</span>
                                <span className={`text-sm font-medium ${t.bodyText}`}>{curso.name}</span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Idiomas */}
                <section>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-sky-500/20">
                            <GlobeIcon className="w-5 h-5 text-white" />
                        </div>
                        <h2 className={`text-2xl font-bold ${t.sectionTitle}`}>Idiomas</h2>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                        <div className={`${t.cardBg} border ${t.cardBorder} rounded-xl p-5 hover:border-sky-500/30 transition-all duration-300`}>
                            <div className="flex items-center gap-3 mb-3">
                                <span className="text-2xl">🇺🇸</span>
                                <div>
                                    <h3 className={`text-base font-bold ${t.sectionTitle}`}>Inglês</h3>
                                    <p className={`text-xs ${t.bodyTextLight}`}>Básico</p>
                                </div>
                            </div>
                            <div className={`w-full h-2 ${isDark ? 'bg-slate-800' : 'bg-slate-200'} rounded-full overflow-hidden`}>
                                <div className="h-full bg-gradient-to-r from-sky-400 to-blue-500 rounded-full" style={{ width: '35%' }} />
                            </div>
                        </div>
                        <div className={`${t.cardBg} border ${t.cardBorder} rounded-xl p-5 hover:border-sky-500/30 transition-all duration-300`}>
                            <div className="flex items-center gap-3 mb-3">
                                <span className="text-2xl">🇪🇸</span>
                                <div>
                                    <h3 className={`text-base font-bold ${t.sectionTitle}`}>Espanhol</h3>
                                    <p className={`text-xs ${t.bodyTextLight}`}>Básico</p>
                                </div>
                            </div>
                            <div className={`w-full h-2 ${isDark ? 'bg-slate-800' : 'bg-slate-200'} rounded-full overflow-hidden`}>
                                <div className="h-full bg-gradient-to-r from-orange-400 to-red-500 rounded-full" style={{ width: '30%' }} />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Habilidades Técnicas */}
                <section>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                            <SparklesIcon className="w-5 h-5 text-white" />
                        </div>
                        <h2 className={`text-2xl font-bold ${t.sectionTitle}`}>Habilidades Técnicas</h2>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className={`${t.cardBg} border ${t.cardBorder} rounded-2xl p-6 hover:border-emerald-500/30 transition-all duration-300`}>
                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                                    <CodeIcon className="w-4 h-4 text-emerald-400" />
                                </div>
                                <h3 className={`text-base font-bold ${t.sectionTitle}`}>Programação</h3>
                            </div>
                            <div className="space-y-4">
                                <SkillBar name="Python" level={85} color="bg-gradient-to-r from-yellow-400 to-yellow-500" delay={0} isDark={isDark} />
                                <SkillBar name="JavaScript" level={80} color="bg-gradient-to-r from-amber-400 to-amber-500" delay={100} isDark={isDark} />
                                <SkillBar name="HTML / CSS" level={90} color="bg-gradient-to-r from-orange-400 to-red-500" delay={200} isDark={isDark} />
                                <SkillBar name="Node.js" level={75} color="bg-gradient-to-r from-emerald-400 to-emerald-500" delay={300} isDark={isDark} />
                                <SkillBar name="PHP" level={65} color="bg-gradient-to-r from-indigo-400 to-violet-500" delay={400} isDark={isDark} />
                            </div>
                        </div>

                        <div className={`${t.cardBg} border ${t.cardBorder} rounded-2xl p-6 hover:border-blue-500/30 transition-all duration-300`}>
                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
                                    <DatabaseIcon className="w-4 h-4 text-blue-400" />
                                </div>
                                <h3 className={`text-base font-bold ${t.sectionTitle}`}>Banco de Dados</h3>
                            </div>
                            <div className="space-y-4">
                                <SkillBar name="MySQL" level={80} color="bg-gradient-to-r from-sky-400 to-blue-500" delay={0} isDark={isDark} />
                                <SkillBar name="SQL" level={80} color="bg-gradient-to-r from-blue-400 to-indigo-500" delay={100} isDark={isDark} />
                                <SkillBar name="Supabase" level={85} color="bg-gradient-to-r from-emerald-400 to-green-500" delay={200} isDark={isDark} />
                            </div>
                        </div>

                        <div className={`${t.cardBg} border ${t.cardBorder} rounded-2xl p-6 hover:border-violet-500/30 transition-all duration-300`}>
                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-8 h-8 bg-violet-500/10 rounded-lg flex items-center justify-center">
                                    <CpuIcon className="w-4 h-4 text-violet-400" />
                                </div>
                                <h3 className={`text-base font-bold ${t.sectionTitle}`}>Automação & IA</h3>
                            </div>
                            <div className="space-y-4">
                                <SkillBar name="N8N" level={85} color="bg-gradient-to-r from-orange-400 to-red-400" delay={0} isDark={isDark} />
                                <SkillBar name="Make (Integromat)" level={75} color="bg-gradient-to-r from-violet-400 to-purple-500" delay={100} isDark={isDark} />
                                <SkillBar name="Agentes de IA" level={80} color="bg-gradient-to-r from-fuchsia-400 to-pink-500" delay={200} isDark={isDark} />
                                <SkillBar name="Gestão de Tráfego" level={90} color="bg-gradient-to-r from-sky-400 to-cyan-500" delay={300} isDark={isDark} />
                            </div>
                        </div>

                        <div className={`${t.cardBg} border ${t.cardBorder} rounded-2xl p-6 hover:border-amber-500/30 transition-all duration-300`}>
                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-8 h-8 bg-amber-500/10 rounded-lg flex items-center justify-center">
                                    <WrenchIcon className="w-4 h-4 text-amber-400" />
                                </div>
                                <h3 className={`text-base font-bold ${t.sectionTitle}`}>Ferramentas & Plataformas</h3>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {[
                                    { name: 'Claude', key: 'claude' },
                                    { name: 'OpenAI / GPT', key: 'openai' },
                                    { name: 'Gemini', key: 'gemini' },
                                    { name: 'Cursor', key: 'cursor' },
                                    { name: 'Antigravity', key: 'antigravity' },
                                    { name: 'Vibe Coding', key: 'vibe' },
                                    { name: 'Websites', key: 'websites' },
                                    { name: 'Aplicativos', key: 'apps' },
                                    { name: 'Agentes de IA', key: 'agents' },
                                    { name: 'META Ads', key: 'vibe' },
                                    { name: 'Google ADS', key: 'gemini' },
                                    { name: 'n8n', key: 'claude' },
                                    { name: 'Maker', key: 'openai' },
                                ].map((tool) => (
                                    <span
                                        key={tool.name}
                                        className={`text-xs font-medium px-3 py-1.5 rounded-lg border ${(t.toolColors as any)[tool.key]} hover:scale-105 transition-transform cursor-default`}
                                    >
                                        {tool.name}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Experiência Profissional */}
                <section>
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                            <BriefcaseIcon className="w-5 h-5 text-white" />
                        </div>
                        <h2 className={`text-2xl font-bold ${t.sectionTitle}`}>Experiência Profissional</h2>
                    </div>

                    <div className="space-y-0">
                        <TimelineItem
                            period="2012 – 2020"
                            company="Igreja Plenitude"
                            role="Gerente de Tecnologia"
                            description="Responsável pela implantação completa da infraestrutura de TI de uma igreja de grande porte com templo para 15 mil membros (sede) e mais de 120 congregações, totalizando mais de 50 mil membros no Brasil. Gestão abrangente, incluindo Central de Atendimento com 220 pontos telefônicos e +50 mil ligações/mês, além de administração de rádio e TV."
                            highlights={[
                                'Infraestrutura de TI',
                                'Rádio & TV',
                                'Central de Atendimento',
                                'Gestão de equipes',
                            ]}
                            isDark={isDark}
                        />

                        <TimelineItem
                            period="2004 – 2012"
                            company="TOTVS"
                            role="Analista de Negócios"
                            description="Levantamento de processos e implementação de sistema ERP na área de materiais e produção. Suporte especializado a aplicativos corporativos e migração completa de dados para o ERP, garantindo integridade e continuidade operacional."
                            highlights={[
                                'ERP (Protheus)',
                                'Levantamento de processos',
                                'Materiais & Produção',
                                'Migração de dados',
                                'Suporte corporativo',
                            ]}
                            isDark={isDark}
                        />

                        <TimelineItem
                            period="1988 – 2004"
                            company="Diversas Empresas (Sul América, SBT, Bunge Alimentos, Nalco Química, Braisa Brasil Serviços, Mecanográfics Automações)"
                            role="Profissional de Tecnologia"
                            description="Atuação diversificada na área de tecnologia com foco em suporte técnico e desenvolvimento de soluções departamentais. Criação de planilhas, pequenos sistemas e ferramentas para otimização de processos em diferentes setores corporativos."
                            highlights={[
                                'Suporte técnico',
                                'Suporte a Usuários',
                                'Pacote Office',
                                'Sistemas departamentais',
                                'Planilhas avançadas',
                                'Otimização de processos',
                            ]}
                            isLast
                            isDark={isDark}
                        />
                    </div>
                </section>

                {/* Dados Pessoais & Informações Complementares */}
                <section>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg shadow-rose-500/20">
                            <HeartIcon className="w-5 h-5 text-white" />
                        </div>
                        <h2 className={`text-2xl font-bold ${t.sectionTitle}`}>Informações Pessoais</h2>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className={`${t.cardBg} border ${t.cardBorder} rounded-2xl p-6`}>
                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <CalendarIcon className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <span className={`text-xs ${t.labelText} uppercase tracking-wider`}>Data de Nascimento</span>
                                        <p className={`${t.infoValue} font-medium`}>18 de Abril de 1973 ({age} anos)</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <HeartIcon className="w-5 h-5 text-rose-400 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <span className={`text-xs ${t.labelText} uppercase tracking-wider`}>Estado Civil</span>
                                        <p className={`${t.infoValue} font-medium`}>Casado · 4 filhas</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <MapPinIcon className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <span className={`text-xs ${t.labelText} uppercase tracking-wider`}>Endereço</span>
                                        <p className={`${t.infoValue} font-medium`}>Rua Guaraitá, 1290 - Vila Curuçá</p>
                                        <p className={`${t.bodyTextLight} text-sm`}>CEP 08030-310 - São Paulo - SP</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className={`${t.cardBg} border ${t.cardBorder} rounded-2xl p-6`}>
                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <GraduationCapIcon className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <span className={`text-xs ${t.labelText} uppercase tracking-wider`}>Formação</span>
                                        <p className={`${t.infoValue} font-medium`}>Ciências da Computação</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <BriefcaseIcon className="w-5 h-5 text-violet-400 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <span className={`text-xs ${t.labelText} uppercase tracking-wider`}>Atuação em TI desde</span>
                                        <p className={`${t.infoValue} font-medium`}>1988 — mais de {techYears} anos de experiência</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <SparklesIcon className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <span className={`text-xs ${t.labelText} uppercase tracking-wider`}>Foco atual</span>
                                        <p className={`${t.infoValue} font-medium`}>IA, Desenvolvimento Web e Aplicativos, Automação & Gestão de Tráfego</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Diferenciais / Pontos Fortes */}
                <section>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
                            <SparklesIcon className="w-5 h-5 text-white" />
                        </div>
                        <h2 className={`text-2xl font-bold ${t.sectionTitle}`}>Diferenciais</h2>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[
                            { icon: '🧠', title: 'Visão Estratégica', desc: 'Capacidade de unir tecnologia e propósito para gerar impacto real em organizações.' },
                            { icon: '🤖', title: 'Early Adopter de IA', desc: 'Domínio de ferramentas modernas de IA generativa e agentes autônomos para automação.' },
                            { icon: '🔧', title: 'Full Stack Prático', desc: 'Do conceito à produção: websites, aplicativos e sistemas com entrega completa.' },
                            { icon: '📊', title: 'Gestão de TI', desc: 'Experiência comprovada em implantar e gerenciar infraestrutura em grande escala.' },
                            { icon: '🤝', title: 'Liderança e Comunicação', desc: 'Habilidade natural de liderança e gestão de equipes multidisciplinares.' },
                            { icon: '⚡', title: 'Resolução de Problemas', desc: 'Mais de 3 décadas transformando desafios complexos em soluções funcionais.' },
                        ].map((item, index) => (
                            <div
                                key={item.title}
                                className={`group ${t.diffCardBg} border ${t.diffCardBorder} rounded-2xl p-5 hover:border-cyan-500/30 ${isDark ? 'hover:bg-slate-800/60' : 'hover:bg-white'} transition-all duration-300 hover:-translate-y-1`}
                                style={{ animationDelay: `${index * 80}ms` }}
                            >
                                <div className="text-3xl mb-3">{item.icon}</div>
                                <h3 className={`text-sm font-bold ${t.sectionTitle} mb-1.5`}>{item.title}</h3>
                                <p className={`text-xs ${t.diffDesc} leading-relaxed`}>{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className={`border-t ${t.footerBorder} py-10 px-6`}>
                <div className="max-w-5xl mx-auto text-center">
                    <p className={`${t.footerText} text-sm mb-2`}>
                        © {new Date().getFullYear()} Marcio Rolim. Todos os direitos reservados.
                    </p>
                    <p className={`${t.footerAccent} text-xs`}>Eu creio em Deus.</p>
                </div>
            </footer>
        </div>
    );
};

export default CurriculumPage;
