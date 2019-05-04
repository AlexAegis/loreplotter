import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { LoreComponent } from '@lore/lore.component';

const routes: Routes = [{ path: '', component: LoreComponent }];

@NgModule({
	imports: [RouterModule.forChild(routes)],
	exports: [RouterModule]
})
export class LoreRoutingModule {}
