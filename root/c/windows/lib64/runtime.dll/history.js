function History(...history) {
	let index = history.length - 1;
	
	return {
		push(item) {
			history.length = index + 1;
			history.push(item);
			
			index = history.length - 1;
		},
		back() {
			index--;
			
			return history[index];
		},
		forward() {
			index++;
			
			return history[index];
		},
		get canGoForward() {
			return history.length != index + 1;
		},
		get canGoBack() {
			return !!index;
		},
		get items() {
			return Array.from(history);
		},
		get index() {
			return index;
		},
		replace(v) {
			history[index] = v;
		},
		get current() {
			return history[index];
		}
	}
}

DLL.export("History", History);