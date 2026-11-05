"""Local-only review of both portfolios and the model studies, with fixtures.

Run python tools/portfolio-review.py. No QA route or script is in dist.
"""
from functools import partial
from http.server import ThreadingHTTPServer
from pathlib import Path
import runpy

ROOT = Path(__file__).resolve().parents[1]
MotionHandler = runpy.run_path(str(ROOT / 'tools/motion-lab.py'))['MotionHandler']

if __name__ == '__main__':
    server = ThreadingHTTPServer(('127.0.0.1', 8790), partial(MotionHandler, directory=str(ROOT)))
    print('Portfolio review: http://127.0.0.1:8790/tools/model-studies/', flush=True)
    server.serve_forever()
