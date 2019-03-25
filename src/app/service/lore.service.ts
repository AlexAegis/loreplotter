import { EngineService } from './../engine/engine.service';
import { Injectable } from '@angular/core';

@Injectable({
	providedIn: 'root'
})
export class LoreService {
	constructor(private engineService: EngineService) {}
}
