import { 
  Code2, 
  BrainCircuit, 
  Database, 
  CheckCircle2 
} from 'lucide-react';

interface SkillCategory {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  badge: string;
  description: string;
  skills: { name: string; highlight?: boolean }[];
}

const SKILL_CATEGORIES: readonly SkillCategory[] = [
  {
    title: 'Full Stack Dev',
    icon: Code2,
    color: 'from-sky-500/20 to-blue-500/5 text-sky-400 border-sky-500/30',
    badge: 'Client & Server Systems',
    description: 'Engineering responsive client interfaces with React and scalable backend APIs with Node.js and Python.',
    skills: [
      { name: 'React.js', highlight: true },
      { name: 'TypeScript', highlight: true },
      { name: 'Node.js', highlight: true },
      { name: 'Express.js', highlight: true },
      { name: 'RESTful APIs', highlight: true },
      { name: 'Tailwind CSS', highlight: true },
      { name: 'Python', highlight: true },
      { name: 'JavaScript (ES6+)' },
      { name: 'WebGL (Three.js)' },
      { name: 'Vite & Tooling' },
    ],
  },
  {
    title: 'Artificial Intelligence',
    icon: BrainCircuit,
    color: 'from-amber-500/20 to-rose-500/5 text-amber-400 border-amber-500/30',
    badge: 'Intelligent Systems',
    description: 'Deploying local LLMs, retrieval-augmented generation pipelines, and deterministic AI workflows.',
    skills: [
      { name: 'Local LLMs (Ollama)', highlight: true },
      { name: 'RAG Pipelines', highlight: true },
      { name: 'Gemini & OpenAI APIs', highlight: true },
      { name: 'Structured JSON Outputs', highlight: true },
      { name: 'Open-Source Models (Qwen, GLM)' },
      { name: 'Prompt Engineering' },
      { name: 'Context Optimization' },
    ],
  },
  {
    title: 'Databases & System Tools',
    icon: Database,
    color: 'from-emerald-500/20 to-teal-500/5 text-emerald-400 border-emerald-500/30',
    badge: 'Data & Infrastructure',
    description: 'Relational database architecture, transactional ledgers, version control, and Linux systems.',
    skills: [
      { name: 'PostgreSQL', highlight: true },
      { name: 'SQLite3 (WAL)', highlight: true },
      { name: 'Relational Database Design', highlight: true },
      { name: 'Git & GitHub', highlight: true },
      { name: 'ETL & Data Ingestion' },
      { name: 'Linux OS' },
      { name: 'Cloud Hosting (Vercel, Netlify)' },
      { name: 'Postman & API Testing' },
    ],
  },
];

export default function Skills() {
  return (
    <section id="skills" className="py-24 relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-left max-w-2xl mb-8 sm:mb-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Technical Stack
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-zinc-400">
            Core technologies, frameworks, and engineering tools.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SKILL_CATEGORIES.map((cat, idx) => {
            const Icon = cat.icon;
            return (
              <div
                key={idx}
                className={`rounded-2xl p-6 sm:p-7 border border-white/10 bg-[#111116] relative overflow-hidden shadow-xl group flex flex-col justify-between ${
                  idx === 0 ? 'md:col-span-2 lg:col-span-1' : ''
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl border bg-black/40 ${cat.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors">
                          {cat.title}
                        </h3>
                        <span className="text-xs text-purple-300/80 font-mono font-medium">
                          {cat.badge}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-zinc-300 mb-5 leading-relaxed">
                    {cat.description}
                  </p>
                </div>

                {/* Skills tags */}
                <div className="flex flex-wrap gap-2">
                  {cat.skills.map((skill, sIdx) => (
                    <span
                      key={sIdx}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                        skill.highlight
                          ? 'bg-purple-950/60 text-purple-200 border border-purple-500/40 shadow-xs'
                          : 'bg-[#141419] text-zinc-300 border border-white/10 hover:border-white/20'
                      }`}
                    >
                      {skill.highlight && (
                        <CheckCircle2 className="w-3 h-3 text-purple-400 shrink-0" />
                      )}
                      <span>{skill.name}</span>
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
