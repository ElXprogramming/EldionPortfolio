import { 
  GraduationCap, 
  Languages, 
  Calendar, 
  MapPin 
} from 'lucide-react';
import GithubContributions from './GithubContributions';

const EDUCATION_ITEMS = [
  {
    institution: 'Universiti Malaysia Sabah (UMS)',
    degree: 'Bachelor of Computer Science (Software Engineering)',
    period: '2023 — Present',
    location: 'Sabah, Malaysia',
    status: 'Current Student',
  },
  {
    institution: 'Kolej Matrikulasi Labuan (KML)',
    degree: 'Physical Science',
    period: '2022 — 2023',
    location: 'Labuan, Malaysia',
    status: 'Completed',
  },
] as const;

const LANGUAGES = [
  {
    name: 'English',
    level: 'Fluent',
  },
  {
    name: 'Malay',
    level: 'Native',
  },
  {
    name: 'Dusun',
    level: 'Native',
  },
] as const;

export default function About() {
  return (
    <section id="about" className="py-24 relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-left max-w-2xl mb-8 sm:mb-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            About
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-zinc-400">
            Software engineering background, education, and language proficiencies.
          </p>
        </div>

        {/* Content Grid: Narrative (Left) | Education & Languages (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
          
          {/* Left Column: Narrative Box */}
          <div className="lg:col-span-6 flex flex-col">
            <div className="rounded-2xl p-6 sm:p-8 bg-[#111116] border border-white/10 shadow-xl flex-1 flex flex-col justify-center">
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-4">
                Turning Ideas into High-Quality Software
              </h3>
              
              <div className="space-y-4 text-zinc-300 text-sm sm:text-base leading-relaxed">
                <p>
                  I am a Software Engineering student at <span className="text-white font-medium">Universiti Malaysia Sabah</span> with a passion for software design, modern web architectures, and intelligent systems.
                </p>
                
                <p>
                  My journey centers around practical building: from engineering 
                  <span className="text-purple-300 font-medium"> Declaraform</span> to eliminate the friction of manual academic PDF editing for peers in FKI, to developing full-stack web applications and intelligent data-driven solutions.
                </p>

                <p>
                  I prioritize writing maintainable, clean code with TypeScript, structuring resilient databases, and delivering user-friendly experiences.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Education Background & Languages */}
          <div className="lg:col-span-6 flex flex-col gap-5">
            {/* Education Section */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-300 font-mono px-1">
                <GraduationCap className="w-4 h-4" />
                <span>Education</span>
              </div>

              {EDUCATION_ITEMS.map((item) => (
                <div
                  key={item.institution}
                  className="relative rounded-2xl p-4 sm:p-5 bg-[#111116] border border-white/10 shadow-lg hover:border-white/20 transition-all"
                >
                  <div className="mb-2 pr-28 sm:pr-32">
                    <h4 className="text-base sm:text-lg font-bold text-white">
                      {item.institution}
                    </h4>
                    <p className="text-xs sm:text-sm font-medium text-purple-300 mt-0.5">
                      {item.degree}
                    </p>
                  </div>

                  <span
                    className={`absolute top-4 right-4 sm:top-5 sm:right-5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium shrink-0 whitespace-nowrap ${
                      item.status === 'Current Student'
                        ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 flex items-center gap-1.5'
                        : 'border border-white/10 bg-white/5 text-zinc-300'
                    }`}
                  >
                    {item.status === 'Current Student' && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    )}
                    {item.status}
                  </span>

                  <div className="flex items-center gap-4 text-xs text-zinc-400 font-mono">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-purple-400" />
                      <span>{item.period}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                      <span>{item.location}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Languages Card (Below Education) */}
            <div className="rounded-2xl p-5 sm:p-6 bg-[#111116] border border-white/10 shadow-xl">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-300 mb-3.5 font-mono">
                <Languages className="w-4 h-4" />
                <span>Languages</span>
              </div>
              <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
                {LANGUAGES.map((lang) => (
                  <div
                    key={lang.name}
                    className="p-3 sm:p-3.5 rounded-xl bg-[#141419] border border-white/5 flex flex-col items-center justify-center text-center hover:border-purple-500/20 transition-colors"
                  >
                    <span className="font-bold text-white text-sm sm:text-base">{lang.name}</span>
                    <span className="text-[11px] sm:text-xs font-mono text-purple-300 mt-0.5 font-medium">
                      {lang.level}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* GitHub Contributions Monitoring Card */}
            <GithubContributions />
          </div>

        </div>

      </div>
    </section>
  );
}
