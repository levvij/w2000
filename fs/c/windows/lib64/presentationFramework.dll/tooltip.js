/// Tooltip utility
/// C 2019 levvij

let timer = setTimeout(() => {});
let pos = {};
let root;

function Tooltip() {
	const public = {
		register(element, text) {
			if (!root) {
				root = document.createElement("ui-tooltip");
				document.body.appendChild(root);
			}
			
			if (element.native) {
				element = element.native;
			}
			
			if (text) {
				element.addEventListener("mouseover", event => {
					pos = {
						x: event.clientX,
						y: event.clientY
					};

					timer = setTimeout(() => {
						// tooltips temporarely disabled
						// root.textContent = text;
						root.style.left = pos.x;
						root.style.top = pos.y;
					}, configuration.tooltip.timeout);
				});

				element.addEventListener("mousemove", () => {
					pos = {
						x: event.clientX,
						y: event.clientY
					};
				});

				element.addEventListener("mouseout", () => {
					clearTimeout(timer);

					root.textContent = "";
				});
			}
		}
	};
	
	return public;
}

DLL.export("Tooltip", new Tooltip());