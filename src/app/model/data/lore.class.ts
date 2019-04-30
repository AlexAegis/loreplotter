import { Actor, Planet } from '@app/model/data';
/**
 * Has an attachment for the planets texture
 */
export class Lore {
	name: string;
	actors: Array<Actor> = [];
	locations: Array<string> = [];
	planet: Planet;
}
