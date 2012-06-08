/*global PyGotham */

function onDeviceReady() {
	console.log('In onDeviceReady');
	document.addEventListener("backbutton", backKeyDown, false)
	document.addEventListener("menubutton", menuKeyDown, false)
}

function backKeyDown(e) {
	e.preventDefault();

	console.log('Back button pressed');
	
	var back_buttons = PyGotham.viewport.query('#back');
	if (back_buttons.length === 1) {
		back_buttons[0].fireEvent('tap');
	}

}

function menuKeyDown(e) {
	e.preventDefault();
	console.log('Menu key pressed');
}

(function () {
	console.log('In Cordova init()');
	document.addEventListener("deviceready", onDeviceReady, false);
}());
