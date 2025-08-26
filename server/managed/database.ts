import { Entity, DbSet, RunContext, QueryUUID, QueryProxy, QueryString, QueryJSON, QueryTimeStamp, QueryNumber, QueryTime, QueryDate, QueryBoolean, QueryBuffer, QueryEnum, ForeignReference, PrimaryReference, View, ViewSet } from 'vlquery';

export class BucketQueryProxy extends QueryProxy {
	get created(): Partial<QueryTimeStamp> { throw new Error("Invalid use of QueryModels. QueryModels cannot be used during runtime"); }
	get key(): Partial<QueryString> { throw new Error("Invalid use of QueryModels. QueryModels cannot be used during runtime"); }
}

export class Bucket extends Entity<BucketQueryProxy> {
	directories: PrimaryReference<Directory, DirectoryQueryProxy>;
		created: Date;
	declare id: string;
	key: string;
	
	$$meta = {
		source: "bucket",
		columns: {
			created: { type: "timestamp", name: "created" },
			id: { type: "uuid", name: "id" },
			key: { type: "text", name: "key" }
		},
		get set(): DbSet<Bucket, BucketQueryProxy> { 
			return new DbSet<Bucket, BucketQueryProxy>(Bucket, null);
		}
	};
	
	constructor() {
		super();
		
		this.directories = new PrimaryReference<Directory, DirectoryQueryProxy>(this, "bucketId", Directory);
	}
}
			
export class DirectoryQueryProxy extends QueryProxy {
	get bucket(): Partial<BucketQueryProxy> { throw new Error("Invalid use of QueryModels. QueryModels cannot be used during runtime"); }
	get parent(): Partial<DirectoryQueryProxy> { throw new Error("Invalid use of QueryModels. QueryModels cannot be used during runtime"); }
	get bucketId(): Partial<QueryUUID> { throw new Error("Invalid use of QueryModels. QueryModels cannot be used during runtime"); }
	get created(): Partial<QueryTimeStamp> { throw new Error("Invalid use of QueryModels. QueryModels cannot be used during runtime"); }
	get name(): Partial<QueryString> { throw new Error("Invalid use of QueryModels. QueryModels cannot be used during runtime"); }
	get parentId(): Partial<QueryUUID> { throw new Error("Invalid use of QueryModels. QueryModels cannot be used during runtime"); }
}

export class Directory extends Entity<DirectoryQueryProxy> {
	get bucket(): Partial<ForeignReference<Bucket>> { return this.$bucket; }
	files: PrimaryReference<File, FileQueryProxy>;
		get parent(): Partial<ForeignReference<Directory>> { return this.$parent; }
	children: PrimaryReference<Directory, DirectoryQueryProxy>;
		bucketId: string;
	created: Date;
	declare id: string;
	name: string;
	parentId: string;
	
	$$meta = {
		source: "directory",
		columns: {
			bucketId: { type: "uuid", name: "bucket_id" },
			created: { type: "timestamp", name: "created" },
			id: { type: "uuid", name: "id" },
			name: { type: "text", name: "name" },
			parentId: { type: "uuid", name: "parent_id" }
		},
		get set(): DbSet<Directory, DirectoryQueryProxy> { 
			return new DbSet<Directory, DirectoryQueryProxy>(Directory, null);
		}
	};
	
	constructor() {
		super();
		
		this.$bucket = new ForeignReference<Bucket>(this, "bucketId", Bucket);
	this.files = new PrimaryReference<File, FileQueryProxy>(this, "directoryId", File);
		this.$parent = new ForeignReference<Directory>(this, "parentId", Directory);
	this.children = new PrimaryReference<Directory, DirectoryQueryProxy>(this, "parentId", Directory);
	}
	
	private $bucket: ForeignReference<Bucket>;

	set bucket(value: Partial<ForeignReference<Bucket>>) {
		if (value) {
			if (!value.id) { throw new Error("Invalid null id. Save the referenced model prior to creating a reference to it."); }

			this.bucketId = value.id as string;
		} else {
			this.bucketId = null;
		}
	}

	private $parent: ForeignReference<Directory>;

	set parent(value: Partial<ForeignReference<Directory>>) {
		if (value) {
			if (!value.id) { throw new Error("Invalid null id. Save the referenced model prior to creating a reference to it."); }

			this.parentId = value.id as string;
		} else {
			this.parentId = null;
		}
	}

	
}
			
export class FileQueryProxy extends QueryProxy {
	get directory(): Partial<DirectoryQueryProxy> { throw new Error("Invalid use of QueryModels. QueryModels cannot be used during runtime"); }
	get content(): Partial<QueryBuffer> { throw new Error("Invalid use of QueryModels. QueryModels cannot be used during runtime"); }
	get created(): Partial<QueryTimeStamp> { throw new Error("Invalid use of QueryModels. QueryModels cannot be used during runtime"); }
	get directoryId(): Partial<QueryUUID> { throw new Error("Invalid use of QueryModels. QueryModels cannot be used during runtime"); }
	get mimeType(): Partial<QueryString> { throw new Error("Invalid use of QueryModels. QueryModels cannot be used during runtime"); }
	get modified(): Partial<QueryTimeStamp> { throw new Error("Invalid use of QueryModels. QueryModels cannot be used during runtime"); }
	get name(): Partial<QueryString> { throw new Error("Invalid use of QueryModels. QueryModels cannot be used during runtime"); }
	get size(): Partial<QueryNumber> { throw new Error("Invalid use of QueryModels. QueryModels cannot be used during runtime"); }
}

export class File extends Entity<FileQueryProxy> {
	get directory(): Partial<ForeignReference<Directory>> { return this.$directory; }
	content: Buffer;
	created: Date;
	directoryId: string;
	declare id: string;
	mimeType: string;
	modified: Date;
	name: string;
	size: number;
	
	$$meta = {
		source: "file",
		columns: {
			content: { type: "bytea", name: "content" },
			created: { type: "timestamp", name: "created" },
			directoryId: { type: "uuid", name: "directory_id" },
			id: { type: "uuid", name: "id" },
			mimeType: { type: "text", name: "mime_type" },
			modified: { type: "timestamp", name: "modified" },
			name: { type: "text", name: "name" },
			size: { type: "int4", name: "size" }
		},
		get set(): DbSet<File, FileQueryProxy> { 
			return new DbSet<File, FileQueryProxy>(File, null);
		}
	};
	
	constructor() {
		super();
		
		this.$directory = new ForeignReference<Directory>(this, "directoryId", Directory);
	}
	
	private $directory: ForeignReference<Directory>;

	set directory(value: Partial<ForeignReference<Directory>>) {
		if (value) {
			if (!value.id) { throw new Error("Invalid null id. Save the referenced model prior to creating a reference to it."); }

			this.directoryId = value.id as string;
		} else {
			this.directoryId = null;
		}
	}

	
}
			

export class DbContext {
	bucket: DbSet<Bucket, BucketQueryProxy>;
	directory: DbSet<Directory, DirectoryQueryProxy>;
	file: DbSet<File, FileQueryProxy>;

	constructor(private runContext: RunContext) {
		this.bucket = new DbSet<Bucket, BucketQueryProxy>(Bucket, this.runContext);
		this.directory = new DbSet<Directory, DirectoryQueryProxy>(Directory, this.runContext);
		this.file = new DbSet<File, FileQueryProxy>(File, this.runContext);
	}

	findSet(modelType) {
		for (let key in this) {
			if (this[key] instanceof DbSet) {
				if ((this[key] as any).modelConstructor == modelType) {
					return this[key];
				}
			}
		}
	}

	
};