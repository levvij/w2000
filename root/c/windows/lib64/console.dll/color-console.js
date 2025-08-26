// console element
function ColorConsole(parent) {
	const element = document.createElement("console");
	element.style.lineHeight = config.console.lineHeight;
	parent.appendChild(element);
	
	let cursor;
	let content;
	let map;
	let locked;
	
	// put char
	const putc = c => {
		if (locked) {
			return;
		}
		
		switch (c) {
			case "\t": {
				// tabs
				for (let i = 0; i < 4; i++) {
					putc(" ");
				}

				break;
			}
			case "\n": {
				// new lines
				public.y++;
				public.x = 0;

				break;
			}
			case "\r": {
				// carriage returns
				public.x = 0;
				
				break;
			}
			case "\b": {
				// backspace
				public.x--;
				
				if (public.x == -1) {
					public.x = 0;
				}
				
				break;
			}
			default: {
				if (!map[public.y] || !map[public.y][public.x]) {
					return;
				}
				
				// replace char
				map[public.y][public.x].textContent = c;
				map[public.y][public.x].style.color = public.foreground;
				map[public.y][public.x].style.background = public.background;

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
			for (let y = 1; y < public.height; y++) {
				for (let x = 0; x < public.width; x++) {
					map[y - 1][x].textContent = map[y][x].textContent;
					map[y - 1][x].style.color = map[y][x].style.color;
					map[y - 1][x].style.background = map[y][x].style.background;
				}
			}
			
			for (let x = 0; x < public.width; x++) {
				map[public.height - 1][x].textContent = " ";
				map[public.height - 1][x].style.color = public.foreground;
				map[public.height - 1][x].style.background = public.background;
			}
			
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
		cursor.style.setProperty("--color", public.foreground);
	};
	
	const public = {
		width: -1,
		height: -1,
		x: 0,
		y: 0,
		output: "",
		foreground: "#A8A8A8",
		background: "",
		lock() {
			locked = true;
		},
		unlock() {
			locked = false;
		},
		hideCursor() {
			cursor.hidden = true;
		},
		showCursor() {
			cursor.hidden = true;
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
			public.height = Math.floor(element.offsetHeight / charSize.height) - 1;

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
			content.textContent = "";
			map = [];
			
			for (let y = 0; y < public.height; y++) {
				const row = document.createElement("console-row");
				
				map.push([]);
				
				for (let x = 0; x < public.width; x++) {
					const cell = document.createElement("console-cell");
					
					cell.textContent = " ";
					cell.style.color = public.foreground;
					cell.style.background = public.background;
					
					map[y].push(cell);
					
					row.appendChild(cell);
				}
				
				content.appendChild(row);
			}
			
			updateCursor();
		},
		write(s) {
			s = s.toString();
			
			public.output += s;
			
			// write string
			for (let c of s) {
				putc(c);
			}
			
			// update cursor
			updateCursor();
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
			
			locked = false;
			public.reset();
		},
		hide() {
			parent.setAttribute("hidden", "");
			
			content.textContent = "";
			locked = true;
		},
		
		// enable error mode for globalConsole
		errorMode() {
			public.foreground = "white";
			public.background = "blue";
			
			public.unlock();
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
