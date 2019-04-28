import 'hammerjs/hammer';
declare namespace Hammer {}
import 'zone.js/dist/zone';
(window as any).global = window;
import 'reflect-metadata';

import './polyfill/hammer-extended-mouse-events.polyfill';
import './polyfill/hammer-propagation.polyfill';
