export const INSTALLATION_ID_HEADER = 'x-app-installation-id';

const INSTALLATION_ID_STORAGE_KEY = 'app_installation_id';
const INSTALLATION_ID_COOKIE_KEY = 'app_installation_id';
const INSTALLATION_ID_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365 * 5;

let cachedInstallationId = '';

export const normalizeInstallationId = (value: unknown) =>
  value?.toString().trim() || '';

const generateInstallationId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `inst_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
};

const readInstallationIdFromCookie = () => {
  if (typeof document === 'undefined') return '';

  const cookieEntry = document.cookie
    .split('; ')
    .find((entry) => entry.startsWith(`${INSTALLATION_ID_COOKIE_KEY}=`));

  if (!cookieEntry) return '';

  const [, rawValue = ''] = cookieEntry.split('=');
  return normalizeInstallationId(decodeURIComponent(rawValue));
};

const persistInstallationId = (installationId: string) => {
  const normalized = normalizeInstallationId(installationId);
  if (!normalized) return '';

  cachedInstallationId = normalized;

  if (typeof window === 'undefined') {
    return normalized;
  }

  window.localStorage.setItem(INSTALLATION_ID_STORAGE_KEY, normalized);
  document.cookie = `${INSTALLATION_ID_COOKIE_KEY}=${encodeURIComponent(
    normalized
  )}; Max-Age=${INSTALLATION_ID_COOKIE_MAX_AGE_SECONDS}; Path=/; SameSite=Lax`;

  return normalized;
};

export const getOrCreateInstallationId = () => {
  if (cachedInstallationId) {
    return cachedInstallationId;
  }

  if (typeof window === 'undefined') {
    return '';
  }

  const storedInstallationId = normalizeInstallationId(
    window.localStorage.getItem(INSTALLATION_ID_STORAGE_KEY)
  );
  const cookieInstallationId = readInstallationIdFromCookie();
  const installationId = storedInstallationId || cookieInstallationId;

  if (installationId) {
    return persistInstallationId(installationId);
  }

  return persistInstallationId(generateInstallationId());
};
