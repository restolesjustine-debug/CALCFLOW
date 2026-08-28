const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const api = async (url, options = {}) => {
  const response = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...options });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Something went wrong. Please try again.');
  return data;
};
let profile = null;
let problems = [];
let currentProblem = 0;

function toast(message) { const box = $('#toast'); box.textContent = message; box.classList.add('show'); setTimeout(() => box.classList.remove('show'), 2600); }
function showView(id) { $$('.view').forEach((view) => view.classList.toggle('active', view.id === id)); $$('.side-nav button').forEach((button) => button.classList.toggle('active', button.dataset.view === id)); window.scrollTo({ top: 0, behavior: 'smooth' }); }
function updateProfile(nextProfile) { profile = nextProfile; $('#xp-total').textContent = profile.xp; $('#mastery-number').textContent = `${profile.mastery}%`; $('.profile b').textContent = profile.name; $('.profile small').textContent = `Level ${profile.level} · Explorer`; $('.home-head h1').innerHTML = `Good afternoon,<br><em>${profile.name}.</em>`; }
$$('[data-view]').forEach((button) => button.addEventListener('click', () => showView(button.dataset.view)));

const lessonCurves = { 1: 'M53 151L398 43', 2: 'M53 169C121 169 150 165 178 146S232 76 294 57S358 32 398 27', 3: 'M53 170C164 170 213 167 244 130S278 48 398 25', 4: 'M53 170C225 170 254 167 282 109S312 35 398 25', 5: 'M53 170C264 170 290 163 314 95S340 30 398 25' };
$('#lesson-power').addEventListener('input', (event) => { const n = event.target.value; $('#lesson-power-output').textContent = n; $('#lesson-derivative').innerHTML = `6x<sup>${n}</sup>`; $('#lesson-curve').setAttribute('d', lessonCurves[n]); });
$('#start-lesson').addEventListener('click', () => { $('#rule-reveal').classList.add('visible'); $('#rule-reveal').scrollIntoView({ behavior: 'smooth', block: 'center' }); });

function renderProblem() {
  const problem = problems[currentProblem]; if (!problem) return;
  $('#problem-count').textContent = `Problem ${currentProblem + 1} of ${problems.length}`; $('#problem-prompt').textContent = problem.prompt; $('#challenge').innerHTML = problem.expression; $('#answer').value = ''; $('#feedback').className = 'feedback'; $('#workthrough').className = 'workthrough'; $('#workthrough').innerHTML = '';
  $$('.practice-progress i').forEach((item, index) => item.classList.toggle('done', index < currentProblem));
}
async function checkAnswer() {
  const button = $('#check-answer'); const answer = $('#answer').value; if (!answer.trim()) { $('#feedback').className = 'feedback warm'; $('#feedback').innerHTML = '<b>Give it a try.</b> Even an imperfect first answer tells us which move to explore next.'; return; }
  button.disabled = true; button.innerHTML = 'Checking…';
  try {
    const result = await api('/api/attempts', { method: 'POST', body: JSON.stringify({ problemId: problems[currentProblem].id, answer }) });
    updateProfile(result.profile); const feedback = $('#feedback');
    if (result.correct) { feedback.className = 'feedback success'; feedback.innerHTML = `<b>That’s it! ✦</b> You made every move: raise the power, balance the coefficient, and keep + C.${result.xpEarned ? '' : ' You had already mastered this one, so no extra XP was needed.'}`; if (result.xpEarned) toast(`+${result.xpEarned} XP · thoughtful work pays off`); setTimeout(() => { if (currentProblem < problems.length - 1) { currentProblem += 1; renderProblem(); } else { feedback.innerHTML = '<b>Session complete! ✦</b> You finished all five guided problems. Your Integration Ocean is a little more restored.'; } }, 1100); }
    else { feedback.className = 'feedback warm'; feedback.innerHTML = '<b>You’re close enough to learn from this.</b> Try one hint — it will point at the next move without taking it away.'; $('#hint-button').dataset.hint = result.hint; $('#show-work').dataset.work = result.walkthrough; }
  } catch (error) { $('#feedback').className = 'feedback warm'; $('#feedback').textContent = error.message; } finally { button.disabled = false; button.innerHTML = 'Check it <b>→</b>'; }
}
$('#check-answer').addEventListener('click', checkAnswer); $('#answer').addEventListener('keydown', (event) => { if (event.key === 'Enter') checkAnswer(); });
$('#hint-button').addEventListener('click', () => { const fallback = problems[currentProblem]?.hint || 'Raise the exponent, then balance the coefficient.'; $('#feedback').className = 'feedback hint'; $('#feedback').innerHTML = `<b>Hint:</b> ${$('#hint-button').dataset.hint || fallback}`; });
$('#show-work').addEventListener('click', () => { const fallback = 'Raise the power by one, divide by that new power, and include + C.'; $('#workthrough').className = 'workthrough visible'; $('#workthrough').innerHTML = `<b>Here’s the move:</b> ${$('#show-work').dataset.work || fallback}`; });

function graphPath(coefficient, power) { const points = []; for (let px = 49; px <= 540; px += 5) { const x = (px - 292) / 61; const y = 165 - coefficient * (x ** power) * 10; points.push(`${px === 49 ? 'M' : 'L'}${px.toFixed(1)} ${Math.max(22, Math.min(300, y)).toFixed(1)}`); } return points.join(' '); }
function updateLab() { const coefficient = Number($('#coefficient').value) || 0; const power = Number($('#lab-power').value); const reverse = $('.mode.active').dataset.mode === 'reverse'; const displayCoefficient = reverse ? coefficient / (power + 1) : coefficient * power; const displayPower = reverse ? power + 1 : Math.max(0, power - 1); const sign = displayCoefficient === 1 ? '' : displayCoefficient === -1 ? '−' : String(displayCoefficient); $('#lab-power-display').textContent = power; $('#graph-expression').textContent = `f(x) = ${coefficient}x${power === 1 ? '' : `^${power}`}`; $('#lab-result').innerHTML = `${sign}${displayPower === 0 ? '' : `x<sup>${displayPower}</sup>`}${reverse ? ' + C' : ''}`; $('#result-label').textContent = reverse ? 'Antiderivative' : 'Derivative'; $('#lab-path').setAttribute('d', graphPath(coefficient, power)); $('#result-copy').textContent = reverse ? `Raise the power to ${power + 1}, then divide ${coefficient} by ${power + 1}.` : `Multiply ${coefficient} by ${power}, then lower the power by one.`; $('#lab-explain-title').textContent = reverse ? 'The power stepped up.' : 'The power came down front.'; $('#lab-explain-copy').textContent = reverse ? `To reverse ${coefficient}x^${power}, make the power ${power + 1} and balance the coefficient by dividing by ${power + 1}.` : `For ${coefficient}x^${power}, multiplying ${coefficient} by the power ${power} gives ${coefficient * power}; then the power drops to ${Math.max(0, power - 1)}.`; }
$('#coefficient').addEventListener('input', updateLab); $('#lab-power').addEventListener('input', updateLab); $$('.mode').forEach((button) => button.addEventListener('click', () => { $$('.mode').forEach((item) => item.classList.remove('active')); button.classList.add('active'); updateLab(); }));

const modal = $('#lost-modal'); function closeModal() { modal.classList.remove('open'); modal.setAttribute('aria-hidden', 'true'); } function openModal() { modal.classList.add('open'); modal.setAttribute('aria-hidden', 'false'); $('#lost-response').innerHTML = ''; }
$('#lost-button').addEventListener('click', openModal); $('#mobile-lost').addEventListener('click', openModal); $('#close-modal').addEventListener('click', closeModal); modal.addEventListener('click', (event) => { if (event.target === modal) closeModal(); });
$$('[data-lost]').forEach((button) => button.addEventListener('click', () => { const responses = { basics: 'That makes sense. Let’s begin with a 5-minute exponent refresh — no pressure.', start: 'Start here: one guided antiderivative. You only need the next move, not the whole chapter.', mistake: 'Let’s look for the pattern in your mistake together. Practice gives specific hints.', overwhelmed: 'You can stop here and come back. Your journey will be exactly where you left it.' }; $('#lost-response').innerHTML = `<b>A small plan:</b> ${responses[button.dataset.lost]} <button data-view="${button.dataset.lost === 'mistake' ? 'practice' : 'learn'}">Take me there →</button>`; $('#lost-response [data-view]').addEventListener('click', (event) => { closeModal(); showView(event.target.dataset.view); }); }));

async function boot() { try { const [nextProfile, nextProblems] = await Promise.all([api('/api/profile'), api('/api/problems')]); updateProfile(nextProfile); problems = nextProblems; renderProblem(); } catch (error) { toast('CalcFlow could not reach its learning server. Run npm start and refresh.'); console.error(error); } updateLab(); }
boot();
