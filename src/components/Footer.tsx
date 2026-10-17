import { ArrowUp, Mail, Lock } from 'lucide-react';
import { GithubIcon, LinkedinIcon } from './Icons';
import {
  sanitizeExternalUrl,
  sanitizeInternalRoute,
  sanitizeMailtoUrl,
} from '../lib/security';

const FOOTER_GITHUB_URL =
  sanitizeExternalUrl('https://github.com/ElXprogramming', ['github.com']) ?? '#';
const FOOTER_LINKEDIN_URL =
  sanitizeExternalUrl('https://www.linkedin.com/in/eldion-ryan-godius-897064235', [
    'www.linkedin.com',
  ]) ?? '#';
const FOOTER_MAILTO_URL = sanitizeMailtoUrl('nayrnoidle@gmail.com');
const FOOTER_INBOX_ROUTE = sanitizeInternalRoute('#inbox');

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="border-t border-slate-800/80 bg-slate-950/70 backdrop-blur-md py-12 relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          
          {/* Logo & Bio info */}
          <div className="flex items-center gap-3">
            <a
              href={FOOTER_INBOX_ROUTE}
              className="w-8 h-8 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-center font-bold text-sm text-purple-300 hover:scale-105 transition-transform"
              title="EG Portal"
            >
              EG
            </a>
            <div>
              <div className="text-sm font-bold text-white">Eldion Ryan Godius</div>
              <div className="text-xs text-slate-300">Software Engineering Student @ UMS</div>
            </div>
          </div>

          {/* Center Navigation */}
          <div className="flex flex-wrap justify-center gap-6 text-xs text-slate-300">
            <a href={sanitizeInternalRoute('#about')} className="hover:text-white transition-colors">About</a>
            <a href={sanitizeInternalRoute('#skills')} className="hover:text-white transition-colors">Skills</a>
            <a href={sanitizeInternalRoute('#projects')} className="hover:text-white transition-colors">Projects</a>
            <a href={sanitizeInternalRoute('#education')} className="hover:text-white transition-colors">Education</a>
            <a href={sanitizeInternalRoute('#contact')} className="hover:text-white transition-colors">Contact</a>
          </div>

          {/* Socials & Back to Top */}
          <div className="flex items-center gap-3">
            <a
              href={FOOTER_GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
              aria-label="GitHub Profile"
            >
              <GithubIcon className="w-4 h-4" />
            </a>
            <a
              href={FOOTER_LINKEDIN_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
              aria-label="LinkedIn Profile"
            >
              <LinkedinIcon className="w-4 h-4" />
            </a>
            <a
              href={FOOTER_MAILTO_URL}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
              aria-label="Send Email"
            >
              <Mail className="w-4 h-4" />
            </a>

            <button
              onClick={scrollToTop}
              className="p-2 rounded-lg bg-purple-600/20 border border-purple-500/30 text-purple-300 hover:bg-purple-600 hover:text-white transition-all ml-2 cursor-pointer"
              aria-label="Scroll to top"
              title="Back to top"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>

        </div>

        <div className="mt-8 pt-8 border-t border-slate-900 text-center text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© {new Date().getFullYear()} Eldion Ryan Godius. All rights reserved.</p>
          <div className="flex items-center gap-2 text-slate-400">
            <span>Built with React, TypeScript &amp; Tailwind CSS</span>
            <a
              href="#inbox"
              className="opacity-25 hover:opacity-100 hover:text-purple-400 transition-all p-1"
              title="Secret Messages Inbox"
              aria-label="Secret Inbox"
            >
              <Lock className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
