const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');

const PORT = Number(process.env.PORT || 4173);
const ROOT = __dirname;
const DATA_FILE = path.join(ROOT, 'data', 'db.json');
const PUBLIC_FILES = { '/': 'index.html', '/index.html': 'index.html', '/styles.css': 'styles.css', '/script.js': 'script.js' };
const contentTypes = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8' };
const problems = [
  { id: 'power-1', prompt: 'Find an antiderivative.', expression: '∫ 6x<sup>2</sup> dx', answer: '2x^3+c', hint: 'Raise 2 to 3. What is 6 ÷ 3?', walkthrough: 'x² becomes x³. Then 6 ÷ 3 = 2, so the answer is 2x³ + C.' },
  { id: 'power-2', prompt: 'Rebuild the original function.', expression: '∫ 12x<sup>3</sup> dx', answer: '3x^4+c', hint: 'The new exponent is 4. Divide 12 by 4.', walkthrough: 'x³ becomes x⁴. Then 12 ÷ 4 = 3, so the answer is 3x⁴ + C.' },
  { id: 'power-3', prompt: 'Give this function a family.', expression: '∫ 4x dx', answer: '2x^2+c', hint: 'x is x¹. Raise 1 to 2, then divide 4 by 2.', walkthrough: 'x¹ becomes x². Then 4 ÷ 2 = 2, so the answer is 2x² + C.' },
  { id: 'power-4', prompt: 'Watch the coefficient carefully.', expression: '∫ 15x<sup>4</sup> dx', answer: '3x^5+c', hint: 'The new exponent is 5. What is 15 ÷ 5?', walkthrough: 'x⁴ becomes x⁵. Then 15 ÷ 5 = 3, so the answer is 3x⁵ + C.' },
  { id: 'power-5', prompt: 'One final gentle challenge.', expression: '∫ 8x<sup>3</sup> dx', answer: '2x^4+c', hint: 'Bring 3 up to 4 and balance 8 by dividing by 4.', walkthrough: 'x³ becomes x⁴. Then 8 ÷ 4 = 2, so the answer is 2x⁴ + C.' }
];

const normalize = (value = '') => String(value).toLowerCase().replace(/\s/g, '').replaceAll('³', '^3').replaceAll('²', '^2');
const defaultDb = { learners: { demo: { id: 'demo', name: 'Justine', level: 4, xp: 180, mastery: 60, streak: 4, completed: [], attempts: [], createdAt: new Date().toISOString() } } };
async function readDb() { try { return JSON.parse(await fs.readFile(DATA_FILE, 'utf8')); } catch { await writeDb(defaultDb); return structuredClone(defaultDb); } }
async function writeDb(data) { await fs.mkdir(path.dirname(DATA_FILE), { recursive: true }); await fs.writeFile(DATA_FILE, `${JSON.stringify(data, null, 2)}\n`); }
function send(res, status, payload, headers = {}) { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', ...headers }); res.end(JSON.stringify(payload)); }
async function body(req) { let raw = ''; for await (const chunk of req) { raw += chunk; if (raw.length > 100000) throw new Error('Request too large'); } try { return raw ? JSON.parse(raw) : {}; } catch { throw new Error('Invalid JSON'); } }
function publicProfile(learner) { const { attempts, ...profile } = learner; return { ...profile, completedCount: learner.completed.length, totalProblems: problems.length }; }

async function api(req, res, url) {
  const db = await readDb(); const learner = db.learners.demo;
  if (req.method === 'GET' && url.pathname === '/api/health') return send(res, 200, { status: 'ok' });
  if (req.method === 'GET' && url.pathname === '/api/profile') return send(res, 200, publicProfile(learner));
  if (req.method === 'PATCH' && url.pathname === '/api/profile') { const input = await body(req); if (typeof input.name !== 'string' || !input.name.trim() || input.name.trim().length > 32) return send(res, 422, { error: 'Please use a name between 1 and 32 characters.' }); learner.name = input.name.trim(); await writeDb(db); return send(res, 200, publicProfile(learner)); }
  if (req.method === 'GET' && url.pathname === '/api/problems') return send(res, 200, problems.map(({ answer, ...problem }) => problem));
  if (req.method === 'POST' && url.pathname === '/api/attempts') {
    const input = await body(req); const problem = problems.find((item) => item.id === input.problemId); if (!problem) return send(res, 404, { error: 'That practice problem does not exist.' });
    const correct = normalize(input.answer) === problem.answer; learner.attempts.push({ id: crypto.randomUUID(), problemId: problem.id, answer: String(input.answer || '').slice(0, 100), correct, createdAt: new Date().toISOString() });
    let xpEarned = 0; if (correct && !learner.completed.includes(problem.id)) { learner.completed.push(problem.id); learner.xp += 20; learner.mastery = Math.min(100, learner.mastery + 8); xpEarned = 20; }
    await writeDb(db); return send(res, 200, { correct, xpEarned, profile: publicProfile(learner), hint: problem.hint, walkthrough: problem.walkthrough });
  }
  if (req.method === 'POST' && url.pathname === '/api/reset') { db.learners.demo = structuredClone(defaultDb.learners.demo); await writeDb(db); return send(res, 200, publicProfile(db.learners.demo)); }
  return send(res, 404, { error: 'API route not found.' });
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (url.pathname.startsWith('/api/')) return await api(req, res, url);
    const file = PUBLIC_FILES[url.pathname]; if (!file || !['GET', 'HEAD'].includes(req.method)) { res.writeHead(404); return res.end('Not found'); }
    const target = path.join(ROOT, file); const content = await fs.readFile(target); res.writeHead(200, { 'Content-Type': contentTypes[path.extname(target)], 'Cache-Control': 'no-cache' }); res.end(req.method === 'HEAD' ? undefined : content);
  } catch (error) { send(res, error.message === 'Invalid JSON' ? 400 : 500, { error: error.message || 'Unexpected server error.' }); }
});
server.listen(PORT, () => console.log(`CalcFlow is ready at http://localhost:${PORT}`));
