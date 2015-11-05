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
		this->stack.front()->Set(Nan::New("@class").ToLocalChecked(), Nan::New(name,name_length).ToLocalChecked());
	this->stack.front()->Set(Nan::New("@type").ToLocalChecked(), Nan::New("d").ToLocalChecked());
}

void TrackerListener::endDocument() {
	this->stack.pop_front();
}

void TrackerListener::startField(const char * name,size_t name_length, OType type) {
	this->field_name = Nan::New(name,name_length).ToLocalChecked();
	this->type = type;
}

void TrackerListener::endField(const char * name,size_t name_length) {
}

void TrackerListener::stringValue(const char * value,size_t value_length) {
	setValue(Nan::New(value,value_length).ToLocalChecked());
}

void TrackerListener::intValue(long value) {
	setValue(Nan::New<v8::Number>(value));
}

void TrackerListener::longValue(long long value) {
	setValue(Nan::New<v8::Number>(value));
}

void TrackerListener::shortValue(short value) {
	setValue(Nan::New(value));
}

void TrackerListener::byteValue(char value) {
	setValue(Nan::New(value));
}

void TrackerListener::booleanValue(bool value) {
	setValue(Nan::New(value));
}

void TrackerListener::floatValue(float value) {
	setValue(Nan::New(value));
}

void TrackerListener::doubleValue(double value) {
	setValue(Nan::New<v8::Number>(value));
}

void TrackerListener::binaryValue(const char * value, int length) {
	setValue(Nan::NewBuffer((char *)value,length).ToLocalChecked());
}

void TrackerListener::dateValue(long long value) {
	setValue(Nan::New<v8::Date>(value).ToLocalChecked());
}

void TrackerListener::dateTimeValue(long long value) {
	setValue(Nan::New<v8::Date>(value).ToLocalChecked());
}

void TrackerListener::linkValue(struct Link &value) {
	v8::Local<v8::Object> cur = Nan::New<v8::Object>();
	cur->Set(Nan::New("cluster").ToLocalChecked(),Nan::New<v8::Number>(value.cluster));
	cur->Set(Nan::New("position").ToLocalChecked(), Nan::New<v8::Number>(value.position));
	v8::Handle<v8::Value> handles[1];
	handles[0] = cur;
	setValue(ridFactory->NewInstance(1,handles));
}

void TrackerListener::startCollection(int size,OType type) {
	v8::Local<v8::Object> cur = Nan::New<v8::Array>();
	if(type == LINKBAG && useRidBag) {
		v8::Handle<v8::Value> handles[1];
		handles[0] = Nan::Null();
		v8::Local<v8::Object> bag = bagFactory->NewInstance(1,handles);
		bag->Set(Nan::New("_content").ToLocalChecked(), cur);
		bag->Set(Nan::New("_type").ToLocalChecked(), Nan::New<v8::Number>(0));
		bag->Set(Nan::New("_size").ToLocalChecked(), Nan::New<v8::Number>(size));
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
	this->field_name = Nan::New(key,key_size).ToLocalChecked();
}

void TrackerListener::ridBagTreeKey(long long fileId,long long pageIndex,long pageOffset) {
	v8::Handle<v8::Value> handles[1];
	handles[0] = Nan::Null();
	v8::Local<v8::Object> bag = bagFactory->NewInstance(1,handles);
	bag->Set(Nan::New("_type").ToLocalChecked(), Nan::New<v8::Number>(1));
	bag->Set(Nan::New("_fileId").ToLocalChecked(), Nan::New<v8::Number>(fileId));
	bag->Set(Nan::New("_pageIndex").ToLocalChecked(), Nan::New<v8::Number>(pageIndex));
	bag->Set(Nan::New("_pageOffset").ToLocalChecked(), Nan::New<v8::Number>(pageOffset));
	bag->Set(Nan::New("_size").ToLocalChecked(), Nan::New<v8::Number>(0));
	//TODO: check if the value is set in the correct place
	setValue(bag);
}

void TrackerListener::nullValue() {
	setValue(Nan::Null());
}

void TrackerListener::endMap(OType type) {
	this->stack.pop_front();
}

void TrackerListener::endCollection(OType type) {
	this->stack.pop_front();
}

void TrackerListener::setValue(v8::Handle<v8::Value> value) {
	if(this->stack.front()->IsArray()){
		v8::Local<v8::Array> arr = v8::Local<v8::Array>::Cast(this->stack.front());
		arr->Set(arr->Length(),value);
	} else this->stack.front()->Set(this->field_name, value);
}


TrackerListener::TrackerListener(v8::Local<v8::Function> ridFactory ,v8::Local<v8::Function > bagFactory, bool useRidBag):ridFactory(ridFactory),bagFactory(bagFactory),useRidBag(useRidBag) {
}

TrackerListener::~TrackerListener() {
}

