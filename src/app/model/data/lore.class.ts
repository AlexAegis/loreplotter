import { Planet } from '@app/model/data';

/**
 * Has an attachment for the planets texture
 */
export class Lore {
	public constructor(
		public id: string,
		public name: string,
		public locations: Array<string> = [],
		public planet: Planet
	) {
	}
}

export const exampleLore = {
	name: 'Example',
	locations: [],
	planet: { name: 'Earth', radius: 6371 },
	id: '0'
};
/* tslint:disable */
export const exampleActors = [
	{
		loreId: '0',
		states:
			'{"root":{"l":{"h":1,"k":{"unix":1556791251.0310843,"__type":"UnixWrapper"},"v":{"name":"a","position":{"x":-0.3757916966063185,"y":-0.281843772454739,"z":0.8827749608149299},"knowledge":[{"key":"Favourite color","value":"blue"},{"key":"Has a cat","value":"yes"}],"maxSpeed":6,"__type":"ActorDelta"}},"r":{"r":{"h":1,"k":{"unix":1557050451.0310843,"__type":"UnixWrapper"},"v":{"position":{"x":-0.605726277152065,"y":0.5558722625716483,"z":0.5690292996108239},"knowledge":[{"key":"Favourite color","value":"red"}],"__type":"ActorDelta"}},"h":2,"k":{"unix":1556964051.0310843,"__type":"UnixWrapper"},"v":{"position":{"x":0.39117893980613805,"y":0.386437376899397,"z":0.8346608718892985},"knowledge":[],"__type":"ActorDelta"}},"h":3,"k":{"unix":1556877651.0310843,"__type":"UnixWrapper"},"v":{"position":{"x":0.09669254683261017,"y":-0.497612862967823,"z":0.8617354361375862},"knowledge":[],"__type":"ActorDelta"}}}',
		id: '1'
	},
	{
		loreId: '0',
		states:
			'{"root":{"h":1,"k":{"unix":1556809205.224611,"__type":"UnixWrapper"},"v":{"position":{"x":0.09669254683261017,"y":-0.497612862967823,"z":0.8617354361375862},"knowledge":[],"__type":"ActorDelta"}}}',
		id: '2'
	},
	{
		loreId: '0',
		states:
			'{"root":{"r":{"h":1,"k":{"unix":1557266400,"__type":"UnixWrapper"},"v":{"position":{"x":0.09669254683261017,"y":-0.497612862967823,"z":0.8617354361375862},"knowledge":[],"__type":"ActorDelta"}},"h":2,"k":{"unix":1557180000,"__type":"UnixWrapper"},"v":{"name":"a","position":{"x":-0.3757916966063185,"y":-0.281843772454739,"z":0.8827749608149299},"knowledge":[],"__type":"ActorDelta"}}}',
		id: '3'
	},
	{
		loreId: '0',
		states:
			'{"root":{"l":{"h":1,"k":{"unix":1557180000,"__type":"UnixWrapper"},"v":{"name":"a","position":{"x":-0.3757916966063185,"y":-0.281843772454739,"z":0.8827749608149299},"knowledge":[],"__type":"ActorDelta"}},"r":{"h":1,"k":{"unix":1557439200,"__type":"UnixWrapper"},"v":{"position":{"x":-0.605726277152065,"y":0.5558722625716483,"z":0.5690292996108239},"knowledge":[],"__type":"ActorDelta"}},"h":2,"k":{"unix":1557266400,"__type":"UnixWrapper"},"v":{"position":{"x":0.09669254683261017,"y":-0.497612862967823,"z":0.8617354361375862},"knowledge":[],"__type":"ActorDelta"}}}',
		id: '4'
	},
	{
		loreId: '0',
		states:
			'{"root":{"r":{"h":1,"k":{"unix":1557439200,"__type":"UnixWrapper"},"v":{"position":{"x":-0.605726277152065,"y":0.5558722625716483,"z":0.5690292996108239},"knowledge":[],"__type":"ActorDelta"}},"h":2,"k":{"unix":1557180000,"__type":"UnixWrapper"},"v":{"name":"a","position":{"x":-0.3757916966063185,"y":-0.281843772454739,"z":0.8827749608149299},"knowledge":[],"__type":"ActorDelta"}}}',
		id: '5'
	}
];
/* tslint:enable */
