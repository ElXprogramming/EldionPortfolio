import { useState } from 'react';
import { 
  ExternalLink, 
  Sparkles, 
  CheckCircle2, 
  Clock,
  FileText,
  X
} from 'lucide-react';
import { GithubIcon } from './Icons';
import GithubContributions from './GithubContributions';
import Folder, { type FolderItem } from './Folder';
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
    badges: [
      {
        label: 'Live Production App',
        className: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10',
      },
      {
        label: 'Client-Side PDF Generator',
        className: 'border-purple-500/40 text-purple-300 bg-purple-500/10',
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
  const [activeProjectIndex, setActiveProjectIndex] = useState<number | null>(0);

  const folderItems: FolderItem[] = PROJECTS_DATA.map((p) => ({
    title: p.title,
    description: p.subtitle,
    image: p.image,
    alt: p.imageAlt,
  }));

  const activeProject = activeProjectIndex !== null ? PROJECTS_DATA[activeProjectIndex] : null;

  return (
    <section id="projects" className="py-24 relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Interactive Portfolio Folder
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Projects &amp; Applications
          </h2>
          <p className="mt-3 text-zinc-300 text-sm sm:text-base">
            Click any project document in the folder to open its architecture and live demo on the right.
          </p>
        </div>

        {/* Main Section Grid: Left = Folder, Right = Project Details */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start my-8">
          
          {/* Left Column: Interactive Folder & Project Selectors */}
          <div className={`${activeProject ? 'lg:col-span-5' : 'lg:col-span-12 max-w-2xl mx-auto w-full'} flex flex-col items-center justify-center transition-all duration-300`}>
            <div className="relative flex items-center justify-center min-h-[300px] sm:min-h-[340px] w-full py-4">
              <Folder
                label="Projects Archive"
                items={folderItems}
                mode="flap"
                variant="solid"
                color="#3b1d60"
                paperColor="#ffffff"
                tabPosition="left"
                defaultOpen={true}
                draggable={true}
                zoomOnClick={true}
                selectedIndex={activeProjectIndex}
                size={activeProject ? 1.05 : 1.15}
                onItemClick={(_item, idx) => {
                  if (idx >= 0 && idx < PROJECTS_DATA.length) {
                    setActiveProjectIndex((prev) => (prev === idx ? null : idx));
                  }
                }}
              />
            </div>

            <div className="text-xs text-zinc-400 mt-2 mb-6 flex items-center gap-2 font-mono text-center">
              <FileText className="w-3.5 h-3.5 text-purple-400" />
              <span>
                {activeProject
                  ? 'Click another project to switch, or click selected to close'
                  : 'Click any project document in the folder to inspect details on the right →'}
              </span>
            </div>

            {/* Project Selector Pills */}
            <div className="flex flex-wrap items-center justify-center gap-2 mb-4 w-full">
              {PROJECTS_DATA.map((project, idx) => (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => setActiveProjectIndex((prev) => (prev === idx ? null : idx))}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
                    activeProjectIndex === idx
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30 border border-purple-500/50'
                      : 'bg-[#141419] text-zinc-400 hover:text-white border border-white/5 hover:border-white/15'
                  }`}
                >
                  {project.title}
                </button>
              ))}
            </div>
          </div>

          {/* Right Column: Opened Project Details Card */}
          {activeProject && (
            <div className="lg:col-span-7 transition-all duration-300">
              <div className="rounded-2xl border border-white/10 bg-[#111116] overflow-hidden shadow-2xl relative">
                
                {/* Visual Preview Header with Domain Status */}
                <div className="relative bg-zinc-950 flex flex-col justify-center items-center overflow-hidden border-b border-white/10 min-h-[220px] max-h-[320px]">
                  <img
                    src={activeProject.image}
                    alt={activeProject.imageAlt}
                    className="w-full h-full object-cover object-center max-h-[320px]"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-zinc-950/30 to-transparent pointer-events-none" />

                  {/* Close button at top right */}
                  <button
                    type="button"
                    onClick={() => setActiveProjectIndex(null)}
                    className="absolute top-3 right-3 p-2 rounded-xl bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/10 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                    aria-label="Close project details"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  {/* Domain badge at bottom of preview */}
                  <div className="absolute bottom-3 left-3 right-3 p-2.5 rounded-xl bg-black/80 backdrop-blur-md border border-white/10 flex items-center justify-between text-xs">
                    <span className="text-zinc-300 font-mono truncate mr-2">
                      {activeProject.domainBadge.label}
                    </span>
                    <span className="text-emerald-400 font-semibold flex items-center gap-1.5 font-mono shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      {activeProject.domainBadge.status}
                    </span>
                  </div>
                </div>

                {/* Content body */}
                <div className="p-6 sm:p-7 flex flex-col justify-between">
                  <div>
                    {/* Badges */}
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      {activeProject.badges.map((badge, bIdx) => (
                        <span
                          key={bIdx}
                          className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                      ))}
                    </div>

                    <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                      {activeProject.title}
                    </h3>
                    
                    <p className="text-sm font-semibold text-purple-300 mt-1 mb-4">
                      {activeProject.subtitle}
                    </p>

                    <p className="text-zinc-300 text-sm leading-relaxed mb-5">
                      {activeProject.description}
                    </p>

                    {/* Key Engineering Features */}
                    <div className="mb-5 space-y-2">
                      <div className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                        Key Engineering Highlights:
                      </div>
                      <div className="grid grid-cols-1 gap-2 text-xs text-zinc-300">
                        {activeProject.features.map((feat, fIdx) => (
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
                    <div className="flex flex-wrap gap-1.5 mb-6">
                      {activeProject.technologies.map((tech) => (
                        <span
                          key={tech}
                          className="px-2.5 py-1 rounded-md bg-zinc-900 text-zinc-300 border border-zinc-800 text-xs font-mono"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center gap-3 pt-5 border-t border-white/10">
                    {activeProject.liveUrl ? (
                      <>
                        <a
                          href={activeProject.liveUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm text-white bg-purple-600 hover:bg-purple-500 shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Launch Application
                        </a>

                        <a
                          href={activeProject.githubUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-xs sm:text-sm text-zinc-200 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-colors cursor-pointer"
                        >
                          <GithubIcon className="w-4 h-4 text-zinc-300" />
                          View Source Code
                        </a>
                      </>
                    ) : (
                      <>
                        <a
                          href={activeProject.githubUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
                        >
                          <GithubIcon className="w-4 h-4 text-white" />
                          Explore on GitHub
                        </a>

                        <a
                          href={activeProject.githubUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-xs sm:text-sm text-zinc-200 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-colors cursor-pointer"
                        >
                          <ExternalLink className="w-4 h-4 text-zinc-300" />
                          Documentation &amp; Architecture
                        </a>
                      </>
                    )}
                  </div>

                </div>
              </div>
            </div>
          )}

        </div>

        {/* GitHub Contributions & Open Source Activity */}
        <GithubContributions />

        {/* Future / In Development Callout */}
        <div className="mt-8 p-6 rounded-2xl bg-[#111116] border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-xl bg-purple-500/10 text-purple-300 border border-purple-500/20 shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm sm:text-base font-bold text-white">
                More Projects Under Active Development
              </h4>
              <p className="text-xs sm:text-sm text-zinc-300">
                Currently exploring new applications in full-stack web engineering, local AI pipelines, and student productivity tools.
              </p>
            </div>
          </div>
          
          <a
            href={EXTERNAL_LINKS.github}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-colors shrink-0 cursor-pointer"
          >
            <GithubIcon className="w-4 h-4 text-purple-400" />
            <span>Follow on GitHub</span>
          </a>
        </div>

      </div>
    </section>
  );
}
