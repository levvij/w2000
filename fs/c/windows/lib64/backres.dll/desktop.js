function Desktop(element, path) {
	const desktop = document.createElement("desktop");
	element.appendChild(desktop);
	
	if (Management.os.beta) {
		const devInfo = document.createElement("dev-info");
		devInfo.textContent = `
			${Management.os.productName}~${Management.os.build}
			v${Management.os.version}.b${(+Management.os.buildDate).toString(16)}
		`.trim().split("\n").map(l => l.trim()).join("\n");
		
		element.appendChild(devInfo);
	}

	let renamingFile;
	let select;

	const open = async file => {
		await Application.run(file);
	}

	desktop.addEventListener("mousedown", event => {
		if (!event.button && (document.elementFromPoint(event.pageX, event.pageY) || {}).tagName == "DESKTOP") {
			select = {
				startX: event.pageX,
				startY: event.pageY,
				element: desktop.appendChild(document.createElement("select-area"))
			};

			for (let item of Array.from(desktop.querySelectorAll("desktop-item"))) {
				item.removeAttribute("selected");

				if (item.originalContextMenu) {
					item.contextMenu = item.originalContextMenu;
					item.originalContextMenu = null;
				}
			}
		}
	});

	desktop.addEventListener("mousemove", event => {
		if (select) {
			select.element.style.left = Math.min(event.pageX, select.startX);
			select.element.style.top = Math.min(event.pageY, select.startY);

			select.element.style.width = Math.abs(event.pageX - select.startX);
			select.element.style.height = Math.abs(event.pageY - select.startY);

			const selectionBox = select.element.getBoundingClientRect();
			const elements = desktop.querySelectorAll("desktop-item");

			select.items = [];

			for (let element of elements) {
				element.removeAttribute("selected");

				const box = element.getBoundingClientRect();

				if (selectionBox.top - box.height < box.top && selectionBox.bottom + box.height > box.bottom &&
					selectionBox.left - box.width < box.left && selectionBox.right + box.width > box.right) {
					element.setAttribute("selected", "");

					select.items.push(element);
				}
			}
		}
	});

	desktop.addEventListener("mouseup", event => {
		if (select) {
			for (let item of Array.from(desktop.querySelectorAll("select-area"))) {
				item.remove();
			}

			if (select.items && select.items.length > 1) {
				const selectedItems = select.items;

				for (let item of select.items) {
					item.originalContextMenu = item.contextMenu;

					item.contextMenu = [{
						text: "Open",
						async click() {
							for (let item of selectedItems) {
								await open(item.path);

								public.update();
							}
						}
					}];

					UI.draggable(item, () => {
						return {
							files: selectedItems.map(i => i.path)
						};
					}, () => {
						public.update();
					});
				}
			}

			select = null;
		}
	});
	
	UI.dropZone(desktop, async item => {
		if (item.files) {
			Application.run(...configuration.move.replace("%s", item.files).replace("%d", path));
		}
	});

	const public = {
		async update() {
			const renderItem = async (file, draggable) => {
				const item = document.createElement("desktop-item");
				item.path = file;

				item.contextMenu = (await fs.isDirectory(file)) ? [{
						text: "Rename",
						click() {
							public.rename(file);
						}
					},
					{
						text: "Delete",
						async click() {
							await fs.delete(file);
							public.update();
						}
					}, {}, {
						text: "Properties",
						async click() {
							Application.run(...configuration.properties.replace("%f", file));
						}
					}
				] : [{
						text: "Open",
						click() {
							open(file);
						}
					},
					{
						text: "Edit",
						click() {
							Application.edit(file);
						},
						disabled: !(await Path.canEdit(file))
					}, 
					{
						text: "Open with...",
						async items() {
							const info = await fs.extinfo(Path.ext(file));
							
							const openers = [];
							
							for (let opener of [...(info.openers || []), ...(info.editors || [])].unique(p => p.file)) {
								openers.push({
									text: await Path.getPrettyName(opener.file),
									icon: Icon.fromPath(opener.file, 16),
									click() {
										Application.run(opener.file, file);
									}
								});
							}
							
							return openers;
						}
					},
					{},
					{
						text: "Rename",
						click() {
							public.rename(file);
						}
					},
					{
						text: "Delete",
						async click() {
							await fs.delete(file);
							public.update();
						}
					}
				];

				const img = document.createElement("img");
				img.draggable = false;

				const isLink = await fs.isLink(file);
				const target = isLink && await fs.resolve(file);

				if (isLink && target.path == Path.user.bin) {
					console.log(configuration.desktop.bin.full)

					Icon.from((await fs.list(target.path)).length ? configuration.desktop.bin.full : configuration.desktop.bin.empty, 32).then(icon => fs.readURI(icon)).then(url => {
						img.src = url;
					});
				} else {
					Icon.fromPath(file, 32).then(icon => fs.readURI(icon)).then(url => {
						img.src = url;
					});
				}

				item.appendChild(img);

				if (draggable) {
					UI.draggable(item, () => {
						return {
							files: [file]
						};
					}, () => {
						public.update();
					});
				}

				if (await fs.isDirectoryOrLinksDirectory(file)) {
					UI.dropZone(item, async container => {
						if (container.files) {
							Application.run(...configuration.move.replace("%s", container.files).replace("%d", file));
						}
					});
				}

				if (isLink) {
					const meta = await fs.meta(target.path);

					if (!meta || !meta.noLinkIcon) {
						const img = document.createElement("img");
						img.setAttribute("overlay", "");

						Icon.link(32).then(i => fs.readURI(i)).then(url => {
							img.src = url;
						});

						item.appendChild(img);
					}
				}

				const text = document.createElement("text");
				text.textContent = await Path.getPrettyName(file);
				item.appendChild(text);

				if (renamingFile == file) {
					text.contentEditable = true;
					text.textContent = Path.name(file);

					const overlay = document.createElement("text-overlay");

					requestAnimationFrame(() => {
						text.focus();

						const rename = async () => {
							text.textContent = text.textContent.trim();

							if (renamingFile) {
								const name = renamingFile;
								renamingFile = null;
								
								Interaction.lock();

								if (Path.name(name) != text.textContent) {
									await fs.rename(name, text.textContent);
								}
								
								public.update();

								Interaction.unlock();
							}
						};

						text.onkeydown = e => {
							if (e.key == "Enter") {
								e.preventDefault();
								
								rename();
							}
						}
						
						text.onblur = e => {
							rename();
						};
					});
				}

				item.ondblclick = item.ontouchend = () => {
					open(file);
				};

				desktop.appendChild(item);
			}

			requestAnimationFrame(async () => {
				desktop.textContent = "";
				
				for (let file of configuration.desktop.items.map(f => DLL.resource(f))) {
					await renderItem(file, false);
				}

				for (let file of await fs.list(path)) {
					await renderItem(file, true);
				}
			});
		},
		rename(path) {
			renamingFile = path;
			public.update();
		}
	}

	public.update();

	fs.listen(path, () => {
		public.update();
	});

	fs.listen(Path.user.bin, () => {
		public.update();
	});

	Application.load(...configuration.autostart);

	return public;
}

DLL.export("Desktop", new Desktop(workspace, Path.user.desktop));