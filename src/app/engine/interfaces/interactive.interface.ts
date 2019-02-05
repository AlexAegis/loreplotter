import { Deselectable } from './deselectable.interface';
import { Selectable } from './selectable.interface';
import { Highlightable } from './highlightable.interface';

export interface Interactive extends Highlightable, Selectable, Deselectable {}
