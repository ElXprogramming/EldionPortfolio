import { useState } from 'react';
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
import { submitContactMessage } from '../lib/supabase';
import { createSafeErrorMessage, copyToClipboard } from '../lib/security';
import { PROFILE, EXTERNAL_LINKS } from '../lib/constants';

const INITIAL_FORM_DATA = {
  name: '',
  email: '',
  subject: '',
  message: '',
};

export default function Contact() {
  const [copiedEmail, setCopiedEmail] = useState(false);

  const [formData, setFormData] = useState(INITIAL_FORM_DATA);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  const handleCopyEmail = async () => {
    const success = await copyToClipboard(PROFILE.email);
    if (success) {
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2500);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');
    setStatusMessage('');

    try {
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
    <section id="contact" className="py-24 relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold uppercase tracking-wider mb-3">
            <Mail className="w-3.5 h-3.5" />
            Get in Touch
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight text-readable-heading">
            Let's Build Something Great
          </h2>
          <p className="mt-3 text-zinc-300 text-sm sm:text-base text-readable-body">
            I am currently open to internship opportunities, junior software engineering roles, and innovative projects. Feel free to reach out directly!
          </p>
        </div>

        {/* Symmetrical 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          
          {/* Direct Contact Cards (Left Column) */}
          <div className="rounded-2xl p-7 sm:p-9 bg-[#111116] border border-white/10 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Mail className="w-4 h-4 text-purple-400" />
                <h3 className="text-xl font-bold text-white text-readable-subheading">
                  Direct Channels
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-zinc-300 mb-6 text-readable-body">
                Prefer direct inquiries? Feel free to reach out via email or connect with me across professional networks.
              </p>
            </div>

            {/* Chunkier Contact Boxes */}
            <div className="space-y-4 my-auto py-2">
              {/* Email Card */}
              <div className="p-5 rounded-2xl bg-[#141419] border border-white/5 hover:border-purple-500/30 transition-all flex items-center justify-between group">
                <a
                  href={EXTERNAL_LINKS.mailto}
                  className="flex items-center gap-4 min-w-0 flex-1 mr-2 cursor-pointer"
                >
                  <div className="p-3.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 shrink-0 group-hover:scale-105 transition-transform">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div className="truncate">
                    <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider font-mono">Email</div>
                    <div className="text-sm sm:text-base font-semibold text-white group-hover:text-purple-300 transition-colors truncate">
                      {PROFILE.email}
                    </div>
                  </div>
                </a>
                <button
                  type="button"
                  onClick={handleCopyEmail}
                  className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white transition-colors shrink-0 cursor-pointer"
                  title="Copy email to clipboard"
                  aria-label="Copy email address"
                >
                  {copiedEmail ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* LinkedIn Card */}
              <a
                href={EXTERNAL_LINKS.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="p-5 rounded-2xl bg-[#141419] border border-white/5 hover:border-sky-500/30 transition-all flex items-center justify-between group cursor-pointer block"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="p-3.5 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 shrink-0 group-hover:scale-105 transition-transform">
                    <LinkedinIcon className="w-5 h-5" />
                  </div>
                  <div className="truncate">
                    <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider font-mono">LinkedIn</div>
                    <div className="text-sm sm:text-base font-semibold text-white group-hover:text-sky-300 transition-colors truncate">
                      {PROFILE.name}
                    </div>
                  </div>
                </div>
                <ArrowUpRight className="w-5 h-5 text-zinc-400 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </a>

              {/* GitHub Card */}
              <a
                href={EXTERNAL_LINKS.github}
                target="_blank"
                rel="noopener noreferrer"
                className="p-5 rounded-2xl bg-[#141419] border border-white/5 hover:border-purple-500/30 transition-all flex items-center justify-between group cursor-pointer block"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="p-3.5 rounded-xl bg-purple-500/10 text-purple-300 border border-purple-500/20 shrink-0 group-hover:scale-105 transition-transform">
                    <GithubIcon className="w-5 h-5" />
                  </div>
                  <div className="truncate">
                    <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider font-mono">GitHub</div>
                    <div className="text-sm sm:text-base font-semibold text-white group-hover:text-purple-300 transition-colors truncate">
                      @{PROFILE.githubUsername}
                    </div>
                  </div>
                </div>
                <ArrowUpRight className="w-5 h-5 text-zinc-400 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </a>
            </div>

            {/* Availability Indicator */}
            <div className="pt-6 border-t border-white/10 flex items-center justify-between text-xs font-mono text-zinc-400">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Open to Opportunities</span>
              </span>
              <span className="text-zinc-500">Fast Response</span>
            </div>
          </div>

          {/* Quick Interactive Message Form (Right Column) */}
          <div className="rounded-2xl p-7 sm:p-9 bg-[#111116] border border-white/10 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <h3 className="text-xl font-bold text-white text-readable-subheading">
                  Send a Message
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-zinc-300 mb-6 text-readable-body">
                Have an idea, project, or role to discuss? Send a direct note to my inbox.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 my-auto">
              {submitStatus === 'success' && (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-white">Message Delivered!</div>
                    <div className="text-xs text-emerald-300/90 mt-0.5">{statusMessage}</div>
                  </div>
                </div>
              )}

              {submitStatus === 'error' && (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-start gap-3">
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
                    className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5 font-mono"
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
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    className="w-full px-4 py-2.5 rounded-xl bg-[#141419] border border-white/10 text-sm text-white placeholder-zinc-500 focus:outline-hidden focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors disabled:opacity-50"
                  />
                </div>
                <div>
                  <label
                    htmlFor="contact-email"
                    className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5 font-mono"
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
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, email: e.target.value }))
                    }
                    className="w-full px-4 py-2.5 rounded-xl bg-[#141419] border border-white/10 text-sm text-white placeholder-zinc-500 focus:outline-hidden focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors disabled:opacity-50"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="contact-subject"
                  className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5 font-mono"
                >
                  Subject
                </label>
                <input
                  id="contact-subject"
                  type="text"
                  required
                  maxLength={150}
                  disabled={isSubmitting}
                  placeholder="Internship opportunity / Project inquiry"
                  value={formData.subject}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, subject: e.target.value }))
                  }
                  className="w-full px-4 py-2.5 rounded-xl bg-[#141419] border border-white/10 text-sm text-white placeholder-zinc-500 focus:outline-hidden focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors disabled:opacity-50"
                />
              </div>

              <div>
                <label
                  htmlFor="contact-message"
                  className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5 font-mono"
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
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, message: e.target.value }))
                  }
                  className="w-full px-4 py-2.5 rounded-xl bg-[#141419] border border-white/10 text-sm text-white placeholder-zinc-500 focus:outline-hidden focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors resize-none disabled:opacity-50"
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

            <div className="pt-4 text-center">
              <span className="text-[11px] font-mono text-zinc-500">
                End-to-end sanitized &amp; secured transmission
              </span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
