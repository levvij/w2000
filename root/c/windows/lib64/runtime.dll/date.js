Date.SECOND = 1000;
Date.MINUTE = 60 * 1000;
Date.HOUR = 60 * 60 * 1000;
Date.DAY = 24 * 60 * 60 * 1000;

Date.prototype.toLongString = function () {
	if (Math.floor(this / Date.DAY) * Date.DAY == Math.floor(new Date() / Date.DAY) * Date.DAY) {
		return "Today, " + this.toDateString() + ", " + this.toTimeString();
	}
	
	return [
		"Sunday",
		"Monday", 
		"Tuesday", 
		"Wednesday", 
		"Thursday", 
		"Friday", 
		"Saturday"
	][this.getUTCDay()] + ", " + this.toDateString() + ", " + this.toTimeString();
};

Date.prototype.toDateString = function () {
	return [
		"January", 
		"February", 
		"March", 
		"April", 
		"May", 
		"June", 
		"July", 
		"August", 
		"September", 
		"October", 
		"November", 
		"December"
	][this.getUTCMonth()] + " " + this.getUTCDate().toString().padStart(2, 0) + ", " + this.getFullYear();
};

Date.prototype.toTimeString = function () {
	return [
		this.getUTCHours().toString().padStart(2, 0),
		this.getUTCMinutes().toString().padStart(2, 0),
		this.getUTCSeconds().toString().padStart(2, 0)
	].join(":");
};