import { 
  User, 
  GraduationCap, 
  Languages, 
  Calendar, 
  MapPin 
} from 'lucide-react';

const EDUCATION_ITEMS = [
  {
    institution: 'Universiti Malaysia Sabah (UMS)',
    degree: 'Bachelor of Computer Science (Software Engineering)',
    period: '2023 — Present',
    location: 'Sabah, Malaysia',
    status: 'Current Student',
    desc: 'Undergraduate curriculum emphasizing software design, relational database systems, testing & QA, and modern web architectures.',
  },
  {
    institution: 'Kolej Matrikulasi Labuan (KML)',
    degree: 'Physical Science',
    period: '2022 — 2023',
    location: 'Labuan, Malaysia',
    status: 'Completed',
    desc: 'Pre-university physical science program building a foundation in advanced calculus, applied physics, and analytical logic.',
  },
] as const;

const LANGUAGES = [
  {
    name: 'English',
    level: 'Fluent / Professional',
    desc: 'Technical documentation, code, and collaborative communication.',
  },
  {
    name: 'Malay',
    level: 'Native Speaker',
    desc: 'Mother tongue, fluent written and verbal communication.',
  },
] as const;

export default function About() {
  return (
    <section id="about" className="py-24 relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold uppercase tracking-wider mb-3">
            <User className="w-3.5 h-3.5" />
            About
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            About Me
          </h2>
          <p className="mt-3 text-zinc-400 text-sm sm:text-base">
            Software engineering student background, education, and language proficiencies.
          </p>
        </div>

        {/* Content Grid: Narrative & Languages (Left) | Education (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
          
          {/* Left Column: Narrative Box & Languages */}
          <div className="lg:col-span-6 rounded-2xl p-6 sm:p-8 bg-[#111116] border border-white/10 shadow-xl flex flex-col justify-between">
            <div>
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

            {/* Languages Spoken */}
            <div className="mt-8 pt-6 border-t border-white/10">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-300 mb-3 font-mono">
                <Languages className="w-4 h-4" />
                <span>Languages Spoken</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {LANGUAGES.map((lang) => (
                  <div
                    key={lang.name}
                    className="p-3.5 rounded-xl bg-[#141419] border border-white/5"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-bold text-white text-sm">{lang.name}</span>
                      <span className="text-[11px] font-mono text-purple-300 font-medium">
                        {lang.level}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 leading-normal">
                      {lang.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Education Background */}
          <div className="lg:col-span-6 flex flex-col justify-between gap-4">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-300 font-mono px-1">
                <GraduationCap className="w-4 h-4" />
                <span>Education</span>
              </div>

              {EDUCATION_ITEMS.map((item) => (
                <div
                  key={item.institution}
                  className="rounded-2xl p-6 bg-[#111116] border border-white/10 shadow-lg hover:border-white/20 transition-all"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                    <div>
                      <h4 className="text-base sm:text-lg font-bold text-white">
                        {item.institution}
                      </h4>
                      <p className="text-xs sm:text-sm font-medium text-purple-300 mt-0.5">
                        {item.degree}
                      </p>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium border border-white/10 bg-white/5 text-zinc-300 shrink-0">
                      {item.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-zinc-400 font-mono mb-3">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-purple-400" />
                      <span>{item.period}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                      <span>{item.location}</span>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
