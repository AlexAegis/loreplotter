import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'toString' })
export class ToStringPipe implements PipeTransform {
	public transform(t: any): string {
		return t.toString();
	}
}
