/**
 * Backend stub for end-to-end offline sync validation (RF-07).
 *
 * Run with: node backend-stub.js
 * Listens on http://localhost:3000
 *
 * Endpoints:
 *   POST /sync/report    — accepts installation report JSON
 *   POST /sync/diagnostic — accepts diagnostic snapshot JSON
 *   POST /sync/device_update — accepts device update JSON
 *   GET  /sync/status    — returns received count
 */
const http = require('http');

const received = { report: [], diagnostic: [], device_update: [] };

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', () => {
      try { resolve(JSON.parse(body)); }
      catch { resolve({}); }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');

  const url = new URL(req.url, `http://localhost:3000`);
  const path = url.pathname;

  if (req.method === 'GET' && path === '/sync/status') {
    res.writeHead(200);
    res.end(JSON.stringify({
      status: 'ok',
      received: {
        reports: received.report.length,
        diagnostics: received.diagnostic.length,
        deviceUpdates: received.device_update.length,
      },
      timestamp: new Date().toISOString(),
    }));
    return;
  }

  if (req.method === 'POST' && path.startsWith('/sync/')) {
    const type = path.replace('/sync/', '');
    if (!['report', 'diagnostic', 'device_update'].includes(type)) {
      res.writeHead(404);
      res.end(JSON.stringify({ error: 'Unknown sync type' }));
      return;
    }

    const body = await readBody(req);
    received[type].push({ receivedAt: new Date().toISOString(), payload: body });

    console.log(`[STUB] Received ${type}:`, JSON.stringify(body, null, 2).slice(0, 200));

    // Simulate occasional failures (10%) to test retry logic
    if (Math.random() < 0.1) {
      res.writeHead(503);
      res.end(JSON.stringify({ error: 'Simulated server error (retry logic test)' }));
      return;
    }

    res.writeHead(200);
    res.end(JSON.stringify({
      success: true,
      id: body.id ?? `stub-${Date.now()}`,
      receivedAt: new Date().toISOString(),
    }));
    return;
  }

  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Not found' }));
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`\n🚀 Backend stub running at http://localhost:${PORT}`);
  console.log('   POST /sync/report       — receives installation reports');
  console.log('   POST /sync/diagnostic   — receives diagnostic snapshots');
  console.log('   POST /sync/device_update — receives device updates');
  console.log('   GET  /sync/status       — shows received counts');
  console.log('\n   10% random failure rate enabled to test retry logic\n');
});
