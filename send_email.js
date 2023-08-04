// JavaScript Document
/* eslint-env es6 */

// this takes the user ID of the person whose email is being sent and then finds that user ID on the "Formatted_w_ID" tab so that we can mark that the email was sent.
function markEmailSent(userID) {
	const ss = SpreadsheetApp.getActiveSpreadsheet();
	const sheet = ss.getSheetByName('Formatted_w_ID');
	const uIDs = sheet.getRange('A2:A').getValues().flat(1); // get the list of IDs from the sheet and flatten them into a single array.

	const pasteRange = sheet.getRange(uIDs.indexOf(userID) + 2, 16, 1, 1); // +2; 1 because Google Sheets is 1-indexed and 1 because of the header row.
	pasteRange.setValue(1); // We set the value as 1 to indicate that the email was sent.
}

// this gets the written email from email.html, then gets the data from the sheet and adds it to the email template.  Then returns that as the htmlBody;
function getMessage(data) {
	const htmlTemplate = HtmlService.createTemplateFromFile('email');
	htmlTemplate.data = data; // data is passed to the function but, in this context, is the result of "getAllData()".  Here we pass it to the HTML to be added to the email.
	const htmlBody = htmlTemplate.evaluate().getContent();
	return htmlBody;
}

// this takes the data from the sheet and builds a message without HTML formatting, in case that isn't supported. data in this context is the result of getAllData().
function getNOHTMLmessage(data) {
	let text = '';

	text += `Hi ${data.firstName} and welcome to Rutgers Prep!\n\n`;

	text += "My name is Michael Nardulli, I'm the Associate Director of Technology, and I make up one-third of our IT department.  When you arrive on campus you'll meet Omar Simpson, our technician, and Mark Nastus, the Director of Technology.  In the meantime if you need anything from our department please don't hesitate to contact us by email at mom@rutgersprep.org and someone will get back to you.\n\n";

	text += 'Now, this email is to help walk you through setting up all of your digital accounts for your time at Rutgers Prep, including email, ArgoNet, and on campus wifi access.\n\n';

	text += 'As to how to access your accounts:\n\n';

	text += '-----\n\n';

	text += 'ArgoNet\n\n';

	text += "Argonet is our Learning Management System (LMS).  It's the place online where you can find information about your classes, extracurriculars, athletics, homework, attendance.  There's almost nothing we do that isn't, in some way, represented on ArgoNet.\n\n";

	text += 'To get logged head over to the login page.  You can navigate directly to it by going to argonet.rutgersprep.org.  It is also accessible by going to rutgersprep.org and clicking the link at the top of the page.\n\n';

	text += 'Once you have reached the login page, please enter the following username to being the login process:\n\n';

	text += `username: ${data.username}\n\n`;

	text += 'This will begin a process to get your account setup.  Specific instructions for how to navigate this process can be found here:\n\n';

	text += 'https://www.rutgersprep.org/instructions\n\n';

	text += 'Any time that you are asked for a username please use the username listed above.  When asked to enter a password please use the following:\n\n';

	text += `password:  ${data.tempPassword}\n\n`;

	text += 'You will then be asked to reset the password to something that only you know.\n\n';

	text += 'Once you get logged in all of your account credentials will have been created automatically.  This includes:\n\n';

	text += 'ArgoNet\n';
	text += 'Email / Google Workspace\n';
	text += 'RPSnet (the on campus wifi)\n';
	text += 'Credentials for printing\n\n';

	text += 'When asked to log into any of these services just use the name and password that you created as part of this process.\n\n';

	text += '-----\n\n';

	text += 'Email (Google Workspace Account)\n\n';

	text += "Printing and RPSnet aren't something that you can use until you're on campus, however, your Google Workspace Account is available immediately.\n\n";

	text += "To access it go to https://www.gmail.com.  If you're using the same browser you used to setup your account above you should be logged in automatically, however, if you need to log in just use the username and password you created above.\n\n";

	text += "Once logged in feel free to use this as you would a regular Gmail account.  In addition to email, this account gives you access to everything that comes with a Google Account: Google Drive, Google Calendar, Google Docs, etc…. If you need any help or have any questions on how any of this works please don't hesitate to ask.\n\n";

	text += 'Also note, you may see some email waiting for you when you first log in.  Please make sure to look through it all, some may not be important, but any of it could be.  This is because you have already been added to a few of our internal distribution lists and you may have had some communications sent to you that were a part of those.\n\n';

	text += '-----\n\n';

	text += "If you run into any issues, or have any questions, please don't hesitate to ask.  Your best bet for getting your question answered quickly is to email the RPS tech department email, which is mom@rutgersprep.org.\n\n";

	text += 'Thanks and, once again, welcome to Rutgers Prep!\n\n\n\n\n\n\n';

	text += 'This email was sent from a notification-only address and cannot accept incoming email.\n\nIf you are seeing this version of this message your email client does not support HTML.';

	return text;
}

// this take the list of people to send the message to, the subject line, and the email body content both with and without HTML formatting then process it to send out the email.
function processEmails(emails, emailBodyHTML, emailSubject, emailBody, userID) {
	let emailsFormatted = ''; // this will hold the comma deliminated list of emails to be sent
	const bccEmails = [
		// the list of emails to BCC
		'nardulli@rutgersprep.org',
		'nastus@rutgersprep.org',
	];

	for (let i = 0; i < emails.length; i++) {
		if (emails[i]) {
			emailsFormatted += `${emails[i]},`; // add email to the properly formatted list;
		}
	}

	try {
		// this sends the message to everyone on the emailsFormatted list.
		MailApp.sendEmail(emailsFormatted, emailSubject, emailBody, {
			htmlBody: emailBodyHTML,
			bcc: bccEmails.join(','),
			noReply: true,
		});

		markEmailSent(userID); // mark the user as having had the email sent.
	} catch (err) {
		Logger.log(`${err} - Could not send message to the following addresses: ${emailsFormatted}`);
	}
}

/**
 * Sends an email with everyone in the column BCC'd
 */
function sendEmails(data, emails, emailSubject) {
	const emailBody = getNOHTMLmessage(data); // contains the backup email body, if HTML isn't supported.
	const emailBodyHTML = getMessage(data); // get the content from the HTML Object.  This is the body of the email (defined on email.html)

	// this will send the emails, 50 people at a time, to avoid the API limit.
	while (emails.length) {
		processEmails(emails.splice(0, 49), emailBodyHTML, emailSubject, emailBody, data.id);
	}
}

// gets data from the "Formatted_w_ID" sheet, then checks each entry and ensures we actually want to send them an email before pushing the data out to send the message.
function getData() {
	const ss = SpreadsheetApp.getActiveSpreadsheet();
	const sheet = ss.getSheetByName('Formatted_w_ID');
	const newStuRange = sheet.getRange('A2:P'); // All of the data from the sheet.
	const newStuData = newStuRange.getValues();

	const schoolInfoSheet = ss.getSheetByName('School_Info');
	const schoolInfoRange = schoolInfoSheet.getRange('D5'); // this is the current grad year for grade 9.
	const ninthGradYear = schoolInfoRange.getValue();

	const users = []; // the ultimate data passed to the email

	newStuData.forEach((stuInfo) => {
		let stuGradYear = stuInfo[5]; // this is the "Description" column.  On the sheet it reads "Class of 20XX"
		stuGradYear = stuGradYear.replace(/[-\s+]/g, ''); // remove all spaces and '-' from the description.
		stuGradYear = stuGradYear.slice(-4); // grab the last 4 characters only (the students grad year).
		stuGradYear = parseInt(stuGradYear, 10); // Parse as an Int for comparrision below.

		// stuInfo[0] = user ID, stuInfo[14] = "Non-RPS Contact Email", stuInfo[15] = "Email Sent".
		if (stuInfo[0] && stuInfo[14] && stuInfo[15] !== 1 && (stuGradYear <= ninthGradYear)) {
			const user = {};

			[user.id, , , user.firstName, , , user.tempPassword, , , user.username, , , , , user.contactEmail] = stuInfo; // populate the user info for processing.

			users.push(user);
		}
	});

	return users;
}

// confirm that the user actually wants to send out the emails before sending them.
function emailConfirmation() {
	const ui = SpreadsheetApp.getUi();

	// Warn user that the user is about to send emails out to all eligible students.
	const result = ui.alert('All Upper School Students with an Email address listed will be notified.  Are you sure you want to contiue?', ui.ButtonSet.YES_NO);

	// Process the user's response.
	if (result === ui.Button.YES) {
		// User clicked "Yes".

		return true; // continue sending emails
	}

	// User clicked "No" or X in the title bar.
	return false; // stop the process and exit the script without making any changes.
}

// this get all the user data into an array, then sends emails to each entry in that array one at a time.
function getAllData() {
	let allUsers = []; // all user data will be stored here.
	let allEmails = []; // the final list of emails will be stored here.
	const subject = 'Rutgers Prep School New Student Accounts'; // define the subject for the email

	const confirm = emailConfirmation(); // confirm that the user wants to send the emails

	if (!confirm) {
		return false;
	}

	allUsers = getData(); // get data for users to whom we want to send an email.

	// loop through the allUsers array and pull out all the email address for mailing.
	for (let i = 0; i < allUsers.length; i++) {
		allEmails = []; // reset the email list

		allEmails.push(allUsers[i].contactEmail); // this is the Non-RPS Contact Email.

		sendEmails(allUsers[i], allEmails, subject); // send email for that user and mark as having been sent.
	}
}
