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

export function bigFailure(title, msg, indented) {
	let str = title + ' ' + (msg ? msg : '');
	log(str.bgRed.white, indented);
}

export function bigInfo(title, msg, indented) {
	let str = title + ' ' + (msg ? msg : '');
	log(str.bgBrightBlue.black, indented);
}

export function bigSuccess(title, msg, indented) {
	let str = title + ' ' + (msg ? msg : '');
	log(str.bgBrightGreen.black, indented);
}

export function error(title, msg, indented) {
	let str = title.bold.red;
	if(msg) {
		str += ' ' + msg.red;
	}
	log(str, indented)
}

export function failure(title, msg, indented) {	
	let str = title.bold.red;
	if(msg) {
		str += ' ' + msg.red;
	}
	log(str, indented);
}

export function newline() {
	console.log("\n");
}

export function success(title, msg, indented) {	
	let str = title.bold.green;
	if(msg) {
		str += ' ' + msg.green;
	}
	log(str, indented);
}

export function info(title, msg, indented) {	
	let str = title.bold.blue;
	if(msg) {
		str += ' ' + msg.blue;
	}
	log(str, indented);
}