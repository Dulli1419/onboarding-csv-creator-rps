// JavaScript Document
/* eslint-env es6 */

// This goes through the sAMAccountNames initially constructed by the spreadsheet and removes and " ", "-", or accented character.  Accented characters are replaced by their non-accented english equivalent. info here - https://stackoverflow.com/questions/70287406/how-to-replace-all-accented-characters-with-english-equivalents.  It also checks to see if the user has an already existing username and, if they do, copies that instead of the cleaned up version of the generated username.
function cleanUsernames() {
	const ss = SpreadsheetApp.getActiveSpreadsheet();
	const newSheet = ss.getSheetByName('Formatted_w_ID');
	const newRange = newSheet.getRange('A2:N'); // all data, exculding headers, on the sheet that holds the new usernames.
	const newData = newRange.getValues();
	const finalRange = newSheet.getRange('I2:I'); // 'clean' sAMAccount Names.
	let samClean = ''; // placeholder for each sAMAccount name being processed.
	const samFinal = []; // final array to print to the sheet.

	newData.forEach((samInt) => {
		if (samInt[13] === 1) {
			// if user accounts exist
			samFinal.push([samInt[8]]); // don't change the value already on the sheet.
		} else {
			samClean = samInt[7].normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // replace accented characters.
			samClean = samClean.replace(/[-\s+]/g, ''); // removes '-' and spaces.

			samFinal.push([samClean]);
		}
	});

	finalRange.setValues(samFinal);
	SpreadsheetApp.flush(); // force all pending changes to post to spreadsheet.

	return true; // return true so trigger function continues.
}

// This parses all of the new usernames and matches them against all existing usernames and all of the other new usernames to see if there are any duplicates.  It then alters the duplicates by adding another letter from the first name into the existing username.  If the current username is jdoe23 this will return jodoe23.  The function then rechecks all usernames again to make sure that the new username is not, itself, a duplicate.  If so it adds another new letter (returning johdoe23).  It cycles until all usernames are unique.  If it runs out of letters in the first name it throws an error.
function checkForDupUsernames() {
	let namesUnique = false; // this will turn true when all usernames are unique.

	const ss = SpreadsheetApp.getActiveSpreadsheet();
	const newSheet = ss.getSheetByName('Formatted_w_ID');
	const newRange = newSheet.getRange('A2:N'); // all data, exculding headers, on the sheet that holds the new usernames.

	const importSheet = ss.getSheetByName('Import');
	const importRange = importSheet.getRange('F2:G'); // the last 2 columns of the sheet with the existing usernames (email address & whether accounts have been created).
	const existingUsernames = importRange.getValues();

	let existingUN;
	let existingUNList = []; // this will just be the usernames, for quick reference. (from the list of current students)

	// this populates allUNList
	existingUsernames.forEach((un) => {
		// un[0] === username; un[1] === 'Accounts Created'
		if (un[1] === 1) {
			existingUN = un[0].replace(/^\s*|\s*$/g, '').toLowerCase(); // remove leading and trailing spaces from username.  Also make lower case.
			existingUN = existingUN.replace(/@rutgersprep\.org/g, ''); // remove @rutgersprep.org

			existingUNList.push(existingUN); // push username to list.
		}
	});

	existingUNList = existingUNList.filter((el) => el); // remove blank entries.

	let cycle = 1; // this tracks which letter of the first name we're inserting.
	let newMatchPos = -1; // this will hold the index of the matching user, if one exists (for targeting the correct cell to update).
	let changeRange; // this will be the actual cell that needs to be updated.
	let newUN; // this will hold the new iteration of the username.
	let allMatchingUsers; // this will be a list of all users that match a specific name that has a duplicate.  It will only ever pull new users as we don't want to alter existing user's usernames.
	const usersToAlter = []; // this is the list of accounts that are up for modification.  This exists to make sure we don't suddenly start changing usernames that we're unique on the first cycle.  Once we pass the first cycle only those usernames should be changed (or else we'll insert a random letter in the middle of the username).

	while (!namesUnique) {
		const newUsernames = newRange.getValues(); // this has to be within the while loop so that it's refreshed along with the new usernames.
		const newUsernamesFiltered = newUsernames.filter((el) => el[13] !== 1 && el[0]); // this is the list of new usernames we're considering.  It removes user's whose accounts have been created (el[13]).  It also makes sure the user has a user ID so there are no blank entries (el[0]).
		const newUNList = []; // a flat list of all new usernames.
		const newUNDict = []; // this will be an array of objects which link new user ID to new username.
		let fName; // this is the first name of the new user.  It's necessary to update the username correctly when there is a match.

		// populate newUNDict & NewUNList.
		newUsernamesFiltered.forEach((initNewUN) => {
			fName = initNewUN[3].normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // replace accented characters.
			fName = fName.replace(/[-\s+]/g, ''); // removes '-' and spaces.

			newUNDict.push({
				UID: initNewUN[0], // user ID
				firstName: fName, // first name
				UN: initNewUN[8], // username
			});

			newUNList.push(initNewUN[8]);
		});

		const allUNList = [...existingUNList, ...newUNList]; // this is a concat of the list of new and existing usernames (to search for dupes).
		const allUNUnique = new Set(allUNList); // this is the list of all unique usernames (to compare against when searching for dupes).

		let duplicateCheck; // the username we'll be checking
		const duplicateUsernames = []; // this will, ultimatley, hold all of the duplicate usernames.

		// this checks each username in the allUNUnique list and checks how many time they exist in the allUNList.  If it's > 1 then there is a duplicate so it adds that username to [duplicateUsernames].
		allUNUnique.forEach((testUN) => {
			duplicateCheck = allUNList.filter((el) => el === testUN); // the filtered list, which should be only 1.
			if (duplicateCheck.length > 1 && !duplicateUsernames.includes(duplicateCheck[0])) {
				// only push to duplicateUsernames if it doesn't have the entry already.
				duplicateUsernames.push(duplicateCheck[0]);
			}
		});

		// if there are duplicate usernames generate the new username and update the cell.
		if (duplicateUsernames.length) {
			for (let i = 0; i < duplicateUsernames.length; i++) {
				allMatchingUsers = newUNDict.filter((el) => el.UN === duplicateUsernames[i]); // this is all of the users with the duplicate usernames.  This entry includes all user info, not just the username.

				for (let j = 0; j < allMatchingUsers.length; j++) {
					const matchingUserID = allMatchingUsers[j].UID; // this is the user ID of the account that needs a new username.

					// we only push to [usersToAlter] if it's the first cycle.  Usernames that we unique when first checked don't need to get altered just because something else was made to match it on a future iteration.
					if (cycle === 1) {
						usersToAlter.push(matchingUserID);
					}

					// if it's the first cycle, or if the user still has a non-unique username after being identified during the first cycle, update the username.
					if (cycle === 1 || usersToAlter.includes(matchingUserID)) {
						// if the user has no more letters in their first name, throw this error.
						if (!allMatchingUsers[j].firstName[cycle]) {
							throw new Error(`User ${matchingUserID} is out of available letters in their first name.`);
						}

						newUN = `${allMatchingUsers[j].UN.slice(0, cycle)}${allMatchingUsers[j].firstName[cycle]}${allMatchingUsers[j].UN.slice(cycle)}`; // generate the new username.
						newMatchPos = newUsernames.findIndex((el) => el[0] === matchingUserID); // this gets the index of the user from the array of all new usernames (non-filtered) so we can find it in the sheet to update the cell.
						changeRange = newSheet.getRange(newMatchPos + 2, 9); // +2.  +1 because Google Sheets is 1-indexed and +1 because of the header row.
						changeRange.setValue(newUN); // set new username.

						Logger.log(newUN);
					}
				}
			}

			cycle += 1; // move to the next letter in the first name.
		} else {
			Logger.log('All usernames are unique'); // log this once complete.
			namesUnique = true; // exit the while loop.
		}
	}
}
