UI.extend("Tabs", (env, headerTextsInitial, initialIndex = 0) => {
	const tabs = env.element("ui-tabs");

	const headerTexts = [];

	headerTextsInitial = headerTextsInitial.filter((c, i, a) => a.indexOf(c) == i);

	const headers = env.element("ui-tab-headers");
	tabs.add(headers);

	const contents = env.element("ui-tab-contents");
	tabs.add(contents);

	let activeIndex = -1;

	const open = index => {
		if (activeIndex != -1) {
			headers.native.children[activeIndex].removeAttribute("active");
			contents.native.children[activeIndex].removeAttribute("active");
		}

		if (headers.native.children[index]) {
			activeIndex = index;

			headers.native.children[activeIndex].setAttribute("active", "");
			contents.native.children[activeIndex].setAttribute("active", "");
		}
	};

	tabs.addTab = (name, con) => {
		const index = headerTexts.push(name) - 1;

		const header = env.element("ui-tab-header");
		header.native.textContent = name;

		header.native.onclick = () => {
			open(index);
		};

		headers.add(header);

		const content = env.element("ui-tab-content");
		tabs[index] = content;

		contents.add(content);

		if (con) {
			content.add(con);
		}

		return index;
	};

	for (let item of headerTextsInitial) {
		tabs.addTab(item);
	}

	tabs.bind("activeIndex", () => {
		return activeIndex;
	}, value => {
		open(value);
	});

	open(initialIndex);

	return tabs;
});