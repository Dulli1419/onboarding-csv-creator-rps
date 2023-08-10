// JavaScript Document
/* eslint-env es6 */

// This takes the list of students labled 'New' or 'Withdrawing' and pulls all of their details, passing them on to be sent in the email.
function getEnrollmentChanges(sheet, allStuInfo) {
	const newStu = sheet.getRange('E2:E').getValues().flat(1); // List of New Stu User IDs
	const withdrawStu = sheet.getRange('H2:H').getValues().flat(1); // List of Withdrawing Stu User IDs.
	const allStu = [newStu, withdrawStu]; // so we can grab each in a loop.
	const msDiv = ['6th Grade', '7th Grade', '8th Grade']; // to filter by division.
	const usDiv = ['9th Grade', '10th Grade', '11th Grade', '12th Grade']; // to filter by division.
	let sendLS = false; // if true send email to LS people
	let sendMS = false; // if true send email to MS people
	let sendUS = false; // if true send email to US people
	let fullStuInfo; // this will hold all the info for a specific student in the loop.
	let stuData; // this is the truncated, reformatted collection of data for each student, for our use outside of this function.
	const newStuInfo = []; // this will hold the final list of student info to be returned.
	const withdrawStuInfo = []; // this will hold the final list of student info to be returned.

	// find the relevant student info for each new student.
	for (let i = 0; i < allStu.length; i++) {
		const newOrWithdraw = allStu[i]; // grab the appropriate array of data.
		let newCheck = false; // used to track where to store the results.
		let changeLS = false; // tracks if theer has been a change to LS enrollment.
		let changeMS = false; // tracks if theer has been a change to MS enrollment.
		let changeUS = false; // tracks if theer has been a change to US enrollment.

		// mark students as new if they are new (vs withdrawing)
		if (allStu[i] === newStu) {
			newCheck = true;
		}

		const checkData = newOrWithdraw.filter((el) => el); // filter out blanks.

		// this loops through all the entries within the inner array and pulls relevant data out for our use.
		for (let j = 0; j < checkData.length; j++) {
			[fullStuInfo] = allStuInfo.filter((el) => el.id === checkData[j]); // all of the info attaached to the student.

			if (fullStuInfo) {
				let divisionLevel = 'LS';
				const gradYear = fullStuInfo.student_info.grad_year.slice(-2); // grab the last 2 characters of the grad year only.
				let stuName = `${fullStuInfo.first_name} ${fullStuInfo.last_name} '${gradYear}`;

				// format the name correctly if the student has a 'Preferred Name'.
				if (fullStuInfo.preferred_name) {
					stuName = `${fullStuInfo.first_name} '${fullStuInfo.preferred_name}' ${fullStuInfo.last_name} '${gradYear}`;
				}

				// Mark them with the correct division so that we can sort them within the email.
				if (msDiv.includes(fullStuInfo.student_info.grade_level_description)) {
					divisionLevel = 'MS';
					changeMS = true; // mark this division as having had a change so we know this divison doesn't need a "No Change" Entry.
				} else if (usDiv.includes(fullStuInfo.student_info.grade_level_description)) {
					divisionLevel = 'US';
					changeUS = true; // mark this division as having had a change so we know this divison doesn't need a "No Change" Entry.
				} else {
					changeLS = true; // mark this division as having had a change so we know this divison doesn't need a "No Change" Entry.
				}

				// compile the student entry.
				stuData = {
					name: stuName,
					id: fullStuInfo.id,
					profile_url: fullStuInfo.profile_url,
					division: divisionLevel,
				};

				// push data to the correct array if new vs withdrawing.
				if (newCheck) {
					newStuInfo.push(stuData);
				} else {
					withdrawStuInfo.push(stuData);
				}
			}
		}

		// this is the "No Change" student entry, pushed with the relevant division info if there has not been a change to that division.  This is so the division section in the final email says "No Change" if there wasn't a change, rather then just being a blank space.
		const emptyStud = {
			name: 'No Change',
			id: 'noID',
			profile_url: 'https://rutgersprep.myschoolapp.com',
			division: 'Temp',
		};

		const divList = ['LS', 'MS', 'US'];
		const changeCheck = [changeLS, changeMS, changeUS]; // log whether each division has had a change
		const emptyStuds = []; // this holds the duplicated object based on emptyStud.  Needed so that the divisoin prop can be updated individually for each emptyStud object.

		for (let m = 0; m < divList.length; m++) {
			if (!changeCheck[m]) { // only add an emptyStud if there was no change.
				emptyStuds[m] = { ...emptyStud }; // clone the blank object into the emptyStuds array.
				emptyStuds[m].division = divList[m]; // update the division

				// push data to the correct array if new vs withdrawing.
				if (newCheck) {
					newStuInfo.push(emptyStuds[m]);
				} else {
					withdrawStuInfo.push(emptyStuds[m]);
				}
			}
		}

		// if there was a change to a division then we need to email that division.  Because these are defined outside of any loop you may be updating a true value to true at some point but it doesn't matter.  If there is a change in any itteration of the loop then we need to notify the appropriate division.
		if (changeLS) {
			sendLS = true;
		}

		if (changeMS) {
			sendMS = true;
		}

		if (changeUS) {
			sendUS = true;
		}
	}

	// this is the final object the function returns.  It marks whether to email each division as a boolean and returns sepearate arrays for the new student info and the withdrawing student info.
	const emailInfo = {
		newInfo: newStuInfo,
		withdrawInfo: withdrawStuInfo,
		emailLS: sendLS,
		emailMS: sendMS,
		emailUS: sendUS,
	};

	return emailInfo;
}

// This updates the spreadsheet list of enrolled students so that it can make a comparrison to determine if there are any that are New or Withdrawing.
function enrollmentUpdate() {
	const ss = SpreadsheetApp.getActiveSpreadsheet();
	const sheet = ss.getSheetByName('New_Stu_Tracker');
	let existingUIDsRange = sheet.getRange('B2:B'); // Today's Students
	const existingUIDs = existingUIDsRange.getValues();
	let oldUIDs = sheet.getRange('A2:A'); // Yesterday's Students

	let allStuInfoCollected = false; // tracks whether all user info has been pulled from the system.
	let stuInfo; // holds a single call result to be concated into the greater whole.
	let allStuInfo = []; // holds all calls concated together
	let infoLink = '/school/v1/users/extended?base_role_ids=14'; // 14 = student
	const stuIds = []; // will hold all stuIDs.

	while (!allStuInfoCollected) {
		stuInfo = ArgoNetAccessLibrary.bbGet(`https://api.sky.blackbaud.com${infoLink}`, 0);
		allStuInfo = [...allStuInfo, ...stuInfo.value]; // concat this call into the whole.

		if (stuInfo.next_link) {
			infoLink = stuInfo.next_link; // if theres a next_link get that info from the API
		} else {
			allStuInfoCollected = true; // if there isn't a next_link exit the loop.
		}
	}

	// collect all IDs for comparrison.
	allStuInfo.forEach((stuData) => {
		stuIds.push([stuData.id]);
	});

	// clear out the column holding 'Yesterday's Students' and paste the data from 'Today's Students' into it.
	oldUIDs.clearContent();
	oldUIDs = sheet.getRange(2, 1, existingUIDs.length, 1);
	oldUIDs.setValues(existingUIDs);

	// clear out the column holding 'Today's Students' and paste in the data from the system.
	existingUIDsRange.clearContent();
	existingUIDsRange = sheet.getRange(2, 2, stuIds.length, 1);
	existingUIDsRange.setValues(stuIds);

	SpreadsheetApp.flush(); // force all pending changes to post to spreadsheet.

	return getEnrollmentChanges(sheet, allStuInfo); // get detailed user info for the students listed as New or Withdrawing (Which are new and withdrawing is calculated by formulas in the sheet).
}
