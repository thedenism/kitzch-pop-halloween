import React, { useState, useEffect } from 'react';
import {
  verifyGitHubToken,
  pushProjectToGitHub,
  getSavedGitHubToken,
  saveGitHubToken,
  GitHubUser,
  GitHubRepo,
} from '../utils/githubService';
import {
  Github,
  CheckCircle2,
  ExternalLink,
  Copy,
  X,
  Loader2,
  Terminal,
  Shield,
  AlertCircle,
  HelpCircle,
  FolderGit2,
} from 'lucide-react';

interface GitHubModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GitHubModal({ isOpen, onClose }: GitHubModalProps) {
  const [activeTab, setActiveTab] = useState<'token' | 'terminal'>('token');
  const [tokenInput, setTokenInput] = useState<string>('');
  const [repoName, setRepoName] = useState<string>('kitzch-pop-halloween');
  const [isPrivate, setIsPrivate] = useState<boolean>(false);

  const [githubUser, setGithubUser] = useState<GitHubUser | null>(null);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [isPushing, setIsPushing] = useState<boolean>(false);
  const [progressMsg, setProgressMsg] = useState<string>('');
  const [uploadedRepo, setUploadedRepo] = useState<GitHubRepo | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [copiedCmd, setCopiedCmd] = useState<boolean>(false);

  useEffect(() => {
    const saved = getSavedGitHubToken();
    if (saved) {
      setTokenInput(saved);
      // Auto verify saved token
      verifyGitHubToken(saved)
        .then((user) => setGithubUser(user))
        .catch(() => {
          saveGitHubToken('');
        });
    }
  }, []);

  if (!isOpen) return null;

  const handleVerify = async () => {
    if (!tokenInput.trim()) {
      setErrorMessage('Masukkan Personal Access Token GitHub Anda');
      return;
    }
    setErrorMessage('');
    setIsValidating(true);
    try {
      const user = await verifyGitHubToken(tokenInput);
      setGithubUser(user);
      saveGitHubToken(tokenInput.trim());
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memverifikasi token';
      setErrorMessage(msg);
    } finally {
      setIsValidating(false);
    }
  };

  const handlePush = async () => {
    if (!githubUser || !tokenInput.trim()) {
      setErrorMessage('Harap verifikasi token GitHub terlebih dahulu.');
      return;
    }
    if (!repoName.trim()) {
      setErrorMessage('Masukkan nama repositori tujuan.');
      return;
    }

    setErrorMessage('');
    setIsPushing(true);
    setProgressMsg('Memulai proses upload...');
    try {
      const repo = await pushProjectToGitHub(
        tokenInput,
        githubUser.login,
        repoName,
        isPrivate,
        (msg) => setProgressMsg(msg)
      );
      setUploadedRepo(repo);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mengunggah repositori';
      setErrorMessage(msg);
    } finally {
      setIsPushing(false);
      setProgressMsg('');
    }
  };

  const terminalCommand = `# 1. Pastikan Anda sudah membuat repo di github.com/new
git remote add origin https://github.com/${githubUser ? githubUser.login : '<username>'}/${repoName || 'kitzch-pop-halloween'}.git
git branch -M main
git push -u origin main`;

  const copyTerminalCommands = () => {
    navigator.clipboard.writeText(terminalCommand);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="glass relative w-full max-w-lg p-6 text-left border border-white/20 shadow-[0_10px_50px_rgba(0,0,0,0.8)] rounded-2xl bg-[#0a1215]/95 max-h-[92vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-[#FACE91] transition-colors cursor-pointer"
          aria-label="Tutup"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-[#24292e] border border-white/20 flex items-center justify-center text-white shadow-lg">
            <Github className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-disp text-2xl text-[#fff3dc] leading-tight m-0">
              Upload ke GitHub
            </h2>
            <p className="text-xs text-[#FACE91]/70 font-ui m-0">
              Simpan source code dan seluruh aset game ke repositori GitHub Anda
            </p>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex gap-2 p-1 rounded-xl bg-black/50 border border-white/10 mb-4 font-ui text-xs">
          <button
            onClick={() => setActiveTab('token')}
            className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'token'
                ? 'bg-[#F86903] text-white font-bold shadow'
                : 'text-[#FACE91]/70 hover:text-white'
            }`}
          >
            <FolderGit2 className="w-4 h-4" />
            <span>Upload Otomatis (Browser)</span>
          </button>
          <button
            onClick={() => setActiveTab('terminal')}
            className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'terminal'
                ? 'bg-[#F86903] text-white font-bold shadow'
                : 'text-[#FACE91]/70 hover:text-white'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>Git CLI Terminal</span>
          </button>
        </div>

        {/* Error notification */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span className="leading-snug">{errorMessage}</span>
          </div>
        )}

        {/* Tab 1: Token / Auto Push */}
        {activeTab === 'token' && (
          <div className="flex flex-col gap-4 font-ui text-xs">
            {/* Step 1: User Verification */}
            {!githubUser ? (
              <div className="p-4 rounded-xl bg-black/40 border border-white/10 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-[#FACE91] text-xs">
                    GitHub Personal Access Token (PAT):
                  </label>
                  <a
                    href="https://github.com/settings/tokens/new?scopes=repo&description=Kitzch-Pop+Game+Upload"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-amber-400 hover:text-amber-300 underline flex items-center gap-1"
                  >
                    <span>Buat Token Baru</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <input
                  type="password"
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-black/60 border border-white/20 text-white placeholder-white/30 font-mono text-xs focus:outline-none focus:border-[#F86903]"
                />

                <div className="text-[11px] text-[#FACE91]/60 flex items-start gap-1.5 leading-relaxed">
                  <HelpCircle className="w-3.5 h-3.5 shrink-0 text-amber-400 mt-0.5" />
                  <span>
                    Token butuh izin <b>repo</b> untuk membuat repositori dan mengunggah kode secara otomatis. Token hanya disimpan di browser Anda.
                  </span>
                </div>

                <button
                  onClick={handleVerify}
                  disabled={isValidating}
                  className="btn-hunt w-full py-2.5 mt-1 flex items-center justify-center gap-2 cursor-pointer font-bold"
                >
                  {isValidating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Memverifikasi Akun...</span>
                    </>
                  ) : (
                    <>
                      <Github className="w-4 h-4" />
                      <span>Hubungkan Akun GitHub</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {/* Connected User Badge */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={githubUser.avatar_url}
                      alt={githubUser.login}
                      className="w-8 h-8 rounded-full border border-white/20"
                    />
                    <div>
                      <div className="font-bold text-white text-xs">{githubUser.name || githubUser.login}</div>
                      <div className="text-[11px] text-[#FACE91]/70 font-mono">@{githubUser.login}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setGithubUser(null);
                      saveGitHubToken('');
                      setUploadedRepo(null);
                    }}
                    className="text-[11px] text-rose-300 hover:text-rose-200 underline cursor-pointer"
                  >
                    Ganti Akun
                  </button>
                </div>

                {/* Repo settings */}
                <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 flex flex-col gap-2.5">
                  <label className="font-semibold text-[#FACE91] text-xs">
                    Nama Repositori Tujuan:
                  </label>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-white/50 text-xs">{githubUser.login} /</span>
                    <input
                      type="text"
                      value={repoName}
                      onChange={(e) => setRepoName(e.target.value)}
                      placeholder="kitzch-pop-halloween"
                      className="flex-1 px-3 py-2 rounded-lg bg-black/60 border border-white/20 text-white font-mono text-xs focus:outline-none focus:border-[#F86903]"
                    />
                  </div>

                  <label className="flex items-center gap-2 text-xs text-[#FACE91]/80 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={isPrivate}
                      onChange={(e) => setIsPrivate(e.target.checked)}
                      className="rounded accent-[#F86903]"
                    />
                    <span>Jadikan repositori Private (hanya Anda yang bisa melihat)</span>
                  </label>
                </div>

                {/* Upload Status / Trigger */}
                {!uploadedRepo ? (
                  <button
                    onClick={handlePush}
                    disabled={isPushing}
                    className="btn-hunt w-full py-3 flex items-center justify-center gap-2 cursor-pointer font-bold text-xs shadow-lg shadow-orange-500/20"
                  >
                    {isPushing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>{progressMsg || 'Mengunggah ke GitHub...'}</span>
                      </>
                    ) : (
                      <>
                        <FolderGit2 className="w-4 h-4" />
                        <span>Upload Proyek ke GitHub Saya</span>
                      </>
                    )}
                  </button>
                ) : (
                  <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-100 flex flex-col gap-3">
                    <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Berhasil diunggah ke GitHub!</span>
                    </div>

                    <div className="font-mono text-[11px] text-emerald-200 bg-black/40 p-2.5 rounded-lg border border-emerald-500/30 break-all">
                      {uploadedRepo.html_url}
                    </div>

                    <div className="flex gap-2">
                      <a
                        href={uploadedRepo.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-hunt flex-1 py-2 flex items-center justify-center gap-1.5 text-xs text-center cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Buka Repositori GitHub</span>
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Terminal / Git CLI Instructions */}
        {activeTab === 'terminal' && (
          <div className="flex flex-col gap-3 font-ui text-xs">
            <p className="text-[#FACE91]/80 leading-relaxed m-0">
              Jika Anda lebih menyukai menggunakan terminal atau git command-line:
            </p>

            <div className="relative p-3.5 rounded-xl bg-black/80 border border-white/10 font-mono text-[11px] text-emerald-300 leading-relaxed overflow-x-auto">
              <pre className="m-0 whitespace-pre-wrap">{terminalCommand}</pre>
              <button
                onClick={copyTerminalCommands}
                className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-[#FACE91] hover:text-white transition-colors cursor-pointer flex items-center gap-1 text-[10px]"
                title="Salin Perintah"
              >
                <Copy className="w-3 h-3" />
                <span>{copiedCmd ? 'Tersalin' : 'Salin'}</span>
              </button>
            </div>

            <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-200/90 text-[11px] flex items-start gap-2">
              <Shield className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                Seluruh commit awal (Initial commit) sudah dipersiapkan dan di-commit pada branch <b>main</b>. Anda hanya perlu menghubungkan remote origin dan push.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
