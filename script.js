const views = document.querySelectorAll('.view');
const nav = document.querySelectorAll('[data-view]');
function showView(id) {
  views.forEach(view => view.classList.toggle('active', view.id === id));
  document.querySelectorAll('.nav-link').forEach(link => link.classList.toggle('active', link.dataset.view === id));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
nav.forEach(button => button.addEventListener('click', () => showView(button.dataset.view)));

const power = document.querySelector('#power');
const derivative = document.querySelector('#derivative');
const output = document.querySelector('#power-output');
const graph = document.querySelector('#graph-line');
const curves = {
  1: 'M53 145 L403 45',
  2: 'M53 166 C120 166 151 161 179 144 S232 79 293 60 S358 34 403 28',
  3: 'M53 170 C177 170 212 168 242 135 S278 51 403 24',
  4: 'M53 171 C223 171 255 168 282 118 S314 38 403 24',
  5: 'M53 171 C263 171 292 164 315 100 S341 31 403 24'
};
power.addEventListener('input', () => {
  const n = power.value;
  output.textContent = n;
  derivative.innerHTML = `6x<sup>${n}</sup>`;
  graph.setAttribute('d', curves[n]);
});
document.querySelector('#reveal-rule').addEventListener('click', () => {
  document.querySelector('#rule-panel').classList.add('visible');
  document.querySelector('#rule-panel').scrollIntoView({ behavior: 'smooth', block: 'center' });
});

const answer = document.querySelector('#answer');
const feedback = document.querySelector('#feedback');
document.querySelector('#check-answer').addEventListener('click', () => {
  const value = answer.value.toLowerCase().replace(/\s/g, '').replace(/³/g, '^3');
  const correct = ['2x^3+c', '2x^3+c.', '2x^3+c+0'];
  if (correct.includes(value)) {
    feedback.className = 'feedback show correct';
    feedback.innerHTML = '<b>Beautiful work! ✦</b><br>You raised the exponent, divided 6 by 3, and remembered + C. That’s the whole move.';
  } else if (value.includes('6x^3')) {
    feedback.className = 'feedback show close';
    feedback.innerHTML = '<b>You’re close. 👀</b><br>You raised the exponent correctly. Now divide the coefficient by the new exponent: 6 ÷ 3.';
  } else {
    feedback.className = 'feedback show close';
    feedback.innerHTML = '<b>Let’s slow it down.</b><br>First increase the exponent from 2 to 3. Then ask: what coefficient differentiates into 6x²?';
  }
});
answer.addEventListener('keydown', event => { if (event.key === 'Enter') document.querySelector('#check-answer').click(); });
document.querySelector('#hint-button').addEventListener('click', () => document.querySelector('#hint').classList.toggle('visible'));

const modal = document.querySelector('#lost-modal');
document.querySelector('#lost-button').addEventListener('click', () => { modal.classList.add('open'); modal.setAttribute('aria-hidden', 'false'); });
document.querySelector('#close-modal').addEventListener('click', () => { modal.classList.remove('open'); modal.setAttribute('aria-hidden', 'true'); });
modal.addEventListener('click', event => { if (event.target === modal) document.querySelector('#close-modal').click(); });
