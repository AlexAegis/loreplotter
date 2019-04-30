import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TimelineComponent } from './timeline.component';
import { AppModule } from 'src/app/app.module';
import { MaterialModule } from 'src/app/shared/material.module';

describe('TimelineComponent', () => {
	let component: TimelineComponent;
	let fixture: ComponentFixture<TimelineComponent>;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			imports: [AppModule]
		}).compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(TimelineComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
