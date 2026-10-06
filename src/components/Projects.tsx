import { 
  ExternalLink, 
  Sparkles, 
  CheckCircle2, 
  Clock
} from 'lucide-react';
import { GithubIcon } from './Icons';
import declaraformImg from '../assets/projects/declaraform-preview.jpg';

export default function Projects() {
  return (
    <section id="projects" className="py-24 relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Featured Work
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Projects &amp; Applications
          </h2>
          <p className="mt-3 text-slate-300 text-sm sm:text-base">
            Production-ready software built to solve real-world problems with modern web technologies.
          </p>
        </div>

        {/* Flagship Project: Declaraform */}
        <div className="glass-card rounded-2xl overflow-hidden border border-slate-800/80 bg-slate-900/60 transition-all duration-300 hover:border-indigo-500/40 hover:shadow-2xl hover:shadow-indigo-500/5 group mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
            
            {/* Visual Preview Column */}
            <div className="lg:col-span-6 relative bg-slate-950 flex flex-col justify-center items-center overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-800/80 min-h-[300px] lg:min-h-full">
              <div className="relative w-full h-full min-h-[300px] group-hover:scale-105 transition-transform duration-500 ease-out">
                <img
                  src={declaraformImg}
                  alt="Declaraform Preview"
                  className="w-full h-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-slate-950/40" />
                
                {/* Floating badge inside visual */}
                <div className="absolute top-4 right-4">
                  <a
                    href="https://declaraform.netlify.app/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600/90 text-white text-xs font-semibold shadow-lg backdrop-blur-md hover:bg-indigo-500 transition-colors"
                  >
                    <span>Visit Live Site</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                <div className="absolute bottom-4 left-4 right-4 p-3.5 rounded-xl bg-slate-950/80 backdrop-blur-md border border-slate-800/80 hidden sm:block">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium">Domain: declaraform.netlify.app</span>
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      Online
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Details Column */}
            <div className="lg:col-span-6 p-6 sm:p-9 flex flex-col justify-between">
              <div>
                {/* Top Badge */}
                <div className="flex flex-wrap items-center gap-2.5 mb-3">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold border border-emerald-500/40 text-emerald-400 bg-emerald-500/10">
                    Live Production App
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold border border-sky-500/40 text-sky-400 bg-sky-500/10">
                    Interactive WebGL
                  </span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight group-hover:text-indigo-300 transition-colors">
                  Declaraform
                </h3>
                
                <p className="text-sm font-semibold text-indigo-400/90 mb-4">
                  Automated UMS Declaration Form PDF Generator
                </p>

                <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-6">
                  A system built for Universiti Malaysia Sabah students that accepts structured user input and automatically parses it into official, print-ready declaration PDFs. Eliminates the extra manual labor of transforming static PDF templates into editable files, paired with a playful interactive 3D background.
                </p>

                {/* Key Highlights */}
                <div className="mb-6 space-y-2.5">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                    Key Engineering Features:
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                      <span>Instant client-side PDF synthesis with <code>pdf-lib</code></span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                      <span>Interactive 3D WebGL canvas with Three.js</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                      <span>In-browser digital signature drawing canvas</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                      <span>Multi-student group declaration form mode</span>
                    </div>
                  </div>
                </div>

                {/* Technologies */}
                <div className="flex flex-wrap gap-1.5 mb-8">
                  {[
                    'React.js',
                    'Tailwind CSS',
                    'WebGL (Three.js)',
                    'HTML Canvas',
                    'pdf-lib',
                    'Vite',
                    'Netlify'
                  ].map((tech) => (
                    <span
                      key={tech}
                      className="px-2.5 py-1 rounded-md bg-slate-800/90 text-slate-300 border border-slate-700/60 text-xs font-mono"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-5 border-t border-slate-800/80">
                <a
                  href="https://declaraform.netlify.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/25 transition-all duration-200"
                >
                  <ExternalLink className="w-4 h-4" />
                  Launch Application
                </a>

                <a
                  href="https://github.com/ElXprogramming/declaration-form-filler"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-xs sm:text-sm text-slate-200 bg-slate-800/90 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 transition-colors"
                >
                  <GithubIcon className="w-4 h-4 text-slate-300" />
                  View Source Code
                </a>
              </div>

            </div>

          </div>
        </div>

        {/* Future / In Development Callout Card */}
        <div className="p-6 sm:p-7 rounded-2xl bg-slate-900/40 border border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm sm:text-base font-bold text-white">
                More Projects Under Active Development
              </h4>
              <p className="text-xs sm:text-sm text-slate-300">
                Currently exploring new applications in full-stack web engineering, local AI pipelines, and student productivity tools.
              </p>
            </div>
          </div>
          
          <a
            href="https://github.com/ElXprogramming"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 transition-colors shrink-0"
          >
            <GithubIcon className="w-4 h-4 text-indigo-400" />
            <span>Follow on GitHub</span>
          </a>
        </div>

      </div>
    </section>
  );
}
