function main() {
	const window = new Window("Task Manager", 440, 470);
	window.onclose.subscribe(() => exit());
	window.icon = Icon.fromPath("taskmgr/0x006B", 16);

	const tray = application.process.createTray();
	tray.icon = "taskmgr/0x007F";

	window.render(ui => {
		const menuView = ui.MenuView();
		ui.root.add(menuView);

		let timer = new Timer(() => {}, 0);
		let speed = 100;

		// this menu is so bad, but its like in the real one
		menuView.menus.add(ui.Menu([{
			text: "File",
			items: [{
				text: "New Task (Run...)",
				async click() {
					Application.run((await fs.extinfo("!")).opener);
				}
			}, {}, {
				text: "Exit Task Manager",
				click() {
					exit(Process.ExitCode.success);
				}
			}]
		}, {
			text: "View",
			items: [{
					text: "Refresh Now",
					click() {
						timer.fire();
					}
				},
				{
					text: "Update Speed",
					items: [{
						text: "High",
						speed: 10
					}, {
						text: "Normal",
						speed: 100
					}, {
						text: "Low",
						speed: 1000
					}, {
						text: "Paused",
						speed: 0
					}].map(i => ({
						text: i.text,
						checked: speed == i.speed,
						check() {
							if (timer.time = speed = i.speed) {
								timer.restart();
							} else {
								timer.stop();
							}
						}
					}))
				}, {},
				{
					text: "CPU History",
					items: [{
						text: "One Graph Per CPU",
						checked: true,
						disabled: true
					}]
				},
				{
					text: "Show Kernel Memory",
					disabled: true
				}
			]
		}, {
			text: "Help",
			items: [{
					text: "Task Manager Help Topics",
					disabled: true
				}, {},
				{
					text: "About Task Manager",
					click() {
						about();
					}
				}
			]
		}]));

		const tabs = ui.Tabs([
			"Applications",
			"Processes",
			"Performance"
		]);
		menuView.content.add(tabs);

		const statusBar = ui.InfoBar([{
			text: "Processes",
			width: "25%"
		}, {
			text: "CPU Usage",
			width: "25%"
		}, {
			text: "Mem Usage",
			width: "45%"
		}, {
			text: "",
			width: "5%"
		}]);
		menuView.status.add(statusBar);

		const applicationGrid = ui.Grid(["*"], ["*", "auto"]);
		tabs[0].add(applicationGrid);

		const applicationList = ui.List([]);

		applicationGrid[0][0].add(applicationList);
		applicationGrid[1][0].add(ui.Button("End Task", () => {
			applicationList.selectedItem.process.kill();
		}));

		const processGrid = ui.Grid(["*"], ["*", "auto"]);
		tabs[1].add(processGrid);

		const processDataView = ui.DataGrid(["Name", "PID", "Timers", "Memory Usage"], []);
		processGrid[0][0].add(processDataView);

		let x = 0;

		const update = async () => {
			timer.stop();

			applicationList.items = Process.active.filter(p => p.windows.length).map(p => ({
				text: p.windows[0].title,
				icon: p.windows[0].icon,
				tooltip: p.path,
				process: p,
				activate(item, old) {
					if (old) {
						for (let w of old.process.windows) {
							w.unhighlight();
						}
					}

					for (let w of p.windows) {
						w.highlight();
					}
				}
			}));

			processDataView.rows = [{
				columns: [{
						text: "kernel"
					},
					{
						text: process.pid,
						align: UI.Align.right
					},
					{
						text: "-",
						align: UI.Align.right
					},
					{
						text: "-",
						align: UI.Align.right
					}
				]
			}, ...Process.active.map(process => ({
				contextMenu: [{
					text: "End Process",
					click() {
						process.kill();
					}
				}],
				columns: [{
						text: process.name,
						tooltip: process.path
					},
					{
						text: process.pid,
						align: UI.Align.right
					},
					{
						text: "- / -",
						align: UI.Align.right
					},
					{
						text: "-",
						align: UI.Align.right
					}
				]
			}))];

			timer = new Timer(async () => {
				const usage = await Management.cpu.getUsage();

				tray.icon = "taskmgr/0x" + (0x007F + Math.floor(usage / (100 / 12))).toString(16).toUpperCase().padStart(4, 0);

				statusBar[0].text = "Processes: " + (Process.active.length + 1);
				statusBar[1].text = "CPU Usage: " + Math.floor(usage) + "%";
				statusBar[2].text = "Mem Usage: " + Path.readableSize(Management.memory.used) + " / " + Path.readableSize(Management.memory.total);

				processDataView[0][2] = {
					text: Timer.top,
					align: UI.Align.right
				};

				processDataView[0][3] = {
					text: Path.readableSize(Management.memory.used),
					align: UI.Align.right
				};

				for (let i = 0; i < Process.active.length; i++) {
					processDataView[i + 1][2] = {
						text: process.timers.filter(c => c.running).length + "/" + process.timers.length,
						align: UI.Align.right
					};

					if (Process.active[i] == application.process) {
						processDataView[i + 1][3] = {
							text: Path.readableSize(Process.active[i].memoryUsage) + "*",
							align: UI.Align.right,
							tooltip: "This value is higher than the actual idle memory usage"
						};
					} else {
						processDataView[i + 1][3] = {
							text: Path.readableSize(Process.active[i].memoryUsage),
							align: UI.Align.right
						};
					}

				}
			}, speed);

			timer.fire();
		};

		update();

		Event.subscribe(Process.onexit, Process.onstart, Process.onnewwindow, e => {
			if (!process.exited) {
				update();
			}
		});
	});
}