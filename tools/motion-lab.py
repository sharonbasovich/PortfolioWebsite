"""Local-only motion review server; no debug assets are in Vercel's output."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from io import BytesIO
from pathlib import Path
import re
from urllib.parse import parse_qs, urlsplit

ROOT = Path(__file__).resolve().parents[1]
DEV_ASSETS = {
    '/__motion_lab__/motion-lab.js': ROOT / 'tools/motion-lab.js',
    '/__motion_lab__/GSDevTools.min.js': ROOT / 'tools/vendor/GSDevTools.min.js',
}

WEBGL_OFF = """
(() => {
  const original = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (type, ...options) {
    if (typeof type === 'string' && /^webgl/.test(type)) return null;
    return original.call(this, type, ...options);
  };
})();
"""

REDUCED_MOTION = """
(() => {
  const original = window.matchMedia.bind(window);
  window.matchMedia = function (query) {
    const result = original(query);
    if (query !== '(prefers-reduced-motion: reduce)') return result;
    return new Proxy(result, {
      get(target, property) {
        if (property === 'matches') return true;
        const value = Reflect.get(target, property, target);
        return typeof value === 'function' ? value.bind(target) : value;
      }
    });
  };
})();
"""


class MotionHandler(SimpleHTTPRequestHandler):
    def translate_path(self, path):
        requested = path.split('?', 1)[0]
        if requested in DEV_ASSETS:
            return str(DEV_ASSETS[requested])
        return super().translate_path(path)

    def send_head(self):
        """Inject explicit local fixtures into HTML, preserving ordinary serving."""
        request = urlsplit(self.path)
        query = parse_qs(request.query)
        scripts = []
        if query.get('webgl') == ['off']:
            scripts.append(WEBGL_OFF)
        if query.get('motion') == ['reduce']:
            scripts.append(REDUCED_MOTION)
        if not scripts:
            return super().send_head()

        path = Path(self.translate_path(self.path))
        if path.is_dir():
            # Let the normal handler issue its directory redirect first.
            if not request.path.endswith('/'):
                return super().send_head()
            for name in ('index.html', 'index.htm'):
                candidate = path / name
                if candidate.is_file():
                    path = candidate
                    break

        if not path.is_file() or path.suffix.lower() not in ('.html', '.htm'):
            return super().send_head()

        try:
            original = path.read_bytes()
        except OSError:
            return super().send_head()

        injection = ('\n<script data-local-motion-fixture>\n'
                     + '\n'.join(scripts) + '\n</script>\n').encode('utf-8')
        head = re.search(br'<head(?:\s[^>]*)?>', original, re.IGNORECASE)
        if not head:
            return super().send_head()
        response = original[:head.end()] + injection + original[head.end():]
        self.send_response(200)
        self.send_header('Content-Type', 'text/html; charset=utf-8')
        self.send_header('Content-Length', str(len(response)))
        self.send_header('Cache-Control', 'no-store')
        self.end_headers()
        return BytesIO(response)


if __name__ == '__main__':
    server = ThreadingHTTPServer(('127.0.0.1', 8789), partial(MotionHandler, directory=str(ROOT / 'dist/startup')))
    print('Motion lab: http://127.0.0.1:8789/?motion-lab=1', flush=True)
    server.serve_forever()
