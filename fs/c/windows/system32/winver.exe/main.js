function main() {
	const window = new Window("System Information", 459, 400);
	window.resizeable = false;
	window.buttonStyle = Window.ButtonStyle.close;
	window.onclose.subscribe(() => exit());

	window.render(async ui => {
		const tabs = ui.Tabs([
			"General",
			"Hardware",
			"Storage"
		]);
		ui.root.add(tabs);

		const general = ui.StackPanel();
		tabs[0].add(general);

		const logoContainer = ui.StackPanel();
		logoContainer.background = "white";
		logoContainer.padding = "10px";

		const logo = ui.Image(application.resource("banner.png"));
		logo.width = 413;
		logoContainer.add(logo);

		general.add(logoContainer);
		general.add(ui.Separator());
		general.add(ui.Label(Management.os.productName)).margin = "0 0 5px 0";
		general.add(ui.Label("Version: " + Management.os.version + " (" + Management.os.buildDate.toDateString() + ", " + (Management.os.beta ? "Beta" : "Release") + ")"));
		general.add(ui.Separator());
		general.add(ui.Label(Management.os.copyright.text)).margin = "0 0 5px 0";
		general.add(ui.Label(Management.os.copyright.notice));

		const hardware = ui.StackPanel();

		hardware.add(ui.Label("CPU Cores: " + (Management.cpu.cores || "Unknown")));
		hardware.add(ui.Label("Host platform: " + Management.host.platform));
		hardware.add(ui.Label("Host vendor: " + Management.host.vendor));

		hardware.add(ui.Separator());

		hardware.add(ui.Label("Connection Downlink: " + Management.connection.downlink + "/" + Management.connection.type));
		hardware.add(ui.Label("Host: " + Management.host.os));

		hardware.add(ui.Separator());

		hardware.add(ui.Label("Device Memory: " + Path.readableSize(Management.memory.deviceTotal)));
		hardware.add(ui.Label("Max Memory: " + Path.readableSize(Management.memory.total)));
		hardware.add(ui.Label("VM Memory: " + Path.readableSize(Management.memory.vmSize)));
		hardware.add(ui.Label("Used Memory: " + Path.readableSize(Management.memory.used)));

		tabs[1].add(hardware);

		const storage = ui.Grid(["100%"], ["auto", "10px", "*"]);
		const storageInfo = ui.StackPanel();

		storageInfo.add(ui.Label("Total Used: " + Path.readableSize(fs.used)));
		storageInfo.add(ui.Label("Max Size: " + Path.readableSize(fs.capacity)));
		storageInfo.add(ui.Label("Free: " + Path.readableSize(fs.free)));

		storage[0][0].add(storageInfo);

		const storageList = ui.List(fs.providers.map(p => ({
			text: p.name + " (" + Path.readableSize(p.used) + "/" + Path.readableSize(p.capacity) + ")"
		})));
		storage[2][0].add(storageList);

		tabs[2].add(storage);
	});
}