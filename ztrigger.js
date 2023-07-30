// This updates the list of students and triggers the rest of the functions to assign them a new temp pass.
function updateAll() {
	let importComplete = false;
	let copyComplete = false;
	let passUpdateComplete = false;
	let cleanComplete = false;

	const service = ArgoNetAccessLibrary.getService(); // check to see if the user is authenticated to ArgoNet.

	if (service.hasAccess()) {
		updateSchoolYear(); // make sure the correct school year is listed in the sheet.

		// while loop ensures that the import finishes before we move on.
		while (!importComplete) {
			importComplete = updateStuList(); // update stu list from ArgoNet.
		}

		// while loop ensures that the copy finishes before we move on.
		while (!copyComplete) {
			copyComplete = copyForFormatting(); // copy new students to "Formatted_w_ID" for processing.
		}

		// while loop ensures that the passwords update before we move on.
		while (!passUpdateComplete) {
			passUpdateComplete = updatePass(); // generate temp passwords for the new accounts.
		}

		// while loop ensures that the usernames fully update before we move on.
		while (!cleanComplete) {
			cleanComplete = cleanUsernames(); // check usernames for unsupported characters.
		}

		checkForDupUsernames(); // check usernames to make sure they are unique across all usernames.
	} else {
		updateStuList(); // this will only authenticate to ArgoNet and not update the list if the user is not authenticated.  We isolate this because we don't want the other functions to run until the list is properly updated.
	}
}
