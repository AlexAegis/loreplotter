import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'mathAbs' })
export class MathAbsPipe implements PipeTransform {
	public transform(t: number): number {
		return Math.abs(t);
	}
}
