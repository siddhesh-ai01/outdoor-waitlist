/* OUTDOOR — Legal pages: an "On this page" list built from the headings,
   with the section you're reading marked. */
import './site.js';
import { onFrame, reduceMotion } from './motion.js';

const body = document.querySelector('[data-legal]');
const toc = document.querySelector('[data-toc]');
if (body && toc) {
  const heads = Array.from(body.querySelectorAll('h2'));
  const links = heads.map((h, i) => {
    if (!h.id) h.id = `section-${i + 1}`;
    const a = document.createElement('a');
    a.href = `#${h.id}`;
    a.textContent = h.textContent;
    a.addEventListener('click', (e) => {
      e.preventDefault();
      h.scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth', block: 'start' });
      history.replaceState(null, '', `#${h.id}`);
    });
    toc.append(a);
    return a;
  });
  let current = -1;
  onFrame((vh) => {
    let k = 0;
    heads.forEach((h, i) => { if (h.getBoundingClientRect().top < vh * 0.3) k = i; });
    if (k !== current) {
      current = k;
      links.forEach((a, i) => a.classList.toggle('is-active', i === k));
    }
  });
}
