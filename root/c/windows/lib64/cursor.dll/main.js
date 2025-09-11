function Cursor() {
	const process = new Process("pointer");

	const e = document.createElement("cursor");
	document.body.appendChild(e);

	const cache = {};

	const public = {
		get type() {
			return e.getAttribute("type");
		},
		set type(type) {
			type = type.trim();

			if (type.startsWith("url('") || type.startsWith("url(\"")) {
				e.style.backgroundImage = type;
			} else {
				e.style.backgroundImage = "url('" + type + "')";
			}

			e.setAttribute("type", type.split("/").pop().split(".")[0].split("')")[0].split("\")")[0]);
		},
		update(x, y, type) {
			if (config.touch) {
				return;
			}

			e.style.left = x;
			e.style.top = y;

			if (type) {
				public.type = type;
			} else {
				const element = document.elementFromPoint(x, y);

				if (element) {
					const s = getComputedStyle(element);

					if (s.getPropertyValue("--cursor")) {
						public.type = s.getPropertyValue("--cursor");

						return;
					}
				}
			}
		},
		async load(name) {
			if (cache[name]) {
				return cache[name];
			}

			if (!(await fs.exists(configuration.path.replace("%n", name)))) {
				process.log.warn("not-found", "cursor '" + name + "' ('" + configuration.path.replace("%n", name) + "') not found");

				return await fs.readURI(configuration.path.replace("%n", configuration.default));
			}

			return cache[name] = await fs.readURI(configuration.path.replace("%n", name));
		}
	}

	if (config.touch) {
		e.setAttribute("hidden", "");
	} else {
		addEventListener("mousemove", event => {
			document.body.setAttribute("cursor", "");

			public.update(event.pageX, event.pageY);
		});

		public.update(innerWidth / 2, innerHeight / 2, "arrow");
	}

	return public;
}

DLL.export("Cursor", new Cursor());
