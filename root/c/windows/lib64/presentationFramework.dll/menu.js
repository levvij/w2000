UI.extend("Menu", (env, items) => {
	const menu = env.element("ui-menu");

	// adds all key handlers to window
	// recursive because menus are only expanded / loaded when opened
	const addKeyHandlers = items => {
		for (let item of items) {
			if (item.key) {
				env.window.bindKey(item.key, () => {
					if (!item.disabled) {
						item.click();
					}
				});
			}

			if (item.items) {
				addKeyHandlers(item.items);
			}
		}
	}

	addKeyHandlers(items);

	// render menu items
	let i = 0;
	for (let item of items) {
		const e = env.element("ui-menu-item");

		if (item.disabled) {
			e.native.setAttribute("disabled", "");
		}

		if (item.tooltip) {
			e.tooltip = item.tooltip;
		}

		if (item.render) {
			// custom render
			item.render(e);
		} else if (item.input) {
			// add input item
			e.add(item.input);
			e.native.setAttribute("input", "");
		} else {
			// default item style
			e.native.textContent = item.text;

			// add icon
			if (item.icon) {
				const img = document.createElement("img");
				e.native.appendChild(img);
				e.native.setAttribute("icon", "");

				(item.then ? item : Promise.resolve(item.icon)).then(icon => fs.readURI(icon)).then(uri => {
					img.src = uri;
				});

				if (!item.text) {
					e.native.setAttribute("empty", "");
				}
			}

			e.native.onclick = () => {
				if (item.click) {
					item.click();
				} else if (item.items) {
					// show context menu when when expanded
					const box = e.native.getBoundingClientRect();
					
					env.ContextMenu(item.items, box.left, box.bottom);
				}
			}
		}

		// set custom width
		if (item.width) {
			e.native.style.width = item.width;
		}

		// add enable / disable functions
		menu[i] = {
			disable() {
				e.native.disabled = item.disabled = true;
			},
			enable() {
				e.native.disabled = item.disabled = false;
			}
		}

		if (item.disabled) {
			e.native.disabled = true;
		}

		i++;
		menu.add(e);
	}

	return menu;
});