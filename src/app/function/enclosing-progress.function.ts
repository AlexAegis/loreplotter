import { Enclosing, Node } from '@alexaegis/avl';
import { ActorDelta, UnixWrapper } from '@app/model/data';
import { Math as ThreeMath } from 'three';

export function enclosingProgress(enclosure: Enclosing<Node<UnixWrapper, ActorDelta>>, unix: number): number {
	return ThreeMath.mapLinear(
		unix,
		enclosure.last ? enclosure.last.k.unix : -Infinity,
		enclosure.first ? enclosure.first.k.unix : Infinity,
		0,
		1
	);
}
