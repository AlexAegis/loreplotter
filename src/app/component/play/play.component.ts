import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { LoreService } from 'src/app/service/lore.service';

@Component({
	selector: 'app-play',
	templateUrl: './play.component.html',
	styleUrls: ['./play.component.scss']
})
export class PlayComponent implements OnInit {
	public play = false;

	private pauseAnim = 'M11,10 L18,13.74 18,22.28 11,26 M18,13.74 L26,18 26,18 18,22.28';
	private playAnim = 'M11,10 L17,10 17,26 11,26 M20,10 L26,10 26,26 20,26';

	public from = this.playAnim;
	public to = this.pauseAnim;

	@ViewChild('animation')
	private animation: ElementRef;

	constructor(private loreService: LoreService) {}

	ngOnInit() {}

	@HostListener('tap')
	public tap(): void {
		if (this.play) {
			this.from = this.playAnim;
			this.to = this.pauseAnim;
		} else {
			this.from = this.pauseAnim;
			this.to = this.playAnim;
		}
		this.play = !this.play;
		const svgAnimate = this.animation.nativeElement as SVGAnimateElement;
		const from = svgAnimate.attributes.getNamedItem('from');
		from.value = this.from;
		svgAnimate.attributes.setNamedItem(from);
		const to = svgAnimate.attributes.getNamedItem('to');
		to.value = this.to;
		svgAnimate.attributes.setNamedItem(to);
		(svgAnimate as any).beginElement();
	}
}
