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

	if(name_length > 0)
		this->stack.front()->Set(Nan::New("@class").ToLocalChecked(), v8::String::New(name,name_length));
	this->stack.front()->Set(Nan::New("@type").ToLocalChecked(), v8::String::New("d"));
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
	setValue(v8::Number::New(value));
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
	v8::Local<v8::Object> cur = Nan::New<v8::Object>();
	cur->Set(Nan::New("cluster").ToLocalChecked(), v8::Number::New(value.cluster));
	cur->Set(Nan::New("position").ToLocalChecked(), v8::Number::New(value.position));
	v8::Handle<v8::Value> handles[1];
	handles[0] = cur;
	setValue(ridFactory->NewInstance(1,handles));
}

void TrackerListener::startCollection(int size,OType type) {
	v8::Local<v8::Object> cur = v8::Array::New();
	if(type == LINKBAG) {
		v8::Handle<v8::Value> handles[1];
		handles[0] = v8::Null();
		v8::Local<v8::Object> bag = bagFactory->NewInstance(1,handles);
		bag->Set(Nan::New("_content").ToLocalChecked(), cur);
		bag->Set(Nan::New("_type").ToLocalChecked(), v8::Number::New(0));
		bag->Set(Nan::New("_size").ToLocalChecked(), v8::Number::New(size));
		setValue(bag);
	} else
  		setValue(cur);
	this->stack.push_front(cur);
}

void TrackerListener::startMap(int size,OType type) {
	v8::Local<v8::Object> cur = Nan::New<v8::Object>();
	setValue(cur);
	this->stack.push_front(cur);
}

void TrackerListener::mapKey(const char *key,size_t key_size) {
	this->field_name = v8::String::New(key,key_size);
}

void TrackerListener::ridBagTreeKey(long long fileId,long long pageIndex,long pageOffset) {
}

void TrackerListener::nullValue() {
	setValue(v8::Null());
}

void TrackerListener::endMap(OType type) {
	this->stack.pop_front();
}

void TrackerListener::endCollection(OType type) {
	this->stack.pop_front();
}

void TrackerListener::setValue(v8::Handle<v8::Value> value) {
	if(this->stack.front()->IsArray()){
		v8::Local<v8::Array> arr = v8::Array::Cast(*this->stack.front());
		arr->Set(arr->Length(),value);
	} else this->stack.front()->Set(this->field_name, value);
}


TrackerListener::TrackerListener(v8::Local<v8::Function> ridFactory ,v8::Local<v8::Function > bagFactory ):ridFactory(ridFactory),bagFactory(bagFactory) {
}

TrackerListener::~TrackerListener() {
}

