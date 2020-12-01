let currentItem;

UI.draggable = (element, ondrag, ondrop) => {
	element.draggable = true;
	element.ondrag = async () => {
		currentItem = {
			element, 
			ondrop,
			value: await ondrag()
		};
	};
};

UI.dropZone = (element, ondrop) => {
	element.ondragover = e => {
		e.preventDefault();
		element.setAttribute("ui-drag-over", "");
	};
	
	element.ondragleave = element.ondragend = e => {
		element.removeAttribute("ui-drag-over");
	}
	
	element.ondrop = async e => {
		e.preventDefault();
		
		element.removeAttribute("ui-drag-over");
		
		if (currentItem) {
			const itemDrop = currentItem.ondrop;
			const value = currentItem.value;
			currentItem = null;
			
			await ondrop(value);
			itemDrop && itemDrop(value);
		}
	};
};