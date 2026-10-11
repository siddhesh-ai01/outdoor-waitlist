/* OUTDOOR — Join the waitlist page */
import './site.js';
import { initField } from './field.js';
import { initCount, initForms } from './waitlist.js';

const panel = document.querySelector('.join-panel');
if (panel) initField(panel, { embers: 'brand', pointer: false });
initCount();
initForms();
