import { Actor, Planet } from '@app/model/data';
/**
 * Has an attachment for the planets texture
 */
export class Lore {
	constructor(public name: string) {}
	public locations: Array<string> = [];
	public planet: Planet;
}
