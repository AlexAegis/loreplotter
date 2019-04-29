import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'log' })
export class LogPipe implements PipeTransform {
	transform(obj: any) {
		console.log(obj);
		return obj;
	}
}
