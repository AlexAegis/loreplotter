import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LightControlComponent } from 'src/app/lore/component/control/light-control.component';

describe('LightControlComponent', () => {
	let component: LightControlComponent;
	let fixture: ComponentFixture<LightControlComponent>;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			declarations: [LightControlComponent]
		}).compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(LightControlComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
