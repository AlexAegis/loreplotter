import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LoreFormComponent } from 'src/app/lore/component/dialog/lore-form.component';

describe('LoreFormComponent', () => {
	let component: LoreFormComponent;
	let fixture: ComponentFixture<LoreFormComponent>;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			declarations: [LoreFormComponent]
		}).compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(LoreFormComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
