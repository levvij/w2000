const process = new Process("nogap");
const tray = process.createTray();

async function NoGap() {
	const id = Cypp.id;
	
	let lastSend = new Date();
	let lastReceive = new Date();
	let reconnectAttempts = 0;
	
	let socket;
	const queue = {};
	const server = {};
	
	const online = [];
	
	const reconnect = async () => {
		if (!socket || socket.readyState > 1) {
			public.ready = false;
			
			return new Promise(done => {
				process.log.action("reconnect", configuration.nogap.address);
				
				public.onreconnect();
				
				socket = new WebSocket(configuration.nogap.address);
				
				socket.onclose = () => {
					reconnectAttempts++;
					
					if (reconnectAttempts == 10) {
						reconnectAttempts = 10;
					} 
					
					process.log.info("closed", "connection '" + configuration.nogap.address + "' closed. Trying to reconnect in " + reconnectAttempts + "s");
					
					setTimeout(() => {
						public.ready = false;
						
						reconnect();
					}, configuration.nogap.reconnectDelay * reconnectAttempts);
				};
				
				socket.onopen = function () {
					reconnectAttempts = 0;
					process.log.action("connect", "as " + id);

					// Register your id, so the root server knows you
					socket.send(JSON.stringify({
						type: "connect",
						id
					}));
					
					socket.onmessage = event => {
						// Parse the data of the message
						const data = JSON.parse(event.data);
						
						lastReceive = new Date();

						if (data.tag == "connect") {
							process.log.mark("connected", "node: " + data.node + ", active clients: " + data.clients);
							
							while (online.length) {
								online.pop();
							}
							
							online.push(...data.clients);
							
							public.ready = true;
							
							public.onreconnected();
							done();
						} else if (data.tag == "new-client") {
							process.log.info("new-client", data.id);
							
							online.push(data.id);
							public.onnewclient();
						} else if (data.tag == "closed-client") {
							process.log.info("closed-client", data.id);
							
							online.splice(online.indexOf(data.id), 1);
							public.oncloseclient();
						} else if (queue[data.tag]) {
							// call queue handler
							queue[data.tag](data);
						} else if (server[data.port]) {
							// send it to server handler
							server[data.port]({
								peerId: data.peerId,
								path: data.path,
								data: data.data,
								tag: data.tag
							}, async res => {
								const block = JSON.stringify({
									peerId: data.peerId,
									port: data.port,
									path: data.path,
									data: res,
									tag: data.tag 
								});
								
								await reconnect();

								// Send the data back to the peer
								socket.send(block);
								
								lastSend = new Date();
							});
						} else {
							// We have received a package which has a tag we dont know and we do not have server listening on the packets port
							process.log.info("Unrecognized package received", data);
							
							socket.send(JSON.stringify({
								peerId: data.peerId,
								port: data.port,
								unrecognized: true,
								tag: data.tag
							}));
							
							lastSend = new Date();
						}
					};
				};
			});
		}
	};
	
	const public = {
		online,
		
		// events
		onnewclient: Event("nogap new client"),
		oncloseclient: Event("nogap close client"),
		onreconnect: Event("nogap reconnect"),
		onreconnected: Event("nogap reconnected"),
		
		// the client allows you to connect to a peer and make requests to him
		Client: function (peer) {
			peer = public.resolve(peer);
			
			if (peer == Cypp.id) {
				const public = {
					peer,
					get active() {
						return Promise.resolve(true);
					},
					isActive() {
						return Promise.resolve(true);
					},
					request(port, path, data, tag) {
						data = JSON.parse(JSON.stringify(data || null));
						
						return new Promise(done => {
							const tag = Cypp.createId();
							
							if (server[port]) {
								server[port]({
									peerId: peer,
									data: data,
									tag,
									path,
									port
								}, res => {
									done({
										peerId: peer,
										data: res,
										port,
										path,
										tag
									});
								});
							} else {
								throw new Error("Server :" + port + " not found");
							}
						});
					}
				}
				
				return public;
			} else {
				const public = {
					peer,
					// Look if the peer is active. Returns true if active and does not return if not active
					get active() {
						return new Promise(done => {
							// Request the :0/up action of the peer
							public.request(0, "/up", {}).then(response => {
								done(!!response);
							});
						});
					},
					// Like active but it returns no after a timeout (default 1 second)
					isActive(timeout) {
						return new Promise(done => {
							public.active.then(done);

							setTimeout(done, timeout || 1000, false);
						});
					},
					// Make a request
					request(port, path, data, tag) {
						if (!data) {
							data = {};
						}
						
						return new Promise(async done => {
							await reconnect();
							
							// Make a tag to identify the request. If a tag is present reuse it
							tag = tag || Cypp.createId();

							var block = JSON.stringify({
								peerId: peer,
								port,
								path,
								data,
								tag
							});
							
							lastSend = new Date();

							// Send the request
							socket.send(block);

							// Add a handler for the response
							queue[tag] = data => {
								done(data);
							}
						});
					},
					// Make a reuseable request (Creates one tag for all requests). If you need to make a multiple requests to the same peer on the same port, it is recommended to use the stream request
					streamRequest(port) {
						const tag = Cypp.createId();

						const op = {
							send(path, data) {
								return public.request(port, path, data, tag);
							}
						}

						return op;
					}
				};

				return public;
			}
		},
		// Make a server. The server will be requestable by everybody who knows your id. A port has to be specified so that the socket knows that your handler has to be called
		Server: function (name, port, handler) {
			const s = {
				name,
				port,
				handler,
				stop() {
					delete server[port];
					
					public.servers.splice(public.servers.indexOf(s), 1);
				}
			};
			
			if (port in server) {
				throw new Error("Server at port " + port + " already exists");
			}
			
			server[port] = handler;
			public.servers.push(s);
			
			return s;
		},
		servers: [],
		async getClientInfo(id) {
			if (id == Cypp.id) {
				return {
					version: configuration.nogap.version,
					servers: public.servers.map(s => ({
						port: s.port,
						name: s.name
					}))
				};
			}
			
			const c = public.Client(id);
			
			const version = (await c.request(0, "/version")).data;
			
			if (Version(version) >= Version("1.0.1.0")) {
				return {
					version,
					servers: (await c.request(0, "/servers")).data
				}
			} else {
				return {
					version
				}
			}
		},
		resolve(peer) {
			if (peer in configuration.hosts) {
				return configuration.hosts[peer].replace("%c", Cypp.id);
			}
			
			return peer;
		},
		revresolve(id) {
			for (let name in configuration.hosts) {
				if (public.resolve(name) == id) {
					return name;
				}
			}
			
			return id;
		}
	}
	
	await reconnect();

	Timer(() => {
		const threshold = new Date() - 50;

		if (public.ready) {
			if (lastSend > threshold) {
				if (lastReceive > threshold) {
					tray.icon = "lights/0x00CB";
				} else {
					tray.icon = "lights/0x00C9";
				}
			} else {
				if (lastReceive > threshold) {
					tray.icon = "lights/0x00CA";
				} else {
					tray.icon = "lights/0x00C8";
				}
			}
		} else {
			tray.icon = "logdrive/0x0077";
		}
	}, 50);
	
	// Start the :0 server (manditory) to make up, and version requests
	process.log.action("server:0", "start");

	const zeroServer = public.Server(".", 0, (req, res) => {
		// Simple router
		switch (req.path) {
			case "/up": {
				res(true);
				return;
			}
			case "/version": {
				res(configuration.nogap.version);
				return;
			}
			case "/servers": {
				res(public.servers.map(s => ({
					port: s.port,
					name: s.name
				})));
				return;
			}
			default: {
				res({
					version: configuration.nogap.version,
					date: Date.now()
				});

				return;
			}
		}
	});
	
	return public;
}

DLL.export("NoGap", Networking.NoGap = (await NoGap()));