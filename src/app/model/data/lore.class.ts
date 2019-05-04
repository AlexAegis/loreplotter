import { Planet } from '@app/model/data';

/**
 * Has an attachment for the planets texture
 */
export class Lore {
	constructor(public name: string) {}
	public id: string;
	public locations: Array<string> = [];
	public planet: Planet;
}
