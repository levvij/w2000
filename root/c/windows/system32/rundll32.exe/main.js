async function main() {
	const window = new Window("Run", 350, 150);
	window.onclose.subscribe(() => exit());

	window.render(ui => {});
}