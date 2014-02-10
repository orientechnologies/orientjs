"use strict";

var util			= require("util"),
    base			= require("./CommandBase"),
    parser			= require("../connection/parser"),
    OperationTypes	= require("./operation_types"),

    command = function() {
        base.call(this);

        this.steps.push(readDatabaseList);
    };

util.inherits(command, base);

module.exports		= command;
command.operation	= OperationTypes.REQUEST_DB_LIST;

function readDatabaseList(buf, offset) {
    if (!parser.canReadBytes(buf, offset)) {
        return 0;
    }

	var list	= [];
	var d		= '';
    var content	= parser.readBytes(buf, offset);
	var tmp		= content.toString().split(':');

	if(tmp.length > 2) {
		var t	= tmp.shift();

		if(t === 'databases') {
			d	= tmp.join(':');
			d	= JSON.parse(d);

			for(var k in d) {
				var obj		= {};
				obj.name	= k;
				obj.path	= d[k];
				list.push(obj);
			}
		}
	}

	this.result	= list;
	this.step++;
    return parser.BYTES_INT + content.length;
}

command.write = function(socket, sessionId, data, callback) {
    //Operation type
    socket.write(parser.writeByte(command.operation));

    //Invoke callback immediately when the operation is sent to the server
    callback();

    //Session ID
    socket.write(parser.writeInt(sessionId));
};