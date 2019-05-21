import { Planet } from '@app/model/data';

/**
 * Has an attachment for the planets texture
 */
export class Lore {
	public constructor(public id: string, public name: string, public planet: Planet) {}
}

export const exampleLore = {
	name: 'Example',
	planet: { name: 'Earth', radius: 6371 },
	id: '0'
};
/* tslint:disable */
export const exampleActors = [
	{
		loreId: '0',
		states:
			'{"root":{"l":{"h":1,"k":{"unix":1558220429,"__type":"UnixWrapper"},"v":{"position":{"x":0.31079691389491537,"y":0.02590408189683169,"z":0.9501005842186824},"properties":"[{\\"key\\":\\"gr\\",\\"value\\":\\"eteet\\"}]","color":"#e63100","__type":"ActorDelta"}},"r":{"l":{"h":1,"k":{"unix":1558466951,"__type":"UnixWrapper"},"v":{"position":{"x":0.3238165964949023,"y":0.053521646545237285,"z":0.9473132743829903},"properties":"[]","__type":"ActorDelta"}},"r":{"h":1,"k":{"unix":1559057044,"__type":"UnixWrapper"},"v":{"position":{"x":0.4033383827194838,"y":0.03394093960041536,"z":0.915932736846041},"properties":"[]","__type":"ActorDelta"}},"h":2,"k":{"unix":1558690147,"__type":"UnixWrapper"},"v":{"position":{"x":0.3450319118484605,"y":0.028226133871091196,"z":0.9421469130822046},"properties":"[{\\"key\\":\\"eee\\",\\"value\\":\\"hh\\"},{\\"key\\":\\"hehe\\",\\"value\\":\\"zzz\\"}]","color":"#e63100","__type":"ActorDelta"}},"h":3,"k":{"unix":1558422021,"__type":"UnixWrapper"},"v":{"position":{"x":0.33034835084322073,"y":0.05405700286525455,"z":0.9422869365615725},"properties":"[]","__type":"ActorDelta"}}}',
		id: '0'
	}
];

/* tslint:enable */
