import React, { useState } from 'react';
import { X, Github, Terminal, Copy, Check, ExternalLink, GitBranch, ShieldCheck } from 'lucide-react';

interface GitHubPublishModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GitHubPublishModal: React.FC<GitHubPublishModalProps> = ({ isOpen, onClose }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [repoName, setRepoName] = useState('pricepredictor-ai');

  if (!isOpen) return null;

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const publishCommands = [
    {
      title: '1. Initialize & stage your code (Pre-configured)',
      cmd: 'git add .\ngit commit -m "feat: complete PricePredictor AI platform with C++ DSA & Python ML"',
    },
    {
      title: '2. Link your new GitHub repository',
      cmd: `git remote add origin https://github.com/YOUR_USERNAME/${repoName}.git`,
    },
    {
      title: '3. Push to main branch',
      cmd: 'git branch -M main\ngit push -u origin main',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 border border-slate-700 text-white">
              <Github className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Publish to GitHub</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Local repository is initialized and ready to push
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

        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between rounded-lg bg-slate-900/60 p-3 border border-slate-800 text-xs">
            <span className="text-slate-300 font-medium flex items-center gap-1.5">
              <GitBranch className="h-4 w-4 text-emerald-400" />
              Branch: <code className="text-cyan-300 font-mono">main</code>
            </span>
            <span className="text-emerald-400 font-mono text-[11px] flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5" />
              Clean Working Tree
            </span>
          </div>

          <div className="text-xs text-slate-400">
            Target Repository Name:
            <input
              type="text"
              value={repoName}
              onChange={(e) => setRepoName(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-800 bg-slate-900 px-3 py-1.5 font-mono text-xs text-white focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="space-y-2.5 pt-2">
            {publishCommands.map((item, i) => (
              <div key={i} className="rounded-lg border border-slate-800 bg-slate-900/90 p-3 text-xs">
                <div className="flex items-center justify-between pb-1.5 font-medium text-slate-300">
                  <span>{item.title}</span>
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
                <pre className="mt-1 overflow-x-auto rounded bg-slate-950 p-2 font-mono text-[11px] text-cyan-300">
                  {item.cmd}
                </pre>
              </div>
            ))}
          </div>

          <div className="rounded-lg bg-blue-950/30 border border-blue-800/40 p-3 text-[11px] text-blue-300">
            <strong>Pro Tip:</strong> Create a new empty repository named <code className="text-white font-mono">{repoName}</code> at{' '}
            <a
              href="https://github.com/new"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-white"
            >
              github.com/new
            </a>
            , then execute the commands above in your terminal.
          </div>
        </div>

        <div className="mt-5 flex items-center justify-end border-t border-slate-800 pt-4">
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-medium text-white hover:bg-slate-700 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
