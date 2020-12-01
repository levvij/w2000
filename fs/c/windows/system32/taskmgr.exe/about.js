const about = () => {
	const window = new Window("About Task Manager", 413, 250);
	window.buttonStyle = Window.ButtonStyle.close;

	window.render(async ui => {
		const rootGrid = ui.Grid(["*"], ["77px", "10px", "*", "auto"]);
		ui.root.add(rootGrid);

		rootGrid[0][0].add(ui.Image(application.resource("cover.png")));

		const grid = ui.Grid(["100px", "*", "10px"], ["100%"]);
		rootGrid[2][0].add(grid);

		const center = ui.Center();
		grid[0][0].add(center);

		center.add(ui.Icon("taskmgr/0x006B", 32));

		grid[0][1].add(ui.Label("@levvij Task Manager")).margin = "0 0 10px 0";
		grid[0][1].add(ui.Label("Version " + Management.os.version + " (Build " + Management.os.build + ")")).margin = "0 0 10px 0";
		grid[0][1].add(ui.Label("Copyright 2019 @levvij"));

		grid[0][1].add(ui.Separator());

		grid[0][1].add(ui.Label("Host device total memory: " + Path.readableSize(Management.memory.deviceTotal))).margin = "0 0 10px 0";
		grid[0][1].add(ui.Label("JSVM total memory: " + Path.readableSize(Management.memory.total)));

		const right = ui.Right();
		rootGrid[3][0].add(right);

		right.add(ui.Button("Close", () => {
			window.close();
		})).margin = "10px";
	});
};