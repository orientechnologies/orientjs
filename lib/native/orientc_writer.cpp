#include "orientc_writer.h"

#include <stdlib.h>
#include <string.h>
#include <list>
#include <utility>
#include <endian.h>

#include "helpers.h"

namespace Orient {

void writeString(ContentBuffer & buffer, const char *string);
void writeFlat16Integer(ContentBuffer & buffer, int16_t value);
void writeFlat32Integer(ContentBuffer & buffer, int32_t value);
void writeFlat64Integer(ContentBuffer & buffer, int64_t value);

class DocumentWriter {
public:
	DocumentWriter();
	ContentBuffer header;
	ContentBuffer data;
	std::list<OType> current;
	std::list<std::pair<int32_t, int32_t> > pointers;
	std::list<std::pair<int32_t, int32_t> > dataPointers;
	void writeRecordVersion();
	void writeClass(const char * name);
	void startField(const char *name);
	void endField(const char *name);
	void writeTypeIfNeeded(OType type);
	void popType();
	unsigned char * writtenContent(int *size, DocumentWriter * parent, int contentOffset);
};

DocumentWriter::DocumentWriter() {
}

class InternalWriter {
public:
	std::list<DocumentWriter *> nested;
};

void DocumentWriter::popType() {
	current.pop_front();
}
void DocumentWriter::writeTypeIfNeeded(OType type) {

	if (current.front() == EMBEDDED || current.front() == EMBEDDEDMAP) {
		header.prepare(4);
		std::pair<int, int> toAdd(header.cursor, data.prepared);
		pointers.push_back(toAdd);
		header.prepare(1);
		header.content[header.cursor] = type;
	} else if (current.front() == EMBEDDEDLIST || current.front() == EMBEDDEDSET) {
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

void DocumentWriter::startField(const char *name) {
	writeString(header, name);
}

void DocumentWriter::endField(const char *name) {
}

unsigned char * DocumentWriter::writtenContent(int * size, DocumentWriter * parent, int contentOffset) {
	writeVarint(header, 0);
	int headerSize = header.prepared;
	int dataSize = data.prepared;
	int wholeSize = headerSize + dataSize;
	std::list<std::pair<int32_t, int32_t> >::iterator i;
	for (i = pointers.begin(); i != pointers.end(); ++i) {
		std::pair<int32_t, int32_t> & pair = *i;
		if (parent != 0) {
			parent->dataPointers.push_back(std::pair<int32_t, int32_t>(pair.first + contentOffset, pair.second + headerSize + contentOffset));
		} else {
			header.force_cursor(pair.first);
			writeFlat32Integer(header, pair.second + headerSize);
		}
	}
	for (i = dataPointers.begin(); i != dataPointers.end(); ++i) {
		std::pair<int32_t, int32_t> & pair = *i;
		if (parent != 0) {
			parent->dataPointers.push_back(std::pair<int32_t, int32_t>(pair.first + headerSize + contentOffset, pair.second + headerSize + contentOffset));
		} else {
			data.force_cursor(pair.first);
			writeFlat32Integer(data, pair.second + headerSize);
		}
	}

	unsigned char * all = new unsigned char[wholeSize];
	memcpy(all, header.content, headerSize);
	memcpy(all + headerSize, data.content, dataSize);

	*size = wholeSize;
	return all;
}

RecordWriter::RecordWriter(std::string formatter) :
		writer(new InternalWriter) {
	if (formatter != "onet_ser_v0")
		throw "Formatter not supported";
}
RecordWriter::~RecordWriter() {
	delete writer->nested.front();
	delete writer;
}

void RecordWriter::startDocument(const char * name) {
	DocumentWriter * doc = new DocumentWriter();
	if (writer->nested.size() == 0) {
		writer->nested.push_front(doc);
		doc->writeRecordVersion();
	} else {
		DocumentWriter * docFront = writer->nested.front();
		docFront->writeTypeIfNeeded(EMBEDDED);
		writer->nested.push_front(doc);
	}
	doc->current.push_front(EMBEDDED);
	doc->writeClass(name);
}

void RecordWriter::startCollection(int size, OType type) {
	DocumentWriter * front = writer->nested.front();
	front->writeTypeIfNeeded(type);
	front->current.push_front(type);
	if (type == LINKBAG) {
		front->data.prepare(1);
		front->data.content[front->data.cursor] = 0x1;
		writeFlat32Integer(front->data, size);
	} else {
		writeVarint(front->data, size);
		if (type == EMBEDDEDLIST || type == EMBEDDEDSET) {
			front->data.prepare(1);
			front->data.content[front->data.cursor] = ANY;
		}
	}
}

void RecordWriter::endCollection(OType type) {
	DocumentWriter * doc = writer->nested.front();
	doc->current.pop_front();
}

void RecordWriter::startMap(int size, OType type) {
	DocumentWriter *front = writer->nested.front();
	front->writeTypeIfNeeded(type);
	writeVarint(front->data, size);
	if (type == EMBEDDEDMAP) {
		writer->nested.push_front(new DocumentWriter());
	}
	writer->nested.front()->current.push_front(type);
}

void RecordWriter::mapKey(const char * mapKey) {
	DocumentWriter *front = writer->nested.front();
	if (front->current.front() == EMBEDDEDMAP) {
		front->header.prepare(1);
		front->header.content[front->header.cursor] = STRING;
		front->startField(mapKey);
	} else {
		front->data.prepare(1);
		front->data.content[front->data.cursor] = STRING;
		writeString(front->data, mapKey);
	}
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
	front->writeTypeIfNeeded(FLOAT);
	int32_t i_value;
	memcpy(&i_value, &value, 4);
	writeFlat32Integer(front->data, i_value);
}

void RecordWriter::doubleValue(double value) {
	DocumentWriter *front = writer->nested.front();
	front->writeTypeIfNeeded(DOUBLE);
	front->data.prepare(8);
	int64_t i_val;
	memcpy(&i_val, &value, 8);
	i_val = htobe64(i_val);
	memcpy(front->data.content + front->data.cursor, &i_val, 8);
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
	if (front->current.front() == LINKBAG) {
		writeFlat16Integer(front->data, link.cluster);
		writeFlat64Integer(front->data, link.position);
	} else {
		front->writeTypeIfNeeded(LINK);
		writeVarint(front->data, link.cluster);
		writeVarint(front->data, link.position);
	}
}

void RecordWriter::ridBagTreeKey(long long fileId, long long pageIndex, long pageOffset) {
	DocumentWriter *front = writer->nested.front();
	front->writeTypeIfNeeded(LINKBAG);
	front->data.prepare(1);
	front->data.content[front->data.cursor] = 0;
	writeFlat64Integer(front->data, fileId);
	writeFlat64Integer(front->data, pageIndex);
	writeFlat32Integer(front->data, pageOffset);
	writeFlat32Integer(front->data, 0);
	writeFlat32Integer(front->data, 0);
}

void RecordWriter::startField(const char* name) {
	DocumentWriter* front = writer->nested.front();
	front->startField(name);
}

void RecordWriter::endField(const char *name) {
	DocumentWriter *front = writer->nested.front();
	front->endField(name);
}

void RecordWriter::endMap(OType type) {
	DocumentWriter *front = writer->nested.front();
	if (front->current.front() == EMBEDDEDMAP) {
		writer->nested.pop_front();
		DocumentWriter *front1 = writer->nested.front();
		int size;
		unsigned char * content = front->writtenContent(&size, front1, front1->data.prepared);
		delete front;
		front1->data.prepare(size);
		memcpy(front1->data.content + front1->data.cursor, content, size);
		delete[] content;
	} else
		front->popType();
}

void RecordWriter::nullValue() {
	DocumentWriter *front = writer->nested.front();
	if (front->current.front() == EMBEDDEDMAP || front->current.front() == EMBEDDED) {
		writeFlat32Integer(front->header, 0);
		front->header.prepare(1);
		front->header.content[front->header.cursor] = ANY;
	} else if (front->current.front() == LINKLIST || front->current.front() == LINKMAP || front->current.front() == LINKSET) {
		writeVarint(front->data, -2);
		writeVarint(front->data, -1);
	} else if (front->current.front() == EMBEDDEDLIST || front->current.front() == EMBEDDEDSET) {
		front->data.prepare(1);
		front->data.content[front->data.cursor] = ANY;
	}
}

void RecordWriter::endDocument() {
	DocumentWriter *front = writer->nested.front();
	front->popType();
	if (writer->nested.size() > 1) {
		writer->nested.pop_front();
		DocumentWriter *front1 = writer->nested.front();
		int size;
		unsigned char * content = front->writtenContent(&size, front1, front1->data.prepared);
		delete front;
		front1->data.prepare(size);
		memcpy(front1->data.content + front1->data.cursor, content, size);
		delete[] content;
	}
}

const unsigned char * RecordWriter::writtenContent(int * size) {
	return writer->nested.front()->writtenContent(size, 0, 0);
}

void writeString(ContentBuffer & buffer, const char *string) {
	int size = strlen(string);
	writeVarint(buffer, size);
	if (size > 0) {
		buffer.prepare(size);
		memcpy(buffer.content + buffer.cursor, string, size);
	}
}

void writeFlat32Integer(ContentBuffer & buffer, int32_t value) {
	buffer.prepare(4);
	value = htobe32(value);
	memcpy(buffer.content + buffer.cursor, &value, 4);
}

void writeFlat16Integer(ContentBuffer & buffer, int16_t value) {
	buffer.prepare(2);
	value = htobe16(value);
	memcpy(buffer.content + buffer.cursor, &value, 2);
}

void writeFlat64Integer(ContentBuffer & buffer, int64_t value) {
	buffer.prepare(8);
	value = htobe64(value);
	memcpy(buffer.content + buffer.cursor, &value, 8);
}

}
