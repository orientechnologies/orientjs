/*
 * orientc_writer.h
 *
 *  Created on: 22 Jul 2015
 *      Author: tglman
 */

#ifndef SRC_ORIENTC_WRITER_H_
#define SRC_ORIENTC_WRITER_H_
#include <string>
#include "orientc_reader.h"
namespace Orient{

class InternalWriter;


/** Sax style writer for generate serialised version of orientdb formats.
 *
 * This implementation it's not thread safe and cannot be reused.
 *
 */
class RecordWriter {

public:
	/** Create a new instance of the writer with a specific format.
	 *
	 * @param format the name of the format, supported formats are "onet_ser_v0"
	 *
	 */
	RecordWriter(std::string format);

	/** Start a new document with a specified class.
	 *
	 * need to be call for the root and for each embedded document start.
	 *
	 * @param className the name of the class of the document or "" in case of missed class.
	 */
	void startDocument(const char * className);

	/** Start a new collection with a specific size and of a specific type.
	 *
	 * @param size the size of the collection.
	 * @param type is the type of the collection, allowed types are EMBEDDEDSET,EMBEDDEDLIST,LINKSET,LINKLIST,LINKBAG
	 *
	 */
	void startCollection(int size,OType type);

	/**Start a new map wiht a specific size and of a specific type
	 *
	 * balanced with
	 *
	 * @param size the size of the map.
	 * @param type the type of the map, EMBEDDEDMAP, LINKMAP
	 *
	 */
	void startMap(int size,OType type);

	/** Provide the key of a value, should be call before a *Value call.
	 *
	 * @param mapKey the key of the map entry.
	 *
	 */
	void mapKey(const char * mapKey);

	/** Start a new field, Should be call before a *Value call.
	 *
	 * Balanced with endField(const char * name).
	 *
	 * @param name the name of the field.
	 *
	 */
	void startField(const char* name);

	/** End a field.
	 *
	 * Balanced with startField(const char* name)
	 *
	 * @param name the name of the field.
	 *
	 */
	void endField(const char * name);

	/** Write a string value.
	 *
	 * @param value Value to write.
	 *
	 */
	void stringValue(const char * value);

	/** Write a int value.
	 *
	 * @param value Value to write.
	 *
	 */
	void intValue(long value);

	/** Write a long value.
	 *
	 * @param value Value to write.
	 *
	 */
	void longValue(long long value);

	/** Write a short value.
	 *
	 * @param value Value to write.
	 *
	 */
	void shortValue(short value);

	/** Write a byte value.
	 *
	 * @param value Value to write.
	 *
	 */
	void byteValue(char value);

	/** Write a boolean value.
	 *
	 * @param value Value to write.
	 *
	 */
	void booleanValue(bool value);

	/** Write a float value.
	 *
	 * @param value Value to write.
	 *
	 */
	void floatValue(float value);

	/** Write a double value.
	 *
	 * @param value Value to write.
	 *
	 */
	void doubleValue(double value);

	/** Write a binary value.
	 *
	 * @param value Value to write..
	 * @param length the length of the value.
	 *
	 */
	void binaryValue(const char * value, int length);

	/** Write a date value .
	 *
	 * @param value Value to write.
	 *
	 */
	void dateValue(long long value);

	/** Write a datetime value.
	 *
	 * @param value Value to write.
	 *
	 */
	void dateTimeValue(long long value);

	/** Write a link value.
	 *
	 * @param value Value to write.
	 *
	 */
	void linkValue(struct Link & value);

	/** Write a ridbag tree key.
	 *
	 * @param value ridbag tree key.
	 *
	 */
	void ridBagTreeKey(long long fileId,long long pageIndex,long pageOffset);

	/** Write a null value.
	 *
	 */
	void nullValue();

	/** End a map
	 *
	 * Balanced with startMap(int size,OType type);
	 *
	 * @param type the type of the map, EMBEDDEDMAP, LINKMAP
	 */
	void endMap(OType type);

	/** End a collection
	 *
	 * Balanced with startCollection(int size,OType type);
	 *
	 * @param type is the type of the collection, allowed types are EMBEDDEDSET,EMBEDDEDLIST,LINKSET,LINKLIST,LINKBAG
	 *
	 */
	void endCollection(OType type);
	/** End an embedded document or the root document.
	 *
	 */
	void endDocument();

	/**
	 * Return the written content, can be call just after the last endDocument call.
	 *
	 * @param size filled with the size of the record.
	 * @return the bytes result of the write operation.
	 *
	 */
	const unsigned char * writtenContent(int *size);

	/**
	 * free all internal structures.
	 *
	 */
	~RecordWriter();
private:
	InternalWriter *writer;
};


}
#endif /* SRC_ORIENTC_WRITER_H_ */
