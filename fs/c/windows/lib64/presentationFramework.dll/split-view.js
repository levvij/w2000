UI.extend("SplitView", env => {
	const e = env.element("ui-split");

	e.navigation = env.element("ui-split-nav");
	e.content = env.element("ui-split-content");

	e.add(e.navigation);
	e.add(e.content);

	return e;
});