/**
 * Normalize thumbnail URLs for display/storage. Google Drive share links → direct view URL
 * (works in <img> when the file is "Anyone with the link" and is an image).
 */
export function normalizeThumbnailUrl(input: string | null | undefined): string | null {
  if (input == null) return null;
  const raw = String(input).trim();
  if (!raw) return null;

  const fileD = raw.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i);
  if (fileD) {
    return `https://drive.google.com/uc?export=view&id=${fileD[1]}`;
  }

  try {
    const u = new URL(raw);
    const host = u.hostname.toLowerCase();
    if (host === 'drive.google.com' || host.endsWith('.drive.google.com')) {
      const id = u.searchParams.get('id');
      if (id && /^[a-zA-Z0-9_-]+$/.test(id) && u.pathname.includes('/open')) {
        return `https://drive.google.com/uc?export=view&id=${id}`;
      }
    }
  } catch {
    // keep raw (e.g. relative path)
  }

  return raw;
}
