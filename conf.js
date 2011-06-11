var conf = (function PongConfiguration() {
	
	"use strict";
	
	var conf = {
		server: 'localhost',
		port: '55555'
	};
	
	if (typeof exports !== 'undefined') {
		exports.port = conf.port;
	} else {	
		return conf;	
	}
	
}());