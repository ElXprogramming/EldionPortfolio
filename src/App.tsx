import { useState, useEffect, lazy, Suspense } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import About from './components/About';
import Skills from './components/Skills';
import Education from './components/Education';
import Footer from './components/Footer';
import { sanitizeInternalRoute } from './lib/security';
import { shouldEnableHeavyVisuals } from './lib/device';

const Projects = lazy(() => import('./components/Projects'));
const Contact = lazy(() => import('./components/Contact'));
const PixelBlast = lazy(() => import('./components/PixelBlast'));
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
  const [shouldRenderBg, setShouldRenderBg] = useState(false);

  useEffect(() => {
    // Only load heavy background WebGL if device is capable (skip on low-end, slow networks, data saver, or reduced motion)
    if (typeof window !== 'undefined') {
      if (!shouldEnableHeavyVisuals()) {
        return;
      }

      if ('requestIdleCallback' in window) {
        const id = (window as unknown as { requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => number }).requestIdleCallback(
          () => {
            setShouldRenderBg(true);
          },
          { timeout: 800 }
        );
        return () => {
          if ('cancelIdleCallback' in window) {
            (window as unknown as { cancelIdleCallback: (n: number) => void }).cancelIdleCallback(id);
          }
        };
      } else {
        const timer = setTimeout(() => {
          setShouldRenderBg(true);
        }, 120);
        return () => clearTimeout(timer);
      }
    }
  }, []);

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
            setActiveSection('');
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
          <div className="min-h-screen bg-slate-950 text-purple-300 flex items-center justify-center">
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
    <div className="min-h-screen bg-[#080511] text-slate-100 flex flex-col selection:bg-[#B497CF]/30 selection:text-purple-200 relative">
      {/* Whole-page Fixed Background Canvas & Soft Atmospheric Lighting */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" style={{ transform: 'translateZ(0)' }}>
        {shouldRenderBg && (
          <Suspense fallback={null}>
            <PixelBlast
              variant="circle"
              pixelSize={6}
              color="#B497CF"
              patternScale={3}
              patternDensity={1.2}
              pixelSizeJitter={0.5}
              enableRipples
              rippleSpeed={0.4}
              rippleThickness={0.12}
              rippleIntensityScale={1.5}
              liquid
              liquidStrength={0.12}
              liquidRadius={1.2}
              liquidWobbleSpeed={5}
              speed={0.5}
              edgeFade={0.25}
              transparent
            />
          </Suspense>
        )}

        {/* Ambient atmospheric glow orbs positioned across the page height */}
        <div className="absolute top-[5%] left-[10%] w-[500px] h-[500px] bg-purple-700/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-[40%] right-[5%] w-[600px] h-[600px] bg-indigo-700/10 rounded-full blur-[160px] pointer-events-none" />
        <div className="absolute top-[75%] left-[15%] w-[550px] h-[550px] bg-purple-600/10 rounded-full blur-[150px] pointer-events-none" />
      </div>

      <Navbar activeSection={activeSection} />
      
      <main className="flex-grow relative z-10">
        <Hero />
        <About />
        <Skills />
        <Suspense
          fallback={
            <div id="projects" className="min-h-[500px] flex items-center justify-center">
              <div className="w-8 h-8 rounded-full border-2 border-purple-500/30 border-t-purple-400 animate-spin" />
            </div>
          }
        >
          <Projects />
        </Suspense>
        <Education />
        <Suspense
          fallback={
            <div id="contact" className="min-h-[400px] flex items-center justify-center">
              <div className="w-8 h-8 rounded-full border-2 border-purple-500/30 border-t-purple-400 animate-spin" />
            </div>
          }
        >
          <Contact />
        </Suspense>
      </main>

      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  );
}
