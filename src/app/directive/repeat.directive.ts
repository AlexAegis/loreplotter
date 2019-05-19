import { Directive, Input, TemplateRef, ViewContainerRef } from '@angular/core';
import { BaseDirective } from '@app/component/base-component.class';
import { Subject } from 'rxjs';
import { map, throttleTime } from 'rxjs/operators';

@Directive({ selector: '[appRepeat]' })
export class RepeatDirective extends BaseDirective {
	private c = 0;

	private audit = new Subject<number>();

	public constructor(private templateRef: TemplateRef<any>, private viewContainer: ViewContainerRef) {
		super();
		this.teardown = this.audit
			.pipe(
				throttleTime(1000 / 60),
				map(c => Math.ceil(c))
			)
			.subscribe(c => {
				for (let i = Math.min(this.c, c); i < Math.max(this.c, c); i++) {
					if (c < this.c) {
						try {
							this.viewContainer.detach();
						} catch (e) {
						}
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
				if (this.viewContainer.length !== c) {
					console.log('Error in Repeat Directive, Resetting');
					this.viewContainer.clear();
					for (let i = 0; i < c; i++) {
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
			});
	}

	@Input('appRepeatFrom')
	public set countFrom(c: number) {
		if (this.c !== c) {
			this.audit.next(c);
		}
	}

	@Input('appRepeat')
	public set countNoFrom(c: number) {
		if (c) {
			this.countFrom = c;
		}
	}
}
