import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PlayComponent } from 'src/app/lore/component/control/play.component';

describe('PlayComponent', () => {
	let component: PlayComponent;
	let fixture: ComponentFixture<PlayComponent>;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			declarations: [PlayComponent]
		}).compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(PlayComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
