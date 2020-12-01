/// Element resize
/// C 2019 levvij

function Resize(rect, root) {
	// resize in one direction
	const ray = (dir, element) => {
		if (element.dirs) {
			element.dirs.push(dir);
		} else {
			element.dirs = [ dir ];
			element.rect = rect;
		}
		
		element.addEventListener("mousedown", event => {
			Resize.element = element;
			root.setAttribute("resizing", "");
		});
	};
	
	// go thru all direction paris
	for (let dir of [
		"t", "r", "b", "l", "tr", "br", "bl", "tl"
	]) {
		const e = document.createElement("resize-" + dir);
		
		// all directions in direction (pair)
		for (let d of dir) {
			// add resize vector
			ray(d, e);
		}
		
		root.appendChild(e);
	}
}

// move handler 
const move = e => {
	// only resize if element is resizeable & no window is moving
	if (!Window.moving && Resize.element && Resize.element.rect.resizeable) {
		// resize all directions
		for (let dir of Resize.element.dirs) {
			switch (dir) {
				case "t": {
					Resize.element.rect.y += e.movementY;
					Resize.element.rect.height -= e.movementY;
					
					break;
				}
				case "b": {
					Resize.element.rect.height += e.movementY;
					
					break;
				}
				case "l": {
					Resize.element.rect.x += e.movementX;
					Resize.element.rect.width -= e.movementX;
					
					break;
				}
				case "r": {
					Resize.element.rect.width += e.movementX;
					
					break;
				}
			}
		}
		
		// trigger onresize event
		Resize.element.rect.onresize && Resize.element.rect.onresize(Resize.element.dirs);
	}
};

// register move handler
workspace.addEventListener("mousemove", move);
workspace.addEventListener("touchmove", move);

// stop resizing
const stop = () => {
	if (Resize.element) {
		Resize.element.parentElement.removeAttribute("resizing");
		Resize.element = null;
	}
};

// register stop handlers
workspace.addEventListener("mouseup", stop);
workspace.addEventListener("mouseleave", stop);
workspace.addEventListener("touchend", stop);

DLL.export("Resize", Resize);