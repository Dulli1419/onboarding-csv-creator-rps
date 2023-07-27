// JavaScript Document
/* eslint-env es6 */

// this deletes all the info from "Formatted_w_ID" (not the formulas) to reset for a new school year.
function clearSheet() {
	const ss = SpreadsheetApp.getActiveSpreadsheet();
	const sheet = ss.getSheetByName('Formatted_w_ID');
	const stuRange = sheet.getRange('A3:A');
	const passRange = sheet.getRange('G2:G');

	const ui = SpreadsheetApp.getUi();

	// Warn user that they are signing in/out when they have not recently signed out/in.
	const result = ui.alert('This will remove all data from the tab "Formatted_w_ID".  Are you sure you want to contiue?', ui.ButtonSet.YES_NO);

	// Process the user's response.
	if (result === ui.Button.YES) {
		// User clicked "Yes".
		stuRange.clearContent();
		passRange.clearContent();

		return true;
	}

	// User clicked "No" or X in the title bar.
	return false; // stop the process and exit the script without making any changes.
}

// You must create a trigger for this function to execute 'From spreadsheet - On open'.  A simple trigger is not possible because end users do not have persistent authorization to access SKY API.  Using a defined trigger attached to this function allows us to force the onOpen function to be called by googleapi@rutgersprep.org at all times.  Without persistant SKY API access this fails because the functions added to the dropdown require auth to access SKY API.
function onOpenHandler() {
	SpreadsheetApp.getUi()
		.createMenu('Custom')
		.addItem('Update Students', 'updateAll')
		.addItem('Reset Sheet', 'clearSheet')
		.addToUi();
}

// gets a random integer between 0 and variable "max".
function getRandomInt(max) {
	return Math.floor(Math.random() * max);
}
