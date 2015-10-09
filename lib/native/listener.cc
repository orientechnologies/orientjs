#include <nan.h>

#include "orientc_reader.h"
#include "listener.h"
#include <iostream>
using namespace Orient;


void TrackerListener::startDocument(const char * name,size_t name_length) {
	v8::Local<v8::Object> cur = Nan::New<v8::Object>();
	if(!stack.empty()) {
		setValue(cur);
	} else
		obj = cur;
	this->stack.push_front(cur);

	this->stack.front()->Set(Nan::New("@class").ToLocalChecked(), v8::String::New(name,name_length));
}

void TrackerListener::endDocument() {
	this->stack.pop_front();
}

void TrackerListener::startField(const char * name,size_t name_length, OType type) {
	this->field_name = v8::String::New(name,name_length);
	this->type = type;
}

void TrackerListener::endField(const char * name,size_t name_length) {
}

void TrackerListener::stringValue(const char * value,size_t value_length) {
	setValue(v8::String::New(value,value_length));
}

void TrackerListener::intValue(long value) {
	setValue(v8::Number::New(value));
}

void TrackerListener::longValue(long long value) {
	setValue(v8::Number::New(value));
}

void TrackerListener::shortValue(short value) {
	setValue(v8::Number::New(value));
}

void TrackerListener::byteValue(char value) {
}

void TrackerListener::booleanValue(bool value) {
	setValue(v8::Boolean::New(value));
}

void TrackerListener::floatValue(float value) {
	setValue(v8::Number::New(value));
}

void TrackerListener::doubleValue(double value) {
	setValue(v8::Number::New(value));
}

void TrackerListener::binaryValue(const char * value, int length) {
	node::Buffer * buffer =  node::Buffer::New(value,length);
	setValue(buffer->handle_);
}

void TrackerListener::dateValue(long long value) {
	setValue(v8::Date::New(value));
}

void TrackerListener::dateTimeValue(long long value) {
	setValue(v8::Date::New(value));
}

void TrackerListener::linkValue(struct Link &value) {
}

void TrackerListener::startCollection(int size,OType type) {
}

void TrackerListener::startMap(int size,OType type) {
	v8::Local<v8::Object> cur = Nan::New<v8::Object>();
	if(!stack.empty()) {
		setValue(cur);
	}
	this->stack.push_front(cur);
}

void TrackerListener::mapKey(const char *key,size_t key_size) {
}
void ridBagTreeKey(long long fileId,long long pageIndex,long pageOffset) {
}
void TrackerListener::endMap(OType type) {
	this->stack.pop_front();
}
void TrackerListener::endCollection(OType type) {}

void TrackerListener::setValue(v8::Handle<v8::Value> value) {
	this->stack.front()->Set(this->field_name, value);
}


TrackerListener::TrackerListener() {
}

TrackerListener::~TrackerListener() {
}

