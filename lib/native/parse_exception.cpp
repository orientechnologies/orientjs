/*
 * ParseException.cpp
 *
 *  Created on: 5 Aug 2015
 *      Author: tglman
 */

#include "parse_exception.h"

namespace Orient {

parse_exception::parse_exception(const std::string message) :
		message(message) {

}

const char* parse_exception::what() const throw () {
	return message.c_str();
}

parse_exception::~parse_exception() throw () {
}

}
