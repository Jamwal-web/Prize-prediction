import React, { useState } from 'react';
import { X, Github, Terminal, Copy, Check, ExternalLink, GitBranch, ShieldCheck, Key, ArrowRight, Loader2, AlertCircle } from 'lucide-react';

interface GitHubPublishModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GitHubPublishModal: React.FC<GitHubPublishModalProps> = ({ isOpen, onClose }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const targetRepo = 'https://github.com/Jamwal-web/Prize-prediction.git';
  const [token, setToken] = useState('');
  const [isPushing, setIsPushing] = useState(false);
  const [pushStatus, setPushStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handlePushWithToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) return;

    setIsPushing(true);
    setPushStatus(null);

    try {
      const resp = await fetch('/api/github-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token.trim() }),
      });
      const data = await resp.json();

      if (!resp.ok || data.error) {
        setPushStatus({ success: false, message: data.error || 'Failed to push to GitHub.' });
      } else {
        setPushStatus({ success: true, message: 'Successfully pushed all files and commits to Jamwal-web/Prize-prediction on main branch!' });
      }
    } catch (err: any) {
      setPushStatus({ success: false, message: err.message || 'Network error pushing to GitHub' });
    } finally {
      setIsPushing(false);
    }
  };

  const localTerminalCommands = [
    {
      title: 'Command 1: Set remote origin to your repository',
      cmd: `git remote set-url origin ${targetRepo}`,
    },
    {
      title: 'Command 2: Push code to main branch',
      cmd: 'git push -u origin main',
    },
    {
      title: 'One-line push with token',
      cmd: `git push https://YOUR_TOKEN@github.com/Jamwal-web/Prize-prediction.git main`,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 border border-slate-700 text-white">
              <Github className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Push to GitHub Repository</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Target: <span className="text-blue-400 font-mono">Jamwal-web/Prize-prediction</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-900 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          {/* Target Repo Status */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg bg-slate-900/60 p-3 border border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <GitBranch className="h-4 w-4 text-emerald-400 shrink-0" />
              <span className="text-slate-300 font-medium">Remote Origin:</span>
              <a
                href="https://github.com/Jamwal-web/Prize-prediction"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-300 font-mono hover:underline flex items-center gap-1"
              >
                <span>Jamwal-web/Prize-prediction</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <span className="text-emerald-400 font-mono text-[11px] flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5" />
              Branch: main
            </span>
          </div>

          {/* Option A: Push directly from browser via Personal Access Token */}
          <div className="rounded-xl border border-blue-900/40 bg-blue-950/20 p-4 text-xs">
            <div className="flex items-center gap-2 text-sm font-semibold text-blue-300 mb-1">
              <Key className="h-4 w-4 text-blue-400" />
              <span>Option A: Instant Push from Browser</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Enter your GitHub Personal Access Token (classic token with <code className="text-white">repo</code> scope) to push all code directly from this container:
            </p>

            <form onSubmit={handlePushWithToken} className="mt-3 space-y-2">
              <div className="relative">
                <input
                  type="password"
                  placeholder="ghp_... (GitHub Personal Access Token)"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 py-2 px-3 font-mono text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <a
                  href="https://github.com/settings/tokens/new?scopes=repo&description=PricePredictorAI"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline flex items-center gap-1"
                >
                  <span>Generate token with "repo" scope on GitHub</span>
                  <ExternalLink className="h-3 w-3" />
                </a>

                <button
                  type="submit"
                  disabled={!token.trim() || isPushing}
                  className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-500 disabled:opacity-40 transition-colors shadow-sm"
                >
                  {isPushing ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Pushing...</span>
                    </>
                  ) : (
                    <>
                      <span>Push to GitHub</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>

            {pushStatus && (
              <div
                className={`mt-3 flex items-start gap-2 rounded-lg p-2.5 text-xs ${
                  pushStatus.success
                    ? 'border border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                    : 'border border-red-500/40 bg-red-500/10 text-red-300'
                }`}
              >
                {pushStatus.success ? (
                  <Check className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
                )}
                <span>{pushStatus.message}</span>
              </div>
            )}
          </div>

          {/* Option B: Terminal Commands */}
          <div>
            <div className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
              <Terminal className="h-4 w-4 text-slate-400" />
              <span>Option B: Push via your local terminal</span>
            </div>

            <div className="space-y-2">
              {localTerminalCommands.map((item, i) => (
                <div key={i} className="rounded-lg border border-slate-800 bg-slate-900/80 p-2.5 text-xs">
                  <div className="flex items-center justify-between pb-1 font-medium text-slate-300">
                    <span className="text-[11px]">{item.title}</span>
                    <button
                      onClick={() => copyToClipboard(item.cmd, i)}
                      className="flex items-center gap-1 rounded px-2 py-0.5 text-[11px] text-blue-400 hover:bg-slate-800 hover:text-blue-300 transition-colors"
                    >
                      {copiedIndex === i ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="overflow-x-auto rounded bg-slate-950 p-1.5 font-mono text-[11px] text-cyan-300">
                    {item.cmd}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 flex items-center justify-between border-t border-slate-800 pt-4">
          <a
            href="https://github.com/Jamwal-web/Prize-prediction"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-400 hover:underline flex items-center gap-1"
          >
            <span>Open Jamwal-web/Prize-prediction repository</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>

          <button
            onClick={onClose}
            className="rounded-lg bg-slate-800 px-4 py-1.5 text-xs font-medium text-white hover:bg-slate-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
