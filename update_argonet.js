// JavaScript Document
/* eslint-env es6 */

// this checks all accounts that are about to be updated in ArgoNet and pulls all info that we currently have in ArgoNet.  This is then used to move the currently listed email into the cc_email field before we rewrite the email field.
function checkForEmails(toUpdate) {
	let allUserInfoCollected = false; // tracks whether all user info has been pulled from the system.
	let existingUserInfo; // holds a single call result to be concated into the greater whole.
	let allExistingUserInfo = []; // holds all calls concated together.
	let infoLink = '/school/v1/users/extended?base_role_ids=14,22'; // 14 = student; 22 = incoming student.
	const usersCheck = []; // this will hold all the info related to the users we are checking.  This is what the function returns.

	while (!allUserInfoCollected) {
		existingUserInfo = ArgoNetAccessLibrary.bbGet(`https://api.sky.blackbaud.com${infoLink}`, 0);
		allExistingUserInfo = [...allExistingUserInfo, ...existingUserInfo.value]; // concat this call into the whole.

		if (existingUserInfo.next_link) {
			infoLink = existingUserInfo.next_link; // if theres a next_link get that info from the API
		} else {
			allUserInfoCollected = true; // if there isn't a next_link exit the loop.
		}
	}

	// this loop runs through all the users that we are going to update in ArgoNet and pulls all the info related to them that came out of the API call.
	for (let i = 0; i < toUpdate.length; i++) {
		usersCheck.push(allExistingUserInfo.filter((el) => el.id === toUpdate[i][0])[0]);
	}

	return usersCheck;
}

// this checks to make sure that the new data is ready to be pushed back into ArgoNet, then updates ArgoNet.
function updateArgoNet() {
	const ss = SpreadsheetApp.getActiveSpreadsheet();
	const newSheet = ss.getSheetByName('Formatted_w_ID');
	const newRange = newSheet.getRange('A2:N'); // all data, exculding headers, on the sheet that holds the new usernames.
	const newData = newRange.getValues();
	const toUpdate = newData.filter((el) => el[13] !== 1 && el[0] && el[0] !== 'TestID'); // filter down to, only, those users that have not had their accounts created and have an ID number.

	const allToUpdate = []; // this will, ultimatley, hold all the users that need to be updated.

	// Check to make sure there actually are accounts to update and, if not, stop the script.
	if (!toUpdate.length) {
		reset(); // reset credentials.
		console.log('No accounts to update');
		return false;
	}

	// This pulls all info currently in ArgoNet for each of the accounts that we're going to update.  That info is used later to populate the cc_email field with whatever is in the email field, since we are going to overwrite the email field.
	const existingInfo = checkForEmails(toUpdate);

	// Go through each user and grab their User ID and new email info.
	toUpdate.forEach((newUser) => {
		const toUpdateInfo = {
			id: newUser[0], // user ID
			email: newUser[9], // generated email address / Entra ID
			cc_email: existingInfo.filter((el) => el.id === newUser[0])[0].email, // whatever is currently in the email field in AN
		};

		allToUpdate.push(toUpdateInfo);
	});

	// go through each user and update their info in ArgoNet.
	allToUpdate.forEach((updateUser) => {
		// update the 'email' and 'cc email' fields.
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

	updateAllReset(); // pull the newly updated ArgoNet info back down into the sheet.
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
