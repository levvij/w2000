function Screen() {
	const element = document.querySelector("screen");
	
	const public = {
		get element() {
			return element;
		}
	};
	
	return public;
}

DLL.export("Screen", new Screen());