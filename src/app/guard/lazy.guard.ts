import { Injectable } from '@angular/core';
import { CanLoad, Route, Router } from '@angular/router';

@Injectable({
	providedIn: 'root'
})
export class LazyGuard implements CanLoad {

	constructor(private router: Router) { }

// checks if we can load the route concerning LifeInsurance
	public canLoad(route: Route): boolean {
		return this.valid(route.path);
	}

	private valid(url: string): boolean {
		return true;
	}
}
