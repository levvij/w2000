PMDE.routes.openFile = async req => {
	await Application.run(req[0], ...req.slice(1));
};

PMDE.routes.loadApplication = async req => {
	await Application.run(req[0], ...req.slice(1));
};

PMDE.routes.editFile = async req => {
	await Application.run(req[0], ...req.slice(1));
};

PMDE.routes.getProcesses = async req => {
	return Process.active.map(p => ({
		name: p.name,
		path: p.path,
		pid: p.pid,
		memoryUsage: p.memoryUsage
	}));
};