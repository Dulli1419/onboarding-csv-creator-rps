// JavaScript Document
/* eslint-env es6 */

// this deletes all the info from "Formatted_w_ID" (not the formulas) to reset for a new school year.
function clearSheet() {
	const ss = SpreadsheetApp.getActiveSpreadsheet();
	const sheet = ss.getSheetByName('Formatted_w_ID');
	const stuRange = sheet.getRange('A3:A');
	const passRange = sheet.getRange('G2:G');
	const samRange = sheet.getRange('I2:I');

	const ui = SpreadsheetApp.getUi();

	// Warn user that they will be deleting all content on the spreadsheet.
	const result = ui.alert('This will remove all data from the tab "Formatted_w_ID".  Are you sure you want to contiue?', ui.ButtonSet.YES_NO);

	// Process the user's response.
	if (result === ui.Button.YES) {
		// User clicked "Yes".
		stuRange.clearContent();
		passRange.clearContent();
		samRange.clearContent();

		return true;
	}

	// User clicked "No" or X in the title bar.
	return false; // stop the process and exit the script without making any changes.
}

// this gets the current school year out of ArgoNet and copies it to the sheet for reference.
function updateSchoolYear() {
	const ss = SpreadsheetApp.getActiveSpreadsheet();
	const sheet = ss.getSheetByName('School_Info');
	const range = sheet.getRange('A2');

	const allYears = ArgoNetAccessLibrary.bbGet('https://api.sky.blackbaud.com/school/v1/years', 0); // get year data from ArgoNet.

	const curYearData = allYears.value.filter((el) => el.current_year); // filter to the current year

	let curYear = curYearData[0].school_year_label;
	curYear = curYear.replace(/-/g, ' - '); // add spaces around "-" in the year.

	range.setValue(curYear);
}

// You must create a trigger for this function to execute 'From spreadsheet - On open'.  A simple trigger is not possible because end users do not have persistent authorization to access SKY API.  Using a defined trigger attached to this function allows us to force the onOpen function to be called by googleapi@rutgersprep.org at all times.  Without persistant SKY API access this fails because the functions added to the dropdown require auth to access SKY API.
function onOpenHandler() {
	SpreadsheetApp.getUi()
		.createMenu('Custom')
		.addItem('Update Student Info', 'updateAll')
		.addItem('Update ArgoNet', 'triggerArgoNetUpdate')
		.addItem('Reset Sheet', 'clearSheet')
		.addToUi();
}

// gets a random integer between 0 and variable "max".
function getRandomInt(max) {
	return Math.floor(Math.random() * max);
}
