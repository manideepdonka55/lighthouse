const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');
const argv = require('yargs').argv;
const fs = require('fs');


const launchChromeAndRunLighthouse = async (config, url) => {
	try {
		const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });
		const options = { logLevel: 'info', port: chrome.port, ...config.configSettings }
		console.log(`lighthouse test started for ${url}`)
		const results = await lighthouse(url, options)
		console.log(`Report is done for ${results.lhr.finalUrl}`);
		console.log(`Performance score was ${results.lhr.categories.performance.score * 100}\n`);
		// await fs.promises.writeFile(`lhr.json`, JSON.stringify(results.lhr, null, 2));
		await chrome.kill();
		return {
			lhr: results.lhr,
			report: results.report
		}
	} catch (err) {
		console.log(err);
	}
}

const createReport = async (url, results) => {
	try {
		const urlObj = new URL(url);
		let dirName = "reports" + "/" + urlObj.host.replace('www.', '');
		if (urlObj.pathname !== '/') {
			dirName = "reports" + "/" + dirName + urlObj.pathname.replace(/\//g, '_');
		}
		if (!fs.existsSync(dirName)) {
			fs.mkdirSync(dirName);
		}
		await fs.promises.writeFile(`${dirName}/${results.lhr['fetchTime'].replace(/:/g, '_')}.html`, results.report);
	} catch (err) {
		console.log(err);
	}
}

const runLighthouse = async (configfile) => {
	const configFilePath = configfile;
	const config = JSON.parse(await fs.promises.readFile(configFilePath, { encoding: 'utf8' }));
	const { urls } = config;
	for (let index = 0; index < urls.length; index++) {
		const url = urls[index];
		await launchChromeAndRunLighthouse(config, url).then(async (results) => {
			await createReport(url, results)
		});
	}
}

if (argv.configfile) {
	runLighthouse(argv.configfile)
}
