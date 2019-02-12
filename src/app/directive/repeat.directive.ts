import { Directive, Input, TemplateRef, ViewContainerRef } from '@angular/core';

@Directive({ selector: '[appRepeat]' })
export class RepeatDirective {
	c = 0;
	constructor(private templateRef: TemplateRef<any>, private viewContainer: ViewContainerRef) {}

	@Input('appRepeatFrom')
	set countFrom(c: number) {
		for (let i = Math.min(this.c, c); i < Math.max(this.c, c); i++) {
			if (c < this.c) {
				this.viewContainer.detach();
			} else if (c > this.c) {
				this.viewContainer.createEmbeddedView(this.templateRef, {
					$implicit: i
				});
			}
		}

		this.c = c;
	}

	@Input('appRepeat')
	set countNoFrom(c: number) {
		if (c) {
			this.countFrom = c;
		}
	}
}
