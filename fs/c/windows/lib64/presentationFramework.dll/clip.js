function Clipboard() {
	let value;
	
	document.body.onpaste = event => {
		value = event.clipboardData.getData("text");
	};
	
	document.body.oncopy = event => {
		value = getSelection().toString();
	};
	
	return {
		async copy(text) {
			value = text;
			
			const el = document.createElement("textarea");
			el.value = text;
			
			document.body.appendChild(el);
			el.select();
			document.execCommand("copy");
			document.body.removeChild(el);
		},
		async paste() {
			return value;
		}
	}
}

DLL.export("Clipboard", new Clipboard());