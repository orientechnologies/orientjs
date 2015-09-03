/*
 * ParseException.h
 *
 *  Created on: 5 Aug 2015
 *      Author: tglman
 */

#ifndef SRC_PARSE_EXCEPTION_H_
#define SRC_PARSE_EXCEPTION_H_

#include <exception>
#include <string>
namespace Orient {

class parse_exception : public std::exception {
public:
	parse_exception(const std::string message);
	virtual const char* what() const throw();
	virtual ~parse_exception() throw();
private:
	std::string message;
};

}
#endif /* SRC_PARSE_EXCEPTION_H_ */
