#include "writer.h"
#include <math.h>

void writeMap(v8::Local<v8::Object> toWrite, Orient::RecordWriter & writer);
void writeArray(v8::Local<v8::Array> toWrite, Orient::RecordWriter & writer);
void writeValue(v8::Local<v8::Value> value, Orient::RecordWriter & writer);

void writeObject(v8::Local<v8::Object> toWrite,Orient::RecordWriter & writer){

	v8::Local<v8::String> classKey = v8::String::New("@type");
	if(toWrite->Has(classKey)){
		v8::Local<v8::String> clazz = toWrite->Get(classKey)->ToString();
		v8::String::Utf8Value clazzVal(clazz);
		writer.startDocument(*clazzVal);
	} else {
		writer.startDocument("");
	}
	v8::Local<v8::Array> properties = toWrite->GetPropertyNames();
	unsigned int  i;
	for(i = 0; i< properties->Length() ; i ++){
		v8::Local<v8::String> name = v8::String::Cast(*properties->Get(i));
		v8::String::Utf8Value val(name);
		writer.startField(*val);
		v8::Local<v8::Value> value = toWrite->Get(name);
		writeValue(value,writer);
		writer.endField(*val);
	}
}


void writeValue(v8::Local<v8::Value> value, Orient::RecordWriter & writer) {

	if(value->IsString()){
		v8::String::Utf8Value sval(value->ToString());
		writer.stringValue(*sval);
	} else if (value->IsInt32()){
		writer.intValue(value->ToInt32()->Value());
	} else if (value->IsNumber()){
		v8::Local<v8::Number> num = value->ToNumber();
		double val = num->Value();
		if(ceil(val) != 0 )
			writer.doubleValue(val);
		else
			writer.longValue(val);
	} else if (value->IsDate()){
		long long int date= v8::Date::Cast(*value)->NumberValue();
		writer.dateTimeValue(date);
	} else if (value->IsNull()){
		writer.nullValue();
	} else if (value->IsBoolean()){
		writer.booleanValue(value->ToBoolean()->Value());
	} else if (value->IsArray()){
		writeArray(v8::Array::Cast(*value), writer);
	} else if (value->IsObject()){
		v8::Local<v8::String> typeKey = v8::String::New("@type");
		//TODO: check if replace with RecordID prototype check
		v8::Local<v8::String> clusterKey = v8::String::New("cluster");
		v8::Local<v8::String> positionKey = v8::String::New("position");
		v8::Local<v8::String> dVal = v8::String::New("d");
		v8::Local<v8::Object> obj = value->ToObject();
		if(obj->Has(typeKey) && obj->Get(typeKey)->Equals(dVal)){
			writeObject(obj,writer);
		} else if(obj->Has(clusterKey) && obj->Has(positionKey)){
			struct Orient::Link lnk;
			lnk.cluster = obj->Get(clusterKey)->ToNumber()->Value();
			lnk.position = obj->Get(positionKey)->ToNumber()->Value();
			writer.linkValue(lnk);
		} else {
			writeMap(obj,writer);
		}	
	}
}


void writeMap(v8::Local<v8::Object> toWrite, Orient::RecordWriter & writer) {
	v8::Local<v8::Array> properties = toWrite->GetPropertyNames();
	unsigned int  i;
	writer.startMap(properties->Length(),Orient::EMBEDDEDMAP);
	for(i = 0; i< properties->Length() ; i ++){
		v8::Local<v8::String> name = v8::String::Cast(*properties->Get(i));
		v8::String::Utf8Value val(name);
		writer.mapKey(*val);
		v8::Local<v8::Value> value = toWrite->Get(name);
		writeValue(value,writer);
	}
	writer.endMap(Orient::EMBEDDEDMAP);
}


void writeArray(v8::Local<v8::Array> toWrite, Orient::RecordWriter & writer){
	unsigned int  i;
	writer.startCollection(toWrite->Length(),Orient::EMBEDDEDLIST);
	for(i = 0; i< toWrite->Length() ; i ++){
		v8::Local<v8::Value> value = toWrite->Get(i);
		writeValue(value,writer);
	}
	writer.endCollection(Orient::EMBEDDEDLIST);
}


