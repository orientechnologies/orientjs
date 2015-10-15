#include <nan.h>
#include "orientc.h"
#include "listener.h"
#include "writer.h"
#include <iostream>

void Deserialize(const Nan::FunctionCallbackInfo<v8::Value>& info){
  
  int len =node::Buffer::Length(info[0]);
  char * content =  node::Buffer::Data(info[0]);

  
  Orient::RecordParser reader("ORecordSerializerBinary");

  v8::Local<v8::Function> ridFactory= v8::Function::Cast(*info[1]);
  v8::Local<v8::Function> bagFactory= v8::Function::Cast(*info[2]);
  TrackerListener listener(ridFactory,bagFactory);
  reader.parse((unsigned char *)content,len,listener);


  info.GetReturnValue().Set(listener.obj);
}


void Serialize(const Nan::FunctionCallbackInfo<v8::Value>& info){
  v8::Local<v8::Object> toWrite = v8::Object::Cast(*info[0]);
  Orient::RecordWriter writer("ORecordSerializerBinary");

  writeObject(toWrite,writer);
  int size=0;
  const unsigned char * content = writer.writtenContent(&size);
  v8::Local<node::Buffer> handle = node::Buffer::New((const char *)content,size);
  v8::Local<v8::Value> value = *handle->handle_;
  info.GetReturnValue().Set(value);
}

void Init(v8::Local<v8::Object> exports,v8::Local<v8::Object> module) {
  exports->Set(Nan::New("deserialize").ToLocalChecked(),
        Nan::New<v8::FunctionTemplate>(Deserialize)->GetFunction());
  exports->Set(Nan::New("serialize").ToLocalChecked(),
        Nan::New<v8::FunctionTemplate>(Serialize)->GetFunction());
}

NODE_MODULE(deserializer, Init)
