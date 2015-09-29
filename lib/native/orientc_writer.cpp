#include "orientc_writer.h"

#include <stdlib.h>
#include <string.h>
#include <list>
#include <utility>

#include "helpers.h"

namespace Orient {
union ftl {
	float fl;
	char bytes[4];
};

union dtll {
	double db;
	char bytes[8];
};

void writeString(ContentBuffer & buffer, const char *string);
void writeFlat32Integer(ContentBuffer & buffer, long value);

class DocumentWriter {
public:
	DocumentWriter();
	ContentBuffer header;
	ContentBuffer data;
	bool writeValueType;
	bool writeMapType;
	OType current;
	std::list<std::pair<int, int> > pointers;
	void writeRecordVersion();
	void writeClass(const char * name);
	void startField(const char *name, OType type);
	void endField(const char *name, OType type);
	void writeTypeIfNeeded(OType type);
	char * writtenContent(int *size);
};

DocumentWriter::DocumentWriter() :
		writeValueType(false), writeMapType(false), current(ANY) {

}

class InternalWriter {
public:
	std::list<DocumentWriter *> nested;
};

void DocumentWriter::writeTypeIfNeeded(OType type) {
	if (writeValueType) {
		data.prepare(1);
		data.content[data.cursor] = type;
	}
	if (writeMapType) {
		data.prepare(1);
		data.content[data.cursor] = type;
	}
}

void DocumentWriter::writeRecordVersion() {
	header.prepare(1);
	header.content[header.cursor] = 0;
}

void DocumentWriter::writeClass(const char * name) {
	writeString(header, name);
}

void DocumentWriter::startField(const char *name, OType type) {
	writeString(header, name);
	header.prepare(4);
	std::pair<int, int> toAdd(header.cursor, data.prepared);
	pointers.push_back(toAdd);
	header.prepare(1);
	header.content[header.cursor] = type;
	current = type;
}

void DocumentWriter::endField(const char *name, OType type) {
}

char * DocumentWriter::writtenContent(int * size) {
	writeVarint(header, 0);
	int headerSize = header.prepared;
	int dataSize = data.prepared;
	int wholeSize = headerSize + dataSize;
	std::list<std::pair<int, int> >::iterator i;
	for (i = pointers.begin(); i != pointers.end(); ++i) {
		std::pair<int, int> & pair = *i;
		header.force_cursor(pair.first);
		writeFlat32Integer(header, pair.second + headerSize);
	}
	char * all = new char[wholeSize];
	memcpy(all, header.content, headerSize);
	memcpy(all + headerSize, data.content, dataSize);
	*size = wholeSize;
	return all;
}

RecordWriter::RecordWriter(std::string formatter) :
		writer(new InternalWriter) {
	if (formatter != "ORecordSerializerBinary")
		throw "Formatter not supported";
	writer->nested.push_front(new DocumentWriter());
	DocumentWriter * doc = writer->nested.front();
	doc->writeRecordVersion();

}
RecordWriter::~RecordWriter() {
	delete writer->nested.front();
	delete writer;
}

void RecordWriter::startDocument(const char * name) {
	DocumentWriter * doc = writer->nested.front();
	doc->writeTypeIfNeeded(EMBEDDED);
	doc->writeClass(name);
}

void RecordWriter::startCollection(int size) {
	DocumentWriter * front = writer->nested.front();
	writeVarint(front->data, size);
	if (front->current == EMBEDDEDLIST || front->current == EMBEDDEDSET) {
		front->writeValueType = true;
		front->data.prepare(1);
		front->data.content[front->data.cursor] = ANY;
	}
}

void RecordWriter::endCollection() {
	DocumentWriter * doc = writer->nested.front();
	doc->writeValueType = false;
}

void RecordWriter::startField(const char *name, OType type) {
	DocumentWriter *front = writer->nested.front();
	front->startField(name, type);
	if (type == EMBEDDED) {
		writer->nested.push_front(new DocumentWriter());
	}
}

void RecordWriter::startMap(int size) {
	DocumentWriter *front = writer->nested.front();
	writeVarint(front->data, size);
	writer->nested.push_front(new DocumentWriter());
	writer->nested.front()->writeMapType = true;
}

void RecordWriter::mapKey(char * mapKey) {
	DocumentWriter *front = writer->nested.front();
	front->header.prepare(1);
	front->header.content[front->header.cursor] = STRING;
	front->startField(mapKey, ANY);
}

void RecordWriter::stringValue(const char * value) {
	DocumentWriter *front = writer->nested.front();
	front->writeTypeIfNeeded(STRING);
	writeString(front->data, value);
}

void RecordWriter::intValue(long value) {
	DocumentWriter *front = writer->nested.front();
	front->writeTypeIfNeeded(INTEGER);
	writeVarint(front->data, value);
}

void RecordWriter::shortValue(short value) {
	DocumentWriter *front = writer->nested.front();
	front->writeTypeIfNeeded(SHORT);
	writeVarint(front->data, value);
}

void RecordWriter::longValue(long long value) {
	DocumentWriter *front = writer->nested.front();
	front->writeTypeIfNeeded(LONG);
	writeVarint(front->data, value);
}

void RecordWriter::dateValue(long long value) {
	DocumentWriter *front = writer->nested.front();
	front->writeTypeIfNeeded(DATE);
	value /= 86400000;
	writeVarint(front->data, value);
}

void RecordWriter::dateTimeValue(long long value) {
	DocumentWriter *front = writer->nested.front();
	front->writeTypeIfNeeded(DATETIME);
	writeVarint(front->data, value);
}

void RecordWriter::byteValue(char value) {
	DocumentWriter *front = writer->nested.front();
	front->writeTypeIfNeeded(BYTE);
	front->data.prepare(1);
	front->data.content[front->data.cursor] = value;
}

void RecordWriter::booleanValue(bool value) {
	DocumentWriter *front = writer->nested.front();
	front->writeTypeIfNeeded(BOOLEAN);
	front->data.prepare(1);
	front->data.content[front->data.cursor] = value ? 1 : 0;
}

void RecordWriter::floatValue(float value) {
	DocumentWriter *front = writer->nested.front();
	union ftl tran;
	tran.fl = value;
	front->writeTypeIfNeeded(FLOAT);
	front->data.prepare(4);
	memcpy(front->data.content + front->data.cursor, tran.bytes, 4);
}

void RecordWriter::doubleValue(double value) {
	DocumentWriter *front = writer->nested.front();
	union dtll tran2;
	tran2.db = value;
	front->writeTypeIfNeeded(DOUBLE);
	front->data.prepare(8);
	memcpy(front->data.content + front->data.cursor, tran2.bytes, 8);
}

void RecordWriter::binaryValue(const char * value, int size) {
	DocumentWriter *front = writer->nested.front();
	front->writeTypeIfNeeded(BINARY);
	writeVarint(front->data, size);
	front->data.prepare(size);
	memcpy(front->data.content + front->data.cursor, value, size);
}

void RecordWriter::linkValue(struct Link &link) {
	DocumentWriter *front = writer->nested.front();
	front->writeTypeIfNeeded(LINK);
	writeVarint(front->data, link.cluster);
	writeVarint(front->data, link.position);
}

void RecordWriter::endField(const char *name, OType type) {
	DocumentWriter *front = writer->nested.front();
	front->endField(name, type);
	if (type == EMBEDDED) {
		int size;
		char * content = front->writtenContent(&size);
		writer->nested.pop_front();
		delete front;
		DocumentWriter *front1 = writer->nested.front();
		front1->data.prepare(size);
		memcpy(front1->data.content + front1->data.cursor, content, size);
	}
}

void RecordWriter::endMap() {
	DocumentWriter *front = writer->nested.front();
	int size;
	char * content = front->writtenContent(&size);
	writer->nested.pop_front();
	delete front;
	DocumentWriter *front1 = writer->nested.front();
	front1->data.prepare(size);
	memcpy(front1->data.content + front1->data.cursor, content, size);
	delete []content;
}

void RecordWriter::endDocument() {

}

const char * RecordWriter::writtenContent(int * size) {
	return writer->nested.front()->writtenContent(size);
}

void writeString(ContentBuffer & buffer, const char *string) {
	int size = strlen(string);
	writeVarint(buffer, size);
	buffer.prepare(size);
	memcpy(buffer.content + buffer.cursor, string, size);
}

void writeFlat32Integer(ContentBuffer & buffer, long value) {
	buffer.prepare(4);
	buffer.content[buffer.cursor] = (char) ((value >> 24) & 0xFF);
	buffer.content[buffer.cursor + 1] = (char) ((value >> 16) & 0xFF);
	buffer.content[buffer.cursor + 2] = (char) ((value >> 8) & 0xFF);
	buffer.content[buffer.cursor + 3] = (char) ((value >> 0) & 0xFF);
}

}
