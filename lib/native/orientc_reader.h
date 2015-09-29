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
	RIDBAG = 22,
	ANY = 23
};
struct Link {
	long cluster;
	long long position;
};

class RecordParseListener {
public:
	virtual void startDocument(const char * class_name, size_t class_name_length)=0;
	virtual void startCollection(int size)=0;
	virtual void startMap(int size)=0;
	virtual void mapKey(const char * key,size_t key_length)=0;
	virtual void startField(const char * name,size_t name_length,OType type)=0;
	virtual void endField(const char * name,size_t name_length)=0;
	virtual void stringValue(const char * value ,size_t value_lenght)=0;
	virtual void intValue(long value)=0;
	virtual void longValue(long long value)=0;
	virtual void shortValue(short value)=0;
	virtual void byteValue(char value)=0;
	virtual void booleanValue(bool value)=0;
	virtual void floatValue(float value)=0;
	virtual void doubleValue(double value)=0;
	virtual void binaryValue(const char * value, int length)=0;
	virtual void dateValue(long long value)=0;
	virtual void dateTimeValue(long long value)=0;
	virtual void linkValue(struct Link & value)=0;
	virtual void endMap()=0;
	virtual void endCollection()=0;
	virtual void endDocument()=0;
	virtual ~RecordParseListener() {}
};

class RecordParser {
public:
	RecordParser(std::string format);
	void parse(const unsigned char * content,int content_size, RecordParseListener & listener);

};

}
#endif /* SRC_ORIENTC_READER_H_ */
