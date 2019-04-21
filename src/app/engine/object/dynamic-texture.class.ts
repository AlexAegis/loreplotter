import { Texture } from 'three';

export class DynamicTexture extends Texture {
	public canvas: HTMLCanvasElement;
	public canvasContext: CanvasRenderingContext2D;
	public image: HTMLImageElement;
	public loading: boolean;

	public constructor(defaultTexture?: string, defaultColor?: string) {
		super(new Image());
		this.canvas = document.createElement('canvas');
		this.canvas.width = 512;
		this.canvas.height = 512;
		this.canvasContext = this.canvas.getContext('2d');
		this.canvasContext.imageSmoothingEnabled = true;
		this.anisotropy = 8;

		if (defaultTexture) {
			this.loadFromDataURL(defaultTexture);
		}
		if (defaultColor) {
			this.draw(defaultColor, 0, 0, this.canvas.width, this.canvas.height);
		}
	}

	public loadFromDataURL(data: string) {
		this.loading = true;
		this.image.src = data;
		this.image.onload = () => {
			this.canvasContext.drawImage(this.image, 0, 0);
			this.canvasContext.save();
			this.loading = false;
			this.image.onload = undefined; // YOLO
			this.needsUpdate = true;
		};
	}

	public draw(color: string, x: number, y: number, size: number, height?: number): void {
		this.canvasContext.fillStyle = color;
		this.canvasContext.fillRect(x, y, size, height !== undefined ? height : (size * Math.PI) / 1.9);
		this.canvasContext.save();
		this.update();
	}

	public update(): void {
		if (!this.loading) {
			this.image.src = this.canvas.toDataURL();
			this.needsUpdate = true;
		}
	}
}
