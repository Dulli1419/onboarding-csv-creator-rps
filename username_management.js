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

// this runs through all the usernames and checks to see if they exist already anywhere in the list of existing students.
function checkForDupUsernames(cycle) {
	let iterate = false; // used to determine whether we need to check again (if a duplicate is found)
	const ss = SpreadsheetApp.getActiveSpreadsheet();
	const importSheet = ss.getSheetByName('Import');
	const importRange = importSheet.getRange('A2:F');
	const allUsernames = importRange.getValues();
	let allUNDict = []; // this will be an array of objects which link user ID to username. (from the list of current students)
	let allUNRef = []; // this will just be the usernames, for quick reference. (from the list of current students)

	// this populates allUNDict all allUNRef
	allUsernames.forEach((un) => {
		un[5] = un[5].replace(/^\s*|\s*$/g, '').toLowerCase(); // remove leading and trailing spaces
		un[5] = un[5].replace(/@rutgersprep\.org/g, ''); // remove @rutgersprep.org

		allUNDict.push({
			UID: un[0], // user ID
			UN: un[5], // username
		});

		allUNRef.push(un[5]);
	});

	allUNDict = allUNDict.filter((el) => el.UID); // remove objects without a user ID.
	allUNRef = allUNRef.filter((el) => el); // remove blank entries.

	const formattedSheet = ss.getSheetByName('Formatted_w_ID');
	const formattedRange = formattedSheet.getRange('A2:I');
	const newUsernames = formattedRange.getValues();
	let newUNDict = []; // this will be an array of objects which link user ID to username. (from the list of new students)
	let matchingUser = []; // this will hold the name of the student with a matching username, if one exists.
	let newMatchPos = -1; // this will hold the index of the matching user, if one exists (for targeting the correct cell to update).
	let changeRange; // this will be the actual cell that needs to be updated.
	let fName; // this is the first name of the new user.  It's necessary to update the username correctly when there is a match.

	// populate newUNDict
	newUsernames.forEach((newUN) => {
		fName = newUN[3].normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // replace accented characters.
		fName = fName.replace(/[-\s+]/g, ''); // removes '-' and spaces.

		newUNDict.push({
			UID: newUN[0], // user ID
			firstName: fName, // first name
			UN: newUN[8], // username
		});
	});

	newUNDict = newUNDict.filter((el) => el.UID); // remove entries without a user ID.

	// actually check for matching users and update if needed.
	newUNDict.forEach((newUNRef) => {
		matchingUser = allUNDict.filter((el) => el.UN === newUNRef.UN)[0]; // this checks to see if there is another user with the same username.

		// we have to check to see if the User IDs match on the matching accounts since this will be a running list.  We don't want it to alter the entries username after we update them into the system.
		if (matchingUser) {
			if (matchingUser.UID !== newUNRef.UID) { // this checks to see if the matching user is the same user as the new user (by checking for matching user ID).
				newUN = `${newUNRef.UN.slice(0, cycle)}${newUNRef.firstName[cycle]}${newUNRef.UN.slice(cycle)}`; // this returns the new username by adding another letter from the first name into the existing username.  If the current username is jdoe23 this will return jodoe23.  The function then calls itself again below, adding 1 to cycle, so that on the next iteration (if it's a match again), it will return johdoe23.

				newMatchPos = newUsernames.findIndex((el) => el[0] === newUNRef.UID); // this gets the index of the user from the array of all new usernmaes so we can find it in the sheet to update the cell.
				changeRange = formattedSheet.getRange(newMatchPos + 2, 9); // +2, +1 because Google Sheets is 1-indexed and +1 because of the header row.
				changeRange.setValue(newUN); // set new username.

				iterate = true; // if a username needed to be updated then we need to run the function again to make sure that, that username isn't also a duplicate.
				Logger.log(newUN); // logs the new username, if there is one.
			}
		}
	});

	if (iterate) {
		checkForDupUsernames(cycle + 1); // run the function again if needed.
	} else {
		Logger.log('All usernames are unique'); // log this if iteration is not necessary.
	}
}
