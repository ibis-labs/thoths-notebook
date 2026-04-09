/**
 * Thoth Launcher — local HTTP helper for Lively Wallpaper
 *
 * Lively's web-wallpaper sandbox has no native "run process" API.
 * This tiny server bridges that gap: the wallpaper fetch()es here,
 * this server executes the whitelisted command.
 *
 * Usage:
 *   node launcher.js
 *
 * To auto-start with Windows, create a shortcut to this command in:
 *   shell:startup  (Win+R → shell:startup)
 * pointing to:
 *   node "C:\dev\thoth-terminal\launcher.js"
 */

const http = require('http');
const { spawn } = require('child_process');

const PORT = 7890;

// Only commands listed here can ever be launched.
// Each entry: { exe: executable, args: argument array }
const ALLOWED_COMMANDS = {
    'powershell': { exe: 'powershell.exe', args: [] },
    'code':       { exe: 'code',           args: [] },
    'recycle-bin':{ exe: 'explorer.exe',   args: ['shell:RecycleBinFolder'] },
};

const server = http.createServer((req, res) => {
    // Reject anything not coming from localhost
    const ip = req.socket.remoteAddress;
    if (ip !== '127.0.0.1' && ip !== '::1' && ip !== '::ffff:127.0.0.1') {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }

    // CORS — required so the wallpaper's WebView2 origin can fetch here
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    const url = new URL(req.url, `http://127.0.0.1:${PORT}`);

    if (url.pathname === '/launch') {
        const cmd = url.searchParams.get('cmd');
        const executable = cmd && ALLOWED_COMMANDS[cmd];

        if (!executable) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: 'Unknown command' }));
            return;
        }

        try {
            const { exe, args } = executable;
            const child = spawn(exe, args, {
                detached: true,
                stdio: 'ignore',
                shell: true,
                windowsHide: false,
            });
            child.unref(); // let it outlive this process

            console.log(`Launched: ${executable.exe} ${executable.args.join(' ')}`.trim());
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, launched: executable }));
        } catch (err) {
            console.error(`Failed to launch ${executable}:`, err.message);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: err.message }));
        }
    } else {
        res.writeHead(404);
        res.end('Not found');
    }
});

server.listen(PORT, '127.0.0.1', () => {
    console.log(`Thoth Launcher running on http://127.0.0.1:${PORT}`);
    console.log('Allowed commands:', Object.keys(ALLOWED_COMMANDS).join(', '));
});
