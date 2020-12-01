UI.extend("InfoBar", (env, items) => {
	const bar = env.element("ui-info-bar");

	for (let i = 0; i < items.length; i++) {
		const e = env.element("ui-info-bar-item");

		e.bind("text", () => {
			return e.native.textContent;
		}, value => {
			e.native.textContent = value;
		});

		items[i].text && (e.text = items[i].text);

		if (items[i].width) {
			e.native.style.width = items[i].width;
		}

		bar[i] = e;
		bar.add(e);
	}

	return bar;
});