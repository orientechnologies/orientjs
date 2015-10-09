#include "orientc_reader.h"

#include <cstring>
#include "helpers.h"
#include "parse_exception.h"
#include <arpa/inet.h>
#include <endian.h>

namespace Orient {

void readSimpleValue(ContentBuffer &reader, OType type, RecordParseListener & listener);
inline void readValueString(ContentBuffer & reader, RecordParseListener & listener);
void readValueLinkCollection(ContentBuffer & reader, RecordParseListener & listener, OType collType);
void readValueEmbeddedCollection(ContentBuffer & reader, RecordParseListener & listener, OType collType);
void readValueEmbeddedMap(ContentBuffer & reader, RecordParseListener & listener, OType collType);
void readValueLinkMap(ContentBuffer & reader, RecordParseListener & listener, OType collType);
inline void readValueLink(ContentBuffer & reader, RecordParseListener & listener);
void readDocument(ContentBuffer &reader, RecordParseListener & listener);
void readValueRidbag(ContentBuffer &reader, RecordParseListener & listener);
int16_t readFlat16Integer(ContentBuffer & reader);
int32_t readFlat32Integer(ContentBuffer & reader);
int64_t readFlat64Integer(ContentBuffer & reader);
RecordParser::RecordParser(std::string formatter) {
	if (formatter != "ORecordSerializerBinary")
		throw parse_exception("Formatter not supported");
}

void RecordParser::parse(const unsigned char * content, int content_size, RecordParseListener &listener) {
	ContentBuffer reader(content, content_size);
	reader.prepare(1);
	if (reader.content[reader.cursor] != 0)
		throw parse_exception("unsupported version");
	readDocument(reader, listener);
}

void readDocument(ContentBuffer &reader, RecordParseListener & listener) {
	int64_t class_size = readVarint(reader);
	if (class_size != 0) {
		reader.prepare(class_size);
		char * class_name = (char *) reader.content + reader.cursor;
		listener.startDocument(class_name, class_size);
	} else
		listener.startDocument("", 0);
	int64_t size = 0;
	int32_t lastCursor = 0;
	while ((size = readVarint(reader)) != 0) {
		if (size > 0) {
			reader.prepare(size);
			char * field_name = (char *) reader.content + reader.cursor;
			int32_t position = readFlat32Integer(reader);
			reader.prepare(1);
			OType type = (OType) reader.content[reader.cursor];
			listener.startField(field_name, size, type);
			int temp = reader.prepared;
			reader.force_cursor(position);
			readSimpleValue(reader, type, listener);
			lastCursor = reader.prepared;
			reader.force_cursor(temp);
			listener.endField(field_name, size);
		} else {
			throw new parse_exception("property id not supported by network serialization");
		}
	}
	if (lastCursor > reader.prepared)
		reader.force_cursor(lastCursor);
}

void readSimpleValue(ContentBuffer &reader, OType type, RecordParseListener & listener) {

	switch (type) {
	case STRING:
		readValueString(reader, listener);
		break;
	case INTEGER: {
		int64_t value = readVarint(reader);
		listener.intValue(value);
	}
		break;
	case LONG: {
		int64_t value = readVarint(reader);
		listener.longValue(value);
	}
		break;
	case SHORT: {
		int64_t value = readVarint(reader);
		listener.shortValue(value);
	}
		break;
	case BYTE: {
		reader.prepare(1);
		listener.byteValue(reader.content[reader.cursor]);
	}
		break;

	case BOOLEAN: {
		reader.prepare(1);
		listener.booleanValue(reader.content[reader.cursor] != 0);
	}
		break;
	case DATE: {
		int64_t read = readVarint(reader);
		read *= 86400000;
		listener.dateValue(read);
	}
		break;
	case FLOAT: {
		int32_t i_val = readFlat32Integer(reader);
		float fl;
		memcpy(&fl, &i_val, 4);
		listener.floatValue(fl);
	}
		break;
	case DOUBLE: {
		int64_t i_val;
		reader.prepare(8);
		memcpy(&i_val, reader.content + reader.cursor, 8);
		i_val = be64toh(i_val);
		double db;
		memcpy(&db, &i_val, 8);
		listener.doubleValue(db);
	}
		break;
	case DATETIME: {
		int64_t value = readVarint(reader);
		listener.dateTimeValue(value);
	}
		break;
	case LINK: {
		readValueLink(reader, listener);
	}
		break;
	case LINKSET:
	case LINKLIST: {
		readValueLinkCollection(reader, listener, type);
	}
		break;
	case BINARY: {
		int64_t value_size = readVarint(reader);
		reader.prepare(value_size);
		listener.binaryValue((char *) reader.content + reader.cursor, value_size);
	}
		break;
	case EMBEDDEDLIST:
	case EMBEDDEDSET: {
		readValueEmbeddedCollection(reader, listener, type);
	}
		break;
	case EMBEDDEDMAP: {
		readValueEmbeddedMap(reader, listener, type);
	}
		break;
	case LINKMAP: {
		readValueLinkMap(reader, listener, type);
	}
		break;
	case EMBEDDED: {
		readDocument(reader, listener);
	}
		break;
	case LINKBAG: {
		readValueRidbag(reader, listener);
	}
		break;
	default:
		break;
	}

}

void readValueString(ContentBuffer & reader, RecordParseListener & listener) {
	int64_t value_size = readVarint(reader);
	reader.prepare(value_size);
	listener.stringValue((char *) reader.content + reader.cursor, value_size);
}

void readValueLink(ContentBuffer & reader, RecordParseListener & listener) {
	Link link;
	link.cluster = readVarint(reader);
	link.position = readVarint(reader);
	listener.linkValue(link);
}

void readValueLinkCollection(ContentBuffer & reader, RecordParseListener & listener, OType type) {
	int size = readVarint(reader);
	listener.startCollection(size, type);
	while (size-- > 0) {
		//TODO: handle null
		readValueLink(reader, listener);
	}
	listener.endCollection(type);

}
void readValueEmbeddedCollection(ContentBuffer & reader, RecordParseListener & listener, OType collType) {
	int size = readVarint(reader);
	listener.startCollection(size, collType);
	reader.prepare(1);
	OType type = (OType) reader.content[reader.cursor];
	if (ANY == type) {
		while (size-- > 0) {
			reader.prepare(1);
			OType entryType = (OType) reader.content[reader.cursor];
			if (ANY == entryType)
				;	//todo handle null
			else
				readSimpleValue(reader, entryType, listener);
		}
	}
	listener.endCollection(collType);
	//For now else is impossible
}

void readValueEmbeddedMap(ContentBuffer & reader, RecordParseListener & listener, OType mapType) {
	int64_t size = readVarint(reader);
	listener.startMap(size, mapType);
	int32_t lastCursor = 0;
	while (size-- > 0) {
		//Skipping because is everytime string
		reader.prepare(1);
		int key_size = readVarint(reader);
		reader.prepare(key_size);
		char * key_name = (char *) reader.content + reader.cursor;
		listener.mapKey(key_name, key_size);
		long position = readFlat32Integer(reader);
		reader.prepare(1);
		OType type = (OType) reader.content[reader.cursor];
		int temp = reader.prepared;
		reader.force_cursor(position);
		readSimpleValue(reader, type, listener);
		lastCursor = reader.prepared;
		reader.force_cursor(temp);
	}
	listener.endMap(mapType);
	if (lastCursor > reader.prepared)
		reader.force_cursor(lastCursor);
}

void readValueLinkMap(ContentBuffer & reader, RecordParseListener & listener, OType mapType) {
	int64_t size = readVarint(reader);
	listener.startMap(size, mapType);
	while (size-- > 0) {
		//Skipping because is everytime string
		reader.prepare(1);
		int key_size = readVarint(reader);
		reader.prepare(key_size);
		char * key_name = (char *) reader.content + reader.cursor;
		listener.mapKey(key_name, key_size);
		readValueLink(reader, listener);
	}
	listener.endMap(mapType);
}

void readValueRidbag(ContentBuffer & reader, RecordParseListener & listener) {
	reader.prepare(1);
	unsigned char c = reader.content[reader.cursor];
	if ((c & 2) == 2) {
		//UUID
		//Skipping UUID
		readFlat64Integer(reader);
		readFlat64Integer(reader);
	}
	if ((c & 1) == 1) {
		int32_t size = readFlat32Integer(reader);
		listener.startCollection(size, LINKBAG);
		while (size-- > 0) {
			struct Link link;
			link.cluster = readFlat16Integer(reader);
			link.position = readFlat64Integer(reader);
			listener.linkValue(link);
		}
		listener.endCollection(LINKBAG);
	} else {
		long long fileId = readFlat64Integer(reader);
		long long pageIndex = readFlat64Integer(reader);
		long int pageOffset = readFlat32Integer(reader);
		// old data not needed anymore
		readFlat32Integer(reader);
		//changes client side should be everytime 0
		readFlat32Integer(reader);
		listener.ridBagTreeKey(fileId, pageIndex, pageOffset);
	}

}

int64_t readFlat64Integer(ContentBuffer & reader) {
	int64_t value;
	reader.prepare(8);
	memcpy(&value, reader.content + reader.cursor, 8);
	value = be64toh(value);
	return value;
}

int16_t readFlat16Integer(ContentBuffer & reader) {
	int16_t value;
	reader.prepare(2);
	memcpy(&value, reader.content + reader.cursor, 2);
	value = be16toh(value);
	return value;
}

int32_t readFlat32Integer(ContentBuffer & reader) {
	int32_t value;
	reader.prepare(4);
	memcpy(&value, reader.content + reader.cursor, 4);
	value = be32toh(value);
	return value;
}

}

