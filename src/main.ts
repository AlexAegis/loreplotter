import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from '@app/app.module';
import { environment } from '@env/environment';

if (environment.production) {
	enableProdMode();
}

platformBrowserDynamic()
	.bootstrapModule(AppModule)
	.then(() => {
		if ('serviceWorker' in navigator && environment.production) {
			// Service Worker registration is broken as of angular 7, register manually
			navigator.serviceWorker.register('./ngsw-worker.js').then();
		}
	})
	.catch(console.error);
