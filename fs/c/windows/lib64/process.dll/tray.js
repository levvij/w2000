function Tray(process) {
	let icon;
	let contextMenu;

	const public = {
		oniconchange: Event("Tray icon change"),
		oncontextmenuchange: Event("Tray context menu change"),
		get icon() {
			return icon;
		},
		set icon(value) {
			if (value != icon) {
				icon = value;

				public.oniconchange();
			}
		},
		get contextMenu() {
			return contextMenu;
		},
		set contextMenu(menu) {
			if (menu != contextMenu) {
				contextMenu = menu;

				public.oncontextmenuchange();
			}
		},
		click() {},
		remove() {
			process.trays.splice(process.trays.indexOf(public), 1);
			process.ontrayremove(public);
			Process.ontrayremove(process, public);
		}
	};

	return public;
}

DLL.export("Tray", Tray);