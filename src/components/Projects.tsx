import { useState } from 'react';
import { 
  ExternalLink, 
  Sparkles, 
  CheckCircle2, 
  Layers, 
  Cpu, 
  Database, 
  FileText
} from 'lucide-react';
import { GithubIcon } from './Icons';
import declaraformImg from '../assets/projects/declaraform-preview.jpg';

interface Project {
  id: string;
  title: string;
  tagline: string;
  category: 'all' | 'fullstack-ai' | 'frontend';
  badge: string;
  badgeColor: string;
  image?: string;
  icon?: React.ComponentType<{ className?: string }>;
  description: string;
  highlights: string[];
  technologies: string[];
  liveUrl?: string;
  githubUrl: string;
}

export default function Projects() {
  const [filter, setFilter] = useState<'all' | 'fullstack-ai' | 'frontend'>('all');

  const projects: Project[] = [
    {
      id: 'declaraform',
      title: 'Declaraform',
      tagline: 'Interactive UMS Declaration Form PDF Generator',
      category: 'frontend',
      badge: 'Live Production App',
      badgeColor: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10',
      image: declaraformImg,
      description:
        'A web system built for Universiti Malaysia Sabah students that accepts structured user input and automatically parses it into official, print-ready declaration PDFs. Eliminates manual document conversion hurdles and features an engaging, interactive 3D WebGL background.',
      highlights: [
        'Instant client-side PDF document synthesis using pdf-lib',
        'Interactive 3D WebGL canvas background built with Three.js',
        'Digital signature pad for hassle-free mobile & desktop signing',
        'Dynamic multi-member student team declaration forms',
      ],
      technologies: [
        'React.js',
        'Tailwind CSS',
        'WebGL (Three.js)',
        'HTML Canvas',
        'pdf-lib',
        'Vite',
        'Netlify'
      ],
      liveUrl: 'https://declaraform.netlify.app/',
      githubUrl: 'https://github.com/ElXprogramming/declaration-form-filler',
    },
    {
      id: 'dailymenu',
      title: 'DailyMenu',
      tagline: 'AI-Powered Nutritional Diet & Restaurant Recommendation Engine',
      category: 'fullstack-ai',
      badge: 'Full-Stack & RAG LLM',
      badgeColor: 'border-sky-500/40 text-sky-400 bg-sky-500/10',
      icon: Cpu,
      description:
        'An intelligent diet planner that matches a user\'s macro/calorie targets with dishes from local restaurants. Powered by a custom Retrieval-Augmented Generation (RAG) pipeline running local LLMs (Qwen, GLM) with JSON parsing fallbacks and a structured PostgreSQL relational database.',
      highlights: [
        'Local LLM deployment via Ollama (Qwen, GLM) with OpenAI SDK compatibility',
        'Retrieval-Augmented Generation (RAG) with strict JSON schema parsing fallback',
        'Automated web scraping & ETL pipeline ingesting real restaurant menus',
        'Relational PostgreSQL database architecture with nutritional metadata',
      ],
      technologies: [
        'React.js',
        'Node.js',
        'Express.js',
        'PostgreSQL',
        'RAG Pipeline',
        'Local LLM (Qwen, GLM)',
        'Ollama',
        'OpenAI SDK',
        'ETL / Web Scraping'
      ],
      githubUrl: 'https://github.com/ElXprogramming/daily-menu-app',
    },
    {
      id: 'haiwango',
      title: 'HaiwanGo',
      tagline: 'Interactive Pet & Animal Platform',
      category: 'frontend',
      badge: 'Modern Web Application',
      badgeColor: 'border-purple-500/40 text-purple-400 bg-purple-500/10',
      icon: Layers,
      description:
        'A responsive web application crafted to explore modern component architecture, TypeScript typing, and intuitive UX patterns for pet care and community discovery.',
      highlights: [
        'Modular, maintainable React and TypeScript component architecture',
        'Fast HMR and bundling configured with Vite',
        'Modern mobile-first responsive layout styling',
        'Clean client-side state handling and UI feedback states',
      ],
      technologies: [
        'React.js',
        'TypeScript',
        'Vite',
        'CSS Architecture',
        'Git & GitHub'
      ],
      githubUrl: 'https://github.com/ElXprogramming/HaiwanGo',
    },
  ];

  const filteredProjects = projects.filter(
    (p) => filter === 'all' || p.category === filter
  );

  return (
    <section id="projects" className="py-24 relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              Featured Work
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Crafted with Precision &amp; Code
            </h2>
            <p className="mt-2 text-slate-300 text-base max-w-xl">
              Real projects tackling real workflows — from automating academic paperwork with WebGL to running local AI nutrition planners.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-900/80 border border-slate-800 rounded-xl backdrop-blur-md self-start md:self-auto">
            <button
              onClick={() => setFilter('all')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filter === 'all'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({projects.length})
            </button>
            <button
              onClick={() => setFilter('fullstack-ai')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filter === 'fullstack-ai'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Full-Stack &amp; AI
            </button>
            <button
              onClick={() => setFilter('frontend')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filter === 'frontend'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Frontend &amp; WebGL
            </button>
          </div>
        </div>

        {/* Project Cards Grid */}
        <div className="space-y-10">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              className="glass-card rounded-2xl overflow-hidden border border-slate-800/80 bg-slate-900/60 transition-all duration-300 hover:border-slate-700 hover:shadow-2xl hover:shadow-indigo-500/5 group"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
                
                {/* Visual / Preview Column */}
                <div className="lg:col-span-5 relative bg-slate-950 flex flex-col justify-center items-center overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-800/80 min-h-[260px] lg:min-h-full">
                  {project.image ? (
                    <div className="relative w-full h-full min-h-[260px] group-hover:scale-105 transition-transform duration-500 ease-out">
                      <img
                        src={project.image}
                        alt={project.title}
                        className="w-full h-full object-cover object-center"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/30" />
                      
                      {project.liveUrl && (
                        <div className="absolute top-4 right-4">
                          <a
                            href={project.liveUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/90 text-white text-xs font-semibold border border-slate-700/80 shadow-md backdrop-blur-md hover:bg-indigo-600 transition-colors"
                          >
                            <span>Live App</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Tech Architecture Graphic for projects without screenshot */
                    <div className="w-full h-full p-8 flex flex-col justify-center items-center relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/40">
                      <div className="absolute -top-12 -left-12 w-48 h-48 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>
                      <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
                      
                      <div className="relative z-10 w-full max-w-sm space-y-3">
                        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/90 border border-slate-800 shadow-sm">
                          <div className="flex items-center gap-2.5">
                            <div className="p-2 rounded-lg bg-sky-500/20 text-sky-400">
                              <Cpu className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="text-xs font-bold text-white">Local LLM (Qwen / GLM)</div>
                              <div className="text-[11px] text-slate-300">Ollama &amp; OpenAI SDK Pipeline</div>
                            </div>
                          </div>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            Active
                          </span>
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/90 border border-slate-800 shadow-sm">
                          <div className="flex items-center gap-2.5">
                            <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
                              <Database className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="text-xs font-bold text-white">PostgreSQL &amp; ETL</div>
                              <div className="text-[11px] text-slate-300">Nutritional Menu Catalogs</div>
                            </div>
                          </div>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/20 text-sky-400 border border-sky-500/30">
                            RAG
                          </span>
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/90 border border-slate-800 shadow-sm">
                          <div className="flex items-center gap-2.5">
                            <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400">
                              <FileText className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="text-xs font-bold text-white">Robust JSON Fallback</div>
                              <div className="text-[11px] text-slate-300">100% Deterministic Output</div>
                            </div>
                          </div>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 border border-purple-500/30">
                            Safe
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Details Column */}
                <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between">
                  <div>
                    {/* Top Tag & Title */}
                    <div className="flex flex-wrap items-center gap-2.5 mb-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${project.badgeColor}`}>
                        {project.badge}
                      </span>
                    </div>

                    <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight group-hover:text-indigo-300 transition-colors">
                      {project.title}
                    </h3>
                    
                    <p className="text-sm font-medium text-indigo-400/90 mb-4">
                      {project.tagline}
                    </p>

                    <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-6">
                      {project.description}
                    </p>

                    {/* Key Engineering Highlights */}
                    <div className="mb-6 space-y-2">
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                        Key Engineering Highlights:
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {project.highlights.map((highlight, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs text-slate-300">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                            <span>{highlight}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Technology Pills */}
                    <div className="flex flex-wrap gap-1.5 mb-6">
                      {project.technologies.map((tech) => (
                        <span
                          key={tech}
                          className="px-2.5 py-1 rounded-md bg-slate-800/90 text-slate-300 border border-slate-700/60 text-xs font-mono"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions / Buttons */}
                  <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-800/80">
                    {project.liveUrl && (
                      <a
                        href={project.liveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/20 transition-all duration-200"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Live Demo
                      </a>
                    )}

                    <a
                      href={project.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-xs sm:text-sm text-slate-200 bg-slate-800/90 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 transition-colors"
                    >
                      <GithubIcon className="w-4 h-4 text-slate-300" />
                      View Repository
                    </a>
                  </div>

                </div>

              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
