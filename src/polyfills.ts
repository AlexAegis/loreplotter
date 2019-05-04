import 'hammerjs/hammer';
import 'reflect-metadata';
import 'zone.js/dist/zone';

import './polyfill/hammer-extended-mouse-events.polyfill';
import './polyfill/hammer-propagation.polyfill';

declare namespace Hammer {}
(window as any).global = window;
