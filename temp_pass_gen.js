// JavaScript Document
/* eslint-env es6 */

// generates a random 8 character password that is guaranteed to have at least 1 Upper case, 1 lower case, and 1 number.
function passGenerator() {
	// the next 4 variables set the acceptable characters to appear in the final password.  Some characters have been removed because of similarity to other characters (0 vs O), or compatability ("=" was removed because, if it shows up as the first character, Google Sheets will try to interpret the cell as a formula).  Numbers are listed explicitly to ensure they'll be treated as strings.
	const acceptableNum = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
	const acceptableSpecial = ['(', '!', '@', '#', '$', '%', '^', '&', '*', '{', '}', '[', ']', '<', '>', ',', '.', '?', '/', ')'];
	const acceptableUpper = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y'];
	const acceptableLower = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'k', 'm', 'n', 'p', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];
	// this array is so we can randomize which character type we select.
	const acceptableOptions = [acceptableNum, acceptableSpecial, acceptableUpper, acceptableLower];
	let randCharType = '';
	let tempPass = ''; // the final temp password.

	// these conditions are set because we need to ensure the password meets minimum requirements.  I've set the 2nd character to be always UPPER case.  The 4th chracter to be always a Number and the final charcter to be always lower case.  All other characters have their type chosen randomly.  There are more secure / random ways to do this but these passwords will be changed by the user on first login so I figured this was good enough.
	for (let i = 0; i < 8; i++) {
		if (i === 1) {
			tempPass += acceptableUpper[getRandomInt(acceptableUpper.length)];
		} else if (i === 3) {
			tempPass += acceptableNum[getRandomInt(acceptableNum.length)];
		} else if (i === 7) {
			tempPass += acceptableLower[getRandomInt(acceptableLower.length)];
		} else {
			randCharType = acceptableOptions[getRandomInt(acceptableOptions.length)];
			tempPass += randCharType[getRandomInt(randCharType.length)];
		}
	}

	return tempPass;
}

// Get existing info from the sheet and use passGenerator() to populate with new temp passwords where none exist.
function updatePass() {
	const ss = SpreadsheetApp.getActiveSpreadsheet();
	const sheet = ss.getSheetByName('Formatted_w_ID');
	const infoRange = sheet.getRange('A1:A'); // student IDs
	const constantInfo = infoRange.getValues();
	const sourceRange = sheet.getRange('G1:G'); // Password column
	const existingInfo = sourceRange.getValues();
	const tempPasses = []; // final list of temp passwords.

	sheet.activate(); // switch user to 'Formatted_w_ID' tab;

	// checks state of sheet to make sure we don't overwrite existing passwords.
	for (let i = 0; i < constantInfo.length; i++) {
		if (!constantInfo[i][0]) { // if no student ID then we set cell to be blank.
			tempPasses.push(['']);
		} else if (!existingInfo[i][0]) { // if student ID exists but no pass exists then we set a new temp password.
			tempPasses.push([passGenerator()]);
		} else { // if both exist then we keep the cell as it is.
			tempPasses.push(existingInfo[i]);
		}
	}

	sourceRange.setValues(tempPasses); // set all values in the google sheet.
	sourceRange.setShowHyperlink(false); // hides any accidental links that may be incorrectly detected in passwords that include a "."

	return true; // return true so trigger function continues.
}
