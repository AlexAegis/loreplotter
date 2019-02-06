import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PopupComponent } from './popup.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

describe('PopupComponent', () => {
	let component: PopupComponent;
	let fixture: ComponentFixture<PopupComponent>;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			imports: [BrowserAnimationsModule],
			declarations: [PopupComponent]
		}).compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(PopupComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
