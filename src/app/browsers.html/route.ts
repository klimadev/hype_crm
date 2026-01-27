import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const target = new URL('https://web.whatsapp.com/browsers.html');
  const { searchParams } = new URL(request.url);
  searchParams.forEach((value, key) => {
    target.searchParams.set(key, value);
  });

  const proxyUrl = new URL('/api/webproxy', request.url);
  proxyUrl.searchParams.set('url', target.toString());

  const resp = await fetch(proxyUrl.toString(), {
    method: 'GET',
    headers: request.headers,
    cache: 'no-store',
  });

  const contentType = resp.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) return resp;

  const html = await resp.text();
  const injection = `
<script src="/wppconnect-wa.js"></script>
<script src="/hype-console.js"></script>`;

  const withInjection = /<\/body>/i.test(html)
    ? html.replace(/<\/body>/i, `${injection}</body>`)
    : /<\/html>/i.test(html)
      ? html.replace(/<\/html>/i, `${injection}</html>`)
      : html + injection;
  return new Response(withInjection, {
    status: resp.status,
    headers: resp.headers,
  });
}
