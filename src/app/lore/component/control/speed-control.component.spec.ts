import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SpeedControlComponent } from 'src/app/lore/component/control/speed-control.component';

describe('SpeedControlComponent', () => {
	let component: SpeedControlComponent;
	let fixture: ComponentFixture<SpeedControlComponent>;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			declarations: [SpeedControlComponent]
		}).compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(SpeedControlComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
