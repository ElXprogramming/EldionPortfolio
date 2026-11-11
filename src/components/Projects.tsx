import { useState } from 'react';
import { 
  ExternalLink, 
  FileText, 
  X 
} from 'lucide-react';
import { GithubIcon } from './Icons';
import Folder, { type FolderItem } from './Folder';
import declaraformImg from '../assets/projects/declaraform-preview.webp';
import gitcanvasImg from '../assets/projects/gitcanvas-preview.webp';
import neurosortImg from '../assets/projects/neurosort-preview.webp';
import restaurantscraperImg from '../assets/projects/restaurantscraper-preview.webp';
import chessGameReviewImg from '../assets/projects/chess-game-review-preview.webp';
import { EXTERNAL_LINKS } from '../lib/constants';

interface ProjectItem {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  imageAlt: string;
  liveUrl?: string;
  githubUrl: string;
  technologies: readonly string[];
}

const PROJECTS_DATA: readonly ProjectItem[] = [
  {
    id: 'gitcanvas',
    title: 'GitCanvas',
    subtitle: 'Visual README Studio & Pixel-Art Mascots',
    description:
      'Interactive GitHub profile README generator featuring animated One Piece pixel-art themes and Gemini AI bio synthesis.',
    image: gitcanvasImg,
    imageAlt: 'GitCanvas Studio — One Piece Themed GitHub Profile README Preview',
    liveUrl: EXTERNAL_LINKS.gitCanvasLive,
    githubUrl: EXTERNAL_LINKS.gitCanvasRepo,
    technologies: ['Next.js 14', 'TypeScript', 'Gemini AI', 'Tailwind CSS'],
  },
  {
    id: 'neurosort',
    title: 'NeuroSort',
    subtitle: 'Autonomous Local-First File Daemon',
    description:
      'Local-first file management daemon and CLI powered by Ollama semantic classification and SQLite WAL audit ledgers.',
    image: neurosortImg,
    imageAlt: 'NeuroSort Dashboard Preview',
    githubUrl: EXTERNAL_LINKS.neurosortRepo,
    technologies: ['Python 3.11', 'Ollama', 'FastAPI', 'SQLite WAL'],
  },
  {
    id: 'restaurantscraper',
    title: 'RestaurantScraper',
    subtitle: 'Menu Scraper & Local SQLite Explorer',
    description:
      'Passive network menu extraction engine for GrabFood and foodpanda with deduplication and a local SQLite explorer.',
    image: restaurantscraperImg,
    imageAlt: 'RestaurantScraper Explorer Preview',
    githubUrl: EXTERNAL_LINKS.restaurantscraperRepo,
    technologies: ['Python 3.11', 'Playwright', 'SQLite WAL', 'Typer'],
  },
  {
    id: 'declaraform',
    title: 'Declaraform',
    subtitle: 'Automated Declaration Form PDF Generator',
    description:
      'Client-side PDF synthesis app with in-browser digital signatures and interactive 3D graphics for UMS CS students.',
    image: declaraformImg,
    imageAlt: 'Declaraform Application Preview',
    liveUrl: EXTERNAL_LINKS.declaraformLive,
    githubUrl: EXTERNAL_LINKS.declaraformRepo,
    technologies: ['React', 'Three.js', 'pdf-lib', 'Tailwind CSS'],
  },
  {
    id: 'chess-game-review',
    title: 'ChessGameReview',
    subtitle: 'Client-Side Chess Engine & Game Review',
    description:
      'Browser-native chess game review tool powered by Stockfish 16 WebAssembly workers and CAPS2 move accuracy analysis.',
    image: chessGameReviewImg,
    imageAlt: 'ChessGameReview In-Browser Engine Preview',
    liveUrl: EXTERNAL_LINKS.chessGameReviewLive,
    githubUrl: EXTERNAL_LINKS.chessGameReviewRepo,
    technologies: ['React 18', 'Stockfish 16 WASM', 'TypeScript', 'Web Workers'],
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
        <div className="text-left max-w-2xl mb-8 sm:mb-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Projects
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-zinc-400">
            Interactive folder archive of selected applications and tools.
          </p>
        </div>

        {/* Main Section Layout: Left = Folder, Right = Compact Project Details */}
        <div className="flex flex-col lg:flex-row items-center justify-center gap-10 lg:gap-20 xl:gap-28 my-8">
          
          {/* Left Column: Interactive Folder */}
          <div className={`w-full ${activeProject ? 'max-w-[420px]' : 'max-w-2xl'} flex flex-col items-center justify-center transition-all duration-300 relative z-10 overflow-visible`}>
            <div className="relative flex items-center justify-center min-h-[290px] sm:min-h-[310px] w-full py-2">
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
                size={1.05}
                onItemClick={(_item, idx) => {
                  if (idx >= 0 && idx < PROJECTS_DATA.length) {
                    setActiveProjectIndex((prev) => (prev === idx ? null : idx));
                  }
                }}
              />
            </div>

            <div className="text-[10px] sm:text-[11px] text-zinc-400 mt-2 flex items-center justify-center gap-1.5 font-mono text-center whitespace-nowrap">
              <FileText className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <span className="whitespace-nowrap">
                {activeProject
                  ? 'Click another project to switch, or click selected to close'
                  : 'Click any project document in the folder to inspect details →'}
              </span>
            </div>
          </div>

          {/* Right Column: Opened Compact Project Details Card */}
          {activeProject && (
            <div className="w-full max-w-[380px] sm:max-w-[400px] shrink-0 transition-all duration-300 relative z-0">
              <div className="rounded-2xl border border-white/10 bg-[#111116] overflow-hidden shadow-2xl relative flex flex-col justify-between h-[340px] sm:h-[350px]">
                
                {/* Visual Preview Header */}
                <div className="relative bg-zinc-950 h-28 sm:h-32 overflow-hidden border-b border-white/10 shrink-0">
                  <img
                    src={activeProject.image}
                    alt={activeProject.imageAlt}
                    className="w-full h-full object-cover object-center"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-zinc-950/20 to-transparent pointer-events-none" />

                  {/* Close button at top right */}
                  <button
                    type="button"
                    onClick={() => setActiveProjectIndex(null)}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/10 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                    aria-label="Close project details"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Content body */}
                <div className="p-4 flex flex-col justify-between flex-1 min-h-0">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-white tracking-tight leading-snug truncate">
                      {activeProject.title}
                    </h3>
                    
                    <p className="text-[11px] font-medium text-purple-300 truncate mb-1.5">
                      {activeProject.subtitle}
                    </p>

                    <p className="text-xs text-zinc-300 leading-relaxed line-clamp-2 sm:line-clamp-3 mb-2.5">
                      {activeProject.description}
                    </p>

                    {/* Technologies */}
                    <div className="flex flex-wrap gap-1 mb-2">
                      {activeProject.technologies.slice(0, 4).map((tech) => (
                        <span
                          key={tech}
                          className="px-2 py-0.5 rounded bg-zinc-900 text-zinc-300 border border-zinc-800 text-[10px] font-mono"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-2.5 border-t border-white/10">
                    {activeProject.liveUrl ? (
                      <>
                        <a
                          href={activeProject.liveUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-xs text-white bg-purple-600 hover:bg-purple-500 shadow-md shadow-purple-600/20 transition-all cursor-pointer"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Launch
                        </a>

                        <a
                          href={activeProject.githubUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium text-xs text-zinc-200 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-colors cursor-pointer"
                        >
                          <GithubIcon className="w-3.5 h-3.5 text-zinc-300" />
                          Code
                        </a>
                      </>
                    ) : (
                      <>
                        <a
                          href={activeProject.githubUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-xs text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
                        >
                          <GithubIcon className="w-3.5 h-3.5 text-white" />
                          GitHub
                        </a>

                        <a
                          href={activeProject.githubUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium text-xs text-zinc-200 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-colors cursor-pointer"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-zinc-300" />
                          Overview
                        </a>
                      </>
                    )}
                  </div>

                </div>
              </div>
            </div>
          )}

        </div>

        {/* More Projects on GitHub Link */}
        <div className="mt-8 flex justify-center">
          <a
            href={EXTERNAL_LINKS.github}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#111116] hover:bg-zinc-900 border border-white/10 hover:border-purple-500/40 text-xs font-mono text-zinc-300 hover:text-white transition-all shadow-sm group cursor-pointer"
          >
            <GithubIcon className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
            <span>More projects on GitHub</span>
            <ExternalLink className="w-3.5 h-3.5 text-zinc-500 group-hover:text-purple-400 transition-colors" />
          </a>
        </div>

      </div>
    </section>
  );
}
