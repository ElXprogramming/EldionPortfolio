import { useState } from 'react';
import { 
  Mail, 
  Phone, 
  Send, 
  Copy, 
  Check, 
  MapPin, 
  Sparkles,
  ArrowUpRight
} from 'lucide-react';
import { GithubIcon, LinkedinIcon } from './Icons';

export default function Contact() {
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('nayrnoidle@gmail.com');
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  const handleCopyPhone = () => {
    navigator.clipboard.writeText('0178201365');
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const mailtoSubject = encodeURIComponent(formData.subject || `Inquiry from ${formData.name || 'Portfolio Visitor'}`);
    const mailtoBody = encodeURIComponent(
      `Hi Eldion,\n\nName: ${formData.name}\nEmail: ${formData.email}\n\nMessage:\n${formData.message}`
    );
    window.location.href = `mailto:nayrnoidle@gmail.com?subject=${mailtoSubject}&body=${mailtoBody}`;
  };

  return (
    <section id="contact" className="py-24 relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-3">
            <Mail className="w-3.5 h-3.5" />
            Get in Touch
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Let's Build Something Great
          </h2>
          <p className="mt-3 text-slate-300 text-sm sm:text-base">
            I am currently open to internship opportunities, junior software engineering roles, and innovative projects. Feel free to reach out directly!
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Direct Contact Cards (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* Email Card */}
            <div className="glass-card rounded-2xl p-5 border border-slate-800/80 bg-slate-900/60 flex items-center justify-between">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="p-3 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div className="truncate">
                  <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">Email</div>
                  <a
                    href="mailto:nayrnoidle@gmail.com"
                    className="text-sm font-semibold text-white hover:text-indigo-400 transition-colors truncate block"
                  >
                    nayrnoidle@gmail.com
                  </a>
                </div>
              </div>
              <button
                onClick={handleCopyEmail}
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors ml-2 shrink-0 cursor-pointer"
                title="Copy email to clipboard"
              >
                {copiedEmail ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Phone Card */}
            <div className="glass-card rounded-2xl p-5 border border-slate-800/80 bg-slate-900/60 flex items-center justify-between">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div className="truncate">
                  <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">Phone / WhatsApp</div>
                  <a
                    href="tel:0178201365"
                    className="text-sm font-semibold text-white hover:text-indigo-400 transition-colors truncate block"
                  >
                    017-820 1365
                  </a>
                </div>
              </div>
              <button
                onClick={handleCopyPhone}
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors ml-2 shrink-0 cursor-pointer"
                title="Copy phone number"
              >
                {copiedPhone ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* LinkedIn Card */}
            <a
              href="https://www.linkedin.com/in/eldion-ryan-godius-897064235"
              target="_blank"
              rel="noopener noreferrer"
              className="glass-card rounded-2xl p-5 border border-slate-800/80 bg-slate-900/60 flex items-center justify-between group block"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="p-3 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 shrink-0">
                  <LinkedinIcon className="w-5 h-5" />
                </div>
                <div className="truncate">
                  <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">LinkedIn</div>
                  <div className="text-sm font-semibold text-white group-hover:text-sky-400 transition-colors truncate">
                    Eldion Ryan Godius
                  </div>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </a>

            {/* GitHub Card */}
            <a
              href="https://github.com/ElXprogramming"
              target="_blank"
              rel="noopener noreferrer"
              className="glass-card rounded-2xl p-5 border border-slate-800/80 bg-slate-900/60 flex items-center justify-between group block"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0">
                  <GithubIcon className="w-5 h-5" />
                </div>
                <div className="truncate">
                  <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">GitHub</div>
                  <div className="text-sm font-semibold text-white group-hover:text-indigo-400 transition-colors truncate">
                    @ElXprogramming
                  </div>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </a>

            {/* Location Pill */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/60 flex items-center gap-3 text-xs text-slate-300">
              <MapPin className="w-4 h-4 text-rose-400 shrink-0" />
              <span>Based in Universiti Malaysia Sabah, Kota Kinabalu, Sabah</span>
            </div>

          </div>

          {/* Quick Interactive Message Form (7 cols) */}
          <div className="lg:col-span-7 glass-panel rounded-2xl p-7 sm:p-9 border border-slate-800/80 shadow-xl">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <h3 className="text-xl font-bold text-white">
                Send a Message
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 mb-6">
              Have an idea, project, or role to discuss? Send a direct note to my inbox.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Your Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alex Tan"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-sm text-white placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Your Email
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="alex@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-sm text-white placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Subject
                </label>
                <input
                  type="text"
                  required
                  placeholder="Internship opportunity / Project inquiry"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-sm text-white placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Message
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Hi Eldion, I'd like to talk about..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-sm text-white placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/25 transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Compose &amp; Send Message</span>
              </button>
            </form>
          </div>

        </div>

      </div>
    </section>
  );
}
