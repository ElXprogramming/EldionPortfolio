import { 
  GraduationCap, 
  Calendar, 
  MapPin, 
  Languages, 
  Award, 
  BookOpen 
} from 'lucide-react';

export default function Education() {
  const educationItems = [
    {
      institution: 'Universiti Malaysia Sabah (UMS)',
      degree: 'Bachelor of Computer Science with Honours (Software Engineering)',
      period: '2023 — Present',
      location: 'Sabah, Malaysia',
      status: 'Current Student',
      statusColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      description:
        'Pursuing formal Software Engineering curriculum emphasizing software architecture, requirements engineering, relational database design, testing & quality assurance, and modern distributed systems.',
      coursework: [
        'Software Engineering Lifecycle & QA',
        'Relational Database Systems (PostgreSQL / SQL)',
        'Object-Oriented Design & Testing',
        'Web & Mobile Application Development',
        'Data Structures & Algorithm Analysis',
      ],
    },
    {
      institution: 'Kolej Matrikulasi Labuan (KML)',
      degree: 'Physical Science',
      period: '2022 — 2023',
      location: 'Labuan, Malaysia',
      status: 'Completed',
      statusColor: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
      description:
        'Completed rigorous pre-university physical science program building strong analytical mathematical foundation, scientific methodology, and computational problem solving.',
      coursework: [
        'Advanced Calculus & Algebra',
        'Applied Physics',
        'Analytical Logic & Computing Foundation',
      ],
    },
  ];

  const languages = [
    {
      name: 'English',
      level: 'Fluent / Full Professional',
      desc: 'Technical documentation, code commenting, written & verbal collaboration.',
      percent: 95,
      color: 'from-indigo-500 to-sky-400',
    },
    {
      name: 'Malay',
      level: 'Native Speaker',
      desc: 'Mother tongue, effective native communication in diverse bilingual teams.',
      percent: 100,
      color: 'from-emerald-500 to-teal-400',
    },
  ];

  return (
    <section id="education" className="py-24 relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold uppercase tracking-wider mb-3">
            <GraduationCap className="w-3.5 h-3.5" />
            Academic Background
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Education &amp; Languages
          </h2>
          <p className="mt-3 text-slate-300 text-sm sm:text-base">
            Academic qualifications, coursework foundation, and language proficiencies.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Education Timeline (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {educationItems.map((item, idx) => (
              <div
                key={idx}
                className="glass-card rounded-2xl p-6 sm:p-7 border border-slate-800/80 bg-slate-900/60 relative overflow-hidden"
              >
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <div>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${item.statusColor}`}>
                      {item.status}
                    </span>
                    <h3 className="text-xl sm:text-2xl font-bold text-white mt-2">
                      {item.institution}
                    </h3>
                    <p className="text-sm font-semibold text-purple-300">
                      {item.degree}
                    </p>
                  </div>

                  <div className="flex flex-col sm:items-end text-xs text-slate-300 gap-1 font-mono">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-purple-400" />
                      <span>{item.period}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-300" />
                      <span>{item.location}</span>
                    </div>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-4">
                  {item.description}
                </p>

                {/* Relevant Coursework */}
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-purple-400" />
                    <span>Key Study Areas:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {item.coursework.map((course, cIdx) => (
                      <span
                        key={cIdx}
                        className="px-2.5 py-1 rounded-md bg-slate-950/70 text-slate-300 border border-slate-800/70 text-xs"
                      >
                        {course}
                      </span>
                    ))}
                  </div>
                </div>

              </div>
            ))}
          </div>

          {/* Languages & Communication (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="glass-panel rounded-2xl p-6 border border-slate-800/80 shadow-lg">
              <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-slate-800/80">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-300">
                  <Languages className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Languages
                  </h3>
                  <p className="text-xs text-slate-300">
                    Bilingual communication skills
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                {languages.map((lang, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/60">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-sm font-bold text-white">
                        {lang.name}
                      </span>
                      <span className="text-xs font-semibold text-purple-300">
                        {lang.level}
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full bg-slate-950 rounded-full h-1.5 mb-2 overflow-hidden border border-slate-800/50">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${lang.color}`}
                        style={{ width: `${lang.percent}%` }}
                      />
                    </div>

                    <p className="text-xs text-slate-300">
                      {lang.desc}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-3.5 rounded-xl bg-purple-950/30 border border-purple-800/30 text-xs text-purple-200 flex items-start gap-2.5">
                <Award className="w-4 h-4 text-[#B497CF] shrink-0 mt-0.5" />
                <span>
                  Ready to collaborate in English-speaking and multilingual engineering environments.
                </span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
