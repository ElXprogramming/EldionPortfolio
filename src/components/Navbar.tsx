import { useState, useEffect } from 'react';
import {
  Home,
  User,
  Layers,
  FolderGit2,
  GraduationCap,
  Mail,
  Send,
  Menu,
  X
} from 'lucide-react';
import { GithubIcon, LinkedinIcon } from './Icons';
import BranchedMenu, { type BranchedMenuItem } from './BranchedMenu';
import { PROFILE, EXTERNAL_LINKS } from '../lib/constants';
import { copyToClipboard } from '../lib/security';

interface NavbarProps {
  activeSection: string;
}

export default function Navbar({ activeSection }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [copiedNotice, setCopiedNotice] = useState(false);

  // Close mobile drawer on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSelect = (value: string) => {
    if (value === 'github') {
      window.open(EXTERNAL_LINKS.github, '_blank', 'noopener,noreferrer');
      return;
    }
    if (value === 'linkedin') {
      window.open(EXTERNAL_LINKS.linkedin, '_blank', 'noopener,noreferrer');
      return;
    }
    if (value === 'email') {
      copyToClipboard(PROFILE.email);
      setCopiedNotice(true);
      setTimeout(() => setCopiedNotice(false), 2000);
      return;
    }
    if (value === 'inbox') {
      window.location.hash = '#inbox';
      return;
    }

    // Scroll to section
    const target = document.getElementById(value);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
      if (window.history.pushState) {
        window.history.pushState(null, '', `#${value}`);
      }
    }
    setMobileOpen(false);
  };

  const menuItems: BranchedMenuItem[] = [
    {
      label: 'Navigation',
      children: [
        { value: 'hero', label: 'Home', icon: Home },
        { value: 'about', label: 'About', icon: User },
        { value: 'skills', label: 'Skills', icon: Layers },
        { value: 'projects', label: 'Projects', icon: FolderGit2 },
        { value: 'education', label: 'Education', icon: GraduationCap },
        { value: 'contact', label: 'Contact', icon: Mail }
      ]
    },
    {
      label: 'Connect',
      children: [
        { value: 'github', label: 'GitHub', icon: GithubIcon },
        { value: 'linkedin', label: 'LinkedIn', icon: LinkedinIcon },
        { value: 'email', label: copiedNotice ? 'Copied!' : 'Copy Email', icon: Send }
      ]
    }
  ];

  return (
    <>
      {/* Desktop Right-Side Branched Navbar */}
      <aside
        aria-label="Right side navigation"
        className="hidden lg:block fixed right-6 top-1/2 -translate-y-1/2 z-50 pointer-events-auto"
      >
        <div className="bg-[#0c0c11]/85 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-2xl shadow-black/60 transition-all hover:border-white/20">
          {/* Subtle branding title */}
          <div className="flex items-center justify-between pb-3 mb-2 border-b border-white/10 text-xs">
            <span className="font-bold text-white tracking-wide">{PROFILE.initials}</span>
            <span className="text-[10px] text-zinc-400 font-mono">PORTFOLIO</span>
          </div>

          <BranchedMenu
            items={menuItems}
            defaultOpen={[0, 1]}
            defaultActive={activeSection || 'hero'}
            onSelect={handleSelect}
            color="#e4e4e7"
            accentColor="#c084fc"
            lineColor="#27272a"
            width={210}
            rowHeight={32}
            indent={36}
            trunk={12}
            radius={8}
            fontSize={13}
            drawDuration={300}
            foldDuration={250}
          />

          {copiedNotice && (
            <div className="mt-2 text-center text-[11px] text-emerald-400 font-medium animate-pulse">
              Email copied to clipboard!
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Top Bar with Right-Side Menu Toggle */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[#09090b]/90 backdrop-blur-md border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <a href="#" className="font-bold text-sm tracking-wide text-white">
          {PROFILE.name}
        </a>
        <button
          type="button"
          onClick={() => setMobileOpen(prev => !prev)}
          className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white"
          aria-label="Toggle navigation menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Right-Side Drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div className="fixed top-0 right-0 bottom-0 w-72 bg-[#0c0c11] border-l border-white/10 p-6 flex flex-col justify-between shadow-2xl overflow-y-auto">
            <div>
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
                <span className="font-bold text-white text-base">{PROFILE.name}</span>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <BranchedMenu
                items={menuItems}
                defaultOpen={[0, 1]}
                defaultActive={activeSection || 'hero'}
                onSelect={handleSelect}
                color="#e4e4e7"
                accentColor="#c084fc"
                lineColor="#27272a"
                width={240}
                rowHeight={36}
                indent={40}
                trunk={14}
                radius={10}
                fontSize={14}
              />
            </div>

            <div className="pt-6 border-t border-white/10 text-xs text-zinc-400 text-center">
              <span>{PROFILE.role}</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
