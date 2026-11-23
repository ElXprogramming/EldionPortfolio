import type { ComponentType } from 'react';
import {
  Code2,
  BrainCircuit,
  Database,
  CheckCircle2,
} from 'lucide-react';
import BorderGlow from './BorderGlow';

interface SkillCategory {
  title: string;
  icon: ComponentType<{ className?: string }>;
  color: string;
  glowColor: string;
  glowColors: readonly [string, string, string];
  badge: string;
  description: string;
  skills: readonly { name: string; highlight?: boolean }[];
}

const SKILL_CATEGORIES: readonly SkillCategory[] = [
  {
    title: 'Full-Stack Development',
    icon: Code2,
    color: 'from-sky-500/20 to-blue-500/5 text-sky-400 border-sky-500/30',
    glowColor: '205 90 72',
    glowColors: ['#38bdf8', '#818cf8', '#c084fc'],
    badge: 'Client & Server Systems',
    description: 'Building responsive web interfaces with React and TypeScript, backed by RESTful Node.js and Python APIs.',
    skills: [
      { name: 'TypeScript', highlight: true },
      { name: 'React', highlight: true },
      { name: 'Next.js', highlight: true },
      { name: 'Node.js', highlight: true },
      { name: 'Express.js', highlight: true },
      { name: 'Python', highlight: true },
      { name: 'FastAPI', highlight: true },
      { name: 'RESTful APIs' },
      { name: 'Tailwind CSS' },
      { name: 'Three.js (WebGL)' },
      { name: 'Vite' },
    ],
  },
  {
    title: 'Applied AI',
    icon: BrainCircuit,
    color: 'from-amber-500/20 to-rose-500/5 text-amber-400 border-amber-500/30',
    glowColor: '345 85 75',
    glowColors: ['#fbbf24', '#fb7185', '#c084fc'],
    badge: 'Inference & Retrieval',
    description: 'Integrating local model inference, retrieval pipelines, and semantic classification into software applications.',
    skills: [
      { name: 'Local Inference (Ollama)', highlight: true },
      { name: 'RAG Pipelines', highlight: true },
      { name: 'LLM API Integration', highlight: true },
      { name: 'Semantic Classification' },
      { name: 'Schema Validation (Zod)' },
    ],
  },
  {
    title: 'Databases & Systems',
    icon: Database,
    color: 'from-emerald-500/20 to-teal-500/5 text-emerald-400 border-emerald-500/30',
    glowColor: '165 80 68',
    glowColors: ['#34d399', '#2dd4bf', '#38bdf8'],
    badge: 'Data & Infrastructure',
    description: 'Relational database design, transactional storage, automated testing, and Linux development environments.',
    skills: [
      { name: 'PostgreSQL', highlight: true },
      { name: 'SQLite (WAL)', highlight: true },
      { name: 'Relational Database Design', highlight: true },
      { name: 'Git & GitHub', highlight: true },
      { name: 'ETL & Data Ingestion' },
      { name: 'Playwright' },
      { name: 'Vitest' },
      { name: 'Linux' },
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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {SKILL_CATEGORIES.map((cat, idx) => {
            const Icon = cat.icon;
            return (
              <BorderGlow
                key={cat.title}
                className={`group ${idx === 0 ? 'md:col-span-2 xl:col-span-1' : ''}`}
                innerClassName="p-6 sm:p-7 justify-between"
                backgroundColor="#111116"
                borderRadius={16}
                glowRadius={36}
                glowIntensity={0.95}
                edgeSensitivity={28}
                coneSpread={25}
                glowColor={cat.glowColor}
                colors={cat.glowColors}
                fillOpacity={0.38}
              >
                <div>
                  <div className="flex items-center gap-3 mb-4">
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

                  <p className="text-xs sm:text-sm text-zinc-300 mb-5 leading-relaxed">
                    {cat.description}
                  </p>
                </div>

                {/* Skills tags */}
                <div className="flex flex-wrap gap-2">
                  {cat.skills.map((skill) => (
                    <span
                      key={skill.name}
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
              </BorderGlow>
            );
          })}
        </div>

      </div>
    </section>
  );
}
