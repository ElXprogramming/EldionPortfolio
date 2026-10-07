import { useState, useEffect, useMemo } from 'react';
import {
  Lock,
  Unlock,
  Mail,
  Trash2,
  CheckCircle,
  Clock,
  Search,
  ArrowLeft,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Copy,
  Check,
  Inbox as InboxIcon
} from 'lucide-react';
import {
  fetchContactMessages,
  toggleMessageReadStatus,
  deleteContactMessage,
  type ContactMessage,
} from '../lib/supabase';

interface SecretInboxProps {
  onBackToHome: () => void;
}

const DEFAULT_PIN = import.meta.env.VITE_ADMIN_PIN || 'eldion';

export default function SecretInbox({ onBackToHome }: SecretInboxProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('eldion_inbox_authenticated') === 'true';
  });
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'unread' | 'read'>('all');
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  const loadMessages = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await fetchContactMessages();
      setMessages(data);
    } catch (err: unknown) {
      console.error('Failed to load messages:', err);
      const message = err instanceof Error ? err.message : 'Unknown error';
      setErrorMessage(
        message.includes('relation "contact_messages" does not exist')
          ? 'Table "contact_messages" was not found in your Supabase database. Please run the SQL schema in Supabase SQL Editor.'
          : `Failed to load messages: ${message}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadMessages();
    }
  }, [isAuthenticated]);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.trim() === DEFAULT_PIN) {
      setIsAuthenticated(true);
      sessionStorage.setItem('eldion_inbox_authenticated', 'true');
      setPinError(false);
      setPinInput('');
    } else {
      setPinError(true);
    }
  };

  const handleLock = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('eldion_inbox_authenticated');
  };

  const handleToggleRead = async (message: ContactMessage) => {
    const newStatus = !message.is_read;
    try {
      // Optimistic update
      setMessages((prev) =>
        prev.map((m) => (m.id === message.id ? { ...m, is_read: newStatus } : m))
      );
      await toggleMessageReadStatus(message.id, newStatus);
    } catch (err) {
      console.error('Failed to update read status:', err);
      // Revert on error
      loadMessages();
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this message?')) return;
    try {
      setMessages((prev) => prev.filter((m) => m.id !== id));
      await deleteContactMessage(id);
    } catch (err) {
      console.error('Failed to delete message:', err);
      loadMessages();
    }
  };

  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  const filteredMessages = useMemo(() => {
    return messages.filter((msg) => {
      const matchesSearch =
        msg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        msg.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        msg.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        msg.message.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (filterMode === 'unread') return !msg.is_read;
      if (filterMode === 'read') return !!msg.is_read;
      return true;
    });
  }, [messages, searchQuery, filterMode]);

  const unreadCount = useMemo(() => {
    return messages.filter((m) => !m.is_read).length;
  }, [messages]);

  // Render Lock Screen if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative selection:bg-indigo-500/30 selection:text-indigo-200">
        <div className="absolute inset-0 bg-grid-pattern opacity-20 pointer-events-none" />

        <div className="glass-panel max-w-md w-full p-8 rounded-3xl border border-slate-800/80 shadow-2xl relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center mx-auto mb-6 text-indigo-400">
            <Lock className="w-7 h-7" />
          </div>

          <div className="text-center mb-6">
            <h1 className="text-2xl font-extrabold text-white">Secret Inbox</h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              Enter your admin passcode to access portfolio messages
            </p>
          </div>

          <form onSubmit={handleUnlock} className="space-y-4">
            <div>
              <input
                type="password"
                autoFocus
                placeholder="Enter passcode..."
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  if (pinError) setPinError(false);
                }}
                className={`w-full px-4 py-3 rounded-xl bg-slate-900 border text-center tracking-widest text-lg font-mono text-white placeholder-slate-500 focus:outline-hidden transition-colors ${
                  pinError
                    ? 'border-rose-500 ring-1 ring-rose-500'
                    : 'border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                }`}
              />
              {pinError && (
                <p className="text-rose-400 text-xs mt-2 text-center">
                  Incorrect passcode. Please try again.
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-semibold text-white shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Unlock className="w-4 h-4" />
              <span>Unlock Messages</span>
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Passcode can be changed via <code className="text-indigo-400">VITE_ADMIN_PIN</code></span>
            <button
              onClick={onBackToHome}
              className="text-slate-300 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render Inbox Dashboard
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative selection:bg-indigo-500/30 selection:text-indigo-200">
      <div className="fixed inset-0 bg-grid-pattern opacity-15 pointer-events-none" />

      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToHome}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors flex items-center gap-2 text-xs font-medium cursor-pointer"
              title="Return to Portfolio"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Portfolio</span>
            </button>

            <div className="h-5 w-px bg-slate-800" />

            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h1 className="font-bold text-white text-base sm:text-lg">Secret Inbox</h1>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-500 text-white">
                  {unreadCount} new
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadMessages}
              disabled={isLoading}
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors flex items-center gap-2 text-xs font-medium cursor-pointer disabled:opacity-50"
              title="Refresh messages"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              onClick={handleLock}
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition-colors flex items-center gap-2 text-xs font-medium cursor-pointer"
              title="Lock inbox session"
            >
              <Lock className="w-4 h-4" />
              <span className="hidden sm:inline">Lock</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        
        {/* Controls: Search & Filter Tabs */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-8">
          <div className="relative flex-grow max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search sender, email, subject, or message..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-sm text-white placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900/90 border border-slate-800 self-start sm:self-auto">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                filterMode === 'all'
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({messages.length})
            </button>
            <button
              onClick={() => setFilterMode('unread')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                filterMode === 'unread'
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Unread ({unreadCount})
            </button>
            <button
              onClick={() => setFilterMode('read')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                filterMode === 'read'
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Read ({messages.length - unreadCount})
            </button>
          </div>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-sm text-rose-300">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
            <div>
              <p className="font-semibold text-rose-200">Database Connection Notice</p>
              <p className="mt-1 text-xs sm:text-sm text-rose-300/90">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Loading Spinner */}
        {isLoading && messages.length === 0 && (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
            <RefreshCw className="w-8 h-8 animate-spin text-indigo-400" />
            <p className="text-sm">Fetching messages from Supabase...</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredMessages.length === 0 && (
          <div className="glass-panel rounded-3xl p-12 text-center border border-slate-800/80 my-8">
            <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto mb-4 text-slate-500">
              <InboxIcon className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white">No messages found</h3>
            <p className="text-slate-400 text-sm max-w-md mx-auto mt-1">
              {searchQuery
                ? 'No messages matched your search query. Try clearing the search filter.'
                : 'Your inbox is clean! When visitors send a message from the Contact section, they will appear right here.'}
            </p>
          </div>
        )}

        {/* Messages Feed */}
        <div className="space-y-4">
          {filteredMessages.map((msg) => {
            const formattedDate = new Date(msg.created_at).toLocaleDateString('en-MY', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            const replySubject = encodeURIComponent(`Re: ${msg.subject}`);
            const mailtoReply = `mailto:${msg.email}?subject=${replySubject}`;

            return (
              <div
                key={msg.id}
                className={`glass-panel rounded-2xl p-5 sm:p-6 border transition-all ${
                  msg.is_read
                    ? 'border-slate-800/60 bg-slate-950/40 opacity-80 hover:opacity-100'
                    : 'border-indigo-500/40 bg-slate-900/60 shadow-lg shadow-indigo-950/20 ring-1 ring-indigo-500/20'
                }`}
              >
                {/* Header: Sender & Meta */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                        msg.is_read
                          ? 'bg-slate-800 text-slate-400'
                          : 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                      }`}
                    >
                      {msg.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-white text-base">{msg.name}</span>
                        {!msg.is_read && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                            New
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                        <a
                          href={`mailto:${msg.email}`}
                          className="hover:text-indigo-400 transition-colors"
                        >
                          {msg.email}
                        </a>
                        <button
                          onClick={() => handleCopyEmail(msg.email)}
                          className="text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                          title="Copy email address"
                        >
                          {copiedEmail === msg.email ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-500 self-start sm:self-auto">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{formattedDate}</span>
                  </div>
                </div>

                {/* Subject */}
                <div className="mb-3">
                  <div className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-0.5">
                    Subject
                  </div>
                  <h4 className="text-sm font-semibold text-indigo-300">{msg.subject}</h4>
                </div>

                {/* Message Body */}
                <div className="bg-slate-950/70 rounded-xl p-4 border border-slate-900 text-sm text-slate-200 leading-relaxed whitespace-pre-wrap select-text mb-4">
                  {msg.message}
                </div>

                {/* Actions Footer */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/60">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleRead(msg)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                        msg.is_read
                          ? 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                          : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                      }`}
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>{msg.is_read ? 'Mark as Unread' : 'Mark as Read'}</span>
                    </button>

                    <button
                      onClick={() => handleDelete(msg.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition-colors cursor-pointer"
                      title="Delete this message"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>

                  <a
                    href={mailtoReply}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Reply via Email</span>
                    <ExternalLink className="w-3 h-3 ml-0.5 opacity-70" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
