UI.extend("RadioSelect", (env, items) => {
	const element = env.element("ui-radio-group");
	element.onchange = new Event("Radiogroup value change");
	
	let selectedItem;
	
	const render = () => {
		element.clear();
		
		for (let item of items) {
			const option = env.element("ui-radio");
			const knob = env.element("ui-radio-knob");
			const knobInner = env.element("ui-radio-knob-inner");
			const info = env.element("ui-radio-info");
			
			if (item.title) {
				info.add(env.element("ui-radio-title")).native.textContent = item.title;
			}
			
			if (item.description) {
				info.add(env.element("ui-radio-description")).native.textContent = item.description;
			}
			
			if (item.disabled) {
				option.native.setAttribute("disabled", "");
			}
			
			if (selectedItem == item) {
				option.native.setAttribute("selected", "");
			}
			
			option.native.onclick = () => {
				if (selectedItem != item) {
					selectedItem = item;
					element.onchange(item.value);
					
					render();
				}
			};
			
			option.add(knob);
			knob.add(knobInner);
			option.add(info);
			element.add(option);
		}
	};
	
	render();
	
	element.bind("items", () => {
		return items;
	}, v => {
		items = v;
		
		render();
	});
	
	element.bind("value", () => {
		if (selectedItem) {
			return selectedItem.value;
		}
	}, v => {
		selectedItem = items.find(item => item.value == v);
		
		render();
	});
	
	return element;
});