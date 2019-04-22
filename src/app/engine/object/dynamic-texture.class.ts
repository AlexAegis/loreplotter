import { Texture, CanvasTexture } from 'three';
import { Subject, race, interval, BehaviorSubject } from 'rxjs';
import { debounceTime, debounce, throttleTime, auditTime, audit } from 'rxjs/operators';

export class DynamicTexture extends CanvasTexture {
	public constructor(defaultTexture?: string, defaultColor?: string, canvas?: HTMLCanvasElement) {
		super(canvas);
		this.canvas = canvas;
		this.canvasContext = canvas.getContext('2d');
		this.canvasContext.imageSmoothingEnabled = true;
		this.anisotropy = 8;

		if (defaultTexture) {
			this.loadFromDataURL(defaultTexture);
		} /*
		if (defaultColor) {
			this.draw(defaultColor, 0, 0, this.canvas.width, this.canvas.height);
		}*/

		this.updateQueue.pipe(audit(() => this.loadSubject)).subscribe(next => {
			this.update();
		});
	}
	public canvas: HTMLCanvasElement;
	public canvasContext: CanvasRenderingContext2D;
	public image: HTMLImageElement;

	private updateQueue = new Subject<boolean>();
	private loadSubject = new BehaviorSubject<boolean>(true);

	public loadFromDataURL(data: string) {
		const image = new Image();
		image.src = data;
		image.onload = () => {
			this.canvasContext.drawImage(image, 0, 0);
			this.needsUpdate = true;
		};
	}
	public draw(color: string, x: number, y: number, size: number, height?: number): void {
		this.canvasContext.fillStyle = color;
		this.canvasContext.fillRect(x, y, size, height !== undefined ? height : (size * Math.PI) / 1.9);
		this.needsUpdate = true;
		console.log('DRAW');
		// this.update();
		// this.updateQueue.next(true);
	}

	public update(): void {
		this.image.src = this.canvas.toDataURL();
		// 	this.canvas.image
		this.needsUpdate = true;
	}
}
