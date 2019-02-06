import { Deselectable } from './deselectable.interface';
import { Selectable } from './selectable.interface';
import { Hoverable } from './hoverable.interface';

export interface Interactive extends Hoverable, Selectable, Deselectable {}
