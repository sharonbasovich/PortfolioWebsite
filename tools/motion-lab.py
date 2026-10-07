"""Local-only motion review server; no debug assets are in Vercel's output."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEV_ASSETS = {
    '/__motion_lab__/motion-lab.js': ROOT / 'tools/motion-lab.js',
    '/__motion_lab__/GSDevTools.min.js': ROOT / 'tools/vendor/GSDevTools.min.js',
}


class MotionHandler(SimpleHTTPRequestHandler):
    def translate_path(self, path):
        requested = path.split('?', 1)[0]
        if requested in DEV_ASSETS:
            return str(DEV_ASSETS[requested])
        return super().translate_path(path)


if __name__ == '__main__':
    server = ThreadingHTTPServer(('127.0.0.1', 8789), partial(MotionHandler, directory=str(ROOT / 'dist/startup')))
    print('Motion lab: http://127.0.0.1:8789/?motion-lab=1', flush=True)
    server.serve_forever()
