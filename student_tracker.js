// JavaScript Document
/* eslint-env es6 */

// This gets all of the enrollment records from the last 2 years so that we can get info about withdrawn students.
function getEnrollmentRecords() {
	const allYears = ArgoNetAccessLibrary.bbGet('https://api.sky.blackbaud.com/school/v1/years', 1); // get year data from ArgoNet.
	const curYearData = allYears.value.filter((el) => el.current_year); // filter to the current year
	const curYear = curYearData[0].school_year_label; // return the current school year
	const lastYear = `${parseInt(curYear.slice(0, 4), 10) - 1}-${curYear.slice(0, 4)}`; // using the current school year record deincriment to last year.
	const relevantYears = [lastYear, curYear]; // so we can loop through them.
	let lastYearRecords = []; // this will hold the final list of all student records for last year.
	let curYearRecords = []; //  this will hold the final list of all student records for this year.

	for (let i = 0; i < relevantYears.length; i++) {
		let gotAllRecords = false; // this is used to escape the while loop
		const recordIncrement = 1000; // max 5000 - API defaults to 1000.
		let recordOffset = 0; // how many records to offset in the event that we have more then the recordIncrement.

		while (!gotAllRecords) {
			const enrollmentLink = `https://api.sky.blackbaud.com/school/v1/users/enrollments?school_year=${relevantYears[i]}&limit=${recordIncrement}&offset=${recordOffset}`; // generate the correct API link.

			const processingRecords = ArgoNetAccessLibrary.bbGet(enrollmentLink, 1); // get enrollment records.

			if (i === 0) {
				lastYearRecords = [...lastYearRecords, ...processingRecords.value]; // if i === 0 then we're in lastYear
			} else {
				curYearRecords = [...curYearRecords, ...processingRecords.value]; // otherwise we're in this year.
			}

			if (processingRecords.count < recordIncrement) {
				gotAllRecords = true; // if the count of records is less then the increment then there is nothing left to return, exit the loop.
			} else {
				recordOffset += recordIncrement; // grab the next group of records.
			}
		}
	}

	const allRecords = [curYearRecords, lastYearRecords]; // compile into a single variable.
	return allRecords;
}

// This takes the list of students labled 'New' or 'Withdrawing' and pulls all of their details, passing them on to be sent in the email.
function getEnrollmentChanges(sheet) {
	const allEnrollmentRecords = getEnrollmentRecords(); // get a list of all enrollment records for both this year and last.
	const newStu = sheet.getRange('E2:E').getValues().flat(1); // List of New Stu User IDs
	const withdrawStu = sheet.getRange('H2:H').getValues().flat(1); // List of Withdrawing Stu User IDs.
	const allStu = [newStu, withdrawStu]; // so we can grab each in a loop.
	// list all grade levels so that we can calculate the grad year below.
	const gradeLevels = [
		'12th Grade',
		'11th Grade',
		'10th Grade',
		'9th Grade',
		'8th Grade',
		'7th Grade',
		'6th Grade',
		'5th Grade',
		'4th Grade',
		'3rd Grade',
		'2nd Grade',
		'1st Grade',
		'Kindergarten',
		'Junior Kindergarten',
		'Pre-Kindergarten',
	];
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
			[fullStuInfo] = allEnrollmentRecords[0].filter((el) => el.user_id === checkData[j]); // all current year info attached to the student.

			// if no record is found for the student in the current school year then we check to see if there is a record in the past school year.
			if (!fullStuInfo) {
				[fullStuInfo] = allEnrollmentRecords[1].filter((el) => el.user_id === checkData[j]); // all past year info attached to the student.
			}

			if (fullStuInfo) {
				let divisionLevel = 'LS';
				// grab the last 2 digits of the current school year then add how many grade levels they have left to calculate the grad year.
				const gradYear = parseInt(fullStuInfo.school_year.slice(-2), 10) + gradeLevels.indexOf(fullStuInfo.grade_level.description);
				let stuName = `${fullStuInfo.firstname} ${fullStuInfo.lastname} '${gradYear}`;

				// format the name correctly if the student has a 'Preferred Name'.
				if (fullStuInfo.preferred_name) {
					stuName = `${fullStuInfo.firstname} '${fullStuInfo.preferred_name}' ${fullStuInfo.lastname} '${gradYear}`;
				}

				// Mark them with the correct division so that we can sort them within the email.
				if (fullStuInfo.school_level.name === 'Middle School') {
					divisionLevel = 'MS';
					changeMS = true; // mark this division as having had a change so we know this divison doesn't need a "No Change" Entry.
				} else if (fullStuInfo.school_level.name === 'Upper School') {
					divisionLevel = 'US';
					changeUS = true; // mark this division as having had a change so we know this divison doesn't need a "No Change" Entry.
				} else {
					changeLS = true; // mark this division as having had a change so we know this divison doesn't need a "No Change" Entry.
				}

				// compile the student entry.
				stuData = {
					name: stuName,
					id: fullStuInfo.user_id,
					profile_url: `https://rutgersprep.myschoolapp.com/app#profile/${fullStuInfo.user_id}/contactcard`,
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
		const emptyStuds = []; // this holds the duplicated object based on emptyStud.  Needed so that the division prop can be updated individually for each emptyStud object.

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
		stuInfo = ArgoNetAccessLibrary.bbGet(`https://api.sky.blackbaud.com${infoLink}`, 1);
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

	return getEnrollmentChanges(sheet); // get detailed user info for the students listed as New or Withdrawing (Which are new and withdrawing is calculated by formulas in the sheet).
}
