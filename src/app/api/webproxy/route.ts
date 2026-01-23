import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url') || 'https://web.whatsapp.com';

  // Extract cookies from the incoming request to pass them to WhatsApp
  const cookieHeader = request.headers.get('cookie') || '';

  try {
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,pt-BR;q=0.8,pt;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Cookie': cookieHeader, // Pass along cookies
      },
      // In Node.js, fetch doesn't have a direct "disable SSL verify" like curl
      // but usually the default environment handles it. 
      // If needed, we'd use a custom agent, but for web.whatsapp.com it should be fine.
      cache: 'no-store',
    });

    if (!response.ok) {
      // If we get a 400 or other error, let's see the body if possible
      const errorText = await response.text().catch(() => 'No body');
      console.error(`WhatsApp Proxy Error (${response.status}):`, errorText);
      return new Response(`WhatsApp returned error: ${response.status}. Body: ${errorText.substring(0, 100)}`, { 
        status: response.status,
        headers: { 'Content-Type': 'text/plain' }
      });
    }

    let content = await response.text();
    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('text/html')) {
      const injectionScript = `
<script>
(function() {
    if (window.__WPP_INJECTED__) return;
    window.__WPP_INJECTED__ = true;
    
    function logWpp(msg) { console.log("[WPP-Connect] " + msg); }
    
    async function injectWpp() {
        if (document.getElementById('wpp-script')) return;
        var script = document.createElement("script");
        script.id = 'wpp-script';
        script.src = "/wppconnect-wa.js";
        script.onload = () => {
            logWpp("Script loaded");
            let check = setInterval(() => {
                if (typeof WPP !== "undefined" && WPP.isReady()) {
                    logWpp("WPP Ready");
                    clearInterval(check);
                    window.parent.postMessage({type: "wpp-ready"}, "*");
                }
            }, 500);
        };
        document.head.appendChild(script);
    }
    
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", injectWpp);
    else injectWpp();
})();
</script>
<script src="/hype-console.js"></script>`;
      content = content.replace(/<\/body>/i, `${injectionScript}</body>`);
      content = content.replace(/<meta[^>]*Content-Security-Policy[^>]*>/gi, '');
    }

    const headers = new Headers();
    // Replicate PHP header logic: block some, allow others
    const blockedHeaders = ['content-security-policy', 'x-frame-options', 'strict-transport-security', 'x-content-type-options', 'content-length', 'content-encoding'];
    
    response.headers.forEach((value, key) => {
      const lowKey = key.toLowerCase();
      if (!blockedHeaders.includes(lowKey)) {
        headers.set(key, value);
      }
    });

    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    headers.set('Access-Control-Allow-Headers', '*');

    return new Response(content, {
      status: response.status,
      headers: headers,
    });
  } catch (error) {
    console.error('Proxy Fetch Exception:', error);
    return new Response(`Error: ${(error as Error).message}`, { status: 500 });
  }
}
