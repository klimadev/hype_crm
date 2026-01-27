import dns from 'dns';
import http from 'http';
import https from 'https';
import { NextRequest } from 'next/server';

dns.setDefaultResultOrder('ipv4first');

const MAX_REDIRECTS = 5;
const REQUEST_TIMEOUT_MS = 30000;
const PROXY_PATH = '/api/webproxy?url=';

function shouldSkipRewrite(value: string) {
  const trimmed = value.trim();
  return trimmed.startsWith('#')
    || trimmed.startsWith('data:')
    || trimmed.startsWith('blob:')
    || trimmed.startsWith('mailto:')
    || trimmed.startsWith('tel:')
    || trimmed.startsWith('javascript:')
    || trimmed.startsWith(PROXY_PATH);
}

function toAbsoluteUrl(value: string, baseUrl: URL) {
  if (shouldSkipRewrite(value)) return value;
  if (value.startsWith('//')) {
    return `${baseUrl.protocol}${value}`;
  }
  if (value.startsWith('http://') || value.startsWith('https://')) {
    return value;
  }
  return new URL(value, baseUrl).toString();
}

function toProxyUrl(value: string) {
  return `${PROXY_PATH}${encodeURIComponent(value)}`;
}


function rewriteSrcset(srcset: string, baseUrl: URL) {
  return srcset
    .split(',')
    .map(entry => {
      const trimmed = entry.trim();
      if (!trimmed) return trimmed;
      const parts = trimmed.split(/\s+/);
      const url = parts[0];
      if (shouldSkipRewrite(url)) return trimmed;
      const absolute = toAbsoluteUrl(url, baseUrl);
      parts[0] = toProxyUrl(absolute);
      return parts.join(' ');
    })
    .join(', ');
}

function rewriteHtml(html: string, baseUrl: URL) {
  let output = html;

  output = output.replace(/\s(src|href|action|poster)=(["'])([^"']+)\2/gi, (match, attr, quote, value) => {
    if (shouldSkipRewrite(value)) return match;
    const absolute = toAbsoluteUrl(value, baseUrl);
    return ` ${attr}=${quote}${toProxyUrl(absolute)}${quote}`;
  });

  output = output.replace(/\ssrcset=(["'])([^"']+)\1/gi, (match, quote, value) => {
    return ` srcset=${quote}${rewriteSrcset(value, baseUrl)}${quote}`;
  });

  output = output.replace(/url\(([^)]+)\)/gi, (match, raw) => {
    const unquoted = raw.trim().replace(/^['"]|['"]$/g, '');
    if (shouldSkipRewrite(unquoted)) return match;
    const absolute = toAbsoluteUrl(unquoted, baseUrl);
    return `url(${toProxyUrl(absolute)})`;
  });

  output = output.replace(/<meta[^>]*Content-Security-Policy[^>]*>/gi, '');

  return output;
}

function injectScriptsIntoHtml(html: string) {
  const injectionScript = `
 <script>
 (function() {
     try { window.parent.postMessage({ type: "wa:inject", version: 1, payload: { timestamp: Date.now() } }, "*"); } catch {}

     function loadScript(src, onOk, onErr) {
         try {
             var s = document.createElement('script');
             s.src = src;
             s.async = true;
             s.onload = onOk;
             s.onerror = onErr;
             (document.head || document.documentElement).appendChild(s);
         } catch (e) {
             if (onErr) onErr(e);
         }
     }

      loadScript('/wppconnect-wa.js?v=' + Date.now(), function () {
          try { window.parent.postMessage({ type: "wa:wpp-load-ok", version: 1, payload: { timestamp: Date.now() } }, "*"); } catch {}
      }, function () {
          try { window.parent.postMessage({ type: "wa:wpp-load-error", version: 1, payload: { timestamp: Date.now() } }, "*"); } catch {}
      });

      loadScript('/webproxy-bridge.js?v=' + Date.now(), function () {
          try { window.parent.postMessage({ type: "wa:bridge-load-ok", version: 1, payload: { timestamp: Date.now() } }, "*"); } catch {}
      }, function () {
          try { window.parent.postMessage({ type: "wa:bridge-load-error", version: 1, payload: { timestamp: Date.now() } }, "*"); } catch {}
      });
 })();
 </script>
 <script>
(function() {
    if (window.__WPP_INJECTED__) return;
    window.__WPP_INJECTED__ = true;

    function logWpp(msg) { console.log("[WPP-Connect] " + msg); }

    function waitWppReady() {
        let tries = 0;
        let check = setInterval(() => {
            tries++;
            if (typeof WPP !== "undefined" && typeof WPP.isReady === 'function' && WPP.isReady()) {
                logWpp("WPP Ready");
                clearInterval(check);
                try { window.parent.postMessage({type: "wpp-ready"}, "*"); } catch {}
            }
            if (tries > 120) clearInterval(check);
        }, 500);
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", waitWppReady);
    else waitWppReady();
})();
 </script>`;

  if (/<\/body>/i.test(html)) {
    return html.replace(/<\/body>/i, `${injectionScript}</body>`);
  }
  if (/<\/html>/i.test(html)) {
    return html.replace(/<\/html>/i, `${injectionScript}</html>`);
  }
  return html + injectionScript;
}

function shouldInjectIntoHtml(html: string) {
  // Don't inject into non-document fragments where <head>/<body> don't exist.
  // (WA sometimes serves HTML fragments for errors/diagnostics.)
  return /<html\b/i.test(html) || /<head\b/i.test(html) || /<body\b/i.test(html);
}

function isHealthcheckRequest(request: NextRequest) {
  const pathname = new URL(request.url).pathname;
  return pathname === '/api/webproxy/health';
}


function requestUrl(url: string, headers: Record<string, string>, redirectCount = 0): Promise<{ status: number; headers: http.IncomingHttpHeaders; body: Buffer; finalUrl: string; }> {
  return new Promise((resolve, reject) => {
    const target = new URL(url);
    const client = target.protocol === 'https:' ? https : http;

    const req = client.request({
      protocol: target.protocol,
      hostname: target.hostname,
      port: target.port || (target.protocol === 'https:' ? 443 : 80),
      path: `${target.pathname}${target.search}`,
      method: 'GET',
      headers,
      timeout: REQUEST_TIMEOUT_MS,
      family: 4,
    }, (res) => {
      const status = res.statusCode || 0;
      const location = res.headers.location;

      if (status >= 300 && status < 400 && location && redirectCount < MAX_REDIRECTS) {
        res.resume();
        const nextUrl = new URL(location, target).toString();
        requestUrl(nextUrl, headers, redirectCount + 1).then(resolve).catch(reject);
        return;
      }

      const chunks: Buffer[] = [];
      res.on('data', (chunk) => {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      });
      res.on('end', () => {
        resolve({
          status,
          headers: res.headers,
          body: Buffer.concat(chunks),
          finalUrl: target.toString(),
        });
      });
    });

    req.on('timeout', () => {
      req.destroy(new Error('Request timeout'));
    });
    req.on('error', reject);
    req.end();
  });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url') || 'https://web.whatsapp.com';

  // Extract cookies from the incoming request to pass them to WhatsApp
  const cookieHeader = request.headers.get('cookie') || '';
  const clientUserAgent = request.headers.get('user-agent');
  const clientAcceptLanguage = request.headers.get('accept-language');
  const clientAccept = request.headers.get('accept');
  const clientChUa = request.headers.get('sec-ch-ua');
  const clientChUaMobile = request.headers.get('sec-ch-ua-mobile');
  const clientChUaPlatform = request.headers.get('sec-ch-ua-platform');
  const clientChUaPlatformVersion = request.headers.get('sec-ch-ua-platform-version');
  const clientChUaFullVersion = request.headers.get('sec-ch-ua-full-version');
  const clientChUaFullVersionList = request.headers.get('sec-ch-ua-full-version-list');
  const clientSecFetchDest = request.headers.get('sec-fetch-dest');
  const clientSecFetchMode = request.headers.get('sec-fetch-mode');
  const clientSecFetchSite = request.headers.get('sec-fetch-site');
  const clientSecFetchUser = request.headers.get('sec-fetch-user');
  const clientUpgradeInsecure = request.headers.get('upgrade-insecure-requests');
  const clientDnt = request.headers.get('dnt');

  try {
    const response = await requestUrl(targetUrl, {
      'User-Agent': clientUserAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept': clientAccept || 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': clientAcceptLanguage || 'en-US,en;q=0.9,pt-BR;q=0.8,pt;q=0.7',
      'Accept-Encoding': 'identity',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Referer': 'https://web.whatsapp.com/',
      'Origin': 'https://web.whatsapp.com',
      ...(clientUpgradeInsecure ? { 'Upgrade-Insecure-Requests': clientUpgradeInsecure } : { 'Upgrade-Insecure-Requests': '1' }),
      ...(clientSecFetchDest ? { 'Sec-Fetch-Dest': clientSecFetchDest } : { 'Sec-Fetch-Dest': 'document' }),
      ...(clientSecFetchMode ? { 'Sec-Fetch-Mode': clientSecFetchMode } : { 'Sec-Fetch-Mode': 'navigate' }),
      ...(clientSecFetchSite ? { 'Sec-Fetch-Site': clientSecFetchSite } : { 'Sec-Fetch-Site': 'none' }),
      ...(clientSecFetchUser ? { 'Sec-Fetch-User': clientSecFetchUser } : { 'Sec-Fetch-User': '?1' }),
      ...(clientDnt ? { 'DNT': clientDnt } : { 'DNT': '1' }),
      ...(clientChUa ? { 'Sec-CH-UA': clientChUa } : {}),
      ...(clientChUaMobile ? { 'Sec-CH-UA-Mobile': clientChUaMobile } : {}),
      ...(clientChUaPlatform ? { 'Sec-CH-UA-Platform': clientChUaPlatform } : {}),
      ...(clientChUaPlatformVersion ? { 'Sec-CH-UA-Platform-Version': clientChUaPlatformVersion } : {}),
      ...(clientChUaFullVersion ? { 'Sec-CH-UA-Full-Version': clientChUaFullVersion } : {}),
      ...(clientChUaFullVersionList ? { 'Sec-CH-UA-Full-Version-List': clientChUaFullVersionList } : {}),
      'Connection': 'keep-alive',
      ...(cookieHeader ? { 'Cookie': cookieHeader } : {}),
    });

    if (response.status < 200 || response.status >= 300) {
      const errorText = response.body.toString('utf-8');
      console.error(`WhatsApp Proxy Error (${response.status}):`, errorText);
      return new Response(`WhatsApp returned error: ${response.status}. Body: ${errorText.substring(0, 100)}`, { 
        status: response.status,
        headers: { 'Content-Type': 'text/plain' }
      });
    }

    const rawContentType = response.headers['content-type'];
    const contentType = Array.isArray(rawContentType) ? rawContentType.join(',') : (rawContentType || '');

    // Healthcheck: don't rewrite/inject, just verify we can reach WA and it's not the unsupported browser page.
    if (isHealthcheckRequest(request)) {
      const bodyText = response.body.toString('utf-8');
      const looksLikeWhatsApp = /web\.whatsapp\.com/i.test(bodyText) || /whatsapp/i.test(bodyText);
      const looksUnsupported = /browser\s+not\s+supported|unsupported\s+browser/i.test(bodyText) || /browsers\.html/i.test(bodyText);

      return Response.json({
        ok: looksLikeWhatsApp && !looksUnsupported,
        status: response.status,
        contentType,
        finalUrl: response.finalUrl,
        indicators: {
          looksLikeWhatsApp,
          looksUnsupported,
        },
        sample: bodyText.slice(0, 500),
      });
    }

    let htmlContent: string | null = null;
    let bodyText: string | null = null;
    const isHtml = contentType.includes('text/html') || contentType.includes('application/xhtml+xml');

    if (isHtml) {
      bodyText = response.body.toString('utf-8');
    } else if (!contentType || contentType.startsWith('text/')) {
      const maybeText = response.body.toString('utf-8');
      if (shouldInjectIntoHtml(maybeText)) {
        bodyText = maybeText;
      }
    }

    if (bodyText !== null) {
      const base = new URL(response.finalUrl || targetUrl);
      let content = rewriteHtml(bodyText, base);
      if (shouldInjectIntoHtml(content)) {
        content = injectScriptsIntoHtml(content);
      }
      htmlContent = content;
    }

    const headers = new Headers();
    // Replicate PHP header logic: block some, allow others
    const blockedHeaders = ['content-security-policy', 'x-frame-options', 'strict-transport-security', 'x-content-type-options', 'content-length', 'content-encoding'];
    
    Object.entries(response.headers).forEach(([key, value]) => {
      const lowKey = key.toLowerCase();
      if (!blockedHeaders.includes(lowKey) && value) {
        headers.set(key, Array.isArray(value) ? value.join(',') : value);
      }
    });

    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    headers.set('Access-Control-Allow-Headers', '*');

    // Ensure our injected scripts can run.
    headers.set('Content-Security-Policy', "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:; frame-ancestors *");

    if (htmlContent) {
      return new Response(htmlContent, {
        status: response.status,
        headers,
      });
    }

    return new Response(new Uint8Array(response.body), {
      status: response.status,
      headers,
    });
  } catch (error) {
    console.error('Proxy Fetch Exception:', error);
    return new Response(`Error: ${(error as Error).message}`, { status: 500 });
  }
}
