import { useState } from 'react';
import { 
  Mail, 
  Phone, 
  Download, 
  ArrowRight, 
  Check, 
  Sparkles,
  MapPin,
  GraduationCap
} from 'lucide-react';
import { GithubIcon, LinkedinIcon } from './Icons';
import eldionAvatar from '../assets/eldion.png';

export default function Hero() {
  const [copiedEmail, setCopiedEmail] = useState(false);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('nayrnoidle@gmail.com');
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
      {/* Background radial glow accents */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-indigo-600/15 rounded-full blur-[130px] pointer-events-none -z-10" />
      <div className="absolute top-1/3 left-1/4 w-[350px] h-[350px] bg-sky-500/10 rounded-full blur-[110px] pointer-events-none -z-10" />
      <div className="absolute top-1/2 right-1/4 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* Decorative background grid */}
      <div className="absolute inset-0 bg-grid-pattern opacity-40 pointer-events-none -z-10" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Bio & Introduction */}
          <div className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left">
            
            {/* Status pill badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-indigo-500/30 text-indigo-300 text-xs sm:text-sm font-medium mb-6 shadow-sm backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Software Engineering Student &amp; Full-Stack Developer</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.1] mb-6">
              Hi, I'm{' '}
              <span className="text-gradient">
                Eldion Ryan
              </span>{' '}
              Godius.
            </h1>

            {/* Core Summary */}
            <p className="text-base sm:text-lg text-slate-300 leading-relaxed mb-6 max-w-2xl">
              Software engineering student eager to learn and gather new experiences through solving real-world problems. 
              Experienced in <span className="text-indigo-400 font-semibold">full-stack web development</span> and 
              implementing <span className="text-sky-400 font-semibold">LLM solutions</span>, with strong proficiency in 
              modern JavaScript, TypeScript, CSS, SQL, and Python.
            </p>

            {/* Academic & Location Quick Badges */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 mb-8 text-xs sm:text-sm text-slate-300">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800">
                <GraduationCap className="w-4 h-4 text-indigo-400" />
                <span>Universiti Malaysia Sabah</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800">
                <MapPin className="w-4 h-4 text-rose-400" />
                <span>Sabah, Malaysia</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>RAG &amp; Full-Stack Builder</span>
              </div>
            </div>

            {/* Primary Action Buttons */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3.5 mb-8 w-full sm:w-auto">
              <a
                href="#projects"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 transition-all duration-200 group text-sm sm:text-base w-full sm:w-auto"
              >
                Explore Projects
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>

              <a
                href="/Eldion_Ryan_Godius_Resume.pdf"
                download="Eldion_Ryan_Godius_Resume.pdf"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-slate-200 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 hover:border-slate-600 transition-all duration-200 shadow-sm text-sm sm:text-base w-full sm:w-auto"
              >
                <Download className="w-4 h-4 text-indigo-400" />
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
                <GithubIcon className="w-3.5 h-3.5 text-indigo-400" />
                GitHub
              </a>

              <a
                href="https://www.linkedin.com/in/eldion-ryan-godius-897064235"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/70 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs font-medium text-slate-300 hover:text-white transition-colors"
              >
                <LinkedinIcon className="w-3.5 h-3.5 text-sky-400" />
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

          {/* Right Column: High-Res Profile Card */}
          <div className="lg:col-span-5 flex justify-center items-center">
            <div className="relative group max-w-[340px] sm:max-w-[380px] w-full">
              
              {/* Outer decorative ambient glow ring */}
              <div className="absolute -inset-1.5 bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 rounded-3xl blur-xl opacity-60 group-hover:opacity-85 transition duration-700 group-hover:duration-300"></div>

              {/* Main Card Shell */}
              <div className="relative rounded-3xl bg-slate-900/90 border border-slate-700/60 p-4 sm:p-5 shadow-2xl backdrop-blur-xl">
                
                {/* Photo frame with rounded corners and gradient border */}
                <div className="relative aspect-[4/4.5] w-full overflow-hidden rounded-2xl bg-slate-950 border border-slate-800">
                  <img
                    src={eldionAvatar}
                    alt="Eldion Ryan Godius"
                    className="w-full h-full object-cover object-top filter brightness-[1.02] contrast-[1.03] transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent"></div>
                  
                  {/* Floating badge inside photo */}
                  <div className="absolute bottom-3 left-3 right-3 p-3 rounded-xl bg-slate-950/80 backdrop-blur-md border border-slate-800/80">
                    <p className="text-xs font-bold text-white tracking-wide">
                      Eldion Ryan Godius
                    </p>
                    <p className="text-[11px] text-indigo-300 font-medium">
                      B.CompSc (Software Engineering) • UMS
                    </p>
                  </div>
                </div>

                {/* Quick stats mini-bar */}
                <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-800/80 text-center">
                  <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/50">
                    <div className="text-base font-bold text-white">2023+</div>
                    <div className="text-[10px] text-slate-300 font-medium uppercase tracking-wider">UMS SE</div>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/50">
                    <div className="text-base font-bold text-indigo-400">Full Stack</div>
                    <div className="text-[10px] text-slate-300 font-medium uppercase tracking-wider">Focus</div>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/50">
                    <div className="text-base font-bold text-sky-400">LLM &amp; RAG</div>
                    <div className="text-[10px] text-slate-300 font-medium uppercase tracking-wider">AI Solns</div>
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
