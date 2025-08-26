const explore = path => {
	// standard window
	const window = new Window("", 700, 550);
	window.onclose.subscribe(() => exit());
	
	window.state.path = path;
	window.state.renamePath = "";
	window.state.listStyle = UI.ListStyle.default;
	window.state.selectedItem = null;

	window.state.history = new History(window.state.path);

	window.render(async ui => {
		const grid = ui.Grid([
			"100%"
		], [
			"auto", 
			"*"
		]);
		ui.root.add(grid);

		window.state.selectedItem = null;

		window.icon = Icon.fromPath(window.state.path, 16);
		window.title = Path.name(window.state.path) + " - Loading...";
		
		Path.getPrettyName(window.state.path).then(name => {
			window.title = name;
		});

		const box = ui.ToolbarBox();
		grid[0][0].add(box);

		if (!window.state.path || await fs.exists(window.state.path)) {
			const fileContextMenu = [{
				text: "New",
				disabled: !window.state.path,
				items: [{
						text: "Folder",
						icon: Icon.directory(16),
						async click() {
							renamePath = await Path.nextName(window.state.path, "New Folder");
							await fs.mkdir(renamePath);
							window.render();
						}
					}, {},
					...fs.creators.map(creator => ({
						text: creator.name,
						icon: Icon.fromExt(creator.ext, 16),
						async click() {
							window.state.renamePath = await Path.nextName(window.state.path, "New " + creator.name + "." + creator.ext);
							await fs.create(window.state.renamePath, creator.content);
							window.render();
						}
					}))
				]
			}, {}, {
				text: "Create Shortcut",
				disabled: true
			}, {
				text: "Delete",
				disabled: true
			}, {
				text: "Rename",
				disabled: true
			}, {
				text: "Properties",
				click() {
					if (window.state.selectedItem) {
						properties(window.state.selectedItem);
					} else {
						properties(window.state.path);
					}
				}
			}, {}, {
				text: "Close",
				click() {
					window.close();
				}
			}];

			const menu = ui.Menu([{
				text: "File",
				items: fileContextMenu
			}, {
				text: "Edit",
				items: [{
					text: "Undo",
					key: "ctrl+z",
					disabled: true
				}, {}, {
					text: "Cut",
					key: "ctrl+x",
					disabled: true
				}, {
					text: "Copy",
					key: "ctrl+c",
					disabled: true
				}, {
					text: "Paste",
					key: "ctrl+v",
					disabled: true
				}, {
					text: "Paste Shortcut",
					disabled: true
				}, {}, {
					text: "Copy to folder...",
					disabled: true
				}, {
					text: "Move to folder...",
					disabled: true
				}, {}, {
					text: "Select All",
					key: "ctrl+a",
					disabled: true
				}, {
					text: "Invert Selection",
					disabled: true
				}]
			}, {
				text: "View",
				items: [{
					checked: window.state.listStyle == UI.ListStyle.default,
					text: "List",
					check() {
						window.state.listStyle = UI.ListStyle.default;
						window.render();
					}
				}, {
					checked: window.state.listStyle == UI.ListStyle.bigIcons,
					text: "Large Icons",
					check() {
						window.state.listStyle = UI.ListStyle.bigIcons;
						window.render();
					}
				}]
			}]);
			box.add(menu);

			box.add(ui.Menu([{
				text: "Back",
				icon: application.resource("back.png"),
				tooltip: "Back",
				disabled: !window.state.history.canGoBack,
				click() {
					window.state.path = window.state.history.back();
					window.render();
				}
			}, {
				icon: application.resource("forward.png"),
				disabled: !window.state.history.canGoForward,
				tooltip: "Forward",
				click() {
					window.state.path = window.state.history.forward();
					window.render();
				}
			}, {
				icon: application.resource("up-dir.png"),
				disabled: !window.state.path,
				tooltip: "Up",
				click() {
					window.state.path = Path.parentPath(window.state.path);
					window.state.history.push(window.state.path);

					window.render();
				}
			}]));

			const addressBar = ui.TextBox(window.state.path);
			const address = ui.Menu([{
					text: "Address"
				},
				{
					input: addressBar,
					width: "100%"
				},
				{
					text: "Go",
					icon: application.resource("go.png"),
					async click() {
						const text = addressBar.value;

						if (await fs.exists(text) || !text) {
							window.state.history.push(text);

							window.state.path = text;
							window.render();
						} else {
							UI.ErrorBox("Not found", "Cannot find '" + text + "'.");
						}
					}
				}
			]);
			box.add(address);

			const body = ui.Grid(["180px", "*"], ["100%"]);
			grid[1][0].add(body);

			const scroll = ui.Scroll();
			body[0][0].add(scroll);

			const stack = ui.StackPanel();
			stack.background = "#FFFFFF";
			scroll.add(stack);

			stack.add(ui.Image(application.resource("header.png")));

			const title = ui.Title(await Path.getPrettyName(window.state.path), 5);
			title.padding = "5px 10px";
			stack.add(title);

			const rect = ui.Rect("calc(100% - 10px)", "2px");
			rect.margin = "0 10px 0 0";
			rect.background = "#6699CC";
			stack.add(rect);

			const selectText = ui.Label();
			selectText.padding = "10px";
			stack.add(selectText);

			const list = ui.List([], window.state.listStyle);

			if (window.state.path) {
				list.makeDropContainer(async item => {
					if (item.files) {
						move(item.files, window.state.path);
					}
				});
			}

			body[0][1].add(list);

			const renderSelectedItem = async () => {
				if (window.state.selectedItem) {
					const item = window.state.selectedItem;

					selectText.text = "";
					selectText.add(ui.Title(Path.name(item), 7));

					const type = ui.Label(await Path.getFileTypeName(item));
					type.padding = "0 0 15px 0";
					selectText.add(type);

					if (await fs.isDisk(item)) {
						const info = await fs.diskInfo(item);

						const chart = ui.Chart({
							valueTransform: value => Path.readableSize(value),
							segments: [...info.providers.map(i => ({
								text: "Used (" + i.name + ")",
								value: i.used
							})), {
								text: "Free",
								value: info.providers.reduce((a, c) => a + c.free, 0),
								color: "#FFFFFF"
							}]
						});

						selectText.add(chart);
					} else if (await fs.isFile(item)) {
						const size = ui.Label("Calculating size...");
						size.padding = "0 0 15px 0";
						selectText.add(size);

						fs.size(item).then(async bytes => {
							if (window.state.selectedItem == item) {
								size.text = "Size: " + Path.readableSize(bytes);

								const description = ui.Label(await Path.getDescription(item));
								selectText.add(description);
							}
						});
					} else if (await fs.isDirectory(item)) {
						const files = (await fs.listFiles(item)).length;
						const folders = (await fs.listDirectories(item)).length;

						selectText.add(ui.Label((files + folders) ? "Content: " + files + " Files and " + folders + " Folders" : "There are no items in " + await Path.getPrettyName(item)));

						const description = ui.Label(await Path.getDescription(item));
						selectText.add(description);
					}
				} else {
					if (await fs.exists(window.state.path)) {
						const meta = await fs.meta(window.state.path);
						selectText.text = "";

						if (meta && meta.description) {
							for (let block of meta.description.split("\n")) {
								selectText.add(ui.Label(block)).padding = "0 0 10px 0";
							}
						}

						const files = (await fs.listFiles(window.state.path)).length;
						const folders = (await fs.listDirectories(window.state.path)).length;

						if (files + folders) {
							selectText.add(ui.Label("Content: " + files + " Files and " + folders + " Folders")).padding = "0 0 10px 0";
							selectText.add(ui.Label("Select an item to view its description."));
						} else {
							selectText.add(ui.Label("There are no items in " + await Path.getPrettyName(window.state.path)));
						}
					} else {
						selectText.add(ui.Label("Select an item to view its description."));
					}
				}
			};

			const renderList = async () => {
				if (window.state.path) {
					const open = async p => {
						if ((await fs.extinfo(Path.ext(p)) && (await fs.extinfo(Path.ext(p))).opener) ||  await fs.isExecuteable(p)) {
							Application.run(p).catch(e => {
								UI.ErrorBox("Error opening " + Path.name(p), "The application could not start because a error occured:\n" + e.message);
							});
						} else {
							UI.ErrorBox("Error opening " + Path.name(p), "No application can open '" + Path.getFileTypeName(p) + "'");
						}
					};

					list.contextMenu = fileContextMenu;

					const items = [];
					
					for (let p of await fs.list(window.state.path)) {
						const item = {
							text: Path.nameWithoutExt(p),
							data: {
								path: p
							},
							iconPath: p,
							draggable: {
								ondrag() {
									return {
										files: [p]
									}
								},
								ondrop() {
									renderList();
								}
							},
							async select() {
								const resolved = await fs.isLink(p) && await fs.resolve(p);

								if (await fs.isExecuteable(p)) {
									open(p);
								} else if (await fs.isDirectory(p)) {
									window.state.history.push(p);

									window.state.path = p;
									window.render();
								} else if (resolved && await fs.isDirectory(resolved.path) && await !fs.isExecuteable(resolved.path)) {
									window.state.history.push(window.state.path = resolved.path);
									window.render();
								} else {
									open(p);
								}
							},
							activate() {
								window.state.selectedItem = p;
								renderSelectedItem();
							},
							deactivate() {
								window.state.selectedItem = null;
								renderSelectedItem();
							}
						};
						
						if (window.state.renamePath == p) {
							item.renameText = Path.name(p);
							
							item.rename = newName => {
								fs.rename(p, Path.parentPath(p) + "/" + newName);
							};
						}
						
						fs.isDirectory(p).then(async isDir => {
							const isExecuteable = isDir && await fs.isExecuteable(p);
							
							if (isDir) {
								item.dropContainer = {
									async ondrop(item) {
										if (item.files) {
											move(item.files.filter(f => f != p), p);
										}

										renderList();
									}
								};
							}
							
							item.contextMenu = isDir ? [{
								text: "Rename",
								click() {
									window.state.renamePath = p;
									renderList();
								}
							}, {
								text: "Delete",
								click() {
									fs.delete(p).then(() => {
										renderList();
									});
								}
							}, ...isExecuteable ? [{
								text: "Show Package Contents",
								click() {
									window.state.history.push(p);

									window.state.path = p;
									window.render();
								}
							}] : []] : [{
									text: "Open",
									click() {
										open(p);
									}
								},
								{
									text: "Edit",
									click() {
										Application.edit(p);
									}
								}, {},
								{
									text: "Rename",
									click() {
										window.state.renamePath = p;
										renderList();
									}
								},
								{
									text: "Delete",
									click() {
										fs.delete(p).then(() => {
											renderList();
										});
									}
								}, {},
								{
									text: "Copy",
									click() {
										window.state.renamePath = p;
										renderList();
									}
								}
							];
							
							item.update();
						});
						
						items.push(item);
					}
					
					list.items = items;
				} else {
					list.contextMenu = [
						{
							text: "Add network location",
							async items() {
								const providers = Hub.read("add-remote-storage-location");
								
								return providers.map(p => ({
									text: p.data.name,
									icon: Icon.fromPath(p.application, 16),
									async click() {
										const app = await Application(p.application, ...p.data.start);
										app.start();
									}
								}));
							}
						}
					];
					
					list.items = fs.disks.map(d => ({
						text: Path.diskPreviewName(d) + " (Loading name...)",
						data: {
							path: d
						},
						iconPath: d,
						select() {
							window.state.history.push(d);

							window.state.path = d;
							window.render();
						},
						activate() {
							window.state.selectedItem = d;
							renderSelectedItem();
						},
						deactivate() {
							window.state.selectedItem = null;
							renderSelectedItem();
						}
					}));
				}
				
				for (let item of list.items) {
					if (item != window.state.renamePath) {
						Path.getPrettyName(item.data.path).then(name => {
							item.text = name;

							item.update();
						});
					}
				}
			}

			if (window.state.path) {
				fs.listen(window.state.path, () => {
					renderList();
				})
			}

			renderList();
			renderSelectedItem();
		} else {
			UI.ErrorBox("Not found", "Path '" + window.state.path + "' not found");
		}
	});
}