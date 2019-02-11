import { Directive, Input, TemplateRef, ViewContainerRef } from '@angular/core';

@Directive({ selector: '[appRepeat]' })
export class RepeatDirective {
	constructor(private templateRef: TemplateRef<any>, private viewContainer: ViewContainerRef) {}

	@Input('appRepeat') set count(c: number) {
		this.viewContainer.clear();
		for (let i = 0; i < c; i++) {
			this.viewContainer.createEmbeddedView(this.templateRef);
		}
	}
}
