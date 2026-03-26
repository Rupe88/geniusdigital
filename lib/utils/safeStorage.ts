const canUseWindow = () => typeof window !== 'undefined';

export const storageGet = (key: string): string | null => {
  if (!canUseWindow()) return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

export const storageSet = (key: string, value: string): boolean => {
  if (!canUseWindow()) return false;
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
};

export const storageRemove = (key: string): void => {
  if (!canUseWindow()) return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Ignore storage access errors for locked-down browsers/webviews.
  }
};

export const storageSetTokens = (accessToken: string, refreshToken?: string | null): boolean => {
  const accessOk = storageSet('accessToken', accessToken);
  if (!accessOk) return false;

  if (refreshToken) {
    const refreshOk = storageSet('refreshToken', refreshToken);
    if (!refreshOk) {
      storageRemove('accessToken');
      return false;
    }
  }

  return true;
};

export const storageClearTokens = (): void => {
  storageRemove('accessToken');
  storageRemove('refreshToken');
};
