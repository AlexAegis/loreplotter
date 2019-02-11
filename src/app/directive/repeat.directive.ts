import { Directive, Input, TemplateRef, ViewContainerRef } from '@angular/core';

@Directive({ selector: '[appRepeat]' })
export class RepeatDirective {
	c = 0;
	constructor(private templateRef: TemplateRef<any>, private viewContainer: ViewContainerRef) {}

	@Input('appRepeat') set count(c: number) {
		for (let i = 0; i < Math.abs(this.c - c); i++) {
			if (c < this.c) {
				this.viewContainer.detach();
			} else if (c > this.c) {
				this.viewContainer.createEmbeddedView(this.templateRef);
			}
		}

		this.c = c;
	}
}
