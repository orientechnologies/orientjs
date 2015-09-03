#include <nan.h>
#include "orientc.h"
#include "listener.h"

void Deserialize(const Nan::FunctionCallbackInfo<v8::Value>& info){

  v8::String::Utf8Value val(info[0]->ToString());
  const char * content = * val;

  Orient::RecordParser reader("ORecordSerializerBinary");

  TrackerListener listener;


  reader.parse((char*)content,info[0]->ToString()->Utf8Length(),listener);


  info.GetReturnValue().Set(listener.obj);
}

void Init(v8::Local<v8::Object> exports,v8::Local<v8::Object> module) {
  exports->Set(Nan::New("deserialize").ToLocalChecked(),
        Nan::New<v8::FunctionTemplate>(Deserialize)->GetFunction());
}

NODE_MODULE(deserializer, Init)