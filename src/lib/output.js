const colors = require('colors');

function log(msg, indented) {
	if(indented) {
		console.group();
	}
	console.log(msg);
	if(indented) {
		console.groupEnd();
	}
}

export function bigFailure(msg, indented) {
	log(msg.bgRed.white, indented);
}

export function bigSuccess(msg, indented) {
	log(msg.bgBrightGreen.black, indented);
}

export function error(msg, indented) {
	log(msg.red, indented)
}

export function failure(msg, indented) {
	log(msg.red, indented);
}

export function success(msg, indented) {
	log(msg.green, indented);
}

export function info(msg, indented) {
	log(msg.blue, indented);
}