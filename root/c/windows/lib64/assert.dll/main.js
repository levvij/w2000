DLL.export("Assert", {
	tests: [],
	async test(name, res, args, fx) {
		const test = {
			name,
			arguments: args,
			expectedResult: res,
			done: false
		};
		
		Assert.tests.push(test);
		
		DLL.log.action("test", name);
		
		const r = await fx(...args);
		test.done = true;
		test.result = r;
		
		if (r == res) {
			DLL.log.action("test-succeed", name, args, r);
			
			test.success = true;
		} else {
			DLL.log.error("test-fail", name, {
				expected: res,
				arguments: args,
				result: r
			});
			
			test.success = false;
		}
	},
	async blukTest(name, reses, arguments, fx) {
		DLL.log.action("bulk-test", name);
		
		for (let i = 0; i < reses; i++) {
			const test = {
				name,
				arguments: arguments[i],
				expectedResult: reses[i],
				done: false
			};

			Assert.tests.push(test);
			
			DLL.log.action("bulk-test-next", name, arguments[i], reses[i]);
			
			const r = await fx(...arguments[i]);
			test.done = true;
			test.result = r;
			
			if (r == reses[i]) {
				DLL.log.action("bulk-test-succeed", name, arguments[i], r);
				
				test.success = true;
			} else {
				DLL.log.error("bulk-test-fail", name, {
					expected: reses[i],
					arguments: arguments[i],
					iteration: i,
					result: r
				});
				test.success = false;
			}
		}
	}
});