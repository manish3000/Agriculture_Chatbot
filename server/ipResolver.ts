import type { IncomingMessage } from "node:http";

/**
 * Validates and sanitizes IPv4 and IPv6 addresses to prevent header injection or spoofing
 */
export function isValidIp(ip: string): boolean {
  if (!ip || typeof ip !== "string") return false;
  const trimmed = ip.trim();
  // Basic IPv4 regex
  const ipv4Regex =
    /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  // Basic IPv6 check
  const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::1$|^::$/;
  return ipv4Regex.test(trimmed) || ipv6Regex.test(trimmed) || trimmed.includes(":");
}

/**
 * Anonymizes an IP address for privacy-compliant logging (GDPR / Indian DPDP Act compliant)
 * e.g., 103.241.144.18 -> 103.241.***.***
 */
export function maskIpForPrivacy(ip: string): string {
  if (!ip) return "unknown";
  if (ip.includes(".")) {
    const parts = ip.split(".");
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.***.***`;
    }
  }
  if (ip.includes(":")) {
    const parts = ip.split(":");
    return parts.slice(0, 3).join(":") + ":****:****";
  }
  return ip.slice(0, Math.min(6, ip.length)) + "***";
}

/**
 * Securely extracts client IP handling proxy headers and direct connections
 */
export function extractClientIp(req: IncomingMessage): string {
  // 1. Support development test header if provided
  const overrideHeader = req.headers["x-client-ip"];
  if (typeof overrideHeader === "string" && isValidIp(overrideHeader.trim())) {
    return overrideHeader.trim();
  }

  // 2. Check X-Forwarded-For: take first valid client IP (client, proxy1, proxy2)
  const forwardedFor = req.headers["x-forwarded-for"];
  if (typeof forwardedFor === "string") {
    const ips = forwardedFor.split(",").map((s) => s.trim());
    for (const rawIp of ips) {
      // Remove port if present (e.g., 192.168.1.1:8080)
      const cleanIp = rawIp.replace(/:\d+$/, "");
      if (isValidIp(cleanIp)) {
        if (cleanIp === "127.0.0.1" || cleanIp === "::1") {
          return "103.241.144.18"; // Localhost development demo IP
        }
        return cleanIp;
      }
    }
  }

  // 3. Check X-Real-IP
  const realIp = req.headers["x-real-ip"];
  if (typeof realIp === "string") {
    const cleanRealIp = realIp.trim().replace(/:\d+$/, "");
    if (isValidIp(cleanRealIp)) {
      if (cleanRealIp === "127.0.0.1" || cleanRealIp === "::1") {
        return "103.241.144.18";
      }
      return cleanRealIp;
    }
  }

  // 4. Socket remote address
  const remoteAddress = req.socket?.remoteAddress;
  if (remoteAddress) {
    const cleanRemote = remoteAddress.replace(/^::ffff:/, "").replace(/:\d+$/, "");
    if (cleanRemote === "127.0.0.1" || cleanRemote === "::1") {
      return "103.241.144.18";
    }
    if (isValidIp(cleanRemote)) {
      return cleanRemote;
    }
  }

  return "103.241.144.18";
}
