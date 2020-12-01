UI.ContextMenu = (items, x, y, parent, z) => {
	const root = document.createElement("ui-context-menu");
	workspace.appendChild(root);

	let currentSubMenu;
	let currentlyCheckedItem;
	
	// add clickout overlay
	const overlay = document.createElement("ui-context-menu-overlay");
	overlay.style.zIndex = z + 98;
	overlay.onclick = () => {
		root.remove();
		overlay.remove();
	};
	workspace.appendChild(overlay);

	// public
	const menu = {
		dismiss(fromParent) {
			root.remove();
			overlay.remove();

			if (parent && !fromParent) {
				parent.dismiss();
			}

			if (currentSubMenu) {
				currentSubMenu.dismiss(true);
			}
		}
	};

	const updateCheckerIcon = item => {
		if (item.checked) {
			fs.readURI(DLL.resource("checked.png")).then(url => {
				item.checker.style.backgroundImage = "url('" + url + "')";
			});
		} else {
			item.checker.style.backgroundImage = "";
		}
	}

	// add all items to the menu
	for (let item of items) {
		if (item.text || item.icon) {
			const e = root.appendChild(document.createElement("ui-context-item"));

			item.element = e;
			item.checker = e.appendChild(document.createElement("ui-check"));

			if (item.icon) {
				const img = document.createElement("image");
				e.appendChild(img);

				(item.icon.then ? item.icon : Promise.resolve(item.icon)).then(icon => fs.readURI(icon)).then(uri => {
					img.style.backgroundImage = "url('" + uri + "')";
				});

				root.setAttribute("icon", "");
			}

			const text = document.createElement("text");
			item.key && (e.appendChild(document.createElement("ui-context-item-shortcut")).textContent = UI.transformShortcut(item.key));
			e.appendChild(text);

			e.onclick = () => {
				if (item.check) {
					if (currentlyCheckedItem) {
						currentlyCheckedItem.uncheck && currentlyCheckedItem.uncheck();
						currentlyCheckedItem.element.removeAttribute("checked");
						currentlyCheckedItem.checked = false;

						updateCheckerIcon(currentlyCheckedItem);
					}

					currentlyCheckedItem = item;
					item.check();
					item.checked = true;
					e.setAttribute("checked", "");

					updateCheckerIcon(item);
				}

				if (item.click) {
					item.click();
					menu.dismiss();
				}
			};

			if (item.checked) {
				e.setAttribute("checked", "");
				currentlyCheckedItem = item;

				updateCheckerIcon(item);
			}

			e.onmouseover = () => {
				if (currentSubMenu) {
					currentSubMenu.dismiss(true);
				}

				if (item.items) {
					if (typeof item.items == "function") {
						const box = e.getBoundingClientRect();
						const loadingMenu = UI.ContextMenu([
							{
								disabled: true,
								text: "Loading..."
							}
						], box.right, box.top, menu, z);
						
						requestAnimationFrame(async () => {
							loadingMenu.dismiss(true);
							currentSubMenu = UI.ContextMenu(await item.items(), box.right, box.top, menu, z);
						});
					} else {
						const box = e.getBoundingClientRect();
						currentSubMenu = UI.ContextMenu(item.items, box.right, box.top, menu, z);
					}
				}
			};

			text.textContent = item.text;
			root.appendChild(e);

			item.disabled && e.setAttribute("disabled", "");

			if (item.items) {
				const more = document.createElement("ui-context-more");

				fs.readURI(DLL.resource("more.png")).then(url => {
					more.style.backgroundImage = "url('" + url + "')";
				});

				e.appendChild(more);
			}
		} else {
			root.appendChild(document.createElement("ui-context-line"));
		}
	}

	const box = root.getBoundingClientRect();

	if (x > innerWidth - box.width) {
		root.style.right = innerWidth - x;
	} else {
		root.style.left = x;
	}

	if (y > innerHeight - box.height) {
		root.style.bottom = innerHeight - y;
	} else {
		root.style.top = y;
	}

	root.style.zIndex = z + 99;

	return menu;
};

// context menu handling for touch
let activeContextMenu;
document.body.ontouchstart = event => {
	config.touch = true;

	touchStart = setTimeout(() => {
		if (!Window.moving) {
			document.body.oncontextmenu(event);
		}
	}, configuration.mouse.contextMenu);
};

// clear timeout
document.body.ontouchend = event => {
	clearTimeout(touchStart);
};

// show context menu
document.body.oncontextmenu = event => {
	// use <bar> in taskbar as actual context
	if (event.target.tagName != "BAR") {
		event.preventDefault();

		if (activeContextMenu) {
			activeContextMenu.dismiss();

			activeContextMenu = null;
		} else {
			const x = event.touches ? event.touches[0].clientX : event.clientX;
			const y = event.touches ? event.touches[0].clientY : event.clientY;

			let element = document.elementFromPoint(x, y);

			while (element) {
				if (element.contextMenu) {
					if (element.contextMenu === true) {
						return;
					} else {
						activeContextMenu = UI.ContextMenu(element.contextMenu, x, y, null, Window.activeWindow ? Window.activeWindow.z + 100 : 100);

						return;
					}
				}

				element = element.parentElement;
			}
		}
	}
};

UI.extend("ContextMenu", (env, items, x, y, parent) => {
	UI.ContextMenu(items, x, y, parent, env.window.z);
});