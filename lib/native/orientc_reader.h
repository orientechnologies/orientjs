/*
 * orientc_reader.h
 *
 *  Created on: 22 Jul 2015
 *      Author: tglman
 */

#ifndef SRC_ORIENTC_READER_H_
#define SRC_ORIENTC_READER_H_
#include <string>
namespace Orient {

enum OType {
	BOOLEAN =0,
	INTEGER =1,
	SHORT =2,
	LONG =3,
	FLOAT =4,
	DOUBLE =5,
	DATETIME=6,
	STRING=7,
	BINARY=8,
	EMBEDDED=9,
	EMBEDDEDLIST=10,
	EMBEDDEDSET=11,
	EMBEDDEDMAP=12,
	LINK =13,
	LINKLIST=14,
	LINKSET =15,
	LINKMAP =16,
	BYTE = 17,
	TRANSIENT = 18,
	DATE =19,
	CUSTOM = 20,
	DECIMAL = 21,
	LINKBAG = 22,
	ANY = 23
};
struct Link {
	long cluster;
	long long position;
};
/** Sax style record parse listener, extends this class for get the result of the parse operations.
 *
 */
class RecordParseListener {
public:
	/** Called at the start of a document in any case of root and embedded document.
	 *
	 * Balanced with endDocument();
	 *
	 * @param class_name the name of the class
	 * @param class_name_length the number of bytes to consider in the class_name.
	 *
	 */
	virtual void startDocument(const char * class_name, size_t class_name_length)=0;

	/**
	 * Called each time a collection start.
	 *
	 * Balanced with endCollection(OType type);
	 *
	 * @param size the number of element present in the collection.
	 * @param type the type of collection can have as value EMBEDDEDSET,EMBEDDEDLIST,LINKSET,LINKLIST,LINKBAG
	 *
	 */
	virtual void startCollection(int size,OType type)=0;

	/** Called each time a map start.
	 *
	 * Balanced with endMap(OType type);
	 *
	 * @param size the number of values in the map.
	 * @param the type of the map can have as value EMBEDDEDMAP, LINKMAP
	 *
	 */
	virtual void startMap(int size,OType type)=0;

	/** Called for each entry of a map defining the key of the map, before a corresponding *Value() method is called for the value.
	 *
	 * @param key the name of the key
	 * @param key_length the number of bytes to consider as key.
	 *
	 */
	virtual void mapKey(const char * key,size_t key_length)=0;

	/** Called at the start of each fiend found in a document.
	 *
	 * Balanced with endField(const char * name,size_t name_length);
	 *
	 * @param name the name of the filed
	 * @param name_length the number of bytes to consider in the name.
	 * @param type the type of the field can be any OType.
	 *
	 */
	virtual void startField(const char * name,size_t name_length,OType type)=0;

	/** Called after at the end of a field parse.
	 *
	 * Balance with startField(const char * name,size_t name_length,OType type)
	 *
	 * @param name the name of the field.
	 * @param name_length the number of bytes to consider as name.
	 *
	 */
	virtual void endField(const char * name,size_t name_length)=0;

	/** Called each time is found a string value.
	 *
	 * @param value the value.
	 * @param value_length the number of bytes to consider as value.
	 *
	 */
	virtual void stringValue(const char * value ,size_t value_length)=0;

	/** Called each time is found a int value.
	 *
	 * @param value the value.
	 */
	virtual void intValue(long value)=0;

	/** Called each time is found a long value.
	 *
	 * @param value the value.
	 */
	virtual void longValue(long long value)=0;

	/** Called each time is found a short value.
	 *
	 * @param value the value.
	 */
	virtual void shortValue(short value)=0;

	/** Called each time is found a bye value.
	 *
	 * @param value the value.
	 */
	virtual void byteValue(char value)=0;

	/** Called each time is found a boolean value.
	 *
	 * @param value the value.
	 */
	virtual void booleanValue(bool value)=0;

	/** Called each time is found a float value.
	 *
	 * @param value the value.
	 */
	virtual void floatValue(float value)=0;

	/** Called each time is found a double value.
	 *
	 * @param value the value.
	 */
	virtual void doubleValue(double value)=0;

	/** Called each time is found a binary value.
	 *
	 * @param value the value.
	 * @param value_length the number of bytes to consider as value.
	 *
	 */
	virtual void binaryValue(const char * value, int length)=0;

	/** Called each time is found a date value.
	 *
	 * @param value the value as UTC.
	 */
	virtual void dateValue(long long value)=0;

	/** Called each time is found a date time value.
	 *
	 * @param value the value as UTC.
	 */
	virtual void dateTimeValue(long long value)=0;

	/** Called each time is found a link value.
	 *
	 * @param value a link structure that contains cluster and position.
	 */
	virtual void linkValue(struct Link & value)=0;

	/** Called each time is found a ridbag tree value.
	 *
	 * @param fileId the tree fileId.
	 * @param pageIndex the tree pageIndex.
	 * @param pageOffset the tree pageOffeset.
	 */
	virtual void ridBagTreeKey(long long fileId,long long pageIndex,long pageOffset)=0;

	/** Called each time if found a null value.
	 *
	 */
	virtual void nullValue()=0;

	/** Called at the end of a map parse.
	 *
	 * Balance with startMap(int size,OType type);
	 *
	 * @param type the type of the map can have as value EMBEDDEDMAP, LINKMAP
	 *
	 */
	virtual void endMap(OType type)=0;

	/** Called at the edn of a collection parse
	 *
	 * Balance with startCollection(int size,OType type);
	 *
	 * @param type he type of collection can have as value EMBEDDEDSET,EMBEDDEDLIST,LINKSET,LINKLIST,LINKBAG
	 *
	 */
	virtual void endCollection(OType type)=0;

	/** Called at the end of a document for root and embedded documents.
	 *
	 */
	virtual void endDocument()=0;

	/**/
	virtual ~RecordParseListener() {}
};


/** Sax style perser for parse record in orientdb serialization formats
 *
 * this instance can be reused.
 *
 */
class RecordParser {
public:
	/** create the instance of the parser with the format
	 *
	 *
	 * @param format the name of the format supported formats are "onet_ser_v0"
	 */
	RecordParser(std::string format);


	/**
	 * Synchronous call for parse a record, the values are passed to the listener as collbacks.
	 *
	 * @param content the raw stream of the record.
	 * @param content_size the number of bytes to read from the content.
	 * @param listener will receive the call for each value found in the record.
	 *
	 */
	void parse(const unsigned char * content,int content_size, RecordParseListener & listener);

};

}
#endif /* SRC_ORIENTC_READER_H_ */
