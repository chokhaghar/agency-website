"""Local server for the website + admin panel.

Run:  python tools/server.py      (or double-click "Start Website.bat")
Site:  http://localhost:5500/            Admin: http://localhost:5500/admin.html
Admin saves go straight to disk (data/site.json and assets/uploads/...).
Only listens on 127.0.0.1, so nobody else on the network can change files.
"""
import http.server, json, os, posixpath, sys, urllib.parse, webbrowser, threading

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PORT = next((int(a) for a in sys.argv[1:] if a.isdigit()), 5500)
WRITABLE = ('data/', 'assets/')
MAX_BYTES = 200 * 1024 * 1024


def safe_path(rel):
    rel = posixpath.normpath(urllib.parse.unquote(rel).replace('\\', '/')).lstrip('/')
    if rel.startswith('..') or not rel.startswith(WRITABLE):
        return None
    return os.path.join(ROOT, *rel.split('/'))


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=ROOT, **kw)

    def end_headers(self):
        if self.path.startswith(('/data/', '/admin', '/js/', '/css/', '/index.html')) or self.path in ('/', ''):
            self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def _json(self, code, obj):
        body = json.dumps(obj).encode()
        self.send_response(code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        u = urllib.parse.urlparse(self.path)
        if u.path == '/__admin/ping':
            return self._json(200, {'ok': True, 'mode': 'local'})
        if u.path == '/__admin/list':
            out = []
            base = os.path.join(ROOT, 'assets')
            for dp, _, fs in os.walk(base):
                for f in fs:
                    full = os.path.join(dp, f)
                    rel = os.path.relpath(full, ROOT).replace('\\', '/')
                    out.append({'path': rel, 'size': os.path.getsize(full)})
            return self._json(200, {'files': sorted(out, key=lambda x: x['path'])})
        return super().do_GET()

    def do_PUT(self):
        u = urllib.parse.urlparse(self.path)
        if u.path != '/__admin/file':
            return self._json(404, {'error': 'not found'})
        rel = urllib.parse.parse_qs(u.query).get('path', [''])[0]
        dest = safe_path(rel)
        n = int(self.headers.get('Content-Length', 0))
        if not dest:
            return self._json(400, {'error': 'path not allowed: ' + rel})
        if n > MAX_BYTES:
            return self._json(413, {'error': 'file too large'})
        data = self.rfile.read(n)
        if rel.endswith('.json'):
            try:
                json.loads(data.decode('utf-8'))
            except Exception as e:
                return self._json(400, {'error': 'invalid json: %s' % e})
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        tmp = dest + '.tmp'
        with open(tmp, 'wb') as f:
            f.write(data)
        os.replace(tmp, dest)
        return self._json(200, {'ok': True, 'path': rel, 'size': n})

    def log_message(self, fmt, *args):
        if '/__admin/' in (args[0] if args else ''):
            sys.stderr.write('[admin] ' + (fmt % args) + '\n')


if __name__ == '__main__':
    srv = http.server.ThreadingHTTPServer(('127.0.0.1', PORT), Handler)
    print(f'Website:     http://localhost:{PORT}/')
    print(f'Admin panel: http://localhost:{PORT}/admin.html')
    print('Band karne ke liye ye window close kar do.')
    if '--open' in sys.argv:
        threading.Timer(1.0, lambda: webbrowser.open(f'http://localhost:{PORT}/admin.html')).start()
    srv.serve_forever()
