import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { ExternalLink, FileText, X } from 'lucide-react';
import { GithubIcon } from './Icons';
import Folder, {
  type FolderHandle,
  type FolderItem,
  type FolderItemSnapshot,
} from './Folder';
import declaraformImg from '../assets/projects/declaraform-preview.webp';
import gitcanvasImg from '../assets/projects/gitcanvas-preview.webp';
import neurosortImg from '../assets/projects/neurosort-preview.webp';
import restaurantscraperImg from '../assets/projects/restaurantscraper-preview.webp';
import { EXTERNAL_LINKS } from '../lib/constants';
import {
  buildFlipTransform,
  computeFlipDelta,
  rectToBox,
  type RectBox,
} from '../lib/folderUtils';
import BorderGlow from './BorderGlow';

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

interface OpeningFlight {
  index: number;
  from: FolderItemSnapshot;
  nonce: number;
}

interface ReturningFlight {
  project: ProjectItem;
  index: number;
  from: RectBox;
  nonce: number;
}

const SMOOTH_EASING = 'cubic-bezier(0.22, 1, 0.36, 1)';
const OPEN_DURATION_MS = 480;
const RETURN_DURATION_MS = 420;
const IDENTITY_TRANSFORM = 'translate3d(0px, 0px, 0) rotate(0deg) scale(1, 1)';

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
] as const;

const FOLDER_ITEMS: readonly FolderItem[] = PROJECTS_DATA.map((p) => ({
  title: p.title,
  image: p.image,
  alt: p.imageAlt,
}));

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
  );
}

export default function Projects() {
  const [activeProjectIndex, setActiveProjectIndex] = useState<number | null>(0);
  const [openingFlight, setOpeningFlight] = useState<OpeningFlight | null>(null);
  const [returningFlight, setReturningFlight] = useState<ReturningFlight | null>(null);

  const folderHandleRef = useRef<FolderHandle>(null);
  const folderColumnRef = useRef<HTMLDivElement>(null);
  const cardContainerRef = useRef<HTMLDivElement>(null);
  const cardContentRef = useRef<HTMLDivElement>(null);
  const cardCoverRef = useRef<HTMLDivElement>(null);
  const returningOverlayRef = useRef<HTMLDivElement>(null);
  const returningPaperRef = useRef<HTMLDivElement>(null);

  const flightNonceRef = useRef(0);
  const startedOpenNonceRef = useRef<number | null>(null);
  const startedReturnNonceRef = useRef<number | null>(null);
  const pendingFolderRectRef = useRef<DOMRect | null>(null);
  const activeAnimationsRef = useRef<Animation[]>([]);

  const activeProject =
    activeProjectIndex !== null ? PROJECTS_DATA[activeProjectIndex] : null;

  const cancelRunningAnimations = useCallback(() => {
    for (const anim of activeAnimationsRef.current) {
      try {
        anim.cancel();
      } catch {
        // Ignore already finished/detached animations
      }
    }
    activeAnimationsRef.current = [];
  }, []);

  useEffect(() => {
    return () => {
      cancelRunningAnimations();
    };
  }, [cancelRunningAnimations]);

  const closeActiveProject = useCallback(() => {
    if (activeProjectIndex === null) return;
    cancelRunningAnimations();

    const reduce = prefersReducedMotion();
    const prevProject = PROJECTS_DATA[activeProjectIndex];
    const cardRect = cardContainerRef.current?.getBoundingClientRect();
    pendingFolderRectRef.current = folderColumnRef.current?.getBoundingClientRect() ?? null;

    if (!reduce && prevProject && cardRect && cardRect.width > 0 && cardRect.height > 0) {
      flightNonceRef.current += 1;
      setReturningFlight({
        project: prevProject,
        index: activeProjectIndex,
        from: rectToBox(cardRect),
        nonce: flightNonceRef.current,
      });
    } else {
      setReturningFlight(null);
    }

    setOpeningFlight(null);
    setActiveProjectIndex(null);
  }, [activeProjectIndex, cancelRunningAnimations]);

  const handleFolderItemClick = useCallback(
    (_item: FolderItem, idx: number, snapshot: FolderItemSnapshot | null) => {
      if (idx < 0 || idx >= PROJECTS_DATA.length) return;

      if (activeProjectIndex === idx) {
        closeActiveProject();
        return;
      }

      cancelRunningAnimations();
      const reduce = prefersReducedMotion();
      const prevIdx = activeProjectIndex;
      const cardRect = cardContainerRef.current?.getBoundingClientRect();
      pendingFolderRectRef.current = folderColumnRef.current?.getBoundingClientRect() ?? null;

      flightNonceRef.current += 1;
      const nonce = flightNonceRef.current;

      if (
        !reduce &&
        prevIdx !== null &&
        PROJECTS_DATA[prevIdx] &&
        cardRect &&
        cardRect.width > 0 &&
        cardRect.height > 0
      ) {
        setReturningFlight({
          project: PROJECTS_DATA[prevIdx],
          index: prevIdx,
          from: rectToBox(cardRect),
          nonce,
        });
      } else {
        setReturningFlight(null);
      }

      const sourceSnapshot = snapshot ?? folderHandleRef.current?.getItemSnapshot(idx) ?? null;
      if (!reduce && sourceSnapshot) {
        setOpeningFlight({
          index: idx,
          from: sourceSnapshot,
          nonce,
        });
      } else {
        setOpeningFlight(null);
      }

      setActiveProjectIndex(idx);
    },
    [activeProjectIndex, cancelRunningAnimations, closeActiveProject]
  );

  // Close open project card cleanly with Escape
  useEffect(() => {
    if (activeProjectIndex === null) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      const tag = (event.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      closeActiveProject();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [activeProjectIndex, closeActiveProject]);

  // Run GPU-composited FLIP animations immediately after layout settles
  useLayoutEffect(() => {
    const reduce = prefersReducedMotion();
    const shouldStartReturn =
      returningFlight !== null && startedReturnNonceRef.current !== returningFlight.nonce;
    const shouldStartOpen =
      openingFlight !== null && startedOpenNonceRef.current !== openingFlight.nonce;

    // 1. Measure return target BEFORE applying folder container FLIP slide
    const returnTarget =
      !reduce && shouldStartReturn && returningFlight
        ? folderHandleRef.current?.getItemSnapshot(returningFlight.index) ?? null
        : null;

    // 2. Smoothly slide the folder column when layout shifts between centered and split
    const prevFolderRect = pendingFolderRectRef.current;
    pendingFolderRectRef.current = null;
    const folderCol = folderColumnRef.current;
    if (!reduce && prevFolderRect && folderCol && typeof folderCol.animate === 'function') {
      const nextFolderRect = folderCol.getBoundingClientRect();
      const dx = prevFolderRect.left - nextFolderRect.left;
      const dy = prevFolderRect.top - nextFolderRect.top;
      if (Math.hypot(dx, dy) > 1) {
        activeAnimationsRef.current.push(
          folderCol.animate(
            [
              { transform: `translate3d(${dx.toFixed(2)}px, ${dy.toFixed(2)}px, 0)` },
              { transform: 'translate3d(0px, 0px, 0)' },
            ],
            {
              duration: OPEN_DURATION_MS,
              easing: SMOOTH_EASING,
            }
          )
        );
      }
    }

    // 3. Animate the newly opened project card unfolding from the folder file
    const cardEl = cardContainerRef.current;
    if (shouldStartOpen && openingFlight) {
      startedOpenNonceRef.current = openingFlight.nonce;
      if (!reduce && cardEl && typeof cardEl.animate === 'function') {
        const cardRect = cardEl.getBoundingClientRect();
        const delta = computeFlipDelta(openingFlight.from, rectToBox(cardRect));
        const openAnim = cardEl.animate(
          [
            { transform: buildFlipTransform(delta) },
            { transform: IDENTITY_TRANSFORM },
          ],
          {
            duration: OPEN_DURATION_MS,
            easing: SMOOTH_EASING,
          }
        );
        activeAnimationsRef.current.push(openAnim);

        const coverEl = cardCoverRef.current;
        if (coverEl && typeof coverEl.animate === 'function') {
          activeAnimationsRef.current.push(
            coverEl.animate(
              [
                { opacity: 1, offset: 0 },
                { opacity: 0.92, offset: 0.22 },
                { opacity: 0, offset: 0.62 },
                { opacity: 0, offset: 1 },
              ],
              {
                duration: OPEN_DURATION_MS,
                easing: 'ease-out',
                fill: 'forwards',
              }
            )
          );
        }

        const contentEl = cardContentRef.current;
        if (contentEl && typeof contentEl.animate === 'function') {
          activeAnimationsRef.current.push(
            contentEl.animate(
              [
                { opacity: 0, transform: 'translate3d(0px, 10px, 0)', offset: 0 },
                { opacity: 0, transform: 'translate3d(0px, 10px, 0)', offset: 0.24 },
                { opacity: 1, transform: 'translate3d(0px, 0px, 0)', offset: 0.85 },
                { opacity: 1, transform: 'translate3d(0px, 0px, 0)', offset: 1 },
              ],
              {
                duration: OPEN_DURATION_MS,
                easing: SMOOTH_EASING,
              }
            )
          );
        }

        const flightNonce = openingFlight.nonce;
        openAnim.onfinish = () => {
          setOpeningFlight((current) => (current?.nonce === flightNonce ? null : current));
        };
      } else {
        setOpeningFlight(null);
      }
    }

    // 4. Animate the closing/previous card folding smoothly back into its folder slot
    const returnEl = returningOverlayRef.current;
    if (shouldStartReturn && returningFlight) {
      startedReturnNonceRef.current = returningFlight.nonce;
      if (!reduce && returnEl && returnTarget && typeof returnEl.animate === 'function') {
        const delta = computeFlipDelta(returnTarget, returningFlight.from);
        const returnAnim = returnEl.animate(
          [
            { transform: IDENTITY_TRANSFORM },
            { transform: buildFlipTransform(delta) },
          ],
          {
            duration: RETURN_DURATION_MS,
            easing: SMOOTH_EASING,
            fill: 'forwards',
          }
        );
        activeAnimationsRef.current.push(returnAnim);

        const paperEl = returningPaperRef.current;
        if (paperEl && typeof paperEl.animate === 'function') {
          activeAnimationsRef.current.push(
            paperEl.animate(
              [
                { opacity: 0, offset: 0 },
                { opacity: 0.88, offset: 0.45 },
                { opacity: 1, offset: 0.82 },
                { opacity: 1, offset: 1 },
              ],
              {
                duration: RETURN_DURATION_MS,
                easing: 'ease-in-out',
                fill: 'forwards',
              }
            )
          );
        }

        const flightNonce = returningFlight.nonce;
        returnAnim.onfinish = () => {
          setReturningFlight((current) => (current?.nonce === flightNonce ? null : current));
        };
      } else {
        setReturningFlight(null);
      }
    }
  }, [openingFlight, returningFlight]);

  const inFlightIndices = useMemo(() => {
    const indices: number[] = [];
    if (openingFlight) indices.push(openingFlight.index);
    if (returningFlight) indices.push(returningFlight.index);
    return indices;
  }, [openingFlight, returningFlight]);

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
        <div className="flex flex-col xl:flex-row items-center justify-center gap-10 xl:gap-20 2xl:gap-28 my-8">
          {/* Left Column: Interactive Folder */}
          <div
            ref={folderColumnRef}
            className={`w-full ${activeProject ? 'max-w-[420px]' : 'max-w-2xl'} flex flex-col items-center justify-center relative z-10 overflow-visible`}
          >
            <div className="relative flex items-center justify-center min-h-[290px] sm:min-h-[310px] w-full py-2">
              <Folder
                ref={folderHandleRef}
                label="Projects Archive"
                items={FOLDER_ITEMS}
                color="#3b1d60"
                paperColor="#ffffff"
                tabPosition="left"
                defaultOpen={true}
                draggable={true}
                zoomOnClick={false}
                extractSelected={true}
                selectedIndex={activeProjectIndex}
                inFlightIndices={inFlightIndices}
                size={1.05}
                onItemClick={handleFolderItemClick}
              />
            </div>

            <div className="text-[10px] sm:text-[11px] text-zinc-400 mt-2 flex items-center justify-center gap-1.5 font-mono text-center">
              <FileText className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <span>
                {activeProject
                  ? 'Click another file to open it, or close the card to put it back'
                  : 'Click any project file in the folder to open its details →'}
              </span>
            </div>
          </div>

          {/* Right Column: Opened Compact Project Details Card */}
          {activeProject && (
            <div
              ref={cardContainerRef}
              className={`w-full max-w-[380px] sm:max-w-[400px] shrink-0 relative origin-center ${
                openingFlight ? 'z-30 will-change-transform' : 'z-0'
              }`}
            >
              <BorderGlow
                key={activeProject.id}
                className="h-[340px] sm:h-[350px]"
                innerClassName="p-[1px]"
                backgroundColor="#111116"
                borderRadius={16}
                glowRadius={38}
                glowIntensity={1.0}
                edgeSensitivity={28}
                coneSpread={25}
                animated={true}
                glowColor="275 85 75"
                fillOpacity={0.4}
              >
                <div className="relative flex flex-col justify-between h-full rounded-[15px] overflow-hidden">
                  {/* Seamless paper-file cover overlay during FLIP opening morph */}
                  {openingFlight && (
                    <div
                      ref={cardCoverRef}
                      aria-hidden="true"
                      className="absolute inset-0 z-20 rounded-[15px] bg-white p-2.5 pointer-events-none"
                    >
                      <div className="relative w-full h-full rounded-[9px] overflow-hidden bg-zinc-950">
                        <img
                          src={activeProject.image}
                          alt=""
                          className="w-full h-full object-cover object-center"
                        />
                        <div className="absolute inset-x-0 bottom-0 px-3 py-2.5 bg-gradient-to-t from-zinc-950/95 via-zinc-950/80 to-transparent text-center">
                          <span className="text-sm font-bold text-white tracking-tight">
                            {activeProject.title}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

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
                      onClick={closeActiveProject}
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/10 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                      aria-label="Close project details"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Content body */}
                  <div
                    ref={cardContentRef}
                    className="p-4 flex flex-col justify-between flex-1 min-h-0"
                  >
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
                            href={`${activeProject.githubUrl}#readme`}
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
              </BorderGlow>
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

      {/* Returning File Overlay: smoothly folds the closed card back into its folder slot */}
      {returningFlight && (
        <div
          ref={returningOverlayRef}
          aria-hidden="true"
          className="fixed z-50 pointer-events-none origin-center will-change-transform rounded-2xl border border-white/10 bg-[#111116] shadow-2xl overflow-hidden"
          style={{
            left: `${returningFlight.from.centerX - returningFlight.from.width / 2}px`,
            top: `${returningFlight.from.centerY - returningFlight.from.height / 2}px`,
            width: `${returningFlight.from.width}px`,
            height: `${returningFlight.from.height}px`,
          }}
        >
          {/* Fading dark card header */}
          <div className="relative bg-zinc-950 h-28 sm:h-32 overflow-hidden border-b border-white/10">
            <img
              src={returningFlight.project.image}
              alt=""
              className="w-full h-full object-cover object-center"
            />
          </div>
          <div className="p-4">
            <p className="text-base sm:text-lg font-bold text-white truncate">
              {returningFlight.project.title}
            </p>
            <p className="text-[11px] font-medium text-purple-300 truncate mt-0.5">
              {returningFlight.project.subtitle}
            </p>
          </div>

          {/* Paper-file layer that fades in as the card shrinks into the folder slot */}
          <div
            ref={returningPaperRef}
            className="absolute inset-0 bg-white p-2.5 opacity-0"
          >
            <div className="relative w-full h-full rounded-[9px] overflow-hidden bg-zinc-950">
              <img
                src={returningFlight.project.image}
                alt=""
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-x-0 bottom-0 px-3 py-2.5 bg-gradient-to-t from-zinc-950/95 via-zinc-950/80 to-transparent text-center">
                <span className="text-sm font-bold text-white tracking-tight">
                  {returningFlight.project.title}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
