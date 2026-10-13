export interface RateLimitStatus {
  allowed: boolean;
  used: number;
  remaining: number;
  max: number;
  windowSeconds: number;
  retryAfterSeconds: number;
  ip: string;
}

export const RATE_LIMIT_MAX_QUERIES = 5;
export const RATE_LIMIT_WINDOW_SECONDS = 60;

const OVERRIDE_IP_KEY = "cgai_override_ip";
const CLIENT_IP_CACHE_KEY = "cgai_client_ip";

export const PRESET_TEST_IPS = [
  { ip: "103.241.144.18", label: "Raipur, CG (Airtel Broadband)" },
  { ip: "49.36.128.5", label: "Bilaspur, CG (Jio 5G)" },
  { ip: "117.202.94.33", label: "Durg, CG (BSNL Fiber)" },
  { ip: "192.168.1.104", label: "Local Farm Hub (LAN)" },
];

export function getOverrideIp(): string | null {
  return localStorage.getItem(OVERRIDE_IP_KEY);
}

export function setOverrideIp(ip: string | null): void {
  if (ip) {
    localStorage.setItem(OVERRIDE_IP_KEY, ip);
  } else {
    localStorage.removeItem(OVERRIDE_IP_KEY);
  }
}

export function getCurrentIpSync(): string {
  const override = getOverrideIp();
  if (override) return override;

  const cached = sessionStorage.getItem(CLIENT_IP_CACHE_KEY);
  if (cached) return cached;

  return "103.241.144.18";
}

export async function getClientIp(): Promise<string> {
  const override = getOverrideIp();
  if (override) return override;

  try {
    const res = await fetch("/api/ratelimit");
    if (res.ok) {
      const data = await res.json();
      if (data && data.ip) {
        sessionStorage.setItem(CLIENT_IP_CACHE_KEY, data.ip);
        return data.ip;
      }
    }
  } catch {
    // fallback
  }

  const fallback = "103.241.144.18";
  sessionStorage.setItem(CLIENT_IP_CACHE_KEY, fallback);
  return fallback;
}
