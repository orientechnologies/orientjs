#include "orientc_reader.h"

#include <malloc/malloc.h>
#include <cstring>
#include "helpers.h"
#include "parse_exception.h"

namespace Orient {

union ftl {
	float fl;
	char bytes[4];
};

union dtll {
	double db;
	char bytes[8];
};

void readSimpleValue(ContentBuffer &reader, OType type, RecordParseListener & listener);
void readString(ContentBuffer & reader, char * str, int size);
void readValueString(ContentBuffer & reader, RecordParseListener & listener);
void readValueLinkCollection(ContentBuffer & reader, RecordParseListener & listener);
void readValueEmbeddedCollection(ContentBuffer & reader, RecordParseListener & listener);
void readValueEmbeddedMap(ContentBuffer & reader, RecordParseListener & listener);
void readValueLink(ContentBuffer & reader, RecordParseListener & listener);
void readDocument(ContentBuffer &reader, RecordParseListener & listener);
long readFlat32Integer(ContentBuffer & reader);

RecordParser::RecordParser(std::string formatter) {
	if (formatter != "ORecordSerializerBinary")
		throw parse_exception("Formatter not supported");
}

void RecordParser::parse(char * content, int content_size, RecordParseListener &listener) {
	ContentBuffer reader(content, content_size);
	reader.prepare(1);
	if (reader.content[reader.cursor] != 0)
		throw parse_exception("unsupported version");
	readDocument(reader, listener);
}

void readDocument(ContentBuffer &reader, RecordParseListener & listener) {
	long long class_size = readVarint(reader);
	char * class_name = reinterpret_cast<char *>(malloc(class_size + 1));
	readString(reader, class_name, class_size);
	listener.startDocument(class_name);
	free(class_name);
	long long size = 0;
	while ((size = readVarint(reader)) != 0) {
		if (size > 0) {
			char * field_name = reinterpret_cast<char *>(malloc(size + 1));
			readString(reader, field_name, size);
			long position = readFlat32Integer(reader);
			reader.prepare(1);
			OType type = (OType) reader.content[reader.cursor];
			listener.startField(field_name, type);
			int temp = reader.prepared;
			reader.force_cursor(position);
			readSimpleValue(reader, type, listener);
			reader.force_cursor(temp);
			listener.endField(field_name);
			//std::cout << "read field:" << field_name << "position" << position << std::endl;
			free(field_name);
		} else {
			// god sake
		}
	}
}

void readSimpleValue(ContentBuffer &reader, OType type, RecordParseListener & listener) {

	switch (type) {
	case STRING:
		readValueString(reader, listener);
		break;
	case INTEGER: {
		long long value = readVarint(reader);
		listener.intValue(value);
	}
		break;
	case LONG: {
		long long value = readVarint(reader);
		listener.longValue(value);
	}
		break;
	case SHORT: {
		long long value = readVarint(reader);
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
		long long read = readVarint(reader);
		read *= 86400000;
		listener.dateValue(read);
	}
		break;
	case FLOAT: {
		union ftl tran;
		reader.prepare(4);
		memcpy(tran.bytes, reader.content + reader.cursor, 4);
		listener.floatValue(tran.fl);
	}
		break;
	case DOUBLE: {
		union dtll tran2;
		reader.prepare(8);
		memcpy(tran2.bytes, reader.content + reader.cursor, 8);
		listener.doubleValue(tran2.db);
	}
		break;
	case DATETIME: {
		long long value = readVarint(reader);
		listener.dateTimeValue(value);
	}
		break;
	case LINK: {
		readValueLink(reader, listener);
	}
		break;
	case LINKSET:
	case LINKLIST: {
		readValueLinkCollection(reader, listener);
	}
		break;
	case BINARY: {
		long long value_size = readVarint(reader);
		char * value = reinterpret_cast<char *>(malloc(value_size + 1));
		reader.prepare(value_size);
		memcpy(value, reader.content + reader.cursor, value_size);
		listener.binaryValue(value, value_size);
		free(value);
	}
		break;
	case EMBEDDEDLIST:
	case EMBEDDEDSET: {
		readValueEmbeddedCollection(reader, listener);
	}
		break;
	case EMBEDDEDMAP: {
		readValueEmbeddedMap(reader, listener);
	}
		break;
	case EMBEDDED: {
		readDocument(reader, listener);
	}
		break;
	default:
		break;
	}

}

void readValueString(ContentBuffer & reader, RecordParseListener & listener) {
	long long value_size = readVarint(reader);
	char * value = reinterpret_cast<char *>(malloc(value_size + 1));
	readString(reader, value, value_size);
	listener.stringValue(value);
	free(value);
}

void readValueLink(ContentBuffer & reader, RecordParseListener & listener) {
	Link link;
	link.cluster = readVarint(reader);
	link.position = readVarint(reader);
	listener.linkValue(link);
}

void readValueLinkCollection(ContentBuffer & reader, RecordParseListener & listener) {
	int size = readVarint(reader);
	listener.startCollection(size);
	while (size-- > 0) {
		//TODO: handle null
		readValueLink(reader, listener);
	}
	listener.endCollection();

}
void readValueEmbeddedCollection(ContentBuffer & reader, RecordParseListener & listener) {
	int size = readVarint(reader);
	listener.startCollection(size);
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
	listener.endCollection();
	//For now else is impossible
}

void readValueEmbeddedMap(ContentBuffer & reader, RecordParseListener & listener) {
	long long size = readVarint(reader);
	listener.startMap(size);
	while (size-- > 0) {
		reader.prepare(1);
		int nameSize = readVarint(reader);
		char * field_name = reinterpret_cast<char *>(malloc(nameSize + 1));
		readString(reader, field_name, nameSize);
		long position = readFlat32Integer(reader);
		reader.prepare(1);
		OType type = (OType) reader.content[reader.cursor];
		listener.mapKey(field_name);
		int temp = reader.prepared;
		reader.force_cursor(position);
		readSimpleValue(reader, type, listener);
		reader.force_cursor(temp);
		//listener.endField(field_name);
		//std::cout << "read field:" << field_name << "position" << position << std::endl;
		free(field_name);
	}
	listener.endMap();
}

void readString(ContentBuffer & reader, char * str, int size) {
	reader.prepare(size);
	memcpy(str, reader.content + reader.cursor, size);
	str[size] = 0;
}

long readFlat32Integer(ContentBuffer & reader) {
	long value = 0;
	reader.prepare(4);
	value |= ((long) 0xff & reader.content[reader.cursor]) << 24;
	value |= ((long) 0xff & reader.content[reader.cursor + 1]) << 15;
	value |= ((long) 0xff & reader.content[reader.cursor + 2]) << 8;
	value |= ((long) 0xff & reader.content[reader.cursor + 3]);
	return value;

}

}

