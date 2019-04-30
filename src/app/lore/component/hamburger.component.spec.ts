import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HamburgerComponent } from './hamburger.component';
import { AppModule } from 'src/app/app.module';

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
