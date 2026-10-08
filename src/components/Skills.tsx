import { 
  Code2, 
  Server, 
  BrainCircuit, 
  Database, 
  CheckCircle2, 
  Layers
} from 'lucide-react';

interface SkillCategory {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  badge: string;
  description: string;
  skills: { name: string; highlight?: boolean }[];
}

export default function Skills() {
  const skillCategories: SkillCategory[] = [
    {
      title: 'Frontend Development',
      icon: Code2,
      color: 'from-sky-500/20 to-blue-500/5 text-sky-400 border-sky-500/30',
      badge: 'Interactive & Responsive',
      description: 'Building fast, accessible, and reactive user interfaces with modern toolchains.',
      skills: [
        { name: 'React.js', highlight: true },
        { name: 'TypeScript', highlight: true },
        { name: 'JavaScript (ES6+)', highlight: true },
        { name: 'Tailwind CSS', highlight: true },
        { name: 'WebGL (Three.js)' },
        { name: 'HTML Canvas' },
        { name: 'Context API' },
        { name: 'Vite & HMR' },
        { name: 'Responsive UI / CSS3' },
      ],
    },
    {
      title: 'Backend & APIs',
      icon: Server,
      color: 'from-indigo-500/20 to-purple-500/5 text-indigo-400 border-indigo-500/30',
      badge: 'Scalable Services',
      description: 'Designing RESTful architectures, server-side business logic, and reliable pipelines.',
      skills: [
        { name: 'Node.js', highlight: true },
        { name: 'Express.js', highlight: true },
        { name: 'RESTful API Architecture', highlight: true },
        { name: 'Python' },
        { name: 'JSON Parsing & Fallbacks', highlight: true },
        { name: 'Web Scraping & Extraction' },
        { name: 'Authentication & Middleware' },
        { name: 'API Integration' },
      ],
    },
    {
      title: 'AI, LLM & RAG Solutions',
      icon: BrainCircuit,
      color: 'from-amber-500/20 to-rose-500/5 text-amber-400 border-amber-500/30',
      badge: 'Intelligent Systems',
      description: 'Integrating open-source LLMs and RAG pipelines for production-grade reliability.',
      skills: [
        { name: 'Retrieval-Augmented Generation (RAG)', highlight: true },
        { name: 'Prompt Engineering', highlight: true },
        { name: 'Local LLM Deployment (Ollama)', highlight: true },
        { name: 'OpenAI SDK' },
        { name: 'Open-Source Models (Qwen, GLM)' },
        { name: 'Structured JSON Outputs' },
        { name: 'Context Optimization' },
      ],
    },
    {
      title: 'Databases & System Tools',
      icon: Database,
      color: 'from-emerald-500/20 to-teal-500/5 text-emerald-400 border-emerald-500/30',
      badge: 'Data & Infrastructure',
      description: 'Relational data modeling, ETL transformation, version control, and Linux systems.',
      skills: [
        { name: 'PostgreSQL', highlight: true },
        { name: 'Relational Database Design', highlight: true },
        { name: 'SQL Querying' },
        { name: 'Data Ingestion & ETL Pipelines', highlight: true },
        { name: 'Linux OS' },
        { name: 'Git & GitHub Version Control', highlight: true },
        { name: 'Netlify & Cloud Hosting' },
        { name: 'Postman & API Testing' },
      ],
    },
  ];

  return (
    <section id="skills" className="py-24 relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Title */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold uppercase tracking-wider mb-3">
            <Layers className="w-3.5 h-3.5" />
            Technical Stack
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Skills &amp; Capabilities
          </h2>
          <p className="mt-3 text-slate-300 text-sm sm:text-base">
            Equipped with modern full-stack development tools, database engineering, and practical AI integrations.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {skillCategories.map((cat, idx) => {
            const Icon = cat.icon;
            return (
              <div
                key={idx}
                className="glass-card rounded-2xl p-6 sm:p-7 border border-slate-800/80 bg-slate-900/60 relative overflow-hidden group"
              >
                {/* Glow backdrop */}
                <div className={`absolute top-0 right-0 w-44 h-44 rounded-full blur-3xl pointer-events-none opacity-20 bg-gradient-to-br ${cat.color}`} />

                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl border bg-slate-950/80 ${cat.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors">
                        {cat.title}
                      </h3>
                      <span className="text-xs text-slate-400 font-medium">
                        {cat.badge}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-300 mb-5 leading-relaxed">
                  {cat.description}
                </p>

                {/* Skills tags */}
                <div className="flex flex-wrap gap-2">
                  {cat.skills.map((skill, sIdx) => (
                    <span
                      key={sIdx}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        skill.highlight
                          ? 'bg-purple-950/70 text-purple-200 border border-purple-700/50 shadow-xs'
                          : 'bg-slate-950/80 text-slate-300 border border-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      {skill.highlight && (
                        <CheckCircle2 className="w-3 h-3 text-[#B497CF] shrink-0" />
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
