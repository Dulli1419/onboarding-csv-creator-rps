// JavaScript Document
/* eslint-env es6 */

function updateArgoNet() {
	const ss = SpreadsheetApp.getActiveSpreadsheet();
	const newSheet = ss.getSheetByName('Formatted_w_ID');
	const newRange = newSheet.getRange('A2:N'); // all data, exculding headers, on the sheet that holds the new usernames.
	const newData = newRange.getValues();
	const toUpdate = newData.filter((el) => el[13] !== 1 && el[0]);
	/*
	let infoLink = '/school/v1/users/extended?base_role_ids=14,22'; // 14 = student; 22 = incoming student.

	let allUserInfoCollected = false;
	let existingUserInfo;
	let allExistingUserInfo = [];
	*/

	const allToUpdate = [];
	/*
	while (!allUserInfoCollected) {
		existingUserInfo = ArgoNetAccessLibrary.bbGet(`https://api.sky.blackbaud.com${infoLink}`, 0);
		allExistingUserInfo = [...allExistingUserInfo, ...existingUserInfo.value];

		if (existingUserInfo.next_link) {
			infoLink = existingUserInfo.next_link;
		} else {
			allUserInfoCollected = true;
		}
	}
	*/

	toUpdate.forEach((newUser) => {
		// const [userInfo] = allExistingUserInfo.filter((el) => el.id === newUser[0]);

		const toUpdateInfo = {
			id: newUser[0], // user ID
			email: newUser[9], // generated email address / Entra ID
			// newCCEmail: userInfo.email, // existing email
			// accountsCreated: true, // mark accounts as created
		};

		allToUpdate.push(toUpdateInfo);
	});

	allToUpdate.forEach((updateUser) => {
		// update the 'email' field.
		ArgoNetAccessLibrary.bbPatchPost('https://api.sky.blackbaud.com/school/v1/users', 0, updateUser, 'patch');

		// update the 'Accounts Created' custom field.
		const customFieldEndpoint = `https://api.sky.blackbaud.com/school/v1/users/${updateUser.id}/customfields`;

		const customFieldPayload = {
			field_id: 2802,
			data_type_id: 1,
			bit_value: true,
		};

		try {
			ArgoNetAccessLibrary.bbPatchPost(customFieldEndpoint, 0, customFieldPayload, 'post');
		} catch (error) {
			const userCustomFields = ArgoNetAccessLibrary.bbGet(customFieldEndpoint, 0);
			const [fieldToUpdate] = userCustomFields.custom_fields.filter((el) => el.field_id === 2802);
			customFieldPayload.id = fieldToUpdate.id;

			ArgoNetAccessLibrary.bbPatchPost(customFieldEndpoint, 0, customFieldPayload, 'patch');
		}
	});
}
