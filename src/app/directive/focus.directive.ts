import {
	Directive,
	OnInit,
	Input,
	ElementRef,
	EventEmitter,
	Output,
	AfterViewInit,
	ChangeDetectorRef,
	OnDestroy,
	Renderer2
} from '@angular/core';
import { Subscription } from 'rxjs';

/**
 * Two way bound focus directive
 *
 * Usage:
 * <element [(appFocus)]="foo">
 *
 * foo can be changed to true if you want to set the elements focus.
 * If the element loses focus, foo will be set to false.
 *
 */
@Directive({
	selector: 'appFocus'
})
export class FocusDirective implements OnInit, AfterViewInit, OnDestroy {
	constructor(private hostElement: ElementRef, private renderer: Renderer2, private cd: ChangeDetectorRef) {}

	private focusListener: Function;
	private focusoutListener: Function;
	private focusSubscription: Subscription;

	@Output()
	focusChange = new EventEmitter<boolean>();

	private _focus = false;

	@Input()
	set focus(focus: boolean) {
		this._focus = focus;
		this.focusChange.emit(this.focus);
	}

	get focus(): boolean {
		return this._focus;
	}

	ngOnInit(): void {
		this.focusSubscription = this.focusChange.subscribe(focus => {
			if (focus) {
				this.hostElement.nativeElement.focus();
			}
		});

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
	ngAfterViewInit(): void {
		this.focusChange.emit(this.focus);
	}

	ngOnDestroy(): void {
		this.focusListener();
		this.focusoutListener();
		this.focusSubscription.unsubscribe();
	}
}
