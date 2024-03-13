Assert.test("NoGap connected", true, [], () => {
	return NoGap.online.includes(Cypp.id);
});
