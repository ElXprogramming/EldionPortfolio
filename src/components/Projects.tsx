import { 
  ExternalLink, 
  Sparkles, 
  CheckCircle2, 
  Clock
} from 'lucide-react';
import { GithubIcon } from './Icons';
import GithubContributions from './GithubContributions';
import declaraformImg from '../assets/projects/declaraform-preview.webp';
import gitcanvasImg from '../assets/projects/gitcanvas-preview.webp';
import neurosortImg from '../assets/projects/neurosort-preview.webp';
import restaurantscraperImg from '../assets/projects/restaurantscraper-preview.webp';
import chessGameReviewImg from '../assets/projects/chess-game-review-preview.webp';
import { EXTERNAL_LINKS } from '../lib/constants';

interface ProjectFeature {
  label: string;
  codeSnippet?: string;
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
  primaryButtonClass?: string;
  floatingBadgeClass?: string;
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
    id: 'gitcanvas',
    title: 'GitCanvas',
    subtitle: 'Visual Bento-Grid Profile Studio & One Piece Themed README Engine',
    description:
      'A full-featured visual GitHub profile README studio and desktop simulator featuring animated One Piece pixel-art themes (Luffy Gatling punch, Straw Hat crew, Gear 5 Nika, and Wano Zoro). Ingests public repositories, star velocity, and byte-level language stats via Octokit REST to classify developer archetypes, synthesizes personalized bio copy using Gemini AI, and renders pixel-accurate Bento, Terminal CLI, and Anime-themed Markdown cards with instant 1-click deployment to <username>/<username>.',
    accentHoverBorder: 'hover:border-cyan-500/40',
    accentHoverShadow: 'hover:shadow-cyan-500/10',
    titleHoverColor: 'group-hover:text-cyan-300',
    subtitleColor: 'text-cyan-300',
    primaryButtonClass: 'bg-cyan-600 hover:bg-cyan-500 shadow-cyan-600/25',
    floatingBadgeClass: 'bg-cyan-600/90 hover:bg-cyan-500',
    badges: [
      {
        label: 'Live Production App',
        className: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10',
      },
      {
        label: 'One Piece Animated Themes',
        className: 'border-amber-500/40 text-amber-300 bg-amber-500/10',
      },
      {
        label: 'Next.js 14 & Gemini AI',
        className: 'border-cyan-500/40 text-cyan-300 bg-cyan-500/10',
      },
    ],
    domainBadge: {
      label: 'Domain: githubstatreadme.vercel.app',
      status: 'Online',
      isOnline: true,
    },
    image: gitcanvasImg,
    imageAlt: 'GitCanvas Live Studio — One Piece Themed GitHub Profile README with Luffy Gatling Mascot Preview',
    liveUrl: EXTERNAL_LINKS.gitCanvasLive,
    githubUrl: EXTERNAL_LINKS.gitCanvasRepo,
    features: [
      { label: 'Animated One Piece themes & pixel-art mascots (Luffy Gatling, Straw Hat, Zoro, Chopper)' },
      { label: 'Portfolio ingestion & archetype classifier powered by', codeSnippet: 'Octokit REST' },
      { label: 'AI bio synthesizer with 4 distinct persona tones using', codeSnippet: 'Gemini AI' },
      { label: 'Split-screen GitHub simulator with 1-click commit & diff verification' },
    ],
    technologies: [
      'Next.js 14',
      'React 18',
      'TypeScript',
      'Tailwind CSS',
      'Gemini AI',
      'Octokit REST',
      'Pixel Art & GIFs',
      'Vercel',
    ],
  },
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
    id: 'restaurantscraper',
    title: 'RestaurantScraper',
    subtitle: 'High-Performance Restaurant Menu Scraper & Local SQLite Database Explorer',
    description:
      'A local-first menu extraction system engineered to harvest, deduplicate, and catalog food menus from dynamic delivery platforms (GrabFood, foodpanda) and restaurant websites. Overcomes single-page application hydration barriers via Playwright Chromium passive network response sniffing, normalizes minor unit pricing to Ringgit (MYR), deduplicates venues with Haversine distance and SequenceMatcher algorithms, and provides both a Rich Typer CLI and zero-dependency local Web GUI with formula-injection-safe CSV and JSON export.',
    accentHoverBorder: 'hover:border-teal-500/40',
    accentHoverShadow: 'hover:shadow-teal-500/10',
    titleHoverColor: 'group-hover:text-teal-300',
    subtitleColor: 'text-teal-300',
    primaryButtonClass: 'bg-teal-600 hover:bg-teal-500 shadow-teal-600/25',
    floatingBadgeClass: 'bg-teal-600/90 hover:bg-teal-500',
    badges: [
      {
        label: 'Passive Sniffer & Rich CLI',
        className: 'border-teal-500/40 text-teal-400 bg-teal-500/10',
      },
      {
        label: 'Playwright & SQLite WAL',
        className: 'border-emerald-500/40 text-emerald-300 bg-emerald-500/10',
      },
    ],
    domainBadge: {
      label: 'Localhost: 127.0.0.1:8765',
      status: 'Local Web GUI',
      isOnline: true,
    },
    image: restaurantscraperImg,
    imageAlt: 'RestaurantScraper Database Explorer & Studio Preview',
    githubUrl: EXTERNAL_LINKS.restaurantscraperRepo,
    features: [
      { label: 'Passive network sniffer for GrabFood & foodpanda with', codeSnippet: 'Playwright' },
      { label: 'Embedded database with WAL mode using', codeSnippet: 'SQLite3' },
      { label: 'Fuzzy venue deduplication via Haversine distance & SequenceMatcher' },
      { label: 'Formula injection defense for sanitized Excel-ready CSV/JSON exports' },
    ],
    technologies: [
      'Python 3.11+',
      'Playwright (Chromium)',
      'SQLite3 (WAL)',
      'Typer & Rich',
      'Vanilla JS & Tailwind',
      'BeautifulSoup4',
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
    id: 'chess-game-review',
    title: 'ChessGameReview',
    subtitle: 'Client-Side Browser Chess Engine & Game Review Web Application',
    description:
      'A high-performance, browser-native chess engine and full game review web application powered by Stockfish 16 compiled to WebAssembly. Evaluates PGN games directly inside browser Web Workers with zero server dependencies, calculating CAPS2 accuracy percentages, classifying every move with badges (Brilliant, Great, Best, Inaccuracy, Blunder), rendering dynamic engine recommendation arrows, and delivering natural language virtual coach commentary.',
    accentHoverBorder: 'hover:border-emerald-500/40',
    accentHoverShadow: 'hover:shadow-emerald-500/10',
    titleHoverColor: 'group-hover:text-emerald-300',
    subtitleColor: 'text-emerald-300',
    primaryButtonClass: 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/25',
    floatingBadgeClass: 'bg-emerald-600/90 hover:bg-emerald-500',
    badges: [
      {
        label: 'Live Web App & Stockfish WASM',
        className: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10',
      },
      {
        label: 'CAPS2 Accuracy & Virtual Coach',
        className: 'border-teal-500/40 text-teal-300 bg-teal-500/10',
      },
    ],
    domainBadge: {
      label: 'Domain: chessgamereview-two.vercel.app',
      status: 'Online',
      isOnline: true,
    },
    image: chessGameReviewImg,
    imageAlt: 'ChessGameReview In-Browser Chess Engine & Move Analysis Preview',
    liveUrl: EXTERNAL_LINKS.chessGameReviewLive,
    githubUrl: EXTERNAL_LINKS.chessGameReviewRepo,
    features: [
      { label: 'In-browser Stockfish 16 MultiPV evaluation with', codeSnippet: 'WebAssembly' },
      { label: 'CAPS2 accuracy model & win probability decay algorithms' },
      { label: 'Interactive move badges, eval chart & engine recommendation arrows' },
      { label: 'Procedural audio synthesis with zero audio assets via', codeSnippet: 'Web Audio API' },
    ],
    technologies: [
      'React 18',
      'TypeScript',
      'Stockfish 16 (WASM)',
      'chess.js',
      'Tailwind CSS',
      'Web Workers',
      'Web Audio API',
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
            Production-ready software built to solve real-world problems with modern web technologies, automated data pipelines, and local AI.
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
                      decoding="async"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-slate-950/40" />
                    
                    {/* Floating badge inside visual */}
                    <div className="absolute top-4 right-4">
                      {project.liveUrl ? (
                        <a
                          href={project.liveUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg ${project.floatingBadgeClass ?? 'bg-purple-600/90 hover:bg-purple-500'} text-white text-xs font-semibold shadow-lg backdrop-blur-md transition-colors cursor-pointer`}
                        >
                          <span>Visit Live Site</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      ) : (
                        <a
                          href={project.githubUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg ${project.floatingBadgeClass ?? 'bg-indigo-600/90 hover:bg-indigo-500'} text-white text-xs font-semibold shadow-lg backdrop-blur-md transition-colors cursor-pointer`}
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
                          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm text-white ${project.primaryButtonClass ?? 'bg-purple-600 hover:bg-purple-500 shadow-purple-600/25'} shadow-md transition-all duration-200 cursor-pointer`}
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
                          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm text-white ${project.primaryButtonClass ?? 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/25'} shadow-md transition-all duration-200 cursor-pointer`}
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
