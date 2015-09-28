#include <nan.h>
#include "orientc_reader.h"
#include "listener.h"
#include <iostream>
using namespace Orient;

union dtb {
	double d;
	long long l;
};
	 void TrackerListener::startDocument(const char * name) {
		this->class_name = strdup(name);
		this->obj = Nan::New<v8::Object>();


		this->obj->Set(Nan::New("@class").ToLocalChecked(), v8::String::New(this->class_name));
	}
	 void TrackerListener::endDocument() {

	}
	 void TrackerListener::startField(const char * name, OType type) {
		this->field_name = strdup(name);
		this->type = type;
	}
	 void TrackerListener::endField(const char * name) {
	}
	 void TrackerListener::stringValue(const char * value) {
			this->obj->Set(Nan::New(this->field_name).ToLocalChecked(), v8::String::New(value));
	}
	 void TrackerListener::intValue(long value) {
	 this->obj->Set(Nan::New(this->field_name).ToLocalChecked(), v8::Number::New(value));
	}
	 void TrackerListener::longValue(long long value) {
	 this->obj->Set(Nan::New(this->field_name).ToLocalChecked(), v8::Number::New(value));
	}
	 void TrackerListener::shortValue(short value) {
	 this->obj->Set(Nan::New(this->field_name).ToLocalChecked(), v8::Number::New(value));
	}
	 void TrackerListener::byteValue(char value) {
	}
	 void TrackerListener::booleanValue(bool value) {
	 this->obj->Set(Nan::New(this->field_name).ToLocalChecked(), v8::Boolean::New(value));
	}
	 void TrackerListener::floatValue(float value) {
		this->obj->Set(Nan::New(this->field_name).ToLocalChecked(), v8::Number::New(value));
	}
	 void TrackerListener::doubleValue(double value) {
	 this->obj->Set(Nan::New(this->field_name).ToLocalChecked(), v8::Number::New(value));
	}
	 void TrackerListener::binaryValue(const char * value, int length) {
	}
	 void TrackerListener::dateValue(long long value) {
	}
	 void TrackerListener::dateTimeValue(long long value) {
	}
	 void TrackerListener::linkValue(struct Link &value) {
	}

	 void TrackerListener::startCollection(int size) {
	}
	 void TrackerListener::startMap(int size) {
	}
	 void TrackerListener::mapKey(const char *key) {
	}
	 void TrackerListener::endMap() {}
	 void TrackerListener::endCollection() {}


	TrackerListener::TrackerListener() :
	class_name(0), field_name(0) {
	}
	TrackerListener::~TrackerListener() {
		free((void *)class_name);
		free((void *)field_name);
	}

