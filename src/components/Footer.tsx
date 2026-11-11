import { ArrowUp, Lock } from 'lucide-react';
import { PROFILE, ROUTES } from '../lib/constants';

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="border-t border-white/10 py-8 relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-zinc-200 tracking-wide">{PROFILE.name}</p>
            <p className="text-xs text-zinc-400 mt-1 flex items-center gap-1.5">
              <span>&copy; 2026 &bull; Built with Antigravity</span>
              <a
                href={ROUTES.inbox}
                className="opacity-20 hover:opacity-100 hover:text-purple-400 transition-opacity p-0.5 ml-1 inline-flex items-center"
                title="Secret Messages Inbox"
                aria-label="Secret Inbox"
              >
                <Lock className="w-3 h-3" />
              </a>
            </p>
          </div>

          <button
            type="button"
            onClick={scrollToTop}
            className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer"
            aria-label="Scroll to top"
            title="Scroll to top"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        </div>
      </div>
    </footer>
  );
}
