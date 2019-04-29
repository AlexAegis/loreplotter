import {
	Directive,
	OnInit,
	Input,
	ElementRef,
	Renderer,
	EventEmitter,
	Output,
	AfterViewInit,
	ChangeDetectorRef,
	OnDestroy
} from '@angular/core';
import { Observable, Subscription } from 'rxjs';

/**
 * Two way bound focus directive
 *
 * Usage:
 * <element [(focus)]="myBool">
 *
 * myBool can be changed to true if you want to set the elements focus.
 * If the element loses focus, myBool will be set to false.
 *
 */
@Directive({
	selector: '[focus]'
})
export class FocusDirective implements OnInit, AfterViewInit, OnDestroy {
	constructor(private hostElement: ElementRef, private renderer: Renderer, private cd: ChangeDetectorRef) {}

	private focusListener: Function;
	private focusoutListener: Function;
	private focusSubscription: Subscription;

	@Output()
	focusChange = new EventEmitter<boolean>();

	private _focus: boolean = false;

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
				this.renderer.invokeElementMethod(this.hostElement.nativeElement, 'focus');
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
