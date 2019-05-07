import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BlockComponent } from 'src/app/lore/component/timeline/block.component';

describe('BlockComponent', () => {
	let component: BlockComponent;
	let fixture: ComponentFixture<BlockComponent>;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			declarations: [BlockComponent]
		}).compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(BlockComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
