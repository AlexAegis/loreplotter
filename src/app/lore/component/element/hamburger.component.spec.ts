import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { AppModule } from '@app/app.module';

import { HamburgerComponent } from 'src/app/lore/component/element/hamburger.component';

describe('HamburgerComponent', () => {
	let component: HamburgerComponent;
	let fixture: ComponentFixture<HamburgerComponent>;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			imports: [AppModule]
		}).compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(HamburgerComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
