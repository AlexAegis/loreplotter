import { Globe } from '@lore/engine/object/';
import { CanvasTexture, Math as ThreeMath, Vector2 } from 'three';

export class DynamicTexture extends CanvasTexture {
	public constructor(
		defaultTexture?: string,
		defaultColor?: string,
		canvas?: HTMLCanvasElement,
		private globe?: Globe
	) {
		super(canvas);
		this.canvas = canvas;
		this.canvasContext = canvas.getContext('2d');
		this.canvasContext.imageSmoothingEnabled = true;
		this.anisotropy = 2;

		if (defaultTexture) {
			this.loadFromDataURL(defaultTexture);
		}

		this.onUpdate = () => {
			if (this.globe) {
				this.globe.pointUpdateAudit.next(undefined);
			}
		};
	}
	public canvas: HTMLCanvasElement;
	public canvasContext: CanvasRenderingContext2D;
	public image: HTMLImageElement;

	public loadFromBlob(blob: Blob): void {
		this.loadFromDataURL(URL.createObjectURL(blob));
	}

	public loadFromDataURL(data: string): void {
		const image = new Image();
		image.src = data;
		image.onload = () => {
			this.canvasContext.drawImage(
				image,
				0,
				0,
				image.width,
				image.height,
				0,
				0,
				this.canvas.width,
				this.canvas.height
			);
			this.needsUpdate = true;
		};
	}
	public draw(color: string, x: number, y: number, size: number, height?: number): void {
		this.canvasContext.fillStyle = color;
		this.canvasContext.fillRect(x, y, size, height !== undefined ? height : (size * Math.PI) / 1.9);
		this.needsUpdate = true;
	}

	/**
	 * it's grayscale, every value is the same
	 */
	public heightAt(uv: Vector2): number {
		const sampleSize = 1;
		const imgd = this.canvasContext.getImageData(
			uv.x * this.canvas.width - sampleSize / 2,
			(1 - uv.y) * this.canvas.height - sampleSize / 2,
			sampleSize,
			sampleSize
		);
		return ThreeMath.mapLinear(imgd.data[0], 0, 255, 0, 1);
	}

	public update(): void {
		this.image.src = this.canvas.toDataURL();
		this.needsUpdate = true;
	}

	public clear() {
		this.canvasContext.fillStyle = '#202020'; // 10%+ gray
		this.canvasContext.fillRect(0, 0, this.canvas.width, this.canvas.height);
		this.needsUpdate = true;
	}
}
