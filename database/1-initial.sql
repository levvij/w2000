CREATE TABLE bucket (
	id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	created TIMESTAMP,

	key TEXT
);

CREATE TABLE file (
	id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	created TIMESTAMP,
	modified TIMESTAMP,
	deleted TIMESTAMP,

	path TEXT,
	bucket_id UUID CONSTRAINT bucket__items REFERENCES bucket (id),
	content BYTEA,
	mime_type TEXT,
	size INTEGER
);
