// JavaScript Document
/* eslint-env es6 */

// This goes through the sAMAccountNames initially constructed by the spreadsheet and removes and " ", "-", or accented character.  Accented characters are replaced by their non-accented english equivalent. info here - https://stackoverflow.com/questions/70287406/how-to-replace-all-accented-characters-with-english-equivalents
function cleanUsernames() {
	const ss = SpreadsheetApp.getActiveSpreadsheet();
	const sheet = ss.getSheetByName('Formatted_w_ID');
	const initialRange = sheet.getRange('H2:H'); // initial sAMAccount Names.
	const samInitial = initialRange.getValues().flat(1); // retrieve values and flatten into non-nested array.
	const finalRange = sheet.getRange('I2:I'); // 'clean' sAMAccount Names.
	let samClean = ''; // placeholder for each sAMAccount name being processed.
	const samFinal = []; // final array to print to the sheet.

	samInitial.forEach((samInt) => {
		samClean = samInt.normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // replace accented characters.
		samClean = samClean.replace(/[-\s+]/g, ''); // removes '-' and spaces.
		samFinal.push([samClean]);
	});

	finalRange.setValues(samFinal);

	return true;
}

function checkForDupUsernames(cycle) {
	let iterate = false;
	const ss = SpreadsheetApp.getActiveSpreadsheet();
	const importSheet = ss.getSheetByName('Import');
	const importRange = importSheet.getRange('A2:F');
	const allUsernames = importRange.getValues();
	let allUNDict = [];
	let allUNRef = [];

	allUsernames.forEach((un) => {
		un[5] = un[5].replace(/^\s*|\s*$/g, '').toLowerCase(); // remove leading and trailing spaces
		un[5] = un[5].replace(/@rutgersprep\.org/g, ''); // remove @rutgersprep.org

		allUNDict.push({
			UID: un[0],
			UN: un[5],
		});

		allUNRef.push(un[5]);
	});

	allUNDict = allUNDict.filter((el) => el.UID);
	allUNRef = allUNRef.filter((el) => el);

	const formattedSheet = ss.getSheetByName('Formatted_w_ID');
	const formattedRange = formattedSheet.getRange('A2:I');
	const newUsernames = formattedRange.getValues();
	let newUNDict = [];
	let matchingUser = [];
	let newMatchPos = -1;
	let changeRange;
	let newUN;
	let fName;

	newUsernames.forEach((newUN) => {
		fName = newUN[3].normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // replace accented characters.
		fName = fName.replace(/[-\s+]/g, ''); // removes '-' and spaces.

		newUNDict.push({
			UID: newUN[0],
			firstName: fName,
			UN: newUN[8],
		});
	});

	newUNDict = newUNDict.filter((el) => el.UID);

	newUNDict.forEach((newUNRef) => {
		matchingUser = allUNDict.filter((el) => el.UN === newUNRef.UN)[0];

		if (matchingUser) {
			if (matchingUser.UID !== newUNRef.UID) {
				newUN = `${newUNRef.UN.slice(0, cycle)}${newUNRef.firstName[cycle]}${newUNRef.UN.slice(cycle)}`;

				newMatchPos = newUsernames.findIndex((el) => el[0] === newUNRef.UID);
				changeRange = formattedSheet.getRange(newMatchPos + 2, 9);
				changeRange.setValue(newUN);

				iterate = true;
				Logger.log(newUN);
			}
		}
	});

	if (iterate) {
		checkForDupUsernames(cycle + 1);
	} else {
		Logger.log('All usernames are unique');
	}
}
