import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/drive.file');
provider.setCustomParameters({
  prompt: 'select_account',
});

const TOKEN_KEY = 'kitzch_gdrive_access_token';

export function getCachedToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function setCachedToken(token: string | null) {
  if (token) {
    sessionStorage.setItem(TOKEN_KEY, token);
  } else {
    sessionStorage.removeItem(TOKEN_KEY);
  }
}

/**
 * Sign in with Google and acquire Google Drive access token
 */
export async function signInWithGoogle(): Promise<{
  user: User;
  accessToken: string;
}> {
  const result = await signInWithPopup(auth, provider);
  const credential = GoogleAuthProvider.credentialFromResult(result);
  const accessToken = credential?.accessToken;

  if (!accessToken) {
    throw new Error('Tidak dapat memperoleh token otorisasi Google Drive. Silakan coba login kembali.');
  }

  setCachedToken(accessToken);
  return { user: result.user, accessToken };
}

/**
 * Sign out
 */
export async function signOutGoogle(): Promise<void> {
  setCachedToken(null);
  await signOut(auth);
}

export interface DriveUploadResult {
  id: string;
  name: string;
  webViewLink?: string;
  webContentLink?: string;
  size?: string;
}

/**
 * Upload the game package ZIP directly to Google Drive
 */
export async function uploadGameZipToDrive(
  token?: string,
  onProgress?: (msg: string) => void
): Promise<DriveUploadResult> {
  let accessToken = token || getCachedToken();

  // If no cached token or expired, trigger sign in
  if (!accessToken) {
    onProgress?.('Menghubungkan ke Google Account...');
    const authResult = await signInWithGoogle();
    accessToken = authResult.accessToken;
  }

  onProgress?.('Mengambil paket file game...');
  const fileRes = await fetch('/kitzch-pop-halloween-game.zip');
  if (!fileRes.ok) {
    throw new Error(`Gagal memuat berkas zip: status ${fileRes.status}`);
  }
  const fileBlob = await fileRes.blob();
  const fileArrayBuffer = await fileBlob.arrayBuffer();

  onProgress?.('Mengunggah ke Google Drive...');

  const metadata = {
    name: 'kitzch-pop-halloween-game.zip',
    mimeType: 'application/zip',
    description: 'Kitzch-Pop Halloween: Candy Catch Szn - Full Game Source Code & Playable Assets',
  };

  const boundary = '-------kitzchPopHalloweenDriveBoundary' + Date.now();
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const metaHeader =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata);

  const fileHeader =
    delimiter +
    'Content-Type: application/zip\r\n\r\n';

  const multipartBlob = new Blob(
    [metaHeader, fileHeader, fileArrayBuffer, closeDelimiter],
    { type: `multipart/related; boundary=${boundary}` }
  );

  const uploadRes = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,webContentLink,size',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: multipartBlob,
    }
  );

  if (!uploadRes.ok) {
    // If 401 Unauthorized, token likely expired
    if (uploadRes.status === 401) {
      setCachedToken(null);
      throw new Error('Sesi Google Drive kedaluwarsa. Silakan klik tombol untuk login ulang.');
    }
    const errText = await uploadRes.text();
    throw new Error(`Gagal mengunggah ke Google Drive: ${errText}`);
  }

  const data: DriveUploadResult = await uploadRes.json();
  onProgress?.('Selesai diunggah!');
  return data;
}
