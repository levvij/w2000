function main() {
	const window = new Window("Memory Watch", 180, 185);
	window.onclose.subscribe(() => exit());

	window.render(ui => {
		const chart = ui.Chart({
			valueTransform: v => Path.readableSize(v),
			segments: [...Management.memory.getUsage().map(m => ({
				text: m.name,
				value: m.usage
			})), arguments.has("b") || {
				text: "Browser Memory",
				value: Management.memory.vmPaddingSize
			}, arguments.has("f") || {
				text: "Free Memory",
				value: Management.memory.free
			}].filter(c => c.text)
		});

		chart.margin = "5px";

		ui.root.add(chart);
	});
	
	new Timer(window.render, +process.arguments.get("i") || 100);
}