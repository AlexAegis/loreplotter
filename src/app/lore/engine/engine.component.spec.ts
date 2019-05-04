import { async, TestBed } from '@angular/core/testing';
import { AppModule } from 'src/app/app.module';
import { EngineComponent } from './engine.component';

describe('EngineComponent', () => {
	beforeEach(async(() => {
		TestBed.configureTestingModule({
			imports: [AppModule]
		}).compileComponents();
	}));

	it('should create the engine', () => {
		const fixture = TestBed.createComponent(EngineComponent);
		const engine = fixture.debugElement.componentInstance;
		expect(engine).toBeTruthy();
	});

	it('should render a canvas', () => {
		const fixture = TestBed.createComponent(EngineComponent);
		fixture.detectChanges();
		const compiled = fixture.debugElement.nativeElement;
		expect(compiled.querySelector('canvas')).toBeTruthy();
	});
});
