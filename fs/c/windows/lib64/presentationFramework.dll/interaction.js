function Interaction() {
	return {
		lock() {
			document.body.setAttribute("lock", "");
		},
		unlock() {
			document.body.removeAttribute("lock");
		}
	}
}

DLL.export("Interaction", new Interaction());