#include "helpers.h"
#include <iostream>
#include <sstream>
#include <stdlib.h>
#include <assert.h>

#include "parse_exception.h"
namespace Orient {

ContentBuffer::ContentBuffer() :
		content(0), cursor(0), prepared(0), size(0), writing(true) {
	content = reinterpret_cast<char *>(malloc(2048));
	size = 2048;
}

ContentBuffer::ContentBuffer(char * content, const int content_size) :
		content(content), cursor(0), prepared(0), size(content_size), writing(false) {
}

void ContentBuffer::prepare(int next) {
	assert(next > 0);
	if (prepared + next > this->size) {
		if (writing) {
			char * new_content = reinterpret_cast<char *>(realloc(content, size * 2));
			if (new_content == 0)
				throw parse_exception("out of memory");
			content = new_content;
			size *= 2;
			std::cout << "reallocated" << std::endl;
		} else {
			std::stringstream ss;
			ss<<"out of content size:"<<this->size<<" nextCursor:"<<prepared + next;
			throw parse_exception(ss.str());
		}
	}
	cursor = prepared;
	prepared += next;
	//std::cout << "cursor:" << cursor << " prepared:" << prepared << " size:" << size << " inwrite:" << writing << "\n";
}

ContentBuffer::~ContentBuffer() {
	if (writing)
		free(content);
}

void ContentBuffer::force_cursor(int position) {
	if (position > this->size)
		throw " out of content size";
	cursor = position;
	prepared = position;
}

long long readVarint(ContentBuffer &reader) {
	long long value = 0;
	int i = 0;
	unsigned long long b;
	do {
		reader.prepare(1);
		b = reader.content[reader.cursor];
		if ((b & 0x80) != 0) {
			value |= ((b & 0x7F) << i);
			i += 7;
			if (i > 63) {
				throw "Variable length quantity is too long (must be <= 63)";
			}
		}
	} while ((b & 0x80) != 0);
	value |= b << i;
	long long temp = ((((long long) value << 63) >> 63) ^ (long long) value) >> 1;
	return temp ^ (value & ((long long) 1 << 63));
}

void writeVarint(ContentBuffer &reader, long long value) {
	unsigned long long realValue = (value << (long long) 1) ^ (value >> (long long) 63);
	while ((realValue & 0xFFFFFFFFFFFFFF80) != 0) {
		reader.prepare(1);
		reader.content[reader.cursor] = (unsigned char) ((realValue & 0x7F) | 0x80);
		realValue >>= 7;
	}
	reader.prepare(1);
	reader.content[reader.cursor] = (unsigned char) ((realValue & 0x7F));
}

}
