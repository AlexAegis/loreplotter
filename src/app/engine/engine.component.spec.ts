import { TestBed, async } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AppComponent } from '../app.component';
import { EngineComponent } from './engine.component';

describe('EngineComponent', () => {
	beforeEach(async(() => {
		TestBed.configureTestingModule({
			imports: [RouterTestingModule],
			declarations: [AppComponent, EngineComponent]
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
