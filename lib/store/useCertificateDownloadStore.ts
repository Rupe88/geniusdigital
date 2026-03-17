import { create } from 'zustand';
import { saveCertificateBlob } from '@/lib/utils/certificatePdfStorage';

interface CertificateDownloadState {
  blobUrlsByCourseId: Record<string, string>;
  generatingCourseId: string | null;
  generatingProgress: number;
  // In the browser, setInterval returns a number. (Node types sometimes make this Timeout.)
  generatingIntervalId: number | null;
  setBlobUrl: (courseId: string, url: string) => void;
  getBlobUrl: (courseId: string) => string | undefined;
  clearBlobUrl: (courseId: string) => void;
  startGenerating: (courseId: string) => void;
  setGeneratingProgress: (value: number) => void;
  finishGenerating: (courseId: string, url?: string, blob?: Blob, userId?: string) => void;
  clearGenerating: () => void;
}

export const useCertificateDownloadStore = create<CertificateDownloadState>((set, get) => ({
  blobUrlsByCourseId: {},
  generatingCourseId: null,
  generatingProgress: 0,
  generatingIntervalId: null,

  setBlobUrl: (courseId, url) => {
    const prev = get().blobUrlsByCourseId[courseId];
    if (prev) URL.revokeObjectURL(prev);
    set((s) => ({
      blobUrlsByCourseId: { ...s.blobUrlsByCourseId, [courseId]: url },
    }));
  },

  getBlobUrl: (courseId) => get().blobUrlsByCourseId[courseId],

  clearBlobUrl: (courseId) => {
    const url = get().blobUrlsByCourseId[courseId];
    if (url) {
      URL.revokeObjectURL(url);
      set((s) => {
        const next = { ...s.blobUrlsByCourseId };
        delete next[courseId];
        return { blobUrlsByCourseId: next };
      });
    }
  },

  startGenerating: (courseId) => {
    const id = get().generatingIntervalId;
    if (id) clearInterval(id);
    set({
      generatingCourseId: courseId,
      generatingProgress: 0,
      generatingIntervalId: window.setInterval(() => {
        set((s) => ({
          generatingProgress: s.generatingProgress >= 90 ? 90 : s.generatingProgress + 6,
        }));
      }, 100),
    });
  },

  setGeneratingProgress: (value) => set({ generatingProgress: value }),

  finishGenerating: (courseId, url, blob, userId) => {
    const id = get().generatingIntervalId;
    if (id) {
      clearInterval(id);
      set({ generatingIntervalId: null });
    }
    set({ generatingProgress: 100 });
    if (url) get().setBlobUrl(courseId, url);
    if (blob) {
      saveCertificateBlob(courseId, blob, userId).catch(() => {});
    }
    set({ generatingCourseId: null, generatingProgress: 0 });
  },

  clearGenerating: () => {
    const id = get().generatingIntervalId;
    if (id) clearInterval(id);
    set({ generatingCourseId: null, generatingProgress: 0, generatingIntervalId: null });
  },
}));

