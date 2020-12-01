UI.extend("Live", (env, feed) => {
	const live = env.element("ui-live");
	const canvas = env.element("canvas");
	live.add(canvas);

	let ctx;
	let i = 0;
	let renderer = setInterval(() => {});
	let w;
	let h;

	const next = () => {
		const video = document.createElement("video");
		video.muted = true;
		video.src = feed + "/frames/frame-" + (i % 2) + ".webm?tag=" + Math.random().toString(36).substr(2);

		video.onerror = e => {
			log.warn("failed to load live frame");

			e.preventDefault();
			e.stopPropagation();
		};

		try {
			video.play();
		} catch (e) {
			e.preventDefault();
			e.stopPropagation();
		}

		video.onloadeddata = () => {
			const box = live.native.getBoundingClientRect();

			if (!ctx) {
				ctx = canvas.native.getContext("2d");
				w = canvas.native.width = video.videoWidth;
				h = canvas.native.height = video.videoHeight;
			}

			if (w != box.width || h != box.height) {
				w = canvas.native.width = box.width;
				h = canvas.native.height = box.height;
			}

			clearInterval(renderer);
			renderer = setInterval(() => {
				ctx.drawImage(video, 0, 0);
			}, 50);
		};

		i++;
	};

	next();
	setInterval(next, 1000);

	return live;
})