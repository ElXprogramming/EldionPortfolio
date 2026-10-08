import { 
  User, 
  Code, 
  Lightbulb, 
  Rocket, 
  CheckCircle2 
} from 'lucide-react';

export default function About() {
  const coreValues = [
    {
      icon: Code,
      title: 'Full-Stack Engineering',
      desc: 'Crafting responsive client interfaces with React and robust backend APIs with Node.js and PostgreSQL.',
    },
    {
      icon: Lightbulb,
      title: 'Pragmatic AI & LLMs',
      desc: 'Implementing practical AI features — from local open-source models (Qwen, GLM) to RAG and deterministic JSON workflows.',
    },
    {
      icon: Rocket,
      title: 'Real-World Impact',
      desc: 'Building tools that eliminate everyday user friction, such as automated academic PDF generators and diet assistants.',
    },
  ];

  return (
    <section id="about" className="py-24 relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold uppercase tracking-wider mb-3">
            <User className="w-3.5 h-3.5" />
            Background &amp; Philosophy
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            About Eldion
          </h2>
          <p className="mt-3 text-slate-300 text-sm sm:text-base">
            Software engineering student with a drive for creating intuitive tools and exploring emerging technologies.
          </p>
        </div>

        {/* Narrative & Value Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Narrative Box */}
          <div className="lg:col-span-7 glass-panel rounded-2xl p-7 sm:p-9 border border-slate-800/80 shadow-xl">
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-4">
              Turning Ideas into High-Quality Software
            </h3>
            
            <div className="space-y-4 text-slate-300 text-sm sm:text-base leading-relaxed">
              <p>
                I am a Software Engineering student at <span className="text-white font-medium">Universiti Malaysia Sabah</span> with a passion for software design, modern web architectures, and intelligent systems.
              </p>
              
              <p>
                My journey centers around practical, hands-on building: from engineering 
                <span className="text-purple-400 font-medium"> Declaraform</span> to eliminate the friction of manual academic PDF editing for university peers, to implementing modern full-stack web applications and intelligent data-driven solutions.
              </p>

              <p>
                I prioritize writing maintainable, clean code with TypeScript, structuring resilient relational databases with PostgreSQL, and deploying user-centric experiences. I thrive on collaborating, learning fast, and delivering solutions that people genuinely enjoy using.
              </p>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-800/80 flex flex-wrap gap-4 text-xs font-medium text-slate-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Fast Learner &amp; Adaptable</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Modern Web &amp; AI Stack</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Collaborative Team Player</span>
              </div>
            </div>
          </div>

          {/* Right Core Pillars */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            {coreValues.map((val, idx) => {
              const Icon = val.icon;
              return (
                <div
                  key={idx}
                  className="glass-card rounded-2xl p-5 border border-slate-800/80 bg-slate-900/60 transition-all hover:border-purple-500/40"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="p-2.5 rounded-xl bg-purple-600/20 text-purple-300 border border-purple-500/30 shrink-0 mt-0.5">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-white mb-1">
                        {val.title}
                      </h4>
                      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                        {val.desc}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>

      </div>
    </section>
  );
}
