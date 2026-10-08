import { useState } from 'react';
import { 
  Mail, 
  Phone, 
  Download, 
  ArrowRight, 
  Check, 
  Sparkles,
  MapPin,
  GraduationCap,
  RotateCcw,
  Layers,
  BrainCircuit
} from 'lucide-react';
import { GithubIcon, LinkedinIcon } from './Icons';
import eldionPortrait from '../assets/eldion-portrait.jpg';
import FlipCard from './FlipCard';

export default function Hero() {
  const [copiedEmail, setCopiedEmail] = useState(false);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('nayrnoidle@gmail.com');
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden min-h-[660px]">
      {/* Ambient subtle glow lights for the Hero area */}
      <div className="absolute inset-0 w-full h-full pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 w-[450px] h-[450px] bg-[#B497CF]/10 rounded-full blur-[130px] pointer-events-none" />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Bio & Introduction */}
          <div className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left relative z-10">
            {/* Soft dark aura behind text for clean readability while letting pixels shine around */}
            <div className="absolute -inset-6 -z-10 bg-gradient-to-r from-[#080511]/90 via-[#080511]/60 to-transparent blur-2xl pointer-events-none rounded-3xl" />

            {/* Status pill badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-purple-500/30 text-purple-300 text-xs sm:text-sm font-medium mb-6 shadow-sm backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Software Engineering Student &amp; Full-Stack Developer</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.1] mb-6 drop-shadow-[0_2px_12px_rgba(8,5,17,0.9)]">
              Hi, I'm{' '}
              <span className="text-gradient">
                Eldion Ryan
              </span>{' '}
              Godius.
            </h1>

            {/* Core Summary */}
            <p className="text-base sm:text-lg text-slate-200 leading-relaxed mb-6 max-w-2xl drop-shadow-[0_1px_6px_rgba(8,5,17,0.9)]">
              Software engineering student eager to learn and gather new experiences through solving real-world problems. 
              Experienced in <span className="text-purple-300 font-semibold">full-stack web development</span> and 
              implementing <span className="text-[#B497CF] font-semibold">LLM solutions</span>, with strong proficiency in 
              modern JavaScript, TypeScript, CSS, SQL, and Python.
            </p>

            {/* Academic & Location Quick Badges */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 mb-8 text-xs sm:text-sm text-slate-300">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800">
                <GraduationCap className="w-4 h-4 text-purple-400" />
                <span>Universiti Malaysia Sabah</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800">
                <MapPin className="w-4 h-4 text-rose-400" />
                <span>Sabah, Malaysia</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800">
                <Sparkles className="w-4 h-4 text-[#B497CF]" />
                <span>RAG &amp; Full-Stack Builder</span>
              </div>
            </div>

            {/* Primary Action Buttons */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3.5 mb-8 w-full sm:w-auto">
              <a
                href="#projects"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-white bg-purple-600 hover:bg-purple-500 shadow-lg shadow-purple-600/30 hover:shadow-purple-600/50 transition-all duration-200 group text-sm sm:text-base w-full sm:w-auto cursor-pointer"
              >
                Explore Projects
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>

              <a
                href="/Eldion_Ryan_Godius_Resume.pdf"
                download="Eldion_Ryan_Godius_Resume.pdf"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-slate-200 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 hover:border-slate-600 transition-all duration-200 shadow-sm text-sm sm:text-base w-full sm:w-auto cursor-pointer"
              >
                <Download className="w-4 h-4 text-purple-400" />
                Download CV
              </a>
            </div>

            {/* Social Links & Direct Contacts */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5 pt-4 border-t border-slate-800/80 w-full">
              <span className="text-xs uppercase font-bold tracking-wider text-slate-300 mr-2">
                Connect:
              </span>

              <a
                href="https://github.com/ElXprogramming"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/70 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs font-medium text-slate-300 hover:text-white transition-colors"
              >
                <GithubIcon className="w-3.5 h-3.5 text-purple-400" />
                GitHub
              </a>

              <a
                href="https://www.linkedin.com/in/eldion-ryan-godius-897064235"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/70 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs font-medium text-slate-300 hover:text-white transition-colors"
              >
                <LinkedinIcon className="w-3.5 h-3.5 text-[#B497CF]" />
                LinkedIn
              </a>

              <button
                onClick={handleCopyEmail}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/70 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs font-medium text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Click to copy email"
              >
                {copiedEmail ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Mail className="w-3.5 h-3.5 text-rose-400" />
                    <span>nayrnoidle@gmail.com</span>
                  </>
                )}
              </button>

              <a
                href="tel:0178201365"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/70 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs font-medium text-slate-300 hover:text-white transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                <span>017-820 1365</span>
              </a>
            </div>

          </div>

          {/* Right Column: Interactive 3D FlipCard with Portrait & Info */}
          <div className="lg:col-span-5 flex justify-center items-center">
            <div className="relative group">
              {/* Outer decorative ambient glow ring behind card */}
              <div className="absolute -inset-2 bg-gradient-to-r from-purple-600/30 via-[#B497CF]/25 to-indigo-600/30 rounded-[30px] blur-xl opacity-75 group-hover:opacity-100 transition duration-500 pointer-events-none" />

              <FlipCard
                axis="y"
                flipOnClick
                draggable
                tilt
                tiltMax={14}
                glare
                glareOpacity={0.28}
                hoverScale={1.03}
                perspective={1100}
                stiffness={180}
                damping={20}
                width={340}
                height={460}
                radius={24}
                background="#0d0818"
                color="#f8fafc"
                shadow
                shadowColor="#a855f7"
                shadowOpacity={0.35}
                ariaLabel="Eldion Ryan Godius 3D Profile Card"
                front={
                  <div className="relative w-full h-full flex flex-col justify-between p-4.5 select-none overflow-hidden">
                    {/* Portrait Photo */}
                    <img
                      src={eldionPortrait}
                      alt="Eldion Ryan Godius"
                      className="absolute inset-0 w-full h-full object-cover object-top filter brightness-[1.02] contrast-[1.03]"
                      draggable={false}
                    />
                    
                    {/* Cinematic vignettes for maximum contrast and aesthetics */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#080511] via-[#080511]/30 to-[#080511]/20 pointer-events-none" />

                    {/* Top corner pills */}
                    <div className="relative z-10 flex items-center justify-between w-full">
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#080511]/75 backdrop-blur-md border border-purple-500/30 text-[11px] text-purple-200 font-medium shadow-md">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span>Software Engineer</span>
                      </div>

                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#080511]/75 backdrop-blur-md border border-purple-500/30 text-[10px] text-purple-300 font-semibold tracking-wider uppercase shadow-md">
                        <RotateCcw className="w-3 h-3 text-[#B497CF]" />
                        <span>Flip 3D</span>
                      </div>
                    </div>

                    {/* Bottom identity plaque */}
                    <div className="relative z-10 p-3.5 rounded-2xl bg-[#080511]/85 backdrop-blur-md border border-purple-500/25 shadow-2xl">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-base font-bold text-white tracking-wide">
                            Eldion Ryan Godius
                          </h3>
                          <p className="text-[11px] text-[#B497CF] font-medium mt-0.5">
                            B.CompSc (Software Engineering) • UMS
                          </p>
                        </div>
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-purple-500/20 flex items-center justify-between text-[10px] text-slate-300">
                        <span className="flex items-center gap-1 text-purple-300">
                          <Sparkles className="w-3 h-3 text-[#B497CF]" />
                          Full-Stack &amp; AI Solns
                        </span>
                        <span className="text-slate-400">Drag or click to turn →</span>
                      </div>
                    </div>
                  </div>
                }
                back={
                  <div className="relative w-full h-full flex flex-col justify-between p-5 select-none bg-gradient-to-b from-[#130b24] via-[#0d0718] to-[#080511] border border-purple-500/30 rounded-[24px] overflow-hidden text-left">
                    {/* Atmospheric glow inside back face */}
                    <div className="absolute -top-12 -right-12 w-44 h-44 bg-purple-600/20 rounded-full blur-2xl pointer-events-none" />
                    <div className="absolute -bottom-12 -left-12 w-44 h-44 bg-indigo-600/20 rounded-full blur-2xl pointer-events-none" />

                    <div>
                      {/* Card Header */}
                      <div className="flex items-center justify-between pb-3 border-b border-purple-500/20">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center font-bold text-sm text-purple-200">
                            EG
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-white">Eldion Ryan Godius</h4>
                            <p className="text-[10px] text-purple-300">Developer Profile &amp; Focus</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 text-[10px] text-purple-300 bg-purple-950/60 px-2 py-1 rounded-md border border-purple-700/40 font-medium">
                          <RotateCcw className="w-3 h-3 text-[#B497CF]" />
                          <span>Flip</span>
                        </div>
                      </div>

                      {/* Bio & Education highlights */}
                      <div className="space-y-2.5 mt-3.5 text-xs">
                        <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                          <div className="flex items-center gap-1.5 text-purple-300 font-semibold mb-0.5 text-[11px]">
                            <GraduationCap className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                            <span>Universiti Malaysia Sabah</span>
                          </div>
                          <p className="text-[10px] text-slate-300 leading-snug">
                            B.CompSc (Software Engineering) • 2023–Present
                          </p>
                        </div>

                        <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                          <div className="flex items-center gap-1.5 text-[#B497CF] font-semibold mb-0.5 text-[11px]">
                            <Layers className="w-3.5 h-3.5 text-[#B497CF] shrink-0" />
                            <span>Full-Stack Engineering</span>
                          </div>
                          <p className="text-[10px] text-slate-300 leading-snug">
                            React, TypeScript, Node.js, PostgreSQL, Tailwind, REST APIs
                          </p>
                        </div>

                        <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                          <div className="flex items-center gap-1.5 text-amber-300 font-semibold mb-0.5 text-[11px]">
                            <BrainCircuit className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span>AI &amp; RAG Systems</span>
                          </div>
                          <p className="text-[10px] text-slate-300 leading-snug">
                            RAG pipelines, Ollama local models (Qwen, GLM), JSON schemas
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Quick stats mini-bar & direct info */}
                    <div className="pt-3 border-t border-purple-500/20">
                      <div className="grid grid-cols-3 gap-1.5 text-center mb-2.5">
                        <div className="p-1.5 rounded-lg bg-slate-950/90 border border-purple-500/20">
                          <div className="text-xs font-bold text-white">2023+</div>
                          <div className="text-[9px] text-purple-300 uppercase tracking-wider">UMS SE</div>
                        </div>
                        <div className="p-1.5 rounded-lg bg-slate-950/90 border border-purple-500/20">
                          <div className="text-xs font-bold text-[#B497CF]">Full Stack</div>
                          <div className="text-[9px] text-slate-300 uppercase tracking-wider">Focus</div>
                        </div>
                        <div className="p-1.5 rounded-lg bg-slate-950/90 border border-purple-500/20">
                          <div className="text-xs font-bold text-emerald-400">RAG / AI</div>
                          <div className="text-[9px] text-slate-300 uppercase tracking-wider">Solns</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 px-1">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-rose-400" />
                          Sabah, Malaysia
                        </span>
                        <span className="text-[#B497CF] font-medium">nayrnoidle@gmail.com</span>
                      </div>
                    </div>
                  </div>
                }
              />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
