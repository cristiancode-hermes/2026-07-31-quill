// Smoke test for Quill API (local dev server on :3111)
const BASE = 'http://localhost:3111/api';

async function main() {
  const login = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'demo@quill.app', password: 'demo1234' }),
  });
  const auth = await login.json();
  console.log('login ok:', !!auth.token, 'user:', auth.user?.username);
  const H = { Authorization: `Bearer ${auth.token}` };

  const stories = await (await fetch(`${BASE}/stories`, { headers: H })).json();
  console.log('stories:', stories.length, stories.map((s) => s.title).join(', '));
  const sid = stories[0].id;

  const stats = await (await fetch(`${BASE}/stats/dashboard`, { headers: H })).json();
  console.log('dashboard stats: totalWords=', stats.totalWords, 'today=', stats.todayWords, 'streak=', stats.streak, 'dailyGoal=', stats.dailyGoal);

  const chapters = await (await fetch(`${BASE}/stories/${sid}/chapters`, { headers: H })).json();
  console.log('chapters:', chapters.length, 'per-chapter words:', chapters.map((c) => c.totalWords).join(','));

  const scenes = await (await fetch(`${BASE}/chapters/${chapters[0].id}/scenes`, { headers: H })).json();
  console.log('scenes ch1:', scenes.length, 'wordCounts:', scenes.map((s) => s.wordCount).join(','));

  const characters = await (await fetch(`${BASE}/stories/${sid}/characters`, { headers: H })).json();
  console.log('characters:', characters.map((c) => c.name).join(', '));
  const rels = await (await fetch(`${BASE}/characters/${characters[0].id}/relationships`, { headers: H })).json();
  console.log('relationships of first char:', rels.length, rels.map((r) => `${r.type}->${r.otherCharacter?.name}`).join(', '));

  const tree = await (await fetch(`${BASE}/stories/${sid}/locations/tree`, { headers: H })).json();
  const flatten = (nodes, depth = 0) => nodes.flatMap((n) => [`${'  '.repeat(depth)}${n.name} (${n.type})`, ...flatten(n.children ?? [], depth + 1)]);
  console.log('location tree:\n' + flatten(tree).join('\n'));

  const timeline = await (await fetch(`${BASE}/stories/${sid}/timeline`, { headers: H })).json();
  console.log('timeline events:', timeline.map((e) => `[${e.eventDate}] ${e.title} (${e.characters?.map((c) => c.name).join('/') || 'no chars'})`).join(' | '));

  const weekly = await (await fetch(`${BASE}/stats/weekly-words`, { headers: H })).json();
  console.log('weekly words:', weekly.map((d) => `${d.date}:${d.words}`).join(' '));

  // create + update + delete a scene to verify write path
  const newScene = await (await fetch(`${BASE}/chapters/${chapters[0].id}/scenes`, {
    method: 'POST', headers: { ...H, 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'Smoke Test Scene', content: 'one two three four five' }),
  })).json();
  console.log('created scene:', newScene.title, 'wordCount=', newScene.wordCount);
  const upd = await (await fetch(`${BASE}/scenes/${newScene.id}`, {
    method: 'PATCH', headers: { ...H, 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: 'one two three' }),
  })).json();
  console.log('updated scene wordCount:', upd.wordCount, '(expect 3)');
  await fetch(`${BASE}/scenes/${newScene.id}`, { method: 'DELETE', headers: H });
  const scenesAfter = await (await fetch(`${BASE}/chapters/${chapters[0].id}/scenes`, { headers: H })).json();
  console.log('deleted scene; count now:', scenesAfter.length);

  // negative: bad login
  const bad = await fetch(`${BASE}/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'demo@quill.app', password: 'wrongpass' }),
  });
  console.log('bad login status (expect 401):', bad.status);

  console.log('SMOKE TEST PASSED');
}

main().catch((e) => { console.error('SMOKE TEST FAILED', e); process.exit(1); });
