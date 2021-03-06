<?php

$version = file_get_contents("fs/c/windows/ime/gen/version.prop");
$beta = trim(file_get_contents("fs/c/windows/ime/gen/beta.prop"))[0] == "t";

$id = "?v=$version";

if ($beta) { 
	$id = "?b=$version-" . uniqid();
}

?>

<head>
	<link rel="stylesheet" href="main.css<?= $id ?>" />
	<link rel="icon" type="image/png" />
	<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1.0, user-scalable=no" />
	<meta name="apple-mobile-web-app-capable" content="yes">
	<meta name="apple-mobile-web-app-title" content="Windows">
	<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
	<link rel="apple-touch-icon" href="fs/c/windows/branding/icon.png">
	
	<title>Booting...</title>
	
	<script src="fs/c/windows/lib64/console.dll/main.js<?= $id ?>"></script>
	<script src="fs/c/windows/lib64/console.dll/console.js<?= $id ?>"></script>
	<script src="fs/c/windows/lib64/console.dll/color-console.js<?= $id ?>"></script>
	<script src="fs/c/windows/lib64/console.dll/unit.js<?= $id ?>"></script>
	<script src="fs/c/windows/ime/root.js<?= $id ?>"></script>
	
	<?php
		foreach (scandir("fs/c/windows/ime/gen") as $f) {
			if ($f[0] != "." && pathinfo($f, PATHINFO_EXTENSION) == "js") {
	?>
	<script src="fs/c/windows/ime/gen/<?= $f ?><?= $id ?>"></script>
	<?php
			}
		}
	?>
</head>

<body>
	<screen>
		<workspace>
			<p>
				Your browser does not support <?= file_get_contents("fs/c/windows/ime/gen/productName.prop") ?>. 
				Use this page with a new version of Google Chrome, Safari or Chromium.
			</p>
		</workspace>
		<task-bar></task-bar>

		<full-overlay></full-overlay>
	</screen>
</body>

<script>

	// global this
	const global = window;
	global.config = config;
	
	// get elements
	const workspace = document.querySelector("workspace");
	
	// create console
	const globalConsole = new Console(document.querySelector("full-overlay"));
	
	// page icon
	const pageIcon = document.querySelector("link[rel=icon]");
	
	// page icon
	const errorMessage = workspace.querySelector("p");
	
</script>
<script src="fs/c/windows/lib64/mscorlib.dll/main.js<?= $id ?>"></script>
<script>
	
	onload = async () => {
		errorMessage.remove();
		
		// load dlls
		globalConsole.writeln("Starting Windows v" + config.version + (config.beta ? "b" : "r") + "...\n");
		
		if (!config.beta) {
			globalConsole.lock();
			globalConsole.hideCursor();
		}
		
		config.bootStartTime = new Date();
		config.touch = "ontouchstart" in window;
		config.cacheArgs = <?= json_encode($id) ?>
		
		const steps = JSON.parse(localStorage[config.version + "_bootsteps"] || "[{}]");
		const bootSteps = [];
		
		document.title = config.productName;
		
		const bootLog = globalConsole.createUnit("boot");
		
		// set beta attribute
		if (config.beta) {
			document.body.setAttribute("beta", "");
		}
		
		const canvas = document.createElement("canvas");
		canvas.width = canvas.height = 64;
		const ctx = canvas.getContext("2d");
		ctx.lineCap = "round";
		ctx.lineWidth = 8;
		
		let i = 0;
		const lastTotal = steps[steps.length - 1].time;

		const interval = setInterval(() => {
			if (config.loaded) {
				clearInterval(interval);
			}
			
			if (matchMedia('(prefers-color-scheme: dark)').matches) {
				ctx.strokeStyle = "white";
			} else {
				ctx.strokeStyle = "black";
			}

			ctx.clearRect(0, 0, 64, 64);
			ctx.beginPath();

			if (steps.length) {
				ctx.arc(32, 32, 24, -Math.PI / 2, Math.PI * (2 / lastTotal * (new Date() - config.bootStartTime)) + -Math.PI / 2);
			} else {
				ctx.arc(32, 32, 24, -Math.PI / 2 + i / 30, i++ / 20);
			}

			ctx.stroke();

			pageIcon.href = canvas.toDataURL();
		}, 100);

		const step = () => {
			bootSteps.push({
				time: new Date() - config.bootStartTime,
				dlls: (global.DLL ? DLL.loadedModules.map(l => l.path) : [])
			});
			
			if (steps.length) {
				document.title = "Booting (" + bootSteps.length + "/" + steps.length + ") - " + config.productName;
			} else {
				document.title = "Booting... - " + config.productName;
			}
			
			if (!config.beta) {
				globalConsole.unlock();
				globalConsole.y = globalConsole.height - 4;
				globalConsole.x = 0;

				const width = globalConsole.width;
				const progress = Math.min(Math.floor(width / steps.length * bootSteps.length), width);

				globalConsole.write("█".repeat(progress) + "▌".repeat(width - progress));
				
				globalConsole.y = globalConsole.height - 2;
				globalConsole.write(((DLL.modules[DLL.modules.length - 1] || {}).name || "").padEnd(globalConsole.width, " "));
				
				globalConsole.lock();
			}
		};
		
		let params = [];
		
		step();
		
		if (location.pathname == "/") {
			params = await fetch("/config/init").then(r => r.json());
		}
		
		step();
		
		const search = decodeURIComponent(location.search || config.injectedQuery || "");
		
		// add query config
		if (search.substr(1)) {
			if (search[1] == "+") {
				params = [];
				
				for (let part of search.substr(2).split("&")) {
					if (part[0] == "!") {
						params.push({
							config: part.substr(1)
						});
					} else if (part[0] == "*") {
						params.push({
							start: JSON.parse(part.substr(1))
						});
					}
				}
			} else if (search[1] == "!") {
				params = [{
					config: search.substr(2)
				}];
			} else {
				params = JSON.parse(search.substr(1));
			}
		}
		
		const reload = async () => {
			if (!Array.isArray(params)) {
				params = [params];
			}

			for (let param of params) {
				if (!param.loaded) {
					if ("config" in param) {
						params.push(...(await fetch(param.config + "/config/init").then(r => r.json())));
						param.loaded = true;

						await reload();
					}

					if ("rrsp" in param) {
						bootLog.action("queryconf", param.name || "ParamRRSP");
						param.loaded = true;

						config.fs.providers.unshift({
							type: "rrsp",
							name: param.name || "ParamRRSP",
							root: param.rrsp,
							deleteList: "rrsp_" + param.rssp + "_dl",
							ray: param.rayroot || param.rrsp + "/" + param.ray + "?name=" + param.name + "&root=" + param.rrsp
						});
					}
					
					if ("release-sim" in param) {
						config.beta = false;
					}
				}
			}
		}
		
		step();
		
		await reload();
		
		// load fs
		step();
		await DLL.load("c/windows/lib64/fileSystem.dll", true, [
			"path.js",
			"hub.js",
			"main.js",
			"rrsp.js",
			"stzr.js",
			"lssp.js",
			"pmpr.js",
			"init.js"
		]);
		
		// create fs
		step();
		
		// load all config exts
		for (let file of await fs.listAll("c/windows/ime/config")) {
			bootLog.action("autoconfig", fs.name(file));
			
			step();
			await DLL.load(file);
		}
		
		// polyfills / runtime
		step();
		await DLL.load("c/windows/lib64/runtime.dll");
		
		// crypto
		step();
		await DLL.load("c/windows/lib64/cryptography.dll");
		
		// pmde
		step();
		await DLL.load("c/windows/lib64/pmde.dll");
		
		// pmde
		step();
		await DLL.load("c/windows/lib64/ftp.dll");
		
		// icons
		step();
		await DLL.load("c/windows/lib64/moricons.dll");

		// assert testing
		step();
		await DLL.load("c/windows/lib64/assert.dll");
		
		// power manager
		step();
		await DLL.load("c/windows/lib64/pwrmgr.dll");
		
		// eventmanager
		step();
		await DLL.load("c/windows/lib64/evntmg.dll");
		
		// device management
		step();
		await DLL.load("c/windows/lib64/management.dll");
		
		// process management
		step();
		await DLL.load("c/windows/lib64/process.dll");
		
		// networking
		step();
		await DLL.load("c/windows/lib64/netstandard.dll");
		
		// cursor
		step();
		await DLL.load("c/windows/lib64/cursor.dll");
		
		// ui
		step();
		await DLL.load("c/windows/lib64/presentationFramework.dll");
		
		// forms
		step();
		await DLL.load("c/windows/input/forms.dll");
		
		// set webapp attribute if page is viewed in iOS webapp mode
		if (navigator.standalone) {
			await DLL.load("c/windows/lib64/mobile.dll");
		}
		
		// run and wait for installers
		await (await Application("c/windows/system32/installer.exe")).startAndWaitForSuccessfulExit();
		
		// run services (will continue while system is already booted)
		(await Application("c/windows/system32/services.exe")).start();

		// load backres (desktop / taskbar)
		step();
		await DLL.load("c/windows/lib64/backres.dll");

		config.bootTime = new Date() - config.bootStartTime;
		config.bootEndTime = new Date();

		step();
		localStorage[config.version + "_bootsteps"] = JSON.stringify(bootSteps);

		for (let param of params) {
			if (param.start) {
				bootLog.action("start", ...param.start);
				Application.run(...param.start);
			}
		}

		config.loaded = true;
	};
	
</script>