// handle keyboard events
onkeyup = e => {
	if (document.activeElement && document.activeElement.tabIndex && e.keyCode == 13) {
		document.activeElement.click();
	}
}