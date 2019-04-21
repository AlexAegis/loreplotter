import { Texture } from 'three';

export class DynamicTexture extends Texture {
	public canvas: HTMLCanvasElement;
	public canvasContext: CanvasRenderingContext2D;

	public constructor(defaultColor: string) {
		super(new Image());
		this.canvas = document.createElement('canvas');
		this.canvas.width = 512;
		this.canvas.height = 512;
		this.canvasContext = this.canvas.getContext('2d');
		this.anisotropy = 2;

		this.draw(defaultColor, 0, 0, this.canvas.width, this.canvas.height);
	}

	public draw(color: string, x: number, y: number, size: number, height?: number): void {
		this.canvasContext.fillStyle = color;
		this.canvasContext.fillRect(x, y, size, height !== undefined ? height : (size * Math.PI) / 1.9);
		this.canvasContext.save();
		this.update();
	}

	public update(): void {
		this.image.src = this.canvas.toDataURL();
		this.needsUpdate = true;
	}
}
