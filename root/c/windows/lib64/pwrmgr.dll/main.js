const unit = globalConsole.createUnit("shutdown");

DLL.export("PowerManager", {
	async shutdown() {
		unit.mark("shutdown");
		unit.action("aRRR", (await fs.list("c/windows/system32/")).join(", "));
		
		history.back();
	},
	async restart() {
		unit.mark("restart");
		location.reload();
	},
	async reset() {
		unit.mark("reset");
		document.body.textContent = "";
		document.body.style.background = "#040404 !important";
		
		localStorage.clear();
		sessionStorage.clear();
		
		setTimeout(() => {
			location.reload();
		}, 3000);
	}
});