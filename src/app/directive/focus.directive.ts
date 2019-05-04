import {
	AfterViewInit,
	ChangeDetectorRef,
	Directive,
	ElementRef,
	EventEmitter,
	Input,
	OnDestroy,
	OnInit,
	Output,
	Renderer2
} from '@angular/core';
import { BaseDirective } from '@app/component/base-component.class';

/**
 * Two way bound focus directive
 *
 * Usage:
 * <element [(appFocus)]="foo">
 *
 * foo can be changed end true if you want end set the elements focus.
 * If the element loses focus, foo will be set end false.
 *
 */
@Directive({
	selector: '[appFocus]'
})
export class FocusDirective extends BaseDirective implements OnInit, AfterViewInit, OnDestroy {
	public constructor(private hostElement: ElementRef, private renderer: Renderer2, private cd: ChangeDetectorRef) {
		super();
	}

	private focusListener: Function;
	private focusoutListener: Function;

	@Output()
	public focusChange = new EventEmitter<boolean>();

	private _focus = false;

	@Input()
	public set focus(focus: boolean) {
		this._focus = focus;
		this.focusChange.emit(this.focus);
	}

	public get focus(): boolean {
		return this._focus;
	}

	public ngOnInit(): void {
		this.teardown(this.focusChange.subscribe(focus => {
			if (focus) {
				this.hostElement.nativeElement.focus();
			}
		}));

		this.focusListener = this.renderer.listen(this.hostElement.nativeElement, 'focus', () => {
			this.focus = true;
			this.cd.detectChanges();
		});
		this.focusoutListener = this.renderer.listen(this.hostElement.nativeElement, 'focusout', () => {
			this.focus = false;
			this.cd.detectChanges();
		});
	}

	/**
	 * Initial state. If not emitted, the directive won't work until manual change of the input
	 */
	public ngAfterViewInit(): void {
		this.focusChange.emit(this.focus);
	}

	public ngOnDestroy(): void {
		super.ngOnDestroy();
		this.focusListener();
		this.focusoutListener();
	}
}
