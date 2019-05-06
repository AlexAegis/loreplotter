import { Planet } from '@app/model/data';

/**
 * Has an attachment for the planets texture
 */
export class Lore {
	public constructor(public id: string, public name: string, public locations: Array<string> = [], public planet: Planet) {}
}
