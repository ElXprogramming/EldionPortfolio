import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import About from './components/About';
import Skills from './components/Skills';
import Projects from './components/Projects';
import Education from './components/Education';
import Contact from './components/Contact';
import Footer from './components/Footer';
import SecretInbox from './components/SecretInbox';
import PixelBlast from './components/PixelBlast';

export default function App() {
  const [activeSection, setActiveSection] = useState('hero');
  const [currentView, setCurrentView] = useState<'home' | 'inbox'>(() => {
    const hash = window.location.hash.toLowerCase();
    const path = window.location.pathname.toLowerCase();
    return hash === '#inbox' ||
      hash === '#admin' ||
      hash === '#secret-inbox' ||
      path === '/inbox' ||
      path === '/admin'
      ? 'inbox'
      : 'home';
  });

  useEffect(() => {
    const handleNavigation = () => {
      const hash = window.location.hash.toLowerCase();
      const path = window.location.pathname.toLowerCase();
      if (
        hash === '#inbox' ||
        hash === '#admin' ||
        hash === '#secret-inbox' ||
        path === '/inbox' ||
        path === '/admin'
      ) {
        setCurrentView('inbox');
      } else {
        setCurrentView('home');
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

    const sections = document.querySelectorAll('section[id]');
    
    const handleScroll = () => {
      const scrollY = window.scrollY;

      sections.forEach((section) => {
        const el = section as HTMLElement;
        const sectionTop = el.offsetTop - 120;
        const sectionHeight = el.offsetHeight;
        const sectionId = el.getAttribute('id') || '';

        if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
          setActiveSection(sectionId);
        }
      });

      if (scrollY < 100) {
        setActiveSection('');
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [currentView]);

  if (currentView === 'inbox') {
    return (
      <SecretInbox
        onBackToHome={() => {
          window.location.hash = '';
          setCurrentView('home');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#080511] text-slate-100 flex flex-col selection:bg-[#B497CF]/30 selection:text-purple-200 relative">
      {/* Whole-page Fixed Background Canvas & Soft Atmospheric Lighting */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
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
        <Projects />
        <Education />
        <Contact />
      </main>

      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  );
}
