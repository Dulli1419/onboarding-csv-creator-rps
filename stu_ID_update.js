function updateStuID() {
	let allUserInfoCollected = false; // tracks whether all user info has been pulled from the system.
	let existingUserInfo; // holds a single call result to be concated into the greater whole.
	let allExistingUserInfo = []; // holds all calls concated together.
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

	const stuNoIds = allExistingUserInfo.filter((el) => el.id.toString() !== el.student_id); // filter out users that already have the Student ID posted.

	// Check to make sure there actually are accounts to update and, if not, stop the script.
	if (!stuNoIds.length) {
		console.log('No accounts to update');
		return false;
	}

	// this runs through all users that don't have matching Student IDs and User IDs and updates the Student ID to match.
	stuNoIds.forEach((updateUser) => {
		const updatee = {
			id: updateUser.id, // user ID.
			student_id: updateUser.id, // Student ID and User ID should match.
		};

		// update the 'studentID' field.
		ArgoNetAccessLibrary.bbPatchPost('https://api.sky.blackbaud.com/school/v1/users', 1, updatee, 'patch');
	});
}
