var parser = require("../connection/parser"),
    OPERATIONTYPE = require("./operation_types");
    
/*------------------------------------------------------------------------------
  (public) Connect
  
  + none
  - void
  
  Constructor - set up parser.
------------------------------------------------------------------------------*/
var Connect = module.exports = function Connect() {
	this._indexCursor = 13;
};

/*------------------------------------------------------------------------------
  (public) read
  
  + data
  + callback
  - void
  
  Read respone from server and emits response event.
------------------------------------------------------------------------------*/
Connect.prototype.read = function(data, callback) {
	var self = this,
		indexCursor = this._indexCursor,
		result = {
			sessionId: 0
		};

	// status
    var status = data.readUInt8(0);
    if (status) {
        callback (data);
        return;
	}

    // session ID
    result.sessionId = data.readUInt32BE(5);

	callback(undefined, result);
};

/*------------------------------------------------------------------------------
  (public) write
  
  + socket
  + sessionId
  + data
  + callback
  - void
  
  Write request to server and emits request event.

Request:  (driver-name:string)(driver-version:string)(protocol-version:short)(client-id:string)(database-name:string)(database-type:string)(user-name:string)(user-password:string)
Response: (session-id:int)(num-of-clusters:short)[(cluster-name:string)(cluster-id:short)(cluster-type:string)](cluster-config:bytes)
------------------------------------------------------------------------------*/
Connect.prototype.write = function(socket, sessionId, data, callback) {

	// operation type
	socket.write(parser.writeByte(OPERATIONTYPE.CONNECT, true));

	// invoke callback imidiately when the operation is sent to the server
	callback();
	
	// session ID
	socket.write(parser.writeInt(sessionId, true));

    // driver name
    socket.write(parser.writeString("OrientDB Node.js driver"));
    // driver version
    socket.write(parser.writeString("0.0.1"));
    // protocol version
    socket.write(parser.writeShort(7));
    // client id
    socket.write(parser.writeString(""));
    // user name
	socket.write(parser.writeString(data.user_name));
    // user password
	socket.write(parser.writeString(data.user_password));
};

