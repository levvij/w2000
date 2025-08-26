// console element
function Console(parent) {
	const element = document.createElement("console");
	parent.appendChild(element);

	let cursor;
	let content;
	let locked;

	// put char
	const putc = c => {
		switch (c) {
			case "\t":
				{
					// tabs
					for (let i = 0; i < 4; i++) {
						putc(" ");
					}
					break;
				}
			case "\n":
				{
					// new lines
					public.y++;
					public.x = 0;
					break;
				}
			case "\r":
				{
					// carriage returns
					public.x = 0;

					break;
				}
			case "\b":
				{
					// backspace
					public.x--;

					if (public.x == -1) {
						public.x = 0;
					}

					break;
				}
			default:
				{
					// replace char
					const index = (public.width + 1) * public.y + public.x;
					const cc = content.textContent;
					content.textContent = cc.substr(0, index) + c + cc.substr(index + 1);
					// is a new line required?
					if (public.x == public.width - 1) {
						public.x = 0;
						public.y++;
					} else {
						public.x++;
					}
				}
		}

		if (public.y == public.height) {
			// remove topmost line and insert empty one
			content.textContent = [
				...content.textContent.split("\n").slice(1),
				"".padStart(public.width, " ")
			].join("\n");

			public.y--;
		}
	};

	// update cursor position
	const updateCursor = () => {
		let text = "";

		for (let i = 0; i < public.y; i++) {
			text += "\n";
		}

		text += "".padStart(public.x, " ");

		cursor.textContent = text;
	};

	const public = {
		width: -1,
		height: -1,
		x: 0,
		y: 0,
		output: "",
		lock() {
			locked = true;
		},
		unlock() {
			locked = false;
		},
		hideCursor() {
			cursor.setAttribute("hidden", "");
		},
		showCursor() {
			cursor.removeAttribute("hidden");
		},
		reset() {
			element.textContent = "";

			const measurementElement = document.createElement("console-m");
			measurementElement.textContent = "#";
			element.appendChild(measurementElement);
			
			content = document.createElement("console-text");
			element.appendChild(content);
			
			cursor = document.createElement("console-cursor");
			cursor.textContent = "#";
			element.appendChild(cursor);
			
			const charSize = {
				height: measurementElement.offsetHeight,
				width: measurementElement.offsetWidth
			};
			
			public.width = Math.floor(element.offsetWidth / charSize.width);
			public.height = Math.floor(element.offsetHeight / charSize.height);
			
			measurementElement.remove();
			public.clear(true);
		},
		clear(fromReset) {
			// reset console if size is Infinite/NaN (div by 0)
			if (!fromReset && isNaN(public.width)) {
				public.reset();
			}

			public.x = 0;
			public.y = 0;

			// fill console space with spaces
			const s = [];
			for (let i = 0; i < public.height; i++) {
				s.push("".padStart(public.width, " "));
			}

			content.textContent = s.join("\n");
			updateCursor();
		},
		write(s) {
			s = s.toString();

			public.output += s;
			
			if (!locked) {
				// write string
				for (let c of s) {
					putc(c);
				}

				// update cursor
				updateCursor();
			}
		},
		writeln(s) {
			public.write(s + "\n");
		},
		createUnit(name) {
			// create new unit in console
			return new Unit(public, name);
		},

		// show / hide for globalConsole
		show() {
			parent.removeAttribute("hidden");
		},
		hide() {
			parent.setAttribute("hidden", "");
		},

		// enable error mode for globalConsole
		errorMode() {
			parent.setAttribute("bsod", "");
			public.show();
		},

		// copy cursor position
		copyCursor() {
			return {
				x: public.x,
				y: public.y
			};
		},

		// apply cursor position
		applyCursor(c) {
			public.x = Math.min(c.x, public.width - 1);
			public.y = Math.min(c.y, public.height - 1);
			updateCursor();
		},

		// resize window
		resize() {
			const buffer = content.textContent;
			const pos = public.copyCursor();
			public.reset();

			for (let line of buffer.trimEnd().split("\n")) {
				public.writeln(line.trimEnd());
			}

			public.applyCursor(pos);
		},

		// dump object to console
		dump(...obj) {
			console.log(obj);

			public.show();
			public.writeln("dump");

			for (let o of obj) {
				public.writeln(JSON.stringify(o, null, 4));
			}
		}
	}

	// initial reset
	public.reset();

	return public;
}