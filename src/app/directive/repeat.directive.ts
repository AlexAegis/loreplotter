import { Directive, Input, TemplateRef, ViewContainerRef } from '@angular/core';

@Directive({ selector: '[appRepeat]' })
export class RepeatDirective {
	private c = 0;
	public constructor(private templateRef: TemplateRef<any>, private viewContainer: ViewContainerRef) {}

	@Input('appRepeatFrom')
	public set countFrom(c: number) {
		for (let i = Math.min(this.c, c); i < Math.max(this.c, c); i++) {
			if (c < this.c) {
				this.viewContainer.detach();
			} else if (c > this.c) {
				this.viewContainer.createEmbeddedView(
					this.templateRef,
					{
						$implicit: i
					},
					i
				);
			}
		}

		this.c = c;
	}

	@Input('appRepeat')
	public set countNoFrom(c: number) {
		if (c) {
			this.countFrom = c;
		}
	}
}
