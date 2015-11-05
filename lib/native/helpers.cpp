#include "helpers.h"
#include <iostream>
#include <sstream>
#include <stdlib.h>
#include <assert.h>
#include <vector>

#include "parse_exception.h"
namespace Orient {

ContentBuffer::ContentBuffer() :
		content(0), cursor(0), prepared(0), size(0), writing(true) {
	content = new unsigned char[2048];
	size = 2048;
}

ContentBuffer::ContentBuffer(const unsigned char * content, const int content_size) :
		content((unsigned char*) content), cursor(0), prepared(0), size(content_size), writing(false) {
}

void ContentBuffer::prepare(int next) {
	assert(next > 0);
	if (prepared + next > this->size) {
		if (writing) {
			int newSize = size;
			while (prepared + next > newSize)
				newSize *= 2;
			unsigned char * new_content = new unsigned char[newSize];
			std::copy(content, content + size, new_content);
			delete[] content;
			content = new_content;
			size = newSize;
		} else {
			std::stringstream ss;
			ss << "out of content size:" << this->size << " nextCursor:" << prepared + next;
			throw parse_exception(ss.str());
		}
	}
	cursor = prepared;
	prepared += next;
	//std::cout << "cursor:" << cursor << " prepared:" << prepared << " size:" << size << " inwrite:" << writing <<std::endl;
}

ContentBuffer::~ContentBuffer() {
	if (writing)
		delete[] content;
}

void ContentBuffer::force_cursor(int position) {
	if (position > this->size)
		throw parse_exception(" out of content size");
	cursor = position;
	prepared = position;
}

int64_t readVarint(ContentBuffer &reader) {
	int64_t value = 0;
	int32_t i = 0;
	uint64_t b;
	do {
		reader.prepare(1);
		b = (uint64_t) reader.content[reader.cursor];
		if ((b & 0x80) != 0) {
			value |= ((b & 0x7F) << i);
			i += 7;
			if (i > 63) {
				throw "Variable length quantity is too long (must be <= 63)";
			}
		}
	} while ((b & 0x80) != 0);
	value |= b << i;
	int64_t temp = ((((int64_t) value << 63) >> 63) ^ (int64_t) value) >> 1;
	return temp ^ (value & ((int64_t) 1 << 63));
}

void writeVarint(ContentBuffer &reader, int64_t value) {
	uint64_t realValue = (value << (int64_t) 1) ^ (value >> (int64_t) 63);
	while ((realValue & 0xFFFFFFFFFFFFFF80) != 0) {
		reader.prepare(1);
		reader.content[reader.cursor] = (unsigned char) ((realValue & 0x7F) | 0x80);
		realValue >>= 7;
	}
	reader.prepare(1);
	reader.content[reader.cursor] = (unsigned char) ((realValue & 0x7F));
}

}
