import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoadingComponent } from '@app/component/loading.component';

const routes: Routes = [
	{ path: '', pathMatch: 'full', loadChildren: '@app/lore/lore.module#LoreModule',  }
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
