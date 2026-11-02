import { 
  ExternalLink, 
  Sparkles, 
  CheckCircle2, 
  Clock
} from 'lucide-react';
import { GithubIcon } from './Icons';
import GithubContributions from './GithubContributions';
import declaraformImg from '../assets/projects/declaraform-preview.jpg';
import doomscrollImg from '../assets/projects/doomscroll-preview.jpg';
import gymposeImg from '../assets/projects/gympose-preview.jpg';
import neurosortImg from '../assets/projects/neurosort-preview.png';
import { EXTERNAL_LINKS } from '../lib/constants';

interface ProjectFeature {
  label: string;
  codeSnippet?: string;
  suffix?: string;
}

interface ProjectBadge {
  label: string;
  className: string;
}

interface ProjectItem {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  accentHoverBorder: string;
  accentHoverShadow: string;
  titleHoverColor: string;
  subtitleColor: string;
  badges: readonly ProjectBadge[];
  domainBadge: {
    label: string;
    status: string;
    isOnline: boolean;
  };
  image: string;
  imageAlt: string;
  liveUrl?: string;
  githubUrl: string;
  features: readonly ProjectFeature[];
  technologies: readonly string[];
}

const PROJECTS_DATA: readonly ProjectItem[] = [
  {
    id: 'neurosort',
    title: 'NeuroSort',
    subtitle: 'Autonomous Local-First File Organization Daemon Powered by Ollama',
    description:
      'A local-first, safe, and intelligent automatic file management daemon and CLI powered by Ollama (Llama 3.2 / Phi 3.5). Features a built-in local web dashboard with a read-only "Future Sight" explorer that extracts metadata from documents, images (EXIF), and code to simulate destinations before moving, accompanied by an audit-grade SQLite WAL ledger guaranteeing instant transaction rollback and zero data loss.',
    accentHoverBorder: 'hover:border-indigo-500/40',
    accentHoverShadow: 'hover:shadow-indigo-500/10',
    titleHoverColor: 'group-hover:text-indigo-300',
    subtitleColor: 'text-indigo-300',
    badges: [
      {
        label: 'Open Source Daemon & CLI',
        className: 'border-indigo-500/40 text-indigo-400 bg-indigo-500/10',
      },
      {
        label: 'Local LLMs & SQLite WAL',
        className: 'border-purple-500/40 text-purple-300 bg-purple-500/10',
      },
    ],
    domainBadge: {
      label: 'Localhost: 127.0.0.1:8765',
      status: 'Local Daemon',
      isOnline: true,
    },
    image: neurosortImg,
    imageAlt: 'NeuroSort Future Sight Dashboard Preview',
    githubUrl: EXTERNAL_LINKS.neurosortRepo,
    features: [
      { label: 'Read-only "Future Sight" explorer to simulate destinations risk-free' },
      { label: 'Semantic classification via Ollama local LLMs with taxonomy overrides' },
      { label: 'Audit-grade SQLite3 WAL transaction ledger with atomic 1-click rollback' },
      { label: 'Streaming SHA-256 chunk hashing & non-blocking intake directory daemon' },
    ],
    technologies: [
      'Python 3.11+',
      'Ollama (Llama 3.2)',
      'FastAPI',
      'SQLite3 (WAL)',
      'Watchdog Daemon',
      'HTML5 Canvas',
      'Pytest',
    ],
  },
  {
    id: 'declaraform',
    title: 'Declaraform',
    subtitle: 'Automated UMS Declaration Form PDF Generator',
    description:
      'A specialized system engineered for Universiti Malaysia Sabah Computer Science students in FKI KK (Faculty of Computing and Informatics, Kota Kinabalu). Accepts structured student inputs and automatically parses them into official, print-ready declaration PDFs. Eliminates the extra manual labor of transforming static PDF templates into editable files, paired with a playful interactive 3D WebGL background.',
    accentHoverBorder: 'hover:border-purple-500/40',
    accentHoverShadow: 'hover:shadow-purple-500/10',
    titleHoverColor: 'group-hover:text-purple-300',
    subtitleColor: 'text-purple-300',
    badges: [
      {
        label: 'Live Production App',
        className: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10',
      },
      {
        label: 'Interactive WebGL',
        className: 'border-sky-500/40 text-sky-400 bg-sky-500/10',
      },
    ],
    domainBadge: {
      label: 'Domain: declaraform.netlify.app',
      status: 'Online',
      isOnline: true,
    },
    image: declaraformImg,
    imageAlt: 'Declaraform Application Preview',
    liveUrl: EXTERNAL_LINKS.declaraformLive,
    githubUrl: EXTERNAL_LINKS.declaraformRepo,
    features: [
      { label: 'Instant client-side PDF synthesis with', codeSnippet: 'pdf-lib' },
      { label: 'Interactive 3D WebGL canvas with', codeSnippet: 'Three.js' },
      { label: 'In-browser digital signature drawing canvas' },
      { label: 'Multi-student group declaration form generation' },
    ],
    technologies: [
      'React.js',
      'Tailwind CSS',
      'WebGL (Three.js)',
      'HTML Canvas',
      'pdf-lib',
      'Vite',
      'Netlify',
    ],
  },
  {
    id: 'doomscroll-siren',
    title: 'Doomscroll Siren',
    subtitle: 'Autonomous Webcam Doomscroll Sentry & Web Audio Siren',
    description:
      'An autonomous, privacy-first computer vision sentry that monitors your workspace via webcam to detect smartphone doomscrolling. Leverages YOLO11n running on ONNX Runtime Web with WebGPU acceleration. If exposure exceeds the duration threshold (default: 10s), a piercing dual-oscillator tactical Web Audio siren and crimson alert trigger to break the scroll cycle—with zero video frames ever leaving the browser.',
    accentHoverBorder: 'hover:border-rose-500/40',
    accentHoverShadow: 'hover:shadow-rose-500/10',
    titleHoverColor: 'group-hover:text-rose-300',
    subtitleColor: 'text-rose-300',
    badges: [
      {
        label: 'Live Production App',
        className: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10',
      },
      {
        label: 'Client-Side AI (WebGPU)',
        className: 'border-rose-500/40 text-rose-400 bg-rose-500/10',
      },
    ],
    domainBadge: {
      label: 'Domain: doomscroll-siren.netlify.app',
      status: 'Online',
      isOnline: true,
    },
    image: doomscrollImg,
    imageAlt: 'Doomscroll Siren Application Preview',
    liveUrl: EXTERNAL_LINKS.doomscrollSirenLive,
    githubUrl: EXTERNAL_LINKS.doomscrollSirenRepo,
    features: [
      { label: 'Client-side neural inference with', codeSnippet: 'ONNX Runtime Web' },
      { label: 'Embedded YOLO11n model with direct NMS bounding box evaluation' },
      { label: 'Anti-flicker grace buffer preventing false drops on occlusions' },
      { label: 'Dual-oscillator Web Audio synthesizer with LFO siren modulation' },
    ],
    technologies: [
      'React 19',
      'TypeScript',
      'ONNX Runtime Web',
      'YOLO11n',
      'WebGPU',
      'Web Audio API',
      'Tailwind CSS',
      'Vite',
      'Netlify',
    ],
  },
  {
    id: 'gymposecamera',
    title: 'GymPoseCamera (AuraCam)',
    subtitle: 'Real-Time AI Bodybuilding Pose Recognition & Shader Pipeline',
    description:
      'A mobile-first real-time camera web application engineered to detect iconic bodybuilding poses (Front Double Bicep, Zyzz/Archer pose, Lat Spread) using MediaPipe Pose WebAssembly. Upon pose detection, it dynamically shifts into an angelic divine aura powered by a custom multi-pass WebGL post-processing shader with bloom and halation, synchronized with a real-time Web Audio API harmonic swell.',
    accentHoverBorder: 'hover:border-amber-500/40',
    accentHoverShadow: 'hover:shadow-amber-500/10',
    titleHoverColor: 'group-hover:text-amber-300',
    subtitleColor: 'text-amber-300',
    badges: [
      {
        label: 'Live Production App',
        className: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10',
      },
      {
        label: 'MediaPipe & WebGL Shaders',
        className: 'border-amber-500/40 text-amber-400 bg-amber-500/10',
      },
    ],
    domainBadge: {
      label: 'Domain: gymposecamera.vercel.app',
      status: 'Online',
      isOnline: true,
    },
    image: gymposeImg,
    imageAlt: 'GymPoseCamera AuraCam Web App Preview',
    liveUrl: EXTERNAL_LINKS.gymposeCameraLive,
    githubUrl: EXTERNAL_LINKS.gymposeCameraRepo,
    features: [
      { label: 'Real-time geometric joint angle calculation with', codeSnippet: 'MediaPipe WASM' },
      { label: 'Custom WebGL post-processing shader with luminance diffusion bloom' },
      { label: 'Dynamic Web Audio filter sweep and harmonic volume swell' },
      { label: 'In-browser canvas & audio stream recording via MediaRecorder (9:16 export)' },
    ],
    technologies: [
      'React 19',
      'TypeScript',
      'MediaPipe Pose',
      'WebGL Shaders',
      'Web Audio API',
      'MediaRecorder',
      'Tailwind CSS',
      'Vite',
      'Vercel',
    ],
  },
] as const;

export default function Projects() {
  return (
    <section id="projects" className="py-24 relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Featured Work
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight text-readable-heading">
            Projects &amp; Applications
          </h2>
          <p className="mt-3 text-slate-200 text-sm sm:text-base text-readable-body">
            Production-ready software built to solve real-world problems with modern web technologies, computer vision, and local AI.
          </p>
        </div>

        {/* Project Cards List */}
        <div className="space-y-10 sm:space-y-12 mb-16">
          {PROJECTS_DATA.map((project) => (
            <div
              key={project.id}
              className={`glass-card rounded-2xl overflow-hidden border border-slate-800/80 bg-slate-900/60 transition-all duration-300 ${project.accentHoverBorder} hover:shadow-2xl ${project.accentHoverShadow} group`}
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
                
                {/* Visual Preview Column */}
                <div className="lg:col-span-6 relative bg-slate-950 flex flex-col justify-center items-center overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-800/80 min-h-[300px] lg:min-h-full">
                  <div className="relative w-full h-full min-h-[300px] group-hover:scale-105 transition-transform duration-500 ease-out">
                    <img
                      src={project.image}
                      alt={project.imageAlt}
                      className="w-full h-full object-cover object-center"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-slate-950/40" />
                    
                    {/* Floating badge inside visual */}
                    <div className="absolute top-4 right-4">
                      {project.liveUrl ? (
                        <a
                          href={project.liveUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-purple-600/90 text-white text-xs font-semibold shadow-lg backdrop-blur-md hover:bg-purple-500 transition-colors cursor-pointer"
                        >
                          <span>Visit Live Site</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      ) : (
                        <a
                          href={project.githubUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600/90 text-white text-xs font-semibold shadow-lg backdrop-blur-md hover:bg-indigo-500 transition-colors cursor-pointer"
                        >
                          <GithubIcon className="w-3.5 h-3.5 text-white" />
                          <span>View on GitHub</span>
                        </a>
                      )}
                    </div>

                    <div className="absolute bottom-4 left-4 right-4 p-3.5 rounded-xl bg-slate-950/80 backdrop-blur-md border border-slate-800/80 hidden sm:block">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-300 font-medium font-mono">
                          {project.domainBadge.label}
                        </span>
                        <span className={`${project.domainBadge.isOnline ? 'text-emerald-400' : 'text-purple-300'} font-semibold flex items-center gap-1.5 font-mono`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${project.domainBadge.isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-purple-400'}`} />
                          {project.domainBadge.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Details Column */}
                <div className="lg:col-span-6 p-6 sm:p-9 flex flex-col justify-between">
                  <div>
                    {/* Top Badges */}
                    <div className="flex flex-wrap items-center gap-2.5 mb-3">
                      {project.badges.map((badge, bIdx) => (
                        <span
                          key={bIdx}
                          className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                      ))}
                    </div>

                    <h3 className={`text-2xl sm:text-3xl font-bold text-white tracking-tight ${project.titleHoverColor} transition-colors text-readable-subheading`}>
                      {project.title}
                    </h3>
                    
                    <p className={`text-sm font-semibold ${project.subtitleColor} mb-4 text-readable-body`}>
                      {project.subtitle}
                    </p>

                    <p className="text-slate-200 text-sm sm:text-base leading-relaxed mb-6 text-readable-body">
                      {project.description}
                    </p>

                    {/* Key Highlights */}
                    <div className="mb-6 space-y-2.5 text-readable-body">
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-2">
                        Key Engineering Features:
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-200">
                        {project.features.map((feat, fIdx) => (
                          <div key={fIdx} className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                            <span>
                              {feat.label}
                              {feat.codeSnippet && (
                                <>
                                  {' '}
                                  <code className="text-purple-300 bg-purple-950/40 px-1 py-0.5 rounded border border-purple-800/50 font-mono text-[11px]">
                                    {feat.codeSnippet}
                                  </code>
                                </>
                              )}
                              {feat.suffix && ` ${feat.suffix}`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Technologies */}
                    <div className="flex flex-wrap gap-1.5 mb-8">
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

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center gap-3 pt-5 border-t border-slate-800/80">
                    {project.liveUrl ? (
                      <>
                        <a
                          href={project.liveUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm text-white bg-purple-600 hover:bg-purple-500 shadow-md shadow-purple-600/25 transition-all duration-200 cursor-pointer"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Launch Application
                        </a>

                        <a
                          href={project.githubUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-xs sm:text-sm text-slate-200 bg-slate-800/90 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 transition-colors cursor-pointer"
                        >
                          <GithubIcon className="w-4 h-4 text-slate-300" />
                          View Source Code
                        </a>
                      </>
                    ) : (
                      <>
                        <a
                          href={project.githubUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/25 transition-all duration-200 cursor-pointer"
                        >
                          <GithubIcon className="w-4 h-4 text-white" />
                          Explore on GitHub
                        </a>

                        <a
                          href={project.githubUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-xs sm:text-sm text-slate-200 bg-slate-800/90 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 transition-colors cursor-pointer"
                        >
                          <ExternalLink className="w-4 h-4 text-slate-300" />
                          Documentation &amp; Architecture
                        </a>
                      </>
                    )}
                  </div>

                </div>

              </div>
            </div>
          ))}
        </div>

        {/* GitHub Contributions & Open Source Activity */}
        <GithubContributions />

        {/* Future / In Development Callout Card */}
        <div className="mt-8 p-6 sm:p-7 rounded-2xl bg-slate-900/65 border border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-xl bg-purple-500/10 text-purple-300 border border-purple-500/20 shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm sm:text-base font-bold text-white text-readable-subheading">
                More Projects Under Active Development
              </h4>
              <p className="text-xs sm:text-sm text-slate-200 text-readable-body">
                Currently exploring new applications in full-stack web engineering, local AI pipelines, and student productivity tools.
              </p>
            </div>
          </div>
          
          <a
            href={EXTERNAL_LINKS.github}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 transition-colors shrink-0 cursor-pointer"
          >
            <GithubIcon className="w-4 h-4 text-purple-400" />
            <span>Follow on GitHub</span>
          </a>
        </div>

      </div>
    </section>
  );
}
