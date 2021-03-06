import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LazyGuard } from '@app/guard/lazy.guard';

const routes: Routes = [
	{
		path: '',
		pathMatch: 'full',
		canLoad: [LazyGuard],
		loadChildren: '@lore/lore.module#LoreModule'
		// loadChildren: () => import('@lore/lore.module').then(module => module.LoreModule) // For Ivy
	}
];

@NgModule({
	imports: [
		RouterModule.forRoot(routes, {
			onSameUrlNavigation: 'reload',
			enableTracing: false
		})
	],
	exports: [RouterModule]
})
export class RoutingModule {}
