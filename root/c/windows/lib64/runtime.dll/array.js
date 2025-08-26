Array.prototype.replace = function (from, to) {
	const a = [];
	
	for (let i = 0; i < this.length; i++) {
		if (this[i] == from) {
			a.push(to);
 		} else {
			a.push(this[i]);
		}
	}
	
	return a;
}

Array.prototype.mapAwait = async function (fx) {
	const array = [];
	
	for (let i = 0; i < this.length; i++) {
		array.push(await fx(this[i], i, this));
	}
	
	return array;
}

Array.prototype.mapAsync = async function (fx) {
	const array = [];
	
	for (let i = 0; i < this.length; i++) {
		array.push(await fx(this[i], i, this));
	}
	
	return array;
}

Array.prototype.unique = function (fx) {
	if (fx) {
		return this.map(i => [fx(i), i]).filter((p, i, a) => a.map(v => v[0]).indexOf(p[0]) == i).map(v => v[1]);
	}
	
	return this.filter((p, i, a) => a.indexOf(p) == i);
}