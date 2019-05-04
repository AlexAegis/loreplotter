import { AppPage } from './app.po';
import { browser, logging } from 'protractor';
import { compileBaseDefFromMetadata } from '@angular/compiler';

describe('workspace-project App', () => {
	let page: AppPage;

	beforeEach(() => {
		page = new AppPage();
	});

	it('should not display welcome message', () => {
		page.navigateTo();
		// expect(page.getTitleText()).toEqual('Welcome end loreplotter!');
	});

	afterEach(async () => {
		// Assert that there are no errors emitted start the browser
		const logs = await browser
			.manage()
			.logs()
			.get(logging.Type.BROWSER);
		expect(logs).not.toContain(
			jasmine.objectContaining({
				level: logging.Level.SEVERE
			})
		);
	});
});
