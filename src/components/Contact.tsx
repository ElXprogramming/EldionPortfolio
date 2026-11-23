import { useState, useRef, useEffect, type ComponentType, type FormEvent } from 'react';
import {
  Mail,
  Send,
  Copy,
  Check,
  Sparkles,
  ArrowUpRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { GithubIcon, LinkedinIcon } from './Icons';
import { createSafeErrorMessage, copyToClipboard } from '../lib/urlSecurity';
import { PROFILE, EXTERNAL_LINKS } from '../lib/constants';
import BorderGlow from './BorderGlow';

const EMAIL_GLOW_COLORS = ['#fb7185', '#f472b6', '#c084fc'] as const;

interface SocialCardConfig {
  label: string;
  displayValue: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  glowColor: string;
  colors: readonly [string, string, string];
  focusRingClass: string;
  iconBoxClass: string;
  arrowHoverClass: string;
  valueHoverClass: string;
}

const SOCIAL_CARDS: readonly SocialCardConfig[] = [
  {
    label: 'LinkedIn',
    displayValue: PROFILE.name,
    href: EXTERNAL_LINKS.linkedin,
    icon: LinkedinIcon,
    glowColor: '205 90 72',
    colors: ['#38bdf8', '#60a5fa', '#818cf8'],
    focusRingClass: 'focus-visible:ring-sky-400/70',
    iconBoxClass: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
    arrowHoverClass: 'group-hover:bg-sky-500/10 group-hover:text-sky-300',
    valueHoverClass: 'group-hover:text-sky-300',
  },
  {
    label: 'GitHub',
    displayValue: `@${PROFILE.githubUsername}`,
    href: EXTERNAL_LINKS.github,
    icon: GithubIcon,
    glowColor: '275 85 75',
    colors: ['#c084fc', '#a855f7', '#38bdf8'],
    focusRingClass: 'focus-visible:ring-purple-400/70',
    iconBoxClass: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    arrowHoverClass: 'group-hover:bg-purple-500/10 group-hover:text-purple-300',
    valueHoverClass: 'group-hover:text-purple-300',
  },
];

const INITIAL_FORM_DATA = {
  name: '',
  email: '',
  subject: '',
  message: '',
};

const INPUT_CLASSES =
  'w-full px-4 py-2.5 rounded-xl bg-[#141419] border border-white/10 text-sm text-white placeholder-zinc-500 focus:outline-hidden focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors disabled:opacity-50 font-mono';

export default function Contact() {
  const [copiedEmail, setCopiedEmail] = useState(false);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  const handleCopyEmail = async () => {
    const success = await copyToClipboard(PROFILE.email);
    if (success) {
      setCopiedEmail(true);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopiedEmail(false), 2500);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');
    setStatusMessage('');

    try {
      const { submitContactMessage } = await import('../lib/supabase');
      await submitContactMessage(formData);
      setSubmitStatus('success');
      setStatusMessage('Thank you! Your message has been sent directly to Eldion.');
      setFormData(INITIAL_FORM_DATA);
    } catch (err: unknown) {
      setSubmitStatus('error');
      setStatusMessage(
        createSafeErrorMessage(
          err,
          'Unable to send message right now. You can reach out directly via email.'
        )
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contact" className="py-24 relative section-defer">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-left max-w-2xl mb-8 sm:mb-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Get in Touch
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-zinc-400">
            Open to internships, software engineering roles, and project discussions.
          </p>
        </div>

        {/* Symmetrical 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-stretch">
          {/* Direct Contact Cards (Left Column) */}
          <div className="flex flex-col justify-between gap-4 w-full max-w-[420px]">
            {/* Email Box */}
            <BorderGlow
              className="flex-1"
              innerClassName="p-5 sm:p-6 justify-between min-h-[115px] sm:min-h-[125px]"
              backgroundColor="#111116"
              borderRadius={16}
              glowRadius={30}
              glowIntensity={0.9}
              edgeSensitivity={25}
              coneSpread={25}
              glowColor="345 85 75"
              colors={EMAIL_GLOW_COLORS}
              fillOpacity={0.35}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <button
                  type="button"
                  onClick={handleCopyEmail}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors cursor-pointer border border-white/5"
                  title="Copy email to clipboard"
                  aria-label="Copy email to clipboard"
                >
                  {copiedEmail ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
              <div>
                <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider font-mono">
                  Email
                </div>
                <a
                  href={EXTERNAL_LINKS.mailto}
                  className="text-sm sm:text-base font-semibold text-white hover:text-purple-400 transition-colors truncate block mt-0.5"
                >
                  {PROFILE.email}
                </a>
              </div>
            </BorderGlow>

            {/* Social Profile Boxes */}
            {SOCIAL_CARDS.map((card) => {
              const Icon = card.icon;
              return (
                <BorderGlow
                  key={card.label}
                  className="flex-1"
                  backgroundColor="#111116"
                  borderRadius={16}
                  glowRadius={30}
                  glowIntensity={0.9}
                  edgeSensitivity={25}
                  coneSpread={25}
                  glowColor={card.glowColor}
                  colors={card.colors}
                  fillOpacity={0.35}
                >
                  <a
                    href={card.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`p-5 sm:p-6 flex-1 flex flex-col justify-between min-h-[115px] sm:min-h-[125px] group cursor-pointer focus-visible:outline-none focus-visible:ring-2 ${card.focusRingClass} rounded-[15px]`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className={`p-2.5 rounded-xl border shrink-0 ${card.iconBoxClass}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div
                        className={`p-2 rounded-xl bg-white/5 text-zinc-400 transition-colors border border-white/5 ${card.arrowHoverClass}`}
                      >
                        <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider font-mono">
                        {card.label}
                      </div>
                      <div
                        className={`text-sm sm:text-base font-semibold text-white transition-colors truncate mt-0.5 ${card.valueHoverClass}`}
                      >
                        {card.displayValue}
                      </div>
                    </div>
                  </a>
                </BorderGlow>
              );
            })}
          </div>

          {/* Quick Interactive Message Form (Right Column) */}
          <BorderGlow
            className="w-full max-w-[480px] lg:ml-auto"
            innerClassName="p-6 sm:p-8 justify-between"
            backgroundColor="#111116"
            borderRadius={16}
            glowRadius={36}
            glowIntensity={0.95}
            edgeSensitivity={28}
            coneSpread={25}
            glowColor="275 85 75"
            fillOpacity={0.35}
          >
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <h3 className="text-xl font-bold text-white">Send a Message</h3>
              </div>
              <p className="text-xs sm:text-sm text-zinc-400 mb-6 font-mono">
                Have an idea, project, or role to discuss? Send a direct note to my inbox.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                {submitStatus === 'success' && (
                  <div
                    role="status"
                    className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm flex items-start gap-3"
                  >
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-white">Message Delivered!</div>
                      <div className="text-xs text-emerald-300/90 mt-0.5">{statusMessage}</div>
                    </div>
                  </div>
                )}

                {submitStatus === 'error' && (
                  <div
                    role="alert"
                    className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-start gap-3"
                  >
                    <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                    <div className="flex-grow">
                      <div className="font-semibold text-white">Delivery Notice</div>
                      <div className="text-xs text-rose-300/90 mt-0.5">{statusMessage}</div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="contact-name"
                      className="block text-xs font-bold uppercase tracking-wider text-zinc-300 font-mono mb-1.5"
                    >
                      Your Name
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      required
                      maxLength={100}
                      disabled={isSubmitting}
                      placeholder="e.g. Alex Tan"
                      value={formData.name}
                      onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                      className={INPUT_CLASSES}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="contact-email"
                      className="block text-xs font-bold uppercase tracking-wider text-zinc-300 font-mono mb-1.5"
                    >
                      Your Email
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      required
                      maxLength={254}
                      disabled={isSubmitting}
                      placeholder="alex@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                      className={INPUT_CLASSES}
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="contact-subject"
                    className="block text-xs font-bold uppercase tracking-wider text-zinc-300 font-mono mb-1.5"
                  >
                    Subject
                  </label>
                  <input
                    id="contact-subject"
                    type="text"
                    required
                    maxLength={150}
                    disabled={isSubmitting}
                    placeholder="Internship / Project inquiry"
                    value={formData.subject}
                    onChange={(e) => setFormData((prev) => ({ ...prev, subject: e.target.value }))}
                    className={INPUT_CLASSES}
                  />
                </div>

                <div>
                  <label
                    htmlFor="contact-message"
                    className="block text-xs font-bold uppercase tracking-wider text-zinc-300 font-mono mb-1.5"
                  >
                    Message
                  </label>
                  <textarea
                    id="contact-message"
                    rows={4}
                    required
                    maxLength={2000}
                    disabled={isSubmitting}
                    placeholder="Hi Eldion, I'd like to talk about..."
                    value={formData.message}
                    onChange={(e) => setFormData((prev) => ({ ...prev, message: e.target.value }))}
                    className={`${INPUT_CLASSES} resize-none`}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-white bg-purple-600 hover:bg-purple-500 shadow-md shadow-purple-600/25 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending to Eldion...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Send Message</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </BorderGlow>
        </div>
      </div>
    </section>
  );
}
