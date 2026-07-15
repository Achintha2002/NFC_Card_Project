// ============================================================
//  TAGIT — Analytics Helper Utilities
//  Handles zero-dependency User-Agent parsing, IP anonymization,
//  and lightweight IP geolocation resolution.
// ============================================================

export interface ParsedUserAgent {
  device: 'Mobile' | 'Desktop' | 'Tablet' | 'Unknown';
  os: string;
  browser: string;
}

export interface GeoLocation {
  location: string;
  country: string;
  city: string;
  ip: string;
}

/**
 * Zero-dependency parser for User-Agent string to extract device, OS, and browser.
 */
export function parseUserAgent(ua?: string): ParsedUserAgent {
  if (!ua) {
    return { device: 'Unknown', os: 'Unknown', browser: 'Unknown' };
  }

  // ── 1. Detect Device Type ───────────────────────────────────
  let device: ParsedUserAgent['device'] = 'Desktop';
  if (/tablet|ipad|playbook|silk/i.test(ua) || (/android/i.test(ua) && !/mobile/i.test(ua))) {
    device = 'Tablet';
  } else if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile|wpdesktop/i.test(ua)) {
    device = 'Mobile';
  }

  // ── 2. Detect OS ─────────────────────────────────────────────
  let os = 'Unknown';
  if (/iphone|ipad|ipod/i.test(ua)) {
    os = 'iOS';
  } else if (/android/i.test(ua)) {
    os = 'Android';
  } else if (/macintosh|mac os x/i.test(ua)) {
    os = 'macOS';
  } else if (/windows nt/i.test(ua)) {
    os = 'Windows';
  } else if (/linux/i.test(ua)) {
    os = 'Linux';
  }

  // ── 3. Detect Browser ────────────────────────────────────────
  let browser = 'Unknown';
  if (/edg/i.test(ua)) {
    browser = 'Edge';
  } else if (/opr|opera/i.test(ua)) {
    browser = 'Opera';
  } else if (/chrome|crios/i.test(ua) && !/edg/i.test(ua)) {
    browser = 'Chrome';
  } else if (/safari/i.test(ua) && !/chrome|crios|fxios/i.test(ua)) {
    browser = 'Safari';
  } else if (/firefox|fxios/i.test(ua)) {
    browser = 'Firefox';
  }

  return { device, os, browser };
}

/**
 * Anonymizes an IP address by stripping its last octet (e.g., 192.168.1.45 -> 192.168.1.x)
 * to comply with privacy laws (GDPR) while preserving subnet info for geo-lookup.
 */
export function anonymizeIp(ip?: string): string {
  if (!ip) return 'Unknown';
  
  // Clean up IPv6 loopback or IPv4-mapped IPv6
  let cleanIp = ip.replace(/^::ffff:/, '');
  if (cleanIp === '::1' || cleanIp === '127.0.0.1' || cleanIp === 'localhost') {
    return '127.0.0.x (Local dev)';
  }

  // IPv4 masking
  const parts = cleanIp.split('.');
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.${parts[2]}.x`;
  }

  // IPv6 masking (keep first 3 blocks)
  const v6Parts = cleanIp.split(':');
  if (v6Parts.length > 3) {
    return `${v6Parts[0]}:${v6Parts[1]}:${v6Parts[2]}:*`;
  }

  return cleanIp;
}

/**
 * Resolves geolocation (`location`, `country`, `city`) from an IP or headers.
 * Uses a 2-second timeout against ip-api.com and falls back gracefully.
 */
export async function resolveLocation(
  ip?: string,
  headers?: Record<string, string | string[] | undefined>
): Promise<GeoLocation> {
  // Check fast reverse-proxy geo headers first (Vercel / Cloudflare / AWS)
  if (headers) {
    const countryHeader = headers['x-vercel-ip-country'] || headers['cf-ipcountry'] || headers['x-country-code'];
    const cityHeader = headers['x-vercel-ip-city'] || headers['x-city'];
    if (typeof countryHeader === 'string' && countryHeader.length > 0) {
      const country = countryHeader.toUpperCase();
      const city = typeof cityHeader === 'string' && cityHeader.length > 0 ? cityHeader : 'Unknown City';
      return {
        location: `${city}, ${country}`,
        country,
        city,
        ip: anonymizeIp(ip),
      };
    }
  }

  let cleanIp = (ip || '').replace(/^::ffff:/, '').trim();
  if (!cleanIp || cleanIp === '::1' || cleanIp === '127.0.0.1' || cleanIp.startsWith('192.168.') || cleanIp.startsWith('10.')) {
    // For local development loopback IPs, return a simulated rich location so testing looks realistic
    return {
      location: 'Colombo, LK (Local Dev)',
      country: 'LK',
      city: 'Colombo',
      ip: anonymizeIp(cleanIp),
    };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000); // 2 second timeout

    const response = await fetch(`http://ip-api.com/json/${cleanIp}?fields=status,country,countryCode,city`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (response.ok) {
      const data = (await response.json()) as {
        status: string;
        country?: string;
        countryCode?: string;
        city?: string;
      };

      if (data.status === 'success') {
        const country = data.countryCode || data.country || 'Unknown';
        const city = data.city || 'Unknown City';
        return {
          location: `${city}, ${country}`,
          country,
          city,
          ip: anonymizeIp(cleanIp),
        };
      }
    }
  } catch {
    // Timeout or network failure — fall back silently without blocking request
  }

  return {
    location: 'Global / Unknown',
    country: 'Unknown',
    city: 'Unknown',
    ip: anonymizeIp(cleanIp),
  };
}
