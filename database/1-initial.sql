CREATE TABLE bucket (
	id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	created TIMESTAMP,

	key TEXT
);

CREATE TABLE directory (
	id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	created TIMESTAMP,

	name TEXT,

	bucket_id UUID CONSTRAINT bucket__directories REFERENCES bucket (id)
);

ALTER TABLE directory ADD parent_id UUID CONSTRAINT parent__children REFERENCES directory (id);

CREATE TABLE file (
	id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	created TIMESTAMP,
	modified TIMESTAMP,

	name TEXT,
	directory_id UUID CONSTRAINT directory__files REFERENCES directory (id),
	content BYTEA,
	mime_type TEXT,
	size INTEGER
);
