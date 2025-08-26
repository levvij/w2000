function TaskBar(element, path) {
	const start = document.createElement("start");
	start.textContent = config.taskBar.start;
	element.appendChild(start);

	const startOverlay = document.createElement("start-overlay");
	element.appendChild(startOverlay);

	startOverlay.onclick = () => {
		start.removeAttribute("open");
	};

	const startPopup = document.createElement("start-popup");
	element.appendChild(startPopup);

	start.onclick = async () => {
		if (start.hasAttribute("open")) {
			start.removeAttribute("open");
		} else {
			start.setAttribute("open", "");
			startPopup.textContent = "";

			const banner = document.createElement("start-banner");
			startPopup.appendChild(banner);

			const list = document.createElement("start-list");
			startPopup.appendChild(list);

			for (let program of await fs.list(path)) {
				if (Path.ext(program) == "line") {
					list.appendChild(document.createElement("line"));
				} else {
					const item = document.createElement("start-item");
					list.appendChild(item);

					const img = new Image();

					Icon.fromPath(program, 32).then(icon => fs.readURI(icon)).then(res => {
						img.src = res;
					});

					item.appendChild(img);

					const text = document.createElement("start-item-text");
					text.textContent = await Path.getPrettyName(program);
					item.appendChild(text);

					item.onclick = () => {
						start.removeAttribute("open");
						Application.run(program);
					};
				}
			}
		}
	};

	const programs = document.createElement("programs");
	element.appendChild(programs);

	Event.subscribe(Window.onopen, Window.onactivechange, Window.onclose, Window.onstatechange, Window.ontitlechange, Window.oniconchange, () => {
		programs.textContent = "";

		const bar = document.createElement("bar");
		programs.appendChild(bar);

		const inner = document.createElement("programs-inner");
		programs.appendChild(inner);

		for (let instance of Window.instances.filter(i => !i.parent)) {
			const p = document.createElement("program");

			if (instance.icon) {
				const i = new Image();

				fs.readURI(instance.icon).then(url => {
					i.src = url;
				});

				p.appendChild(i);
			}

			const t = document.createElement("text");
			t.textContent = instance.title;
			p.appendChild(t);

			inner.appendChild(p);

			if (instance == global.Window.activeWindow && !instance.minimized) {
				p.setAttribute("active", "");
			}

			p.onclick = () => {
				Window.activate(instance);
			};

			p.contextMenu = [{
					disabled: !(instance.maximized || instance.minimized),
					text: "Restore",
					icon: DLL.resource("restore.png"),
					click() {
						instance.restore();
					}
				},
				{
					text: "Move",
					disabled: true
				},
				{
					text: "Size",
					disabled: true
				},
				{
					disabled: instance.minimized,
					text: "Minimize",
					icon: DLL.resource("min.png"),
					click() {
						instance.min();
					}
				},
				{
					disabled: instance.maximized,
					text: "Maximize",
					icon: DLL.resource("max.png"),
					click() {
						instance.max();
					}
				},
				{},
				{
					text: "Close",
					icon: DLL.resource("close.png"),
					click() {
						instance.close();
					}
				}
			];
		}
	})();

	const tray = document.createElement("tray");
	element.appendChild(tray);

	const trayIcons = document.createElement("tray-items");
	tray.appendChild(trayIcons);

	const trayDate = document.createElement("tray-date");
	tray.appendChild(trayDate);

	const updateTrayTime = () => {
		const d = new Date();

		trayDate.textContent = d.getHours().toString().padStart(2, 0) + ":" + d.getMinutes().toString().padStart(2, 0);
	};

	const updateTrayIcons = () => {
		trayIcons.textContent = "";

		for (let process of Process.active) {
			for (let trayItem of process.trays) {
				const item = document.createElement("tray-item");
				trayIcons.appendChild(item);

				const image = new Image();
				item.appendChild(image);

				// ovverride the event because only the newest one will be rendered and the old ones dont need to be updated
				trayItem.oniconchange = () => {
					if (trayItem.icon) {
						Icon.from(trayItem.icon, 16).then(icon => fs.readURI(icon)).then(res => {
							image.src = res;
						});
					}
				};

				trayItem.oncontextmenuchange = () => {
					item.contextMenu = trayItem.contextMenu;
				};

				trayItem.oniconchange();
				trayItem.oncontextmenuchange();
			}
		}
	};

	updateTrayTime();
	updateTrayIcons();

	setInterval(() => updateTrayTime(), 500);
	Event.subscribe(Process.onnewtray, Process.ontrayremove, () => updateTrayIcons());
}

new TaskBar(document.querySelector("task-bar"), Path.user.start);