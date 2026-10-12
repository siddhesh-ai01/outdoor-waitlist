/* OUTDOOR — 404: a VAR check, then the decision (straight to it under reduced motion). */
import './site.js';
import { reduceMotion } from './motion.js';

const pitch = document.querySelector('[data-var]');
if (pitch) {
  if (reduceMotion.matches) pitch.classList.add('is-decided');
  else setTimeout(() => pitch.classList.add('is-decided'), 2400);
}
