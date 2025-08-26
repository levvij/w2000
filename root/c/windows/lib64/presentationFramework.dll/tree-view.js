UI.extend("TreeView", (env, items, parent) => {
	const e = env.element("ui-tree");

	const updateExpander = item => {
		if (item.child.native.hasAttribute("open")) {
			fs.readURI(DLL.resource("collapse.png")).then(url => {
				item.expander.native.style.backgroundImage = "url('" + url + "')";
			});
		} else {
			fs.readURI(DLL.resource("expand.png")).then(url => {
				item.expander.native.style.backgroundImage = "url('" + url + "')";
			});
		}
	};

	// keep track of selectedItem in root
	const state = parent ? parent.state : {
		selectedItem: null
	};

	e.state = state;

	for (let item of items) {
		const l = env.element("ui-tree-leaf");
		item.element = l;

		const t = env.element("ui-tree-text");
		t.native.textContent = item.title;
		t.font = item.font;
		l.add(t);

		// select item
		const select = () => {
			// deselect currently selected item
			if (state.selectedItem) {
				state.selectedItem.element.native.removeAttribute("active");
				state.selectedItem.deselect && state.selectedItem.deselect();
			}

			state.selectedItem = item;
			item.select && item.select();
			l.native.setAttribute("active", "");
		};

		// add subitems if any are present
		if (item.items && item.items.length) {
			const child = env.TreeView(item.items, e);
			item.child = child;

			l.add(child);

			let timeout = setTimeout(() => {});

			l.native.onclick = ev => {
				// add nutorious windows tree view delay used to differenciate between click / double click
				// please remove this in actual windows
				timeout = setTimeout(() => {
					child.toggle();

					updateExpander(item);
				}, configuration.mouse.doubleClick);

				ev.stopPropagation();
			};

			l.native.ondblclick = ev => {
				select();
				clearTimeout(timeout);

				ev.stopPropagation();
			};

			// add expander icon
			const expander = env.element("ui-tree-indicator");

			item.expander = expander;

			updateExpander(item);

			l.add(expander);
		} else {
			// activate click if no subitems are present
			l.native.onclick = ev => {
				select();

				ev.stopPropagation();
			};
		}

		e.add(l);
	}

	if (!parent) {
		e.native.setAttribute("root", "");
	}

	e.open = () => {
		e.native.setAttribute("open", "");
	};

	e.close = () => {
		e.native.removeAttribute("open", "");
	};

	e.bind("opened", () => {
		return e.native.hasAttribute("open");
	});

	e.toggle = () => {
		if (e.opened) {
			e.close();
		} else {
			e.open();
		}
	};

	e.add(env.element("ui-tree-last"));

	return e;
});