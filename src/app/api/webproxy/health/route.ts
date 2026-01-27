import dns from 'dns';
import http from 'http';
import https from 'https';
import { NextRequest } from 'next/server';

dns.setDefaultResultOrder('ipv4first');

const MAX_REDIRECTS = 5;
const REQUEST_TIMEOUT_MS = 30000;

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
  const targetUrl = new URL(request.url).searchParams.get('url') || 'https://web.whatsapp.com';
  const userAgent = request.headers.get('user-agent') || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
  const acceptLanguage = request.headers.get('accept-language') || 'en-US,en;q=0.9,pt-BR;q=0.8,pt;q=0.7';

  const resp = await requestUrl(targetUrl, {
    'User-Agent': userAgent,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': acceptLanguage,
    'Accept-Encoding': 'identity',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'DNT': '1',
    'Connection': 'keep-alive',
  });

  const contentType = (resp.headers['content-type'] || '').toString();
  const bodyText = resp.body.toString('utf-8');

  const looksLikeWhatsApp = /id="whatsapp-web"/i.test(bodyText) || /web\.whatsapp\.com/i.test(bodyText) || /whatsapp/i.test(bodyText);
  const looksUnsupported = /browser\s+not\s+supported|unsupported\s+browser/i.test(bodyText) || /browsers\.html/i.test(bodyText);

  return Response.json({
    ok: looksLikeWhatsApp && !looksUnsupported,
    status: resp.status,
    contentType,
    finalUrl: resp.finalUrl,
    indicators: {
      looksLikeWhatsApp,
      looksUnsupported,
    },
    sample: bodyText.slice(0, 500),
  });
}
