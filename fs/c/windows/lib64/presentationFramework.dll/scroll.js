UI.extend("Scroll", env => {
	const e = env.element("ui-scroll");

	e.scrollToTop = () => {
		e.native.firstChild.scrollTop = 0;
	};

	e.scrollToBottom = () => {
		e.native.firstChild.scrollTop = e.native.firstChild.scrollHeight;
	};
	
	e.position = {
		get x() {
			return e.native.scrollLeft;
		},
		get y() {
			return e.native.scrollTop;
		}
	};

	return e;
});