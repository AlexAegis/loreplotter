import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'log' })
export class LogPipe implements PipeTransform {
	public transform<T = any>(t: T): T {
		console.log(t);
		return t;
	}
}
