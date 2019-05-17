import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'mathRound' })
export class MathRoundPipe implements PipeTransform {
	public transform(t: number): number {
		return Math.round(t);
	}
}
