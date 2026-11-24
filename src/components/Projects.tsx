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
  clamp,
  computeFlipDelta,
  rectToBox,
  toLocalBox,
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
  fromViewport: RectBox;
  nonce: number;
}

interface ReturningFlightNodes {
  overlayEl: HTMLDivElement | null;
  cardLayerEl: HTMLDivElement | null;
  paperLayerEl: HTMLDivElement | null;
  photoWrapEl: HTMLDivElement | null;
  captionEl: HTMLDivElement | null;
  animations: Animation[];
  started: boolean;
  startedAt: number;
  duration: number;
  intoPocket: boolean;
}

const SMOOTH_EASING = 'cubic-bezier(0.22, 1, 0.36, 1)';
const OPEN_DURATION_MS = 480;
const RETURN_DURATION_MS = 430;
const POCKET_RETURN_DURATION_MS = 380;
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
  const [returningFlights, setReturningFlights] = useState<ReturningFlight[]>([]);

  const sectionRef = useRef<HTMLElement>(null);
  const folderHandleRef = useRef<FolderHandle>(null);
  const folderColumnRef = useRef<HTMLDivElement>(null);
  const cardContainerRef = useRef<HTMLDivElement>(null);
  const cardContentRef = useRef<HTMLDivElement>(null);
  const cardCoverRef = useRef<HTMLDivElement>(null);

  const flightNonceRef = useRef(0);
  const startedOpenNonceRef = useRef<number | null>(null);
  const pendingFolderRectRef = useRef<DOMRect | null>(null);
  const cardAnimationsRef = useRef<Animation[]>([]);
  const folderSlideAnimRef = useRef<Animation | null>(null);
  const returnFlightMapRef = useRef<Map<number, ReturningFlightNodes>>(new Map());

  const activeProject =
    activeProjectIndex !== null ? PROJECTS_DATA[activeProjectIndex] : null;

  const cancelAnimationList = useCallback((list: readonly Animation[]) => {
    for (const anim of list) {
      try {
        anim.cancel();
      } catch {
        // Ignore already finished/detached animations
      }
    }
  }, []);

  const cancelCardAndFolderAnimations = useCallback(() => {
    cancelAnimationList(cardAnimationsRef.current);
    cardAnimationsRef.current = [];
    if (folderSlideAnimRef.current) {
      try {
        folderSlideAnimRef.current.cancel();
      } catch {
        // Ignore detached animation
      }
      folderSlideAnimRef.current = null;
    }
  }, [cancelAnimationList]);

  useEffect(() => {
    const returnMap = returnFlightMapRef.current;
    return () => {
      cancelCardAndFolderAnimations();
      for (const entry of returnMap.values()) {
        cancelAnimationList(entry.animations);
      }
      returnMap.clear();
    };
  }, [cancelAnimationList, cancelCardAndFolderAnimations]);

  const getReturnFlightEntry = (nonce: number): ReturningFlightNodes => {
    let entry = returnFlightMapRef.current.get(nonce);
    if (!entry) {
      entry = {
        overlayEl: null,
        cardLayerEl: null,
        paperLayerEl: null,
        photoWrapEl: null,
        captionEl: null,
        animations: [],
        started: false,
        startedAt: 0,
        duration: RETURN_DURATION_MS,
        intoPocket: false,
      };
      returnFlightMapRef.current.set(nonce, entry);
    }
    return entry;
  };

  const closeActiveProject = useCallback(() => {
    if (activeProjectIndex === null) return;

    const reduce = prefersReducedMotion();
    const prevProject = PROJECTS_DATA[activeProjectIndex];
    // Measure live mid-flight visual rects BEFORE cancelling running animations
    const cardRect = cardContainerRef.current?.getBoundingClientRect();
    pendingFolderRectRef.current = folderColumnRef.current?.getBoundingClientRect() ?? null;
    cancelCardAndFolderAnimations();

    if (!reduce && prevProject && cardRect && cardRect.width > 0 && cardRect.height > 0) {
      flightNonceRef.current += 1;
      const nonce = flightNonceRef.current;
      setReturningFlights((prev) => [
        ...prev,
        {
          project: prevProject,
          index: activeProjectIndex,
          fromViewport: rectToBox(cardRect),
          nonce,
        },
      ]);
    }

    setOpeningFlight(null);
    setActiveProjectIndex(null);
  }, [activeProjectIndex, cancelCardAndFolderAnimations]);

  const handleFolderItemClick = useCallback(
    (_item: FolderItem, idx: number, snapshot: FolderItemSnapshot | null) => {
      if (idx < 0 || idx >= PROJECTS_DATA.length) return;

      if (activeProjectIndex === idx) {
        closeActiveProject();
        return;
      }

      const reduce = prefersReducedMotion();
      const prevIdx = activeProjectIndex;

      // Capture live visual rects BEFORE cancelling animations so interrupted flights never jump
      const cardRect = cardContainerRef.current?.getBoundingClientRect();
      pendingFolderRectRef.current = folderColumnRef.current?.getBoundingClientRect() ?? null;

      // If the newly clicked file was currently returning mid-air, catch it smoothly mid-flight
      let caughtMidAirSnapshot: FolderItemSnapshot | null = null;
      const midAirFlight = returningFlights.find((f) => f.index === idx);
      if (midAirFlight) {
        const entry = returnFlightMapRef.current.get(midAirFlight.nonce);
        const liveRect = entry?.overlayEl?.getBoundingClientRect();
        if (liveRect && liveRect.width > 0 && liveRect.height > 0) {
          caughtMidAirSnapshot = {
            ...rectToBox(liveRect),
            rotation: 0,
          };
        }
        if (entry) {
          cancelAnimationList(entry.animations);
          returnFlightMapRef.current.delete(midAirFlight.nonce);
        }
      }

      cancelCardAndFolderAnimations();

      flightNonceRef.current += 1;
      const nonce = flightNonceRef.current;

      setReturningFlights((prev) => {
        const filtered = prev.filter((f) => f.index !== idx);
        if (
          !reduce &&
          prevIdx !== null &&
          PROJECTS_DATA[prevIdx] &&
          cardRect &&
          cardRect.width > 0 &&
          cardRect.height > 0
        ) {
          return [
            ...filtered,
            {
              project: PROJECTS_DATA[prevIdx],
              index: prevIdx,
              fromViewport: rectToBox(cardRect),
              nonce,
            },
          ];
        }
        return filtered;
      });

      const sourceSnapshot =
        caughtMidAirSnapshot ?? snapshot ?? folderHandleRef.current?.getItemSnapshot(idx) ?? null;
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
    [
      activeProjectIndex,
      cancelAnimationList,
      cancelCardAndFolderAnimations,
      closeActiveProject,
      returningFlights,
    ]
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
    const shouldStartOpen =
      openingFlight !== null && startedOpenNonceRef.current !== openingFlight.nonce;

    const sectionRect = sectionRef.current?.getBoundingClientRect() ?? null;
    const prevFolderRect = pendingFolderRectRef.current;
    pendingFolderRectRef.current = null;
    const folderCol = folderColumnRef.current;
    const nextFolderRect = folderCol?.getBoundingClientRect() ?? null;
    const folderShiftDx =
      prevFolderRect && nextFolderRect ? prevFolderRect.left - nextFolderRect.left : 0;
    const folderShiftDy =
      prevFolderRect && nextFolderRect ? prevFolderRect.top - nextFolderRect.top : 0;
    const folderMoved = !reduce && Math.hypot(folderShiftDx, folderShiftDy) > 1;

    // 1. Measure & launch/retarget returning flights BEFORE applying folder column FLIP slide
    let activeReturnDuration = RETURN_DURATION_MS;
    for (const flight of returningFlights) {
      const entry = returnFlightMapRef.current.get(flight.nonce);
      const isNewFlight = Boolean(entry && !entry.started);
      const needsRetarget = Boolean(entry && entry.started && folderMoved);
      if (!entry || (!isNewFlight && !needsRetarget)) continue;

      let sourceViewport = flight.fromViewport;
      let remainingDuration = RETURN_DURATION_MS;
      if (needsRetarget) {
        const liveRect = entry.overlayEl?.getBoundingClientRect();
        if (liveRect && liveRect.width > 0 && liveRect.height > 0) {
          sourceViewport = rectToBox(liveRect);
        }
        const elapsedMs = performance.now() - entry.startedAt;
        remainingDuration = Math.max(180, entry.duration - elapsedMs);
        cancelAnimationList(entry.animations);
        entry.animations = [];
      }

      const target = !reduce
        ? folderHandleRef.current?.prepareItemReturn(flight.index) ?? null
        : null;
      const overlayEl = entry.overlayEl;

      if (
        !reduce &&
        sectionRect &&
        target &&
        overlayEl &&
        typeof overlayEl.animate === 'function'
      ) {
        entry.started = true;
        entry.intoPocket = target.intoPocket;
        const duration = needsRetarget
          ? remainingDuration
          : target.intoPocket
            ? POCKET_RETURN_DURATION_MS
            : RETURN_DURATION_MS;
        entry.duration = duration;
        entry.startedAt = performance.now();
        activeReturnDuration = duration;

        const fromLocal = toLocalBox(sourceViewport, sectionRect);
        const toLocal = toLocalBox(target, sectionRect);
        const safeToW = Math.max(1, toLocal.width);
        const safeToH = Math.max(1, toLocal.height);
        const sx = clamp(fromLocal.width / safeToW, 0.05, 12);
        const sy = clamp(fromLocal.height / safeToH, 0.05, 12);
        const dx = fromLocal.centerX - toLocal.centerX;
        const dy = fromLocal.centerY - toLocal.centerY;
        const u = target.unitScale;

        overlayEl.style.left = `${(toLocal.centerX - safeToW / 2).toFixed(2)}px`;
        overlayEl.style.top = `${(toLocal.centerY - safeToH / 2).toFixed(2)}px`;
        overlayEl.style.width = `${safeToW.toFixed(2)}px`;
        overlayEl.style.height = `${safeToH.toFixed(2)}px`;
        overlayEl.style.opacity = '1';

        if (entry.cardLayerEl) {
          entry.cardLayerEl.style.width = `${fromLocal.width.toFixed(2)}px`;
          entry.cardLayerEl.style.height = `${fromLocal.height.toFixed(2)}px`;
          entry.cardLayerEl.style.transformOrigin = '0 0';
          entry.cardLayerEl.style.transform = `scale(${(1 / sx).toFixed(5)}, ${(1 / sy).toFixed(5)})`;
        }

        if (entry.paperLayerEl) {
          entry.paperLayerEl.style.borderRadius = `${(7 * u).toFixed(2)}px`;
        }
        if (entry.photoWrapEl) {
          entry.photoWrapEl.style.inset = `${(5 * u).toFixed(2)}px`;
          entry.photoWrapEl.style.borderRadius = `${(3 * u).toFixed(2)}px`;
        }
        if (entry.captionEl) {
          entry.captionEl.style.padding = `${(6 * u).toFixed(2)}px`;
          entry.captionEl.style.fontSize = `${(9.5 * u).toFixed(2)}px`;
          entry.captionEl.style.borderBottomLeftRadius = `${(3 * u).toFixed(2)}px`;
          entry.captionEl.style.borderBottomRightRadius = `${(3 * u).toFixed(2)}px`;
        }

        const startTransform = `translate3d(${dx.toFixed(2)}px, ${dy.toFixed(2)}px, 0) rotate(${(fromLocal.rotation ?? 0).toFixed(2)}deg) scale(${sx.toFixed(4)}, ${sy.toFixed(4)})`;
        const endTransform = `translate3d(0px, 0px, 0) rotate(${(toLocal.rotation ?? 0).toFixed(2)}deg) scale(1, 1)`;

        const returnAnim = overlayEl.animate(
          [{ transform: startTransform }, { transform: endTransform }],
          {
            duration,
            easing: SMOOTH_EASING,
            fill: 'forwards',
          }
        );
        entry.animations.push(returnAnim);

        if (entry.cardLayerEl && typeof entry.cardLayerEl.animate === 'function') {
          entry.animations.push(
            entry.cardLayerEl.animate(
              [
                { opacity: needsRetarget ? 0 : 1, offset: 0 },
                { opacity: 0, offset: 0.58 },
                { opacity: 0, offset: 1 },
              ],
              {
                duration,
                easing: 'ease-out',
                fill: 'forwards',
              }
            )
          );
        }

        if (entry.paperLayerEl && typeof entry.paperLayerEl.animate === 'function') {
          entry.animations.push(
            entry.paperLayerEl.animate(
              [
                { opacity: needsRetarget ? 1 : 0, offset: 0 },
                { opacity: needsRetarget ? 1 : 0.88, offset: 0.36 },
                { opacity: 1, offset: 0.72 },
                { opacity: 1, offset: 1 },
              ],
              {
                duration,
                easing: 'ease-out',
                fill: 'forwards',
              }
            )
          );
        }

        const flightNonce = flight.nonce;
        const flightIndex = flight.index;
        const intoPocket = target.intoPocket;
        returnAnim.onfinish = () => {
          returnFlightMapRef.current.delete(flightNonce);
          folderHandleRef.current?.completeItemReturn(flightIndex, intoPocket);
          setReturningFlights((current) => current.filter((f) => f.nonce !== flightNonce));
        };
      } else {
        const flightNonce = flight.nonce;
        const flightIndex = flight.index;
        returnFlightMapRef.current.delete(flightNonce);
        queueMicrotask(() => {
          folderHandleRef.current?.completeItemReturn(flightIndex, false);
          setReturningFlights((current) => current.filter((f) => f.nonce !== flightNonce));
        });
      }
    }

    // 2. Smoothly slide the folder column synchronized with the active card flight
    if (folderMoved && folderCol && typeof folderCol.animate === 'function') {
      const slideDuration = shouldStartOpen ? OPEN_DURATION_MS : activeReturnDuration;
      const slideAnim = folderCol.animate(
        [
          { transform: `translate3d(${folderShiftDx.toFixed(2)}px, ${folderShiftDy.toFixed(2)}px, 0)` },
          { transform: 'translate3d(0px, 0px, 0)' },
        ],
        {
          duration: slideDuration,
          easing: SMOOTH_EASING,
        }
      );
      folderSlideAnimRef.current = slideAnim;
      slideAnim.onfinish = () => {
        if (folderSlideAnimRef.current === slideAnim) {
          folderSlideAnimRef.current = null;
        }
      };
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
        cardAnimationsRef.current.push(openAnim);

        const coverEl = cardCoverRef.current;
        if (coverEl && typeof coverEl.animate === 'function') {
          cardAnimationsRef.current.push(
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
          cardAnimationsRef.current.push(
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
          cardAnimationsRef.current = [];
          setOpeningFlight((current) => (current?.nonce === flightNonce ? null : current));
        };
      } else {
        const flightNonce = openingFlight.nonce;
        queueMicrotask(() => {
          setOpeningFlight((current) => (current?.nonce === flightNonce ? null : current));
        });
      }
    }
  }, [cancelAnimationList, openingFlight, returningFlights]);

  const inFlightIndices = useMemo(() => {
    const indices = new Set<number>();
    if (openingFlight) indices.add(openingFlight.index);
    for (const flight of returningFlights) {
      indices.add(flight.index);
    }
    return Array.from(indices);
  }, [openingFlight, returningFlights]);

  return (
    <section ref={sectionRef} id="projects" className="py-24 relative">
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
            className="w-full max-w-[440px] flex flex-col items-center justify-center relative z-10 overflow-visible"
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

      {/* Returning File Overlays: smoothly fold closed/switched cards back into their folder slots */}
      {returningFlights.map((flight) => (
        <div
          key={flight.nonce}
          ref={(node) => {
            getReturnFlightEntry(flight.nonce).overlayEl = node;
          }}
          aria-hidden="true"
          className="absolute top-0 left-0 z-20 opacity-0 pointer-events-none origin-center will-change-transform"
        >
          {/* Counter-scaled 1:1 dark card layer at t=0 that fades out during flight */}
          <div
            ref={(node) => {
              getReturnFlightEntry(flight.nonce).cardLayerEl = node;
            }}
            className="absolute top-0 left-0 rounded-2xl border border-white/10 bg-[#111116] shadow-2xl overflow-hidden"
          >
            <div className="relative bg-zinc-950 h-28 sm:h-32 overflow-hidden border-b border-white/10">
              <img
                src={flight.project.image}
                alt=""
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-zinc-950/20 to-transparent" />
            </div>
            <div className="p-4">
              <p className="text-base sm:text-lg font-bold text-white truncate">
                {flight.project.title}
              </p>
              <p className="text-[11px] font-medium text-purple-300 truncate mt-0.5">
                {flight.project.subtitle}
              </p>
              <p className="text-xs text-zinc-300 leading-relaxed line-clamp-2 mt-1.5">
                {flight.project.description}
              </p>
            </div>
          </div>

          {/* 1:1 paper-file layer matching .folder-item geometry at t=1 for seamless handoff */}
          <div
            ref={(node) => {
              getReturnFlightEntry(flight.nonce).paperLayerEl = node;
            }}
            className="absolute inset-0 bg-white opacity-0 shadow-md overflow-hidden"
          >
            <div
              ref={(node) => {
                getReturnFlightEntry(flight.nonce).photoWrapEl = node;
              }}
              className="absolute overflow-hidden bg-zinc-950"
            >
              <img
                src={flight.project.image}
                alt=""
                className="block w-full h-full object-cover"
              />
              <div
                ref={(node) => {
                  getReturnFlightEntry(flight.nonce).captionEl = node;
                }}
                className="absolute inset-x-0 bottom-0 text-center text-white font-bold whitespace-nowrap overflow-hidden text-ellipsis box-border"
                style={{
                  background:
                    'linear-gradient(to top, rgba(9, 9, 11, 0.96) 0%, rgba(9, 9, 11, 0.82) 65%, transparent 100%)',
                  letterSpacing: '-0.01em',
                  lineHeight: 1.2,
                  textShadow: '0 1px 3px rgba(0, 0, 0, 0.95)',
                }}
              >
                <span>{flight.project.title}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}
