export const formatCurrency = (amount: number, currency: string = 'NPR'): string => {
  return new Intl.NumberFormat('en-NP', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

export const formatDate = (date: string | Date): string => {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d);
};

export const formatDateTime = (date: string | Date): string => {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export const classNames = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};

export const debounce = <T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Generate URL-friendly slug from a string
 */
export const generateSlug = (text: string): string => {
  if (!text) return '';

  return text
    .toString()
    .toLowerCase()
    .trim()
    // Replace spaces with hyphens
    .replace(/\s+/g, '-')
    // Remove special characters except hyphens
    .replace(/[^\w\-]+/g, '')
    // Replace multiple hyphens with single hyphen
    .replace(/\-\-+/g, '-')
    // Remove leading and trailing hyphens
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

/**
 * Format price with currency symbol
 */
export const formatPrice = (price: number, isFree: boolean = false): string => {
  if (isFree) return 'Free';
  return formatCurrency(price);
};

/**
 * Format duration in minutes to human-readable format
 */
export const formatDuration = (minutes: number | null | undefined): string => {
  if (!minutes) return 'Not specified';

  if (minutes < 60) {
    return `${minutes} min${minutes !== 1 ? 's' : ''}`;
  }

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (mins === 0) {
    return `${hours} hr${hours !== 1 ? 's' : ''}`;
  }

  return `${hours} hr${hours !== 1 ? 's' : ''} ${mins} min${mins !== 1 ? 's' : ''}`;
};

/**
 * Common error message extractor
 */
export const handleError = (error: unknown): string => {
  return Object(error).message || 'An error occurred';
};

/**
 * Get YouTube video ID from URL (for embed or thumbnail)
 */
export const getYouTubeVideoId = (url: string): string | null => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  if (match && match[2].length === 11) return match[2];
  return null;
};

/**
 * Get YouTube embed URL from a regular YouTube link
 */
export const getYouTubeEmbedUrl = (url: string): string | null => {
  const id = getYouTubeVideoId(url);
  return id ? `https://www.youtube.com/embed/${id}` : null;
};

/**
 * Get YouTube thumbnail image URL (works on desktop and PWA; no iframe required)
 * quality: 'default' (120x90), 'mqdefault' (320x180), 'hqdefault' (480x360), 'sddefault' (640x480), 'maxresdefault' (1280x720)
 */
export const getYouTubeThumbnailUrl = (url: string, quality: 'default' | 'mqdefault' | 'hqdefault' | 'sddefault' | 'maxresdefault' = 'hqdefault'): string | null => {
  const id = getYouTubeVideoId(url);
  return id ? `https://img.youtube.com/vi/${id}/${quality}.jpg` : null;
};

/**
 * Get embed URL for carousel (YouTube or Vimeo). Accepts watch, youtu.be, or embed URLs.
 * @param options.autoplay - If true, appends autoplay (and mute for YouTube) query params.
 */
/**
 * Get Google Drive embeddable preview URL from view link.
 * e.g. https://drive.google.com/file/d/FILE_ID/view -> https://drive.google.com/file/d/FILE_ID/preview
 * @param hideToolbar - Append #toolbar=0 to minimize share/open controls (may reduce pop-out icon visibility)
 */
export const getGoogleDriveEmbedUrl = (url: string, hideToolbar?: boolean): string | null => {
  if (!url || !url.trim()) return null;
  const match = url.trim().match(/drive\.google\.com\/file\/d\/([^/]+)/);
  if (match) {
    let embed = `https://drive.google.com/file/d/${match[1]}/preview`;
    if (hideToolbar) embed += '#toolbar=0';
    return embed;
  }
  return null;
};

/**
 * Check if URL is a Google Drive file link
 */
export const isGoogleDriveUrl = (url: string): boolean => {
  return /drive\.google\.com\/file\/d\//.test(url || '');
};

/**
 * Check if URL is a Google Classroom link
 */
export const isGoogleClassroomUrl = (url: string): boolean => {
  return /classroom\.google\.com\//.test(url || '');
};

/**
 * Get Google Drive direct download URL from view link.
 * Use for PDFs/documents - more reliable than /view when file is shared "Anyone with the link".
 * e.g. https://drive.google.com/file/d/FILE_ID/view -> https://drive.google.com/uc?export=download&id=FILE_ID
 */
export const getGoogleDriveDownloadUrl = (url: string): string | null => {
  if (!url || !url.trim()) return null;
  const match = url.trim().match(/drive\.google\.com\/file\/d\/([^/]+)/);
  if (match) {
    return `https://drive.google.com/uc?export=download&id=${match[1]}`;
  }
  return null;
};

/**
 * Get the best URL for opening a Google Drive document (PDF, etc.) from a view link.
 * Returns direct download URL for Drive links, otherwise the original URL.
 * Note: Google Classroom URLs are returned as-is (no conversion).
 */
export const getDocumentOpenUrl = (url: string): string => {
  if (!url || !url.trim()) return url;
  const downloadUrl = getGoogleDriveDownloadUrl(url);
  return downloadUrl ?? url;
};

/** True when attachment URL points to PowerPoint (path ends with .ppt / .pptx). Used for lesson player UX. */
export const isPresentationAttachmentUrl = (url: string | null | undefined): boolean => {
  if (!url || typeof url !== 'string') return false;
  const path = url.split('?')[0].split('#')[0].toLowerCase();
  return path.endsWith('.pptx') || path.endsWith('.ppt');
};

/** Short label for lesson header / UI (PDF vs Presentation). */
export function getLessonKindLabel(lesson: {
  lessonType: string;
  attachmentUrl?: string | null;
}): string {
  if (lesson.lessonType === 'PDF' && isPresentationAttachmentUrl(lesson.attachmentUrl)) {
    return 'Presentation';
  }
  const labels: Record<string, string> = {
    VIDEO: 'Video',
    TEXT: 'Reading',
    PDF: 'PDF',
    QUIZ: 'Quiz',
    ASSIGNMENT: 'Assignment',
  };
  return labels[lesson.lessonType] ?? 'Lesson';
}

export const getVideoEmbedUrl = (
  url: string | null | undefined,
  options?: { autoplay?: boolean; hideToolbar?: boolean }
): string | null => {
  if (!url || !url.trim()) return null;
  const u = url.trim();
  let embed: string | null = null;
  let isYoutube = false;
  let isVimeo = false;
  const yt = getYouTubeEmbedUrl(u);
  if (yt) {
    embed = yt;
    isYoutube = true;
  } else {
    const gd = getGoogleDriveEmbedUrl(u, options?.hideToolbar);
    if (gd) return gd;
    const vimeoMatch = u.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (vimeoMatch) {
      embed = `https://player.vimeo.com/video/${vimeoMatch[1]}`;
      isVimeo = true;
    } else if (u.startsWith('https://www.youtube.com/embed/') || u.startsWith('https://player.vimeo.com/video/')) {
      embed = u;
      isYoutube = u.includes('youtube.com');
      isVimeo = u.includes('vimeo.com');
    } else if (/classroom\.google\.com\//.test(u)) {
      return u;
    }
  }
  if (!embed) return null;
  if (options?.autoplay) {
    const sep = embed.includes('?') ? '&' : '?';
    if (isYoutube) embed = `${embed}${sep}autoplay=1&mute=1`;
    else if (isVimeo) embed = `${embed}${sep}autoplay=1&muted=1`;
    else embed = `${embed}${sep}autoplay=1`;
  }
  return embed;
};
