Assert.test("Boot time under 20s", true, [], () => {
	return config.bootTime < 20000;
});

Assert.test("Test run time under 60s", true, [], () => {
	return (new Date() - config.bootEndTime) < 60000;
});