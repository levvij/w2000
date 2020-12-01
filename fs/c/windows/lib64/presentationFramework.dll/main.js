/// windows2000-ui
/// C 2019 levvij

const transformShortcut = shortcut => shortcut.split("+").map(c => c.length == 1 ? c.toUpperCase() : configuration.ui.keys[c]).join("+");
const nameTransform = name => name[0] + name.substr(1).split("").map(c => c.toLowerCase() == c ? c : "-" + c.toLowerCase()).join("");

const log = globalConsole.createUnit("ui");

function UI(window, body) {
	const bindMouseEvents = element => {
		element.onmousemove = Event("Mouse move");
		element.onmouseup = Event("Mouse up");
		element.onmousedown = Event("Mouse down");
		
		element.onmouseenter = Event("Mouse enter");
		element.onmouseleave = Event("Mouse leave");
		
		const transfromEvent = e => {
			const box = element.native.getBoundingClientRect();
			
			return {
				absolute: {
					x: e.clientX,
					y: e.clientY
				},
				relative: {
					x: e.clientX - box.left,
					y: e.clientY - box.top
				}
			}
		};
		
		element.native.onmousemove = e => element.onmousemove(transfromEvent(e));
		element.native.onmouseup = e => element.onmouseup(transfromEvent(e));
		element.native.onmousedown = e => element.onmousedown(transfromEvent(e));
		
		element.native.onmouseenter = () => element.onmouseenter();
		element.native.onmouseleave = () => element.onmouseleave();
	};
	
	// ui element
	const element = tag => {
		let tooltip;

		const pub = {
			native: document.createElement(tag),

			// events
			onadd: Event("Element adds child"),
			onremove: Event("Element removes itself"),
			onadded: Event("Element gets added"),

			// remove element
			remove() {
				pub.native.remove();
				pub.onremove(pub.parent);
			},

			// add child
			add(c) {
				pub.native.appendChild(c.native);
				c.parent = pub;
				pub.onadd(c);

				if (c.onadded) {
					c.onadded(pub);
				}

				return c;
			},

			// bind property
			bind(name, get, set) {
				Object.defineProperty(pub, name, {
					get,
					set
				});
			},

			// bind event
			event(name, desc, transform) {
				pub[name] = new Event(desc);

				pub.native[name] = event => {
					if (transform) {
						pub[name](transform(event, pub));
					} else {
						pub[name](pub);
					}
				};
			},

			get tooltip() {
				return tooltip;
			},
			set tooltip(value) {
				tooltip = value;

				Tooltip.register(pub, value);
			},

			// register contextmenu
			set contextMenu(value) {
				pub.native.contextMenu = value;
			},
			get contextMenu() {
				return pub.native.contextMenu;
			},

			// padding
			set padding(value) {
				pub.native.style.padding = value;
			},

			// margin
			set margin(value) {
				pub.native.style.margin = value;
			},

			// height
			set height(value) {
				pub.native.style.height = value;
			},

			// height
			set width(value) {
				pub.native.style.width = value;
			},

			// align
			set align(value) {
				pub.native.style.textAlign = value;
			},

			// background color
			set background(value) {
				pub.native.style.background = value;
			},

			// foreground color
			set foreground(value) {
				pub.native.style.color = value;
			},

			// set content selectable
			set selectable(value) {
				if (value) {
					pub.native.setAttribute("contentselectable", "");
				} else {
					pub.native.removeAttribute("contentselectable");
				}
			},

			// set font (UI.fonts)
			set font(value) {
				if (value) {
					pub.native.setAttribute("font", value);
				}
			},

			// clear content
			clear() {
				pub.native.textContent = "";
			},

			// remove hidden attribute
			show() {
				pub.native.hidden = false;
			},

			// add hidden attribute
			hide() {
				pub.native.hidden = true;
			},

			makeDraggable(ondrag, ondrop) {
				UI.draggable(pub.native, ondrag, ondrop);
			},

			makeDropContainer(ondrop) {
				UI.dropZone(pub.native, ondrop);
			},

			get disabled() {
				return pub.native.hasAttribute("disabled");
			},
			set disabled(value) {
				if (value) {
					pub.native.setAttribute("disabled", "");
				} else {
					pub.native.removeAttribute("disabled");
				}
			}
		};

		return pub;
	};

	// create root element
	const root = element("ui-root");
	body.appendChild(root.native);

	const public = {
		// clear all
		clear() {
			root.native.textContent = "";
		},

		// create child window
		createChildWindow(...args) {
			return window.createChildWindow(...args);
		},

		// create button window (windows like alert, ...)
		createButtonWindow(title, message, ...buttons) {
			const win = public.createChildWindow(title, configuration.ui.buttonWindow.width, configuration.ui.buttonWindow.height);

			win.buttonStyle = Window.ButtonStyle.none;

			win.render(ui => {
				const grid = ui.Grid(["100%"], ["100%", configuration.ui.buttonWindow.height + "px"]);
				ui.root.add(grid);

				grid[0][0].add(ui.Label(message));

				const cent = ui.Center();
				grid[1][0].add(cent);

				for (let btn of buttons) {
					btn.margin = 10;
					cent.add(btn);
				}
			});

			return win;
		},

		// message box (alert, ...)
		MessageBox(icon, title, message, text) {
			return new Promise(done => {
				const win = public.createButtonWindow(title, message, public.Button(text, () => {
					win.close();

					done();
				}));

				win.buttonStyle = Window.ButtonStyle.none;
				win.moveable = false;
			});
		},

		// error box 
		ErrorBox(message, text) {
			return public.MessageBox(configuration.ui.messageBox.error.icon, configuration.ui.messageBox.error.title, message, text || configuration.ui.messageBox.ok);
		},

		// info box
		InfoBox(message, text) {
			return public.MessageBox(configuration.ui.messageBox.info.icon, configuration.ui.messageBox.info.title, message, text || configuration.ui.messageBox.ok);
		},

		// save as file dialog (like in notepad.exe > file > save as)
		SaveAsDialog(opts) {
			return new Promise(done => {
				const win = window.createChildWindow(opts.title || configuration.ui.openFileDialog.title, configuration.ui.openFileDialog.width, configuration.ui.openFileDialog.height);
				win.buttonStyle = Window.ButtonStyle.none;
				let path = opts.path || Path.user.path;

				// rerender list in current path
				const render = async () => {
					const files = await fs.listDirectories(path);

					if (opts.extensions) {
						files.push(...(await fs.listFilesWithExt(path, Path.ext(fs))));
					} else {
						await fs.listFiles(path);
					}

					win.render(ui => {
						const grid = ui.Grid([
							"100%"
						], [
							"*",
							"auto",
							"auto"
						]);
						ui.root.add(grid);

						const input = ui.TextBox(opts.default);
						grid[1][0].add(input);

						const list = ui.List([{
							text: "..",
							value: Path.parentPath(path),
							select() {
								path = Path.parentPath(path);
								render();
							}
						}, ...files.map(f => ({
							value: f,
							icon: Icon.fromPath(f, 16),
							text: Path.getPrettyName(f),
							async activate() {
								if (await fs.isDirectory(f)) {
									path = f;
									render();
								} else {
									input.value = Path.name(f);
								}
							}
						}))]);

						grid[0][0].add(list);

						const button = ui.Button(opts.done ||  configuration.ui.openFileDialog.done, () => {
							if (input.value) {
								win.close();
								done(Path.fix(path + "/" + input.value));
							}
						});

						grid[2][0].add(button);
					});
				};

				render();
			});
		},

		// file tree (as in devenv.exe)
		FileTree(path, opts) {
			let tree;

			const search = async path => {
				const items = [];

				for (let f of await fs.list(path)) {
					if (await fs.isDirectory(f)) {
						if (opts.showFiles || (await fs.listDirectories(f)).length) {
							items.push({
								title: await Path.prettyName(f),
								icon: Icon.fromPath(f, 16),
								items: search(f),
								select() {
									tree.onselect(f);
								}
							});
						} else {
							items.push({
								title: await Path.prettyName(f),
								icon: Icon.fromPath(f, 16),
								select() {
									tree.onselect(f);
								}
							});
						}
					} else if (opts.showFiles) {
						items.push({
							title: await Path.prettyName(f),
							icon: Icon.fromPath(f, 16),
							select() {
								tree.onselect(f);
							}
						});
					}
				}

				return items;
			};

			tree = public.TreeView(search(path));
			tree.onselect = new Event("File Tree item select");

			return tree;
		},

		// open file dialog (as in notepad.exe)
		OpenFileDialog(opts) {
			return new Promise(done => {
				const win = window.createChildWindow(opts.title ||  configuration.ui.openFileDialog.title, configuration.ui.openFileDialog.width, configuration.ui.openFileDialog.height);
				win.buttonStyle = Window.ButtonStyle.none;
				let path = opts.path || Path.user.path;

				// rerender list in current path
				const render = async () => {
					const files = await fs.listDirectories(path);
					let potentialResult;

					if (opts.allowDirectory) {
						potentialResult = path;
					}

					if (opts.allowFile) {
						files.push(...(await fs.listFiles(path)));
					}

					win.render(ui => {
						const grid = ui.Grid([
							"100%"
						], [
							"*",
							"auto"
						]);
						ui.root.add(grid);

						const list = ui.List([{
							text: "..",
							value: Path.parentPath(path),
							select() {
								path = Path.parentPath(path);
								render();
							}
						}, ...files.map(f => ({
							value: f,
							icon: Icon.fromPath(f, 16),
							text: Path.prettyName(f),
							async activate() {
								if (
									(await fs.isDirectory(f) && opts.allowDirectory) ||
									(await fs.isFile(f) && opts.allowFile)
								) {
									potentialResult = f;
								}
							},
							async select() {
								if (await fs.isDirectory(f)) {
									path = f;
									render();
								} else {
									win.close();
									done(f);
								}
							}
						}))]);

						grid[0][0].add(list);

						const button = ui.Button(opts.done ||  configuration.ui.openFileDialog.done, async () => {
							// decide wether the selected item is suitable
							if (list.selectedItem) {
								if (
									(await fs.isDirectory(list.selectedItem.value) && opts.allowDirectory) ||
									(await fs.isFile(list.selectedItem.value) && opts.allowFile)
								) {
									win.close();
									done(list.selectedItem.value);
								} else if (await fs.isDirectory(list.selectedItem.value)) {
									path = list.selectedItem.value;
									render();
								}
							} else if (potentialResult) {
								win.close();
								done(potentialResult);
							}
						});

						grid[1][0].add(button);
					});
				};

				render();
			});
		},
		root
	};

	for (let key in UI.extensions) {
		public[key] = (...args) => {
			return UI.extensions[key]({
				...public,
				element,
				window,
				nameTransform,
				bindMouseEvents
			}, ...args);
		};
	}

	return public;
}

// add ui exts
UI.extensions = {};

UI.extend = (name, handler) => {
	UI.extensions[name] = handler;
};

// error box (not the same as buttonWindow)
UI.ErrorBox = (title, text) => {
	return new Promise(done => {
		const win = new Window(title, configuration.ui.buttonWindow.width, configuration.ui.buttonWindow.height);
		Window.activeWindow.buttonStyle = Window.ButtonStyle.close;

		win.render(ui => {
			const grid = ui.Grid(["52px", "*"], ["*", "auto"]);
			ui.root.add(grid);

			const icon = ui.Icon(configuration.ui.messageBox.error.icon, 32);
			icon.margin = "10px";
			grid[0][0].add(icon);

			const stack = ui.StackPanel();
			stack.margin = "10px";
			grid[0][1].add(stack);

			for (let block of text.split("\n")) {
				if (block.trim()) {
					const label = ui.Label(block);
					label.margin = "0 0 5px 0";
					stack.add(label);
				}
			}

			const close = ui.Button(configuration.ui.messageBox.ok, () => {
				win.close();
				done();
			});
			grid[1][1].padding = "10px";
			grid[1][1].align = UI.Align.right;
			grid[1][1].add(close);
		});
	});
};

// fonts supported by [font] in css
UI.fonts = {
	default: "default",
	lowResolution: "lres",
	monospace: "monospace"
};

// list styles
UI.ListStyle = {
	default: {
		size: 16
	},
	bigIcons: {
		size: 48
	}
};

UI.Align = {
	left: "left",
	right: "right",
	center: "center"
};

UI.transformShortcut = transformShortcut;

DLL.export("UI", UI);