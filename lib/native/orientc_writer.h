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

class RecordWriter {

public:
	RecordWriter(std::string format);
	void startDocument(const char * className);
	void startCollection(int size);
	void startMap(int size);
	void mapKey(char * mapKey);
	void startField(const char * name,OType type);
	void endField(const char * name,OType type);
	void stringValue(const char * value);
	void intValue(long value);
	void longValue(long long value);
	void shortValue(short value);
	void byteValue(char value);
	void booleanValue(bool value);
	void floatValue(float value);
	void doubleValue(double value);
	void binaryValue(const char * value, int length);
	void dateValue(long long value);
	void dateTimeValue(long long value);
	void linkValue(struct Link & value);
	void endMap();
	void endCollection();
	void endDocument();
	const char * writtenContent(int *size);
	~RecordWriter();
private:
	InternalWriter *writer;
};

}
#endif /* SRC_ORIENTC_WRITER_H_ */
