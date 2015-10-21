#include <iostream>
#include <stdint.h>
namespace Orient {

class ContentBuffer {
public:
	ContentBuffer();
	ContentBuffer(const unsigned char * content, const int content_size);
	void prepare(int next);
	void force_cursor(int position);
	unsigned char *content;
	int cursor;
	int prepared;
	int size;
	~ContentBuffer();
private:
	bool writing;
};

int64_t readVarint(ContentBuffer &reader);

void writeVarint(ContentBuffer &reader,int64_t value);


}  // namespace Orient
