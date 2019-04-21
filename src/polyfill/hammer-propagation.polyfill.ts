/**
 * * This polifill is to extend the Hammer constructor with better propagation-cancelling features
 */

import * as propagating from 'propagating-hammerjs';
Hammer = propagating(Hammer);
