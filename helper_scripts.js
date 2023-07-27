// JavaScript Document
/* eslint-env es6 */

// You must create a trigger for this function to execute 'From spreadsheet - On open'.  A simple trigger is not possible because end users do not have persistent authorization to access SKY API.  Using a defined trigger attached to this function allows us to force the onOpen function to be called by googleapi@rutgersprep.org at all times.  Without persistant SKY API access this fails because the functions added to the dropdown require auth to access SKY API.
function onOpenHandler() {
	SpreadsheetApp.getUi()
		.createMenu('Custom')
		.addItem('Update Students', 'copyForFormatting')
		.addToUi();
}

// gets a random integer between 0 and variable "max".
function getRandomInt(max) {
	return Math.floor(Math.random() * max);
}
