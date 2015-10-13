#ifndef WRITER_H
#define WRITER_H

#include "orientc_writer.h"
#include <nan.h>

void writeObject(v8::Local<v8::Object> toWrite,Orient::RecordWriter & writer); 



#endif



