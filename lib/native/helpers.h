#include <iostream>

namespace Orient {

class ContentBuffer {
public:
	ContentBuffer();
	ContentBuffer(char * content, const int content_size);
	void prepare(int next);
	void force_cursor(int position);
	char *content;
	int cursor;
	int prepared;
	~ContentBuffer();
private:
	int size;
	bool writing;
};

long long readVarint(ContentBuffer &reader);

void writeVarint(ContentBuffer &reader,long long value);


}  // namespace Orient
