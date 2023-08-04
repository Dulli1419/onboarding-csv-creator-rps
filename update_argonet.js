// JavaScript Document
/* eslint-env es6 */

// this checks all accounts that are about to be updated into ArgoNet to see if they have an email address listed in the database.  If so, it generates a CSV of those emails so that they can be moved from the listed email address to the listed CC Email address.  It then exits the script and propmpts the user to upload that CSV (which will move all emails to CC Emails) and try again.
function checkForEmails(toUpdate) {
	let allUserInfoCollected = false; // tracks whether all user info has been pulled from the system.
	let existingUserInfo; // holds a single call result to be concated into the greater whole.
	let allExistingUserInfo = []; // holds all calls concated together
	let infoLink = '/school/v1/users/extended?base_role_ids=14,22'; // 14 = student; 22 = incoming student.

	while (!allUserInfoCollected) {
		existingUserInfo = ArgoNetAccessLibrary.bbGet(`https://api.sky.blackbaud.com${infoLink}`, 0);
		allExistingUserInfo = [...allExistingUserInfo, ...existingUserInfo.value]; // concat this call into the whole.

		if (existingUserInfo.next_link) {
			infoLink = existingUserInfo.next_link; // if theres a next_link get that info from the API
		} else {
			allUserInfoCollected = true; // if there isn't a next_link exit the loop.
		}
	}

	const allUsersToCheck = []; // this will hold all of the info for all the users we need to check for an email address.

	// this loop runs through all the users that we are going to update in ArgoNet and pull all the info related to them that came out of the API call.
	for (let i = 0; i < toUpdate.length; i++) {
		const [usersCheck] = allExistingUserInfo.filter((el) => el.id === toUpdate[i][0]);

		if (usersCheck) { // make sure to only include the response if info is found.
			allUsersToCheck.push(usersCheck);
		}
	}

	const usersWithEmails = allUsersToCheck.filter((el) => el.email); // filter down, only, to those people with something populating their email field.

	// if there are any users with a value in the email field use that info to populate a tab which will allow us to quickly move that info in the CC Email field via a data import in ArgoNet.  Ideally this would just be posted through the API but there is no endpoint that allows us to update the CC Field.  If there ever is this entire function will be unnecessary and the field can be updated as part of the function updateArgoNet().
	if (usersWithEmails.length > 0) {
		const ss = SpreadsheetApp.getActiveSpreadsheet();
		const sheet = ss.getSheetByName('cc_Emails_for_Import');
		const fullRange = sheet.getRange('A2:E'); // all data on the sheet
		const pasteRange = sheet.getRange(2, 1, usersWithEmails.length, 5); // the range we want to populate.
		const emailInfo = [];

		// this loop is necessary so that we only push the details we want to the spreadsheet, and not every piece of information in the system.
		for (let j = 0; j < usersWithEmails.length; j++) {
			emailInfo.push([usersWithEmails[j].id, '^', usersWithEmails[j].first_name, usersWithEmails[j].last_name, usersWithEmails[j].email]); // colate the desired info.
		}

		fullRange.clearContent(); // clear all content on the sheet.
		pasteRange.setValues(emailInfo); // push the new info to the sheet.

		sheet.activate(); // switch user to 'cc_Emails_for_Import' tab;

		// this pulls the UI so that we can send an alert to the user.
		const ui = SpreadsheetApp.getUi();

		// Warn user that there are users with emails that should be moved to the cc_email filed
		ui.alert('Any new user with an entry listed in the "email" field should have that info copied to the "cc_email" field before updating. The tab "cc_Emails_for_Import" has been populated with the necessary information to do this quickly.  Please downlaod that tab as a CSV and upload to ArgoNet, then try again.', ui.ButtonSet.OK);

		return false; // stop the process and exit the script without making any changes.
	}

	return true; // if the email field is blank return true and continue updating the info in ArgoNet.
}

// this checks to make sure that the new data is ready to be pushed back into ArgoNet, then updates ArgoNet.
function updateArgoNet() {
	const ss = SpreadsheetApp.getActiveSpreadsheet();
	const newSheet = ss.getSheetByName('Formatted_w_ID');
	const newRange = newSheet.getRange('A2:N'); // all data, exculding headers, on the sheet that holds the new usernames.
	const newData = newRange.getValues();
	const toUpdate = newData.filter((el) => el[13] !== 1 && el[0] && el[0] !== 'TestID'); // filter down to, only, those users that have not had their accounts created and have an ID number.

	const allToUpdate = []; // this will, ultimatley, hold all the users that need to be updated.

	// this checks all users pending update to see if they have an email and, if any do, warns the user that needs to be rectified.  This is so that we don't lose those emails (they should be moved to the CC Email field within the system).  Once there is an endpoint that allows us to patch the CC Email field this should be removed and the CC Email should be populated by this script instead.
	const continueCheck = checkForEmails(toUpdate);

	// if there are still new users with their email field populated exit the script and don't update ArgoNet.
	if (!continueCheck) {
		reset(); // reset credentials.
		return false;
	}

	// if the users are ready for update we go through each and grab their User ID and new email address.
	toUpdate.forEach((newUser) => {
		const toUpdateInfo = {
			id: newUser[0], // user ID
			email: newUser[9], // generated email address / Entra ID
		};

		allToUpdate.push(toUpdateInfo);
	});

	// go through each user and update their info in ArgoNet.
	allToUpdate.forEach((updateUser) => {
		// update the 'email' field.
		ArgoNetAccessLibrary.bbPatchPost('https://api.sky.blackbaud.com/school/v1/users', 0, updateUser, 'patch');

		// update the 'Accounts Created' custom field.
		const customFieldEndpoint = `https://api.sky.blackbaud.com/school/v1/users/${updateUser.id}/customfields`;

		const customFieldPayload = {
			field_id: 2802, // ID for the 'Accounts Created' custom field.
			data_type_id: 1, // boolean.
			bit_value: true, // value of the field.
		};

		// we first try to POST the field (which is generally the correct action, since these users wont have that field yet).  If the field, somehow, already exists and is being updated we need to PATCH.
		try {
			ArgoNetAccessLibrary.bbPatchPost(customFieldEndpoint, 0, customFieldPayload, 'post'); // attempt to POST to ArgoNet.
		} catch (err) {
			const userCustomFields = ArgoNetAccessLibrary.bbGet(customFieldEndpoint, 0); // each user has a specific ID for their instance of each custom field and we need that ID to PATCH to it.
			const [fieldToUpdate] = userCustomFields.custom_fields.filter((el) => el.field_id === 2802); // filter down to the correct custom field.
			customFieldPayload.id = fieldToUpdate.id; // get the ID number and add it to the payload.

			ArgoNetAccessLibrary.bbPatchPost(customFieldEndpoint, 0, customFieldPayload, 'patch'); // PATCH to ArgoNet.
		}
	});

	updateAll(); // pull the newly updated ArgoNet info back down into the sheet.
}

// this actually triggers the above scripts.  It checks to see if the user has authentication to the system before running the scripts above.  If the user doesn't then it does a simple bbGet just to force it to fail over into an auth request.
function triggerArgoNetUpdate() {
	const service = ArgoNetAccessLibrary.getService(); // check to see if the user is authenticated to ArgoNet.

	if (service.hasAccess()) {
		updateArgoNet(); // update the info in ArgoNet.
	} else {
		ArgoNetAccessLibrary.bbGet('https://api.sky.blackbaud.com/school/v1/years', 0); // attempt a bbGet which will force an auth.  We never actually reach (or need to reach) this endpoint.
	}
}
