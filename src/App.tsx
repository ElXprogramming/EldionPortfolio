import { useState, useEffect, lazy, Suspense } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import About from './components/About';
import Skills from './components/Skills';
import Footer from './components/Footer';
import ErrorBoundary from './components/ErrorBoundary';
import Lanyard from './components/Lanyard';
import eldionPortrait from './assets/eldion-portrait.webp';
import { sanitizeInternalRoute } from './lib/security';

const Projects = lazy(() => import('./components/Projects'));
const Contact = lazy(() => import('./components/Contact'));
const SecretInbox = lazy(() => import('./components/SecretInbox'));

function resolveCurrentView(): 'home' | 'inbox' {
  const safeHash = sanitizeInternalRoute(window.location.hash.toLowerCase());
  const safePath = sanitizeInternalRoute(window.location.pathname.toLowerCase());
  return safeHash === '#inbox' ||
    safeHash === '#admin' ||
    safeHash === '#secret-inbox' ||
    safePath === '/inbox' ||
    safePath === '/admin'
    ? 'inbox'
    : 'home';
}

export default function App() {
  const [activeSection, setActiveSection] = useState('hero');
  const [currentView, setCurrentView] = useState<'home' | 'inbox'>(resolveCurrentView);

  useEffect(() => {
    const handleNavigation = () => {
      setCurrentView(resolveCurrentView());
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

    let observer: IntersectionObserver | null = null;

    const setupObserver = () => {
      if (typeof IntersectionObserver === 'undefined') return;
      observer?.disconnect();
      observer = new IntersectionObserver(
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

      document.querySelectorAll('section[id]').forEach((section) => observer?.observe(section));
    };

    setupObserver();

    // Re-check observed sections after lazy components hydrate
    const observerTimer = setTimeout(setupObserver, 800);

    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (window.scrollY < 80) {
            setActiveSection('hero');
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      clearTimeout(observerTimer);
      observer?.disconnect();
      window.removeEventListener('scroll', handleScroll);
    };
  }, [currentView]);

  if (currentView === 'inbox') {
    return (
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
            if (window.location.pathname !== '/') {
              window.history.replaceState(null, '', '/');
            }
            window.location.hash = '';
            setCurrentView('home');
          }}
        />
      </Suspense>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col selection:bg-purple-600/30 selection:text-purple-200 relative">
      {/* Interactive 3D Lanyard Card - full window visibility across the entire site behind texts */}
      <div
        className="fixed inset-0 w-full h-full pointer-events-none z-0"
        aria-label="Interactive 3D Profile Card hanging on lanyard"
      >
        <Lanyard
          frontImage={eldionPortrait}
          backImage={eldionPortrait}
          cardColor="#141419"
          strapColor="#27272a"
          finish="glossy"
          metal="silver"
          size={0.28}
          anchor="right"
          strapLength={0.45}
          interactive={true}
          breeze={0.25}
        />
      </div>

      {/* Left-side docked navigation using BranchedMenu */}
      <Navbar activeSection={activeSection} />
      
      {/* Main content area: centered horizontally with symmetrical clearance so it never touches the left navbar */}
      <main className="flex-grow relative z-10 w-full px-4 sm:px-6 lg:px-56 2xl:px-8">
        <ErrorBoundary fallbackTitle="Hero display issue">
          <Hero />
        </ErrorBoundary>
        <About />
        <Skills />
        <ErrorBoundary fallbackTitle="Projects display issue">
          <Suspense
            fallback={
              <div id="projects" className="min-h-[500px] flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-2 border-purple-500/30 border-t-purple-400 animate-spin" />
              </div>
            }
          >
            <Projects />
          </Suspense>
        </ErrorBoundary>
        <ErrorBoundary fallbackTitle="Contact display issue">
          <Suspense
            fallback={
              <div id="contact" className="min-h-[400px] flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-2 border-purple-500/30 border-t-purple-400 animate-spin" />
              </div>
            }
          >
            <Contact />
          </Suspense>
        </ErrorBoundary>
      </main>

      <div className="relative z-10 w-full px-4 sm:px-6 lg:px-56 2xl:px-8">
        <Footer />
      </div>
    </div>
  );
}
