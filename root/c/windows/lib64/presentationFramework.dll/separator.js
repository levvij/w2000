UI.extend("Separator", (env, margin) => {
	const e = env.element("ui-separator");
	
	if (margin !== undefined) {
		e.native.style.margin = margin;
	}
	
	return e;
});