UI.extend("MenuView", env => {
	const e = env.element("ui-menu-view");

	e.menus = env.element("ui-toolbar-box");
	e.content = env.element("ui-menu-view-content");
	e.status = env.element("ui-status-box");

	e.add(e.menus);
	e.add(e.content);
	e.add(e.status);

	return e;
});