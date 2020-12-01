UI.extend("Chart", (env, opts) => {
	const container = env.element("ui-chart");

	const legend = env.element("ui-chart-legend");
	container.add(legend);

	const canvas = document.createElement("canvas");
	canvas.context = canvas.getContext("2d");
	container.add({
		native: canvas
	});

	opts.valueTransform = opts.valueTransform || (value => value);

	const render = () => {
		if (!(canvas.width * canvas.height)) {
			return;
		}
		
		const total = opts.segments.map(s => s.value).reduce((a, c) => a + c, 0);

		const centerX = canvas.width / 2;
		const centerY = 1 + canvas.width * configuration.ui.chart.scale / 2;

		legend.clear();

		let last;
		let segmentIndex = 0;
		
		for (let segment of opts.segments) {
			segment.start = last || 0;
			last = segment.end = (last || 0) + (Math.PI * 2) / total * segment.value;

			segment.color = segment.color || configuration.ui.chart.colorTemplate.replace("%v", segmentIndex * configuration.ui.chart.colorDelta + configuration.ui.chart.colorStart);

			const item = env.element("ui-chart-legend-item");
			item.native.setAttribute("style", "--color: " + segment.color);
			item.native.textContent = configuration.ui.chart.template.replace("%t", segment.text).replace("%v", opts.valueTransform(segment.value));
			legend.add(item);

			segment.startX = -Math.sin(segment.start + Math.PI) * canvas.width / 2 + centerX;
			segment.startY = Math.cos(segment.start + Math.PI) * canvas.width * configuration.ui.chart.scale / 2 + centerY;
			segment.endX = -Math.sin(segment.end + Math.PI) * canvas.width / 2 + centerX;
			segment.endY = Math.cos(segment.end + Math.PI) * canvas.width * configuration.ui.chart.scale / 2 + centerY;

			segmentIndex++;
		}

		canvas.context.fillStyle = configuration.ui.chart.fillDark;
		canvas.context.ellipse(centerX, centerY + configuration.ui.chart.height, canvas.width / 2, canvas.width * configuration.ui.chart.scale / 2, 0, 0, 2 * Math.PI);
		canvas.context.rect(0, centerY + 1, canvas.width, configuration.ui.chart.height - 2);
		canvas.context.fill();
		canvas.context.stroke();

		canvas.context.beginPath();
		canvas.context.ellipse(centerX, centerY, canvas.width / 2 - 1, canvas.width * configuration.ui.chart.scale / 2 - 1, 0, 0, 2 * Math.PI);
		canvas.context.ellipse(centerX, centerY + configuration.ui.chart.height, canvas.width / 2 - 1, canvas.width * configuration.ui.chart.scale / 2 - 1, 0, 0, 2 * Math.PI);
		canvas.context.rect(1, centerY, canvas.width - 2, configuration.ui.chart.height);
		canvas.context.fill();

		const steps = Math.PI / canvas.width;

		for (let segment of opts.segments) {
			canvas.context.beginPath();
			canvas.context.fillStyle = segment.color;
			canvas.context.moveTo(segment.startX, segment.startY);

			for (let i = segment.start; i < segment.end; i += steps) {
				const startX = -Math.sin(i + Math.PI) * canvas.width / 2 + centerX;
				const startY = Math.cos(i + Math.PI) * canvas.width * configuration.ui.chart.scale / 2 + centerY;

				canvas.context.lineTo(startX, startY);
			}

			for (let i = segment.end; i > segment.start; i -= steps) {
				const startX = -Math.sin(i + Math.PI) * canvas.width / 2 + centerX;
				const startY = Math.cos(i + Math.PI) * canvas.width * configuration.ui.chart.scale / 2 + centerY;

				canvas.context.lineTo(startX, startY + configuration.ui.chart.height - 1);
			}

			canvas.context.fill();

			canvas.context.beginPath();
			canvas.context.moveTo(segment.startX, segment.startY);
			canvas.context.lineTo(segment.startX, segment.startY + configuration.ui.chart.height);
			canvas.context.stroke();
		}

		for (let segment of opts.segments.sort((a, b) => a.value == b.value ? 0 : a.value < b.value ? 1 : -1)) {
			canvas.context.beginPath();
			canvas.context.fillStyle = segment.color;
			canvas.context.ellipse(centerX, centerY, canvas.width / 2, canvas.width * configuration.ui.chart.scale / 2, 0, segment.start - Math.PI / 2, segment.end - Math.PI / 2);
			canvas.context.moveTo(segment.startX, segment.startY);
			canvas.context.lineTo(centerX, centerY);
			canvas.context.lineTo(segment.endX, segment.endY);
			canvas.context.fill();
			canvas.context.stroke();
		}

		canvas.context.beginPath();
		canvas.context.moveTo(0, centerY);
		canvas.context.lineTo(0, centerY + configuration.ui.chart.height + 1);
		canvas.context.moveTo(canvas.width, centerY);
		canvas.context.lineTo(canvas.width, centerY + configuration.ui.chart.height + 1);
		canvas.context.stroke();
	};

	container.onadded.subscribe(parent => {
		canvas.width = container.native.getBoundingClientRect().width;
		canvas.height = canvas.width * configuration.ui.chart.scale + configuration.ui.chart.height + 2;

		render();
	});

	return container;
});