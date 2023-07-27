// This updates the list of students and triggers the rest of the functions to assign them a new temp pass.
function updateAll() {
	let importComplete = false;

	const service = ArgoNetAccessLibrary.getService(); // check to see if the user is authenticated to ArgoNet.
	if (service.hasAccess()) {
		// while loop ensures that the import finishes before we move on.
		while (!importComplete) {
			importComplete = updateStuList(); // update stu list from ArgoNet.
		}

		copyForFormatting(); // copy new students to "Formatted_w_ID" for processing.
		updatePass(); // generate temp passwords for the new accounts.
	} else {
		updateStuList(); // this will only authenticate to ArgoNet and not update the list if the user is not authenticated.  We isolate this because we don't want the other functions to run until the list is properly updated.
	}
}
