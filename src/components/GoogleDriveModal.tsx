import React, { useState, useEffect } from 'react';
import {
  auth,
  signInWithGoogle,
  signOutGoogle,
  uploadGameZipToDrive,
  getCachedToken,
  DriveUploadResult,
} from '../utils/googleDrive';
import { onAuthStateChanged, User } from 'firebase/auth';
import {
  Cloud,
  CheckCircle2,
  ExternalLink,
  Copy,
  LogOut,
  X,
  Loader2,
  FolderArchive,
  Download,
  AlertCircle,
} from 'lucide-react';

interface GoogleDriveModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GoogleDriveModal({ isOpen, onClose }: GoogleDriveModalProps) {
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [uploadedResult, setUploadedResult] = useState<DriveUploadResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  if (!isOpen) return null;

  const handleSignIn = async () => {
    setErrorMessage('');
    setIsSigningIn(true);
    try {
      const res = await signInWithGoogle();
      setUser(res.user);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal login Google';
      setErrorMessage(msg);
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutGoogle();
      setUser(null);
      setUploadedResult(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal logout';
      setErrorMessage(msg);
    }
  };

  const handleUpload = async () => {
    setErrorMessage('');
    setIsUploading(true);
    setUploadStatus('Mempersiapkan...');
    try {
      const result = await uploadGameZipToDrive(undefined, (status) => {
        setUploadStatus(status);
      });
      setUploadedResult(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mengunggah ke Google Drive';
      setErrorMessage(msg);
    } finally {
      setIsUploading(false);
      setUploadStatus('');
    }
  };

  const copyDriveLink = () => {
    if (uploadedResult?.webViewLink) {
      navigator.clipboard.writeText(uploadedResult.webViewLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="glass relative w-full max-w-md p-6 text-left border border-[#F86903]/40 shadow-[0_10px_50px_rgba(248,105,3,0.25)] rounded-2xl bg-[#0a1215]/95">
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
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-[#F86903] flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
            <Cloud className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-disp text-2xl text-[#fff3dc] leading-tight m-0">
              Simpan ke Google Drive
            </h2>
            <p className="text-xs text-[#FACE91]/70 font-ui m-0">
              Upload file game & source code langsung ke Drive Anda
            </p>
          </div>
        </div>

        {/* Error notification */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span className="leading-snug">{errorMessage}</span>
          </div>
        )}

        {/* File Package Preview Card */}
        <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 mb-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-lg bg-[#CE3D01]/40 border border-[#F86903]/50 flex items-center justify-center text-[#FACE91] shrink-0">
            <FolderArchive className="w-6 h-6 text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-mono text-xs font-bold text-[#fff3dc] truncate">
              kitzch-pop-halloween-game.zip
            </div>
            <div className="text-[11px] text-[#FACE91]/60 font-ui">
              Ukuran berkas: ~1.65 MB (Full Web Project & Assets)
            </div>
          </div>
        </div>

        {/* User Account / Sign in Section */}
        {!user ? (
          <div className="text-center py-3 flex flex-col items-center gap-3">
            <p className="text-xs text-[#FACE91]/80 font-ui leading-relaxed">
              Login dengan Akun Google untuk mengizinkan penyimpanan file game ke Google Drive Anda secara aman.
            </p>
            <button
              onClick={handleSignIn}
              disabled={isSigningIn}
              className="btn-hunt w-full flex items-center justify-center gap-2.5 py-3 cursor-pointer text-xs font-bold"
            >
              {isSigningIn ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Menghubungkan ke Google...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#EA4335"
                      d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.4l3.7 2.9C6.5 7.4 9 5 12 5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.6 14.7c-.2-.7-.4-1.5-.4-2.7s.1-2 .4-2.7L1.9 6.4C.7 8.8 0 10.4 0 12s.7 3.2 1.9 5.6l3.7-2.9z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.3L1.9 16c1.8 3.8 5.6 7 10.1 7z"
                    />
                  </svg>
                  <span>Masuk dengan Google</span>
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {/* Account card */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 font-ui">
              <div className="flex items-center gap-2.5 overflow-hidden">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-8 h-8 rounded-full border border-amber-400/50"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-amber-500/30 text-amber-300 font-bold flex items-center justify-center text-xs">
                    {(user.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white truncate">
                    {user.displayName || 'Google User'}
                  </div>
                  <div className="text-[11px] text-[#FACE91]/70 truncate">
                    {user.email}
                  </div>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                title="Keluar / Ganti Akun"
                className="p-1.5 rounded-lg text-rose-300 hover:bg-rose-500/20 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

            {/* Upload Button or Result */}
            {!uploadedResult ? (
              <button
                onClick={handleUpload}
                disabled={isUploading}
                className="btn-hunt w-full flex items-center justify-center gap-2 py-3 cursor-pointer text-xs font-bold mt-1 shadow-lg shadow-orange-500/30"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>{uploadStatus || 'Mengunggah...'}</span>
                  </>
                ) : (
                  <>
                    <Cloud className="w-4 h-4 text-white" />
                    <span>Upload ke Google Drive Saya</span>
                  </>
                )}
              </button>
            ) : (
              <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-100 flex flex-col gap-3 mt-1">
                <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs font-ui">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Berhasil disimpan di Google Drive Anda!</span>
                </div>
                <div className="text-[11px] text-emerald-200/80 font-mono break-all bg-black/30 p-2 rounded-lg">
                  {uploadedResult.name}
                </div>

                <div className="flex gap-2 font-ui text-xs">
                  {uploadedResult.webViewLink && (
                    <a
                      href={uploadedResult.webViewLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-hunt flex-1 py-2 flex items-center justify-center gap-1.5 text-xs text-center cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Buka di Google Drive</span>
                    </a>
                  )}
                  {uploadedResult.webViewLink && (
                    <button
                      onClick={copyDriveLink}
                      className="btn-alt px-3 py-2 flex items-center justify-center gap-1.5 text-xs cursor-pointer text-[#FACE91] hover:text-white"
                      title="Salin Link Berkas"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copiedLink ? 'Tersalin!' : 'Salin Link'}</span>
                    </button>
                  )}
                </div>

                <button
                  onClick={() => setUploadedResult(null)}
                  className="text-[11px] text-emerald-400/80 underline text-center cursor-pointer hover:text-emerald-300"
                >
                  Unggah ulang berkas
                </button>
              </div>
            )}
          </div>
        )}

        {/* Local Download Fallback */}
        <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-[#FACE91]/70 font-ui">
          <span>Ingin simpan ke perangkat lokal?</span>
          <a
            href="/kitzch-pop-halloween-game.zip"
            download="kitzch-pop-halloween-game.zip"
            className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer"
          >
            <Download className="w-3 h-3" />
            <span>Unduh (.ZIP)</span>
          </a>
        </div>
      </div>
    </div>
  );
}
