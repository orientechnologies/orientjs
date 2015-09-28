#include <nan.h>
#include "orientc.h"
#include "listener.h"
#include <iostream>

void Deserialize(const Nan::FunctionCallbackInfo<v8::Value>& info){
  
  int len =node::Buffer::Length(info[0]);
  char * content =  node::Buffer::Data(info[0]);

  Orient::RecordParser reader("ORecordSerializerBinary");

  TrackerListener listener;
  reader.parse((unsigned char *)content,len,listener);

  info.GetReturnValue().Set(listener.obj);
}

void Init(v8::Local<v8::Object> exports,v8::Local<v8::Object> module) {
  exports->Set(Nan::New("deserialize").ToLocalChecked(),
        Nan::New<v8::FunctionTemplate>(Deserialize)->GetFunction());
}

NODE_MODULE(deserializer, Init)
