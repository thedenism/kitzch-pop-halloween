export interface GitHubUser {
  login: string;
  name: string;
  avatar_url: string;
  html_url: string;
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string;
}

const GITHUB_TOKEN_KEY = 'kitzch_github_token';

export function getSavedGitHubToken(): string | null {
  return localStorage.getItem(GITHUB_TOKEN_KEY);
}

export function saveGitHubToken(token: string) {
  if (token) {
    localStorage.setItem(GITHUB_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(GITHUB_TOKEN_KEY);
  }
}

/**
 * Verify GitHub Token and fetch user profile
 */
export async function verifyGitHubToken(token: string): Promise<GitHubUser> {
  const res = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${token.trim()}`,
      Accept: 'application/vnd.github+json',
    },
  });

  if (!res.ok) {
    if (res.status === 401) {
      throw new Error('Token GitHub tidak valid atau sudah kedaluwarsa. Periksa kembali token Anda.');
    }
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Gagal memverifikasi token: status ${res.status}`);
  }

  return await res.json();
}

/**
 * Project files to push to GitHub
 */
export const PROJECT_FILE_PATHS = [
  'README.md',
  'package.json',
  'tsconfig.json',
  'vite.config.ts',
  'index.html',
  '.gitignore',
  '.env.example',
  'metadata.json',
  'firebase-applet-config.json',
  'src/main.tsx',
  'src/index.css',
  'src/App.tsx',
  'src/types/game.ts',
  'src/utils/audio.ts',
  'src/utils/kitzchRenderer.ts',
  'src/utils/googleDrive.ts',
  'src/utils/githubService.ts',
  'src/components/GoogleDriveModal.tsx',
  'src/components/GrimoireModal.tsx',
  'src/components/SkinSelectorModal.tsx',
  'src/components/GitHubModal.tsx',
];

/**
 * Push full project to user GitHub repo
 */
export async function pushProjectToGitHub(
  token: string,
  owner: string,
  repoName: string,
  isPrivate: boolean = false,
  onProgress?: (msg: string) => void
): Promise<GitHubRepo> {
  const cleanToken = token.trim();
  const cleanRepo = repoName.trim();
  const headers = {
    Authorization: `Bearer ${cleanToken}`,
    Accept: 'application/vnd.github+json',
    'Content-Type': 'application/json',
  };

  onProgress?.(`Memeriksa repositori ${owner}/${cleanRepo}...`);

  let repoData: GitHubRepo | null = null;
  const checkRes = await fetch(`https://api.github.com/repos/${owner}/${cleanRepo}`, {
    headers,
  });

  if (checkRes.ok) {
    repoData = await checkRes.json();
  } else if (checkRes.status === 404) {
    // Create new repo
    onProgress?.(`Membuat repositori baru: ${cleanRepo}...`);
    const createRes = await fetch('https://api.github.com/user/repos', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: cleanRepo,
        description: '🎃 Kitzch-Pop Halloween | Candy Catch Szn - Retro Arcade Web Game',
        homepage: window.location.href,
        private: isPrivate,
        auto_init: true,
      }),
    });

    if (!createRes.ok) {
      const err = await createRes.json().catch(() => ({}));
      throw new Error(err.message || 'Gagal membuat repositori di GitHub.');
    }
    repoData = await createRes.json();
    // Allow brief time for GitHub initialization
    await new Promise((r) => setTimeout(r, 1500));
  } else {
    const err = await checkRes.json().catch(() => ({}));
    throw new Error(err.message || 'Gagal mengakses repositori GitHub.');
  }

  // 1. Fetch default branch / latest commit SHA
  onProgress?.('Mempersiapkan Git Tree...');
  let latestCommitSha: string | null = null;
  const branchRes = await fetch(`https://api.github.com/repos/${owner}/${cleanRepo}/branches/main`, {
    headers,
  });

  if (branchRes.ok) {
    const branchData = await branchRes.json();
    latestCommitSha = branchData.commit.sha;
  } else {
    // Try master
    const masterRes = await fetch(`https://api.github.com/repos/${owner}/${cleanRepo}/branches/master`, {
      headers,
    });
    if (masterRes.ok) {
      const masterData = await masterRes.json();
      latestCommitSha = masterData.commit.sha;
    }
  }

  // 2. Upload blobs for each file
  const treeItems: Array<{ path: string; mode: string; type: string; sha: string }> = [];

  for (let i = 0; i < PROJECT_FILE_PATHS.length; i++) {
    const filePath = PROJECT_FILE_PATHS[i];
    onProgress?.(`Mengunggah file (${i + 1}/${PROJECT_FILE_PATHS.length}): ${filePath}`);

    try {
      const fetchUrl = filePath.startsWith('src/') ? `/${filePath}?raw` : `/${filePath}`;
      const fileRes = await fetch(fetchUrl);
      if (!fileRes.ok) continue;

      const contentText = await fileRes.text();

      // Create Git Blob
      const blobRes = await fetch(`https://api.github.com/repos/${owner}/${cleanRepo}/git/blobs`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          content: contentText,
          encoding: 'utf-8',
        }),
      });

      if (blobRes.ok) {
        const blobData = await blobRes.json();
        treeItems.push({
          path: filePath,
          mode: '100644',
          type: 'blob',
          sha: blobData.sha,
        });
      }
    } catch {
      // Continue next file
    }
  }

  if (treeItems.length === 0) {
    throw new Error('Tidak ada berkas yang berhasil diproses.');
  }

  // 3. Create Tree
  onProgress?.('Membuat Git Tree & commit baru...');
  const treeBody: Record<string, unknown> = {
    tree: treeItems,
  };
  if (latestCommitSha) {
    treeBody.base_tree = latestCommitSha;
  }

  const newTreeRes = await fetch(`https://api.github.com/repos/${owner}/${cleanRepo}/git/trees`, {
    method: 'POST',
    headers,
    body: JSON.stringify(treeBody),
  });

  if (!newTreeRes.ok) {
    const err = await newTreeRes.json().catch(() => ({}));
    throw new Error(err.message || 'Gagal menyusun tree berkas git.');
  }

  const newTreeData = await newTreeRes.json();

  // 4. Create Commit
  const commitRes = await fetch(`https://api.github.com/repos/${owner}/${cleanRepo}/git/commits`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      message: '🎃 Update Kitzch-Pop Halloween Game source code & assets',
      tree: newTreeData.sha,
      parents: latestCommitSha ? [latestCommitSha] : [],
    }),
  });

  if (!commitRes.ok) {
    const err = await commitRes.json().catch(() => ({}));
    throw new Error(err.message || 'Gagal membuat commit git.');
  }

  const newCommitData = await commitRes.json();

  // 5. Update branch reference (main)
  onProgress?.('Memperbarui branch main...');
  const refRes = await fetch(`https://api.github.com/repos/${owner}/${cleanRepo}/git/refs/heads/main`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({
      sha: newCommitData.sha,
      force: true,
    }),
  });

  if (!refRes.ok) {
    // If ref doesn't exist yet, create it
    await fetch(`https://api.github.com/repos/${owner}/${cleanRepo}/git/refs`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        ref: 'refs/heads/main',
        sha: newCommitData.sha,
      }),
    });
  }

  onProgress?.('Berhasil diunggah ke GitHub!');
  return repoData!;
}
