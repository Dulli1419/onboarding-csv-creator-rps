// JavaScript Document
/* eslint-env es6 */

// This updates the list of students on the "Import" tab.
function updateStuList() {
	ArgoNetAccessLibrary.getADVList(150265, 0, 0, 0, 'Import'); // update stu list from ArgoNet.

	return true;
}

// This takes the list of student IDs from the "Needs_Accounts" tab and compares it to the list of IDs already on the "Formatted_w_ID" tab (which is where most of the processing occurs).  It then compares the two lists to determine which IDs don't already exist on the "Formatted_w_ID" tab before copying them over at the bottom of the list.
function copyForFormatting() {
	const ss = SpreadsheetApp.getActiveSpreadsheet();
	const sourceSheet = ss.getSheetByName('Needs_Accounts');
	const targetSheet = ss.getSheetByName('Formatted_w_ID');
	const newIDsFinal = []; // this will be the final array of new IDs.

	targetSheet.activate(); // switch user to 'Formatted_w_ID' tab;

	const sourceRange = sourceSheet.getRange('A2:A'); // student IDs.
	let allIDs = sourceRange
		.getValues()
		.filter((el) => el[0]) // remove blanks
		.flat(1); // move data out of nested arrays and into a single flat array.
	allIDs = [...new Set(allIDs)]; // filter to unique values only.

	const targetRange = targetSheet.getRange('A2:A'); // student IDs.
	let consideredIDs = targetRange.getValues().flat(1); // move data out of nested arrays and into a single flat array.

	const newIDs = allIDs.filter((el) => !consideredIDs.includes(el)); // fillter to new IDs only.

	// nest each index in the array into it's own nested array so that it matches the correct format for Google Sheets.
	newIDs.forEach((stuID) => {
		newIDsFinal.push([stuID]);
	});

	//  Figure out where the bottom of the column is, allowing for rows to be skipped in the data set (so we know where to insert the new IDs).  It uses findLast() to determine the value of the last non-falsey item then lastIndexOf() to get the index of it (lastIndexOf to account for the possiblity of duplicates).
	const finalExistingIDIndex = consideredIDs.lastIndexOf(consideredIDs.findLast((el) => el));

	if (newIDsFinal.length > 0) {
		const newTargetRange = targetSheet.getRange(finalExistingIDIndex + 3, 1, newIDs.length, 1); // +3 because you need +1 for each of the following: Google Sheets is 1-indexed not 0-indexed like the array. Header Row. Add New Row.

		newTargetRange.setValues(newIDsFinal); // insert the newIDs to the sheet.
	} else {
		Logger.log('No New Students');
	}
}
