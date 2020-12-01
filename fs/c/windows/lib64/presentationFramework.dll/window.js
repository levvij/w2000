/// Window / window management
/// C 2019 levvij

const updatePageTab = async () => {
	const window = Window.activeWindow;

	if (window) {
		if (window.icon) {
			pageIcon.href = await fs.readURI(await window.icon);
		} else {
			if (window.process) {
				const info = await fs.exeinfo(window.process.path);
				
				if (info && info.icon) {
					pageIcon.href = await fs.readURI(await Icon.from(info.icon, 16));
				} else {
					pageIcon.href = await fs.readURI(await Icon.from(configuration.pageIcon.defaultProgram, 16));
				}
			} else {
				pageIcon.href = await fs.readURI(await Icon.from(configuration.pageIcon.defaultProgram, 16));
			}
		}

		if (window.title) {
			document.title = window.title + " - " + config.productName;
		} else {
			document.title = config.productName;
		}
	} else {
		pageIcon.href = await fs.readURI(await Icon.from(configuration.pageIcon.default, 16));
		document.title = config.productName;
	}
};

function Window(titletext, width, height, parent) {
	// create elements
	const element = document.createElement("window");
	const inner = document.createElement("window-inner");
	const title = document.createElement("window-title");
	const body = document.createElement("window-body");
	const buttonsContainer = document.createElement("window-buttons");
	const cover = document.createElement("window-cover");

	// create window id
	const id = Cypp.createId();

	// add elements
	workspace.appendChild(element);
	element.appendChild(inner);
	element.appendChild(cover);
	inner.appendChild(title);
	inner.appendChild(body);
	inner.appendChild(buttonsContainer);

	// disable contextMenu 
	inner.contextMenu = true;

	let ui;
	let resizeable = true;
	let ico;
	const keys = {};

	// create logger
	const log = globalConsole.createUnit("window-" + Cypp.shortenId(id));

	const public = {
		id,

		// events
		onclose: Event("Window close"),
		onstatechange: Event("Window state change"),
		onresize: Event("Window resize"),
		onchildcreate: Event("Child window create"),
		onerror: Event("Window rendering error"),
		onmousemove: Event("Window mouse move"),
		onmouseup: Event("Window mouse up"),
		onmousedown: Event("Window mouse down"),
		ontitlechange: Event("Window title change"),
		oniconchange: Event("Window icon change"),

		// hierarchy
		parent,
		childWindows: [],

		// size (limited / capped)
		get width() {
			return parseInt(element.style.width) - configuration.window.borderSize.x;
		},
		set width(value) {
			if (value < configuration.window.minWidth) {
				value = configuration.window.minWidth;
			}

			element.style.width = value + configuration.window.borderSize.x;
		},
		get height() {
			return parseInt(element.style.height) - configuration.window.borderSize.y;
		},
		set height(value) {
			if (value < configuration.window.minHeigth) {
				value = configuration.window.minHeigth;
			}

			element.style.height = value + configuration.window.borderSize.y;
		},

		// location (limited / capped)
		get x() {
			return parseInt(element.style.left);
		},
		set x(value) {
			if (value < configuration.window.minDisplayBorderOffset.x - public.width) {
				value = configuration.window.minDisplayBorderOffset.x - public.width;
			}

			if (value > workspace.clientWidth - configuration.window.minDisplayBorderOffset.x) {
				value = workspace.clientWidth - configuration.window.minDisplayBorderOffset.x;
			}

			element.style.left = value;
			public.prestinePosition = false;
		},
		get y() {
			return parseInt(element.style.top);
		},
		set y(value) {
			if (value < 0) {
				value = 0;
			}

			if (value > workspace.clientHeight - configuration.window.minDisplayBorderOffset.y) {
				value = workspace.clientHeight - configuration.window.minDisplayBorderOffset.y;
			}

			element.style.top = value;
			public.prestinePosition = false;
		},

		// z index
		get z() {
			return +element.style.zIndex;
		},
		set z(value) {
			element.style.zIndex = value;
		},

		// window title text
		get title() {
			return title.textContent;
		},
		set title(value) {
			const old = title.textContent;
			title.textContent = value;

			public.icon = ico;

			if (old != value) {
				public.ontitlechange(value);
				Window.ontitlechange(public, value);
			}

			updatePageTab();
		},

		// window title icon
		set icon(icon) {
			(async () => {
				const old = ico;
				ico = await icon;

				if (title.querySelector("img")) {
					title.querySelector("img").remove();
				}

				if (icon) {
					const img = document.createElement("img");

					fs.readURI(ico).then(url => {
						img.src = url;
					});

					title.appendChild(img);
					title.setAttribute("icon", "");
				} else {
					title.removeAttribute("icon");
				}

				if (ico != old) {
					public.oniconchange(ico);
					Window.oniconchange(public, ico);
				}

				updatePageTab();
			})();
		},
		get icon() {
			return ico;
		},

		// render
		// passing a function will set this function as the renderer and executing
		// just running render() will use the old renderer function
		async render(fx) {
			ui.clear();

			if (fx) {
				log.action("render", "new render function");
				public.renderFunction = fx;

				try {
					await fx(ui);
				} catch (e) {
					public.onerror(e);
				}
			} else {
				log.action("render", "rerender");

				public.renderFunction(ui);
			}
		},

		// create sub window
		createChildWindow(...args) {
			log.action("child", "new child window");

			const w = new Window(...args, public);
			public.childWindows.push(w);

			public.onchildcreate(w);

			return w;
		},

		// state
		state: {},

		// memoryUsage
		get memoryUsage() {
			return element.innerHTML.length;
		},

		// window state
		get active() {
			return element.hasAttribute("active");
		},
		focus() {
			if (!public.active) {
				element.setAttribute("active", "");
				element.removeAttribute("min");

				public.z = Math.max(...Window.instances.map(i => i.z)) + 100;
			}
		},
		blur() {
			element.removeAttribute("active");
		},

		// window visibility
		get minimized() {
			return element.hasAttribute("min");
		},
		get maximized() {
			return element.hasAttribute("max");
		},
		min() {
			log.action("state", "minimized");
			element.setAttribute("min", "");

			if (Window.instances.length - 1) {
				Window.activateTop(public);
			}

			Window.onstatechange(public);
			public.onstatechange();
		},
		max() {
			log.action("state", "maximized");

			element.setAttribute("max", "");

			Window.onstatechange(public);
			public.onstatechange();
		},
		restore() {
			element.removeAttribute("max");
			element.removeAttribute("min");
		},

		// close window
		close() {
			if (public.closed) {
				return;
			}

			log.action("state", "closed");

			// remove window from instances and parents childWindows
			Window.instances.splice(Window.instances.indexOf(public), 1);

			if (parent) {
				parent.childWindows.splice(parent.childWindows.indexOf(public), 1);
			}

			// remove from workplace 
			element.remove();

			if (parent) {
				Window.activate(parent);
			} else {
				if (Window.instances.length) {
					Window.activateTop(public);
				}
			}

			if (public == Window.activeWindow) {
				Window.activateTop(public);
			}

			public.closed = true;

			updatePageTab();

			// run events
			Window.onclose(public);
			public.onclose();
		},

		// set button style
		set buttonStyle(value) {
			buttonsContainer.textContent = "";

			if (value == Window.ButtonStyle.all) {
				const min = document.createElement("button");

				fs.readURI(DLL.resource("min.png")).then(url => {
					min.style.backgroundImage = "url('" + url + "')";
				});

				min.setAttribute("min", "");
				buttonsContainer.appendChild(min);
				min.onclick = () => public.min();

				const max = document.createElement("button");

				fs.readURI(DLL.resource("max.png")).then(url => {
					max.style.backgroundImage = "url('" + url + "')";
				});

				max.setAttribute("max", "");
				buttonsContainer.appendChild(max);
				max.onclick = () => {
					if (public.maximized) {
						public.restore();
					} else {
						public.max();
					}
				};
			}

			if (value != Window.ButtonStyle.none) {
				const close = document.createElement("button");

				fs.readURI(DLL.resource("close.png")).then(url => {
					close.style.backgroundImage = "url('" + url + "')";
				});

				close.setAttribute("close", "");
				buttonsContainer.appendChild(close);
				close.onclick = () => public.close();
			}
		},
		doneMoving() {
			element.removeAttribute("moving");
		},

		// break window & add windows 2000 glitch effect
		break () {
			// get properties
			const style = getComputedStyle(element);
			const headerStyle = getComputedStyle(title).backgroundColor;
			const height = title.getBoundingClientRect().height;

			// clear item
			element.textContent = "";

			// create canvas
			const canvas = document.createElement("canvas");
			const ctx = canvas.getContext("2d");

			canvas.width = public.width;
			canvas.height = public.height;

			// renderer
			const clone = async () => {
				if (Window.activeWindow && Window.activeWindow != public) {
					ctx.fillStyle = style.borderLeftColor;
					ctx.fillRect(Window.activeWindow.x - public.x, Window.activeWindow.y - public.y, Window.activeWindow.width - 1, Window.activeWindow.height - 1);

					ctx.fillStyle = style.borderBottomColor;
					ctx.fillRect(Window.activeWindow.x - public.x + 1, Window.activeWindow.y - public.y + 1, Window.activeWindow.width - 1, Window.activeWindow.height - 1);

					ctx.fillStyle = style.backgroundColor;
					ctx.fillRect(Window.activeWindow.x - public.x + 1, Window.activeWindow.y - public.y + 1, Window.activeWindow.width - 2, Window.activeWindow.height - 2);

					ctx.fillStyle = headerStyle;
					ctx.fillRect(Window.activeWindow.x - public.x + 1, Window.activeWindow.y - public.y + 1, Window.activeWindow.width - 2, height);
				}

				setTimeout(() => clone(), 10);
			}

			element.appendChild(canvas);
			setTimeout(() => clone(), 10);
		},

		// bind key
		bindKey(key, fx) {
			keys[key] = fx;
		},

		// is window resizeable (used by resize)
		get resizeable() {
			return resizeable && Window.activeWindow == public;
		},

		// ovverride resizability
		set resizeable(value) {
			resizeable = value;
		},

		// highlight window (for debugging)
		highlight() {
			element.setAttribute("highlight", "");
		},

		unhighlight() {
			element.removeAttribute("highlight");
		}
	};
	
	if (Management.device.size < Management.sizes.medium) {
		public.max();
	}

	body.onmousemove = event => {
		const box = body.getBoundingClientRect();

		public.onmousemove({
			type: "move",
			x: event.pageX - box.left,
			y: event.pageY - box.top
		});
	};

	body.onmouseup = event => {
		const box = body.getBoundingClientRect();

		public.onmouseup({
			type: "up",
			button: ["left", "middle", "right"][event.button],
			x: event.pageX - box.left,
			y: event.pageY - box.top
		});
	};

	body.onmousedown = event => {
		const box = body.getBoundingClientRect();

		public.onmousedown({
			type: "down",
			button: ["left", "middle", "right"][event.button],
			x: event.pageX - box.left,
			y: event.pageY - box.top
		});
	};

	// main ui object
	ui = new UI(public, body);
	const resize = new Resize(public, element);

	// activate window
	Window.activate(public);

	// set initial values
	public.z = Math.max(...Window.instances.map(i => i.z), 0) + 100;
	public.width = width;
	public.height = height;

	// take topmost window with a prestine position as guide
	public.x = parent ? Math.max(...parent.childWindows.filter(c => c.prestinePosition).map(c => c.x), parent.x) + configuration.window.initialOffset.x : Math.max(...Window.instances.filter(c => c.prestinePosition).map(c => c.x), configuration.window.initialPosition.x) + configuration.window.initialOffset.x;
	public.y = parent ? Math.max(...parent.childWindows.filter(c => c.prestinePosition).map(c => c.y), parent.y) + configuration.window.initialOffset.y : Math.max(...Window.instances.filter(c => c.prestinePosition).map(c => c.y), configuration.window.initialPosition.y) + configuration.window.initialOffset.y;
	public.title = titletext;
	public.prestinePosition = true;
	public.buttonStyle = Window.ButtonStyle.all;

	// add click hander for clickout cover
	cover.onclick = () => {
		Window.activate(public);
	};

	// move start handler
	title.ontouchstart = title.onmousedown = e => {
		Window.moving = public;
		Window.activate(public);
		element.setAttribute("moving", "");

		if (e.touches) {
			Window.movePos = {
				x: e.touches[0].clientX,
				y: e.touches[0].clientY
			};
		}
	};

	// add window to instances
	Window.instances.push(public);
	Window.onopen(public);

	// check key combination
	const checkKeyCombination = (key, event) => {
		const elements = key.toLowerCase().split("+");

		if (elements.includes("ctrl")) {
			if (!event.ctrlKey && !event.metaKey) {
				return;
			}

			elements.splice(elements.indexOf("ctrl"), 1);
		}

		if (elements.includes("shift")) {
			if (!event.shiftKey) {
				return;
			}

			elements.splice(elements.indexOf("shift"), 1);
		}

		if (elements.includes("arrow-up")) {
			if (event.key != "ArrowUp") {
				return;
			}

			elements.splice(elements.indexOf("arrow-up"), 1);
		}

		if (elements.includes("arrow-down")) {
			if (event.key != "ArrowDown") {
				return;
			}

			elements.splice(elements.indexOf("arrow-down"), 1);
		}

		if (elements.includes("arrow-left")) {
			if (event.key != "ArrowLeft") {
				return;
			}

			elements.splice(elements.indexOf("arrow-left"), 1);
		}

		if (elements.includes("arrow-right")) {
			if (event.key != "ArrowRight") {
				return;
			}

			elements.splice(elements.indexOf("arrow-right"), 1);
		}

		if (elements.includes("alt")) {
			if (!event.altKey) {
				return;
			}

			elements.splice(elements.indexOf("alt"), 1);
		}

		for (let item of elements) {
			if (item == event.key.toLowerCase()) {
				elements.splice(elements.indexOf("alt"), 1);
			}
		}

		if (!elements.length) {
			keys[key]();
			event.preventDefault && event.preventDefault();
		}
	}

	// add key handler
	public.keydown = event => {
		for (let key in keys) {
			checkKeyCombination(key, event);
		}
	};

	return public;
}

// all open window instances
Window.instances = [];

// window events
Window.onopen = Event("Window open");
Window.onactivechange = Event("Active window change");
Window.onclose = Event("Window close");
Window.onstatechange = Event("Window state change");
Window.ontitlechange = Event("Window title change");
Window.oniconchange = Event("Window icon change");

// activate window
Window.activate = window => {
	if (Window.activeWindow) {
		Window.activeWindow.blur();
	}

	Window.activeWindow = window;

	if (window) {
		updatePageTab();

		window.focus();
	}

	Window.onactivechange(window);
};

// activate topmost window
Window.activateTop = source => {
	Window.activate(Window.instances.filter(i => i != source && !i.minimized).sort((a, b) => a.z == b.z ? 0 : a.z > b.z ? -1 : 1)[0]);
};

// window button styles
Window.ButtonStyle = {
	all: {},
	close: {},
	none: {}
};

// mouse move handler 
const move = e => {
	if (Window.moving) {
		if (e.touches) {
			Window.moving.x += e.touches[0].clientX - Window.movePos.x;
			Window.moving.y += e.touches[0].clientY - Window.movePos.y;

			Window.movePos = {
				x: e.touches[0].clientX,
				y: e.touches[0].clientY
			};
		} else {
			Window.moving.x += e.movementX;
			Window.moving.y += e.movementY;
		}
	}
};

// register move handlers
workspace.addEventListener("mousemove", move);
workspace.addEventListener("touchmove", move);

// stop handler
const stop = () => {
	if (Window.moving) {
		Window.moving.doneMoving();
		Window.moving = null;
	}
};

// register stop handler
workspace.addEventListener("mouseup", stop);
workspace.addEventListener("mouseleave", stop);
workspace.addEventListener("touchend", stop);

// add global keydown handler
Window.keydown = onkeydown = event => {
	if (!event.key) {
		return;
	}
	
	if (event && event.preventDefault && (event.key.length > 1 && event.key[0] == "F")) {
		event.preventDefault();
	}

	// route event to current active window
	if (Window.activeWindow) {
		Window.activeWindow.keydown(event);
	}
};

updatePageTab();

DLL.export("Window", Window);