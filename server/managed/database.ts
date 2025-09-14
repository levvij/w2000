import { Entity, DbSet, RunContext, QueryUUID, QueryProxy, QueryString, QueryJSON, QueryTimeStamp, QueryNumber, QueryTime, QueryDate, QueryBoolean, QueryBuffer, QueryEnum, ForeignReference, PrimaryReference, View, ViewSet } from 'vlquery';

export class BucketQueryProxy extends QueryProxy {
	get created(): Partial<QueryTimeStamp> { throw new Error("Invalid use of QueryModels. QueryModels cannot be used during runtime"); }
	get key(): Partial<QueryString> { throw new Error("Invalid use of QueryModels. QueryModels cannot be used during runtime"); }
}

export class Bucket extends Entity<BucketQueryProxy> {
	items: PrimaryReference<File, FileQueryProxy>;
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
		
		this.items = new PrimaryReference<File, FileQueryProxy>(this, "bucketId", File);
	}
}
			
export class FileQueryProxy extends QueryProxy {
	get bucket(): Partial<BucketQueryProxy> { throw new Error("Invalid use of QueryModels. QueryModels cannot be used during runtime"); }
	get bucketId(): Partial<QueryUUID> { throw new Error("Invalid use of QueryModels. QueryModels cannot be used during runtime"); }
	get content(): Partial<QueryBuffer> { throw new Error("Invalid use of QueryModels. QueryModels cannot be used during runtime"); }
	get created(): Partial<QueryTimeStamp> { throw new Error("Invalid use of QueryModels. QueryModels cannot be used during runtime"); }
	get deleted(): Partial<QueryTimeStamp> { throw new Error("Invalid use of QueryModels. QueryModels cannot be used during runtime"); }
	get mimeType(): Partial<QueryString> { throw new Error("Invalid use of QueryModels. QueryModels cannot be used during runtime"); }
	get modified(): Partial<QueryTimeStamp> { throw new Error("Invalid use of QueryModels. QueryModels cannot be used during runtime"); }
	get path(): Partial<QueryString> { throw new Error("Invalid use of QueryModels. QueryModels cannot be used during runtime"); }
	get size(): Partial<QueryNumber> { throw new Error("Invalid use of QueryModels. QueryModels cannot be used during runtime"); }
}

export class File extends Entity<FileQueryProxy> {
	get bucket(): Partial<ForeignReference<Bucket>> { return this.$bucket; }
	bucketId: string;
	content: Buffer;
	created: Date;
	deleted: Date;
	declare id: string;
	mimeType: string;
	modified: Date;
	path: string;
	size: number;
	
	$$meta = {
		source: "file",
		columns: {
			bucketId: { type: "uuid", name: "bucket_id" },
			content: { type: "bytea", name: "content" },
			created: { type: "timestamp", name: "created" },
			deleted: { type: "timestamp", name: "deleted" },
			id: { type: "uuid", name: "id" },
			mimeType: { type: "text", name: "mime_type" },
			modified: { type: "timestamp", name: "modified" },
			path: { type: "text", name: "path" },
			size: { type: "int4", name: "size" }
		},
		get set(): DbSet<File, FileQueryProxy> { 
			return new DbSet<File, FileQueryProxy>(File, null);
		}
	};
	
	constructor() {
		super();
		
		this.$bucket = new ForeignReference<Bucket>(this, "bucketId", Bucket);
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

	
}
			

export class DbContext {
	bucket: DbSet<Bucket, BucketQueryProxy>;
	file: DbSet<File, FileQueryProxy>;

	constructor(private runContext: RunContext) {
		this.bucket = new DbSet<Bucket, BucketQueryProxy>(Bucket, this.runContext);
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