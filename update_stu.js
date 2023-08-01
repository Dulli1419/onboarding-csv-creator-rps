// JavaScript Document
/* eslint-env es6 */

// This updates the list of students on the "Import" tab.
function updateStuList() {
	ArgoNetAccessLibrary.getADVList(150265, 0, 0, 0, 'Import'); // update stu list from ArgoNet.

	return true; // return true so trigger function continues.
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

	SpreadsheetApp.flush(); // force all pending changes to post to spreadsheet.
	return true; // return true so trigger function continues.
}

// this function pulls the listed email address for non-created accounts and puts them on the tab 'Formatted_w_ID'.  It won't update created acconts (since those will be RPS email addresses).  These emails are necessary to know where to email to notify the student that their account has been created.
function getNonRPSEmail() {
	const ss = SpreadsheetApp.getActiveSpreadsheet();

	const sourceSheet = ss.getSheetByName('Import');
	const sourceRange = sourceSheet.getRange('A2:G');
	const sourceData = sourceRange.getValues(); // get data from Import tab

	const targetSheet = ss.getSheetByName('Formatted_w_ID');
	const searchRange = targetSheet.getRange('A2:A');
	const searchData = searchRange.getValues().flat(1); // UIDs for cross reference
	const pasteRange = targetSheet.getRange('O2:O');
	const existingData = pasteRange.getValues().flat(1); // non-RPS emails

	let nonRPSEmail; // a placeholder for each users non-RPS email as it is added to the list.
	const nonRPSEmailList = []; // the final list to be pasted back into the sheet.

	// we have to go through every entry in searchData, including the blank entries, to make sure that the final list has the correct email addresses listed in the correct index of the array.
	searchData.forEach((uID) => {
		const [sourceInfo] = sourceData.filter((el) => el[0] === uID); // filter down the info from the Import tab to match the User ID for the user on the "Formatted_w_ID" tab.

		// if there is a match then we need to check to see if the account is created.  If there is no match just push a null entry.
		if (sourceInfo) {
			if (sourceInfo[6] !== 1) {
				// if sourceInfo[6] !== 1 then the account has not been created.
				[, , , , , nonRPSEmail] = sourceInfo; // get the listed email address.
				nonRPSEmailList.push([nonRPSEmail]); // push it to the list.
			} else {
				// here the account has been created.
				nonRPSEmailList.push([existingData[nonRPSEmailList.length]]); // get whatever is already listed in the corrisponding cell on "Formatted_w_ID".
			}
		} else {
			nonRPSEmailList.push(['']); // if we get a null respones push a blank cell.
		}
	});

	pasteRange.setValues(nonRPSEmailList); // paste result to sheet.

	return true; // return true so trigger function continues.
}

function cleanWithdraws() {
	const ss = SpreadsheetApp.getActiveSpreadsheet();
	const sourceSheet = ss.getSheetByName('Formatted_w_ID');
	const searchRange = sourceSheet.getRange('A2:N'); // all data on sheet.
	const searchValues = searchRange.getValues();

	const pasteSheet = ss.getSheetByName('Accounts_to_Deactivate'); // this holds accounts that need to be deactivated and withdrawn
	const pasteCheckRange = pasteSheet.getRange('A2:A');

	const withdrawCheck = searchValues.filter((el) => el[0] && !el[2]); // look for accounts that have a user ID (el[0]) but don't have an OU (el[2]).  If this is case we created the account at one point but it has since been withdrawn from ArgoNet.

	// only process the sheet if there are any matches
	if (withdrawCheck.length > 0) {
		// this loop needs to run in reverse because we are deleting rows within each itteration.  If you looped forward the index would break because the dataset changes.  By looping in reverse we delete the last row first and the first row last.  This still changes the dataset but in a way that doesn't alter the index we care about.
		for (let i = withdrawCheck.length - 1; i > -1; i--) {
			const pasteCheckValues = pasteCheckRange.getValues().flat(1); // get a list of existing records on the sheet 'Accounts_to_Deactivate'.

			//  Figure out where the bottom of the column is, allowing for rows to be skipped in the data set (so we know where to insert the new account info).  It uses findLast() to determine the value of the last non-falsey item then lastIndexOf() to get the index of it (lastIndexOf to account for the possiblity of duplicates).
			const pasteIndex = pasteCheckValues.lastIndexOf(pasteCheckValues.findLast((el) => el));

			// we only  need to deactivate the account if it was created.  If something meets the withdrawCheck criteria but was never created, then we can just delete it without worrying about it.
			if (withdrawCheck[i][13] === 1) {
				const toWithdraw = [withdrawCheck[i][0], withdrawCheck[i][8]]; // withdrawCheck[i][0] is user ID and withdrawCheck[i][8] is sAMAccountName.
				const pasteRange = pasteSheet.getRange(pasteIndex + 3, 1, 1, 2); // +3 because you need +1 for each of the following: Google Sheets is 1-indexed not 0-indexed like the array. Header Row. Add New Row.

				pasteRange.setValues([toWithdraw]); // paste the account info to the sheet.
			}

			sourceSheet.deleteRow(searchValues.indexOf(withdrawCheck[i]) + 2); // find the index of the offending data and delete the row.  +2 - 1 because GSheet is 1-index and 1 for the header row.
		}
	}
	SpreadsheetApp.flush(); // force all pending changes to post to spreadsheet.

	return true; // return true so trigger function continues.
}
