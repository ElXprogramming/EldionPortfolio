import {
  useState,
  useEffect,
  useRef,
  useCallback,
  lazy,
  Suspense,
  type ReactNode,
} from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import About from './components/About';
import Skills from './components/Skills';
import Footer from './components/Footer';
import ErrorBoundary from './components/ErrorBoundary';
import { resolveAppView } from './lib/urlSecurity';

const Projects = lazy(() => import('./components/Projects'));
const Contact = lazy(() => import('./components/Contact'));
const SecretInbox = lazy(() => import('./components/SecretInbox'));

function getCurrentView(): 'home' | 'inbox' {
  return resolveAppView(window.location.hash, window.location.pathname);
}

interface DeferredSectionProps {
  id: string;
  fallbackTitle: string;
  minHeightClass: string;
  forceLoad: boolean;
  children: ReactNode;
}

function DeferredSection({
  id,
  fallbackTitle,
  minHeightClass,
  forceLoad,
  children,
}: DeferredSectionProps) {
  const [inView, setInView] = useState(() => {
    if (typeof window === 'undefined') return true;
    return window.location.hash.toLowerCase() === `#${id}`;
  });
  const sentinelRef = useRef<HTMLElement>(null);
  const shouldMount = inView || forceLoad;

  useEffect(() => {
    if (shouldMount) return undefined;
    const node = sentinelRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      return undefined;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '450px 0px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [shouldMount]);

  if (!shouldMount) {
    return (
      <section
        id={id}
        ref={sentinelRef}
        className={`${minHeightClass} section-defer`}
        aria-busy="true"
      />
    );
  }

  return (
    <ErrorBoundary fallbackTitle={fallbackTitle}>
      <Suspense
        fallback={
          <section id={id} className={`${minHeightClass} flex items-center justify-center`}>
            <div className="w-8 h-8 rounded-full border-2 border-purple-500/30 border-t-purple-400 animate-spin" />
          </section>
        }
      >
        {children}
      </Suspense>
    </ErrorBoundary>
  );
}

export default function App() {
  const [activeSection, setActiveSection] = useState('hero');
  const [currentView, setCurrentView] = useState<'home' | 'inbox'>(getCurrentView);
  const [requestedSections, setRequestedSections] = useState<ReadonlySet<string>>(() => {
    const initial = new Set<string>();
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace('#', '').toLowerCase();
      if (hash) initial.add(hash);
    }
    return initial;
  });
  const mainRef = useRef<HTMLElement>(null);

  const handleNavigate = useCallback((sectionId: string) => {
    setRequestedSections((prev) => {
      if (prev.has(sectionId)) return prev;
      const next = new Set(prev);
      next.add(sectionId);
      return next;
    });
  }, []);

  useEffect(() => {
    const handleNavigation = () => {
      setCurrentView(getCurrentView());
      const hash = window.location.hash.replace('#', '').toLowerCase();
      if (hash) {
        setRequestedSections((prev) => {
          if (prev.has(hash)) return prev;
          const next = new Set(prev);
          next.add(hash);
          return next;
        });
      }
    };

    window.addEventListener('hashchange', handleNavigation);
    window.addEventListener('popstate', handleNavigation);

    // Secret shortcut: Alt + A or Ctrl + Shift + A to open secret inbox
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a') ||
        (e.altKey && e.key.toLowerCase() === 'a')
      ) {
        e.preventDefault();
        window.location.hash = '#inbox';
        setCurrentView('inbox');
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('hashchange', handleNavigation);
      window.removeEventListener('popstate', handleNavigation);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (currentView === 'inbox') return;

    const observed = new WeakSet<Element>();
    let intersectionObserver: IntersectionObserver | null = null;
    let mutationObserver: MutationObserver | null = null;

    const observeSections = () => {
      if (!intersectionObserver) return;
      document.querySelectorAll('section[id]').forEach((section) => {
        if (!observed.has(section)) {
          observed.add(section);
          intersectionObserver?.observe(section);
        }
      });
    };

    if (typeof IntersectionObserver !== 'undefined') {
      intersectionObserver = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              setActiveSection(entry.target.id);
              break;
            }
          }
        },
        {
          rootMargin: '-20% 0px -65% 0px',
          threshold: 0,
        }
      );

      observeSections();

      // Deterministically observe lazy-loaded sections as soon as they mount
      if (typeof MutationObserver !== 'undefined' && mainRef.current) {
        mutationObserver = new MutationObserver(observeSections);
        mutationObserver.observe(mainRef.current, { childList: true, subtree: true });
      }
    }

    let rafId = 0;
    const handleScroll = () => {
      if (rafId) return;
      rafId = window.requestAnimationFrame(() => {
        if (window.scrollY < 80) {
          setActiveSection('hero');
        }
        rafId = 0;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      mutationObserver?.disconnect();
      intersectionObserver?.disconnect();
      window.removeEventListener('scroll', handleScroll);
    };
  }, [currentView]);

  if (currentView === 'inbox') {
    return (
      <ErrorBoundary fallbackTitle="Inbox display issue">
        <Suspense
          fallback={
            <div className="min-h-screen bg-[#09090b] text-purple-300 flex items-center justify-center">
              <div className="flex items-center gap-2 text-sm font-medium animate-pulse">
                <span>Loading Secret Inbox...</span>
              </div>
            </div>
          }
        >
          <SecretInbox
            onBackToHome={() => {
              window.history.replaceState(null, '', '/');
              setCurrentView('home');
            }}
          />
        </Suspense>
      </ErrorBoundary>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col selection:bg-purple-600/30 selection:text-purple-200 relative">
      {/* Left-side docked navigation using BranchedMenu */}
      <Navbar activeSection={activeSection} onNavigate={handleNavigate} />

      {/* Main content area: clears the fixed left navbar across all desktop breakpoints */}
      <main ref={mainRef} className="flex-grow relative z-10 w-full px-4 sm:px-6 lg:pl-56 lg:pr-8 2xl:px-56">
        <ErrorBoundary fallbackTitle="Hero display issue">
          <Hero />
        </ErrorBoundary>
        <About />
        <Skills />
        <DeferredSection
          id="projects"
          fallbackTitle="Projects display issue"
          minHeightClass="min-h-[520px]"
          forceLoad={requestedSections.has('projects')}
        >
          <Projects />
        </DeferredSection>
        <DeferredSection
          id="contact"
          fallbackTitle="Contact display issue"
          minHeightClass="min-h-[420px]"
          forceLoad={requestedSections.has('contact')}
        >
          <Contact />
        </DeferredSection>
      </main>

      <div className="relative z-10 w-full px-4 sm:px-6 lg:pl-56 lg:pr-8 2xl:px-56">
        <Footer />
      </div>
    </div>
  );
}
