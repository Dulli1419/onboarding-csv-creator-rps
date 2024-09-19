// JavaScript Document
/* eslint-env es6 */

// this takes the data from the sheet and builds a message without HTML formatting, in case that isn't supported. data in this context is the result of enrollAlertCompile().
function getNOHTMLStuAlertMessage(data) {
	let text = '';

	text += 'Good Morning!\n\n';

	text += 'The enrollment record has been altered in the last 24 hours.\nPlease see below:\n\n';

	text += '\n\n--------------------------------\n';

	text += 'New Students:';

	text += '\n--------------------------------';

	text += '\n\nUpper School';

	text += '\n---------';

	for (let i = 0; i < data.newInfo.length; i++) {
		if (data.newInfo[i].division === 'US') {
			text += `\n${data.newInfo[i].name}`;
		}
	}

	text += '\n\nMiddle School';

	text += '\n---------';

	for (let i = 0; i < data.newInfo.length; i++) {
		if (data.newInfo[i].division === 'MS') {
			text += `\n${data.newInfo[i].name}`;
		}
	}

	text += '\n\nLower School';

	text += '\n---------';

	for (let i = 0; i < data.newInfo.length; i++) {
		if (data.newInfo[i].division === 'LS') {
			text += `\n${data.newInfo[i].name}`;
		}
	}

	text += '\n\n--------------------------------\n';

	text += 'Withdrawing Students:';

	text += '\n--------------------------------';

	text += '\n\nUpper School';

	text += '\n---------';

	for (let i = 0; i < data.withdrawInfo.length; i++) {
		if (data.withdrawInfo[i].division === 'US') {
			text += `\n${data.withdrawInfo[i].name}`;
		}
	}

	text += '\n\nMiddle School';

	text += '\n---------';

	for (let i = 0; i < data.withdrawInfo.length; i++) {
		if (data.withdrawInfo[i].division === 'MS') {
			text += `\n${data.withdrawInfo[i].name}`;
		}
	}

	text += '\n\nLower School';

	text += '\n---------';

	for (let i = 0; i < data.withdrawInfo.length; i++) {
		if (data.withdrawInfo[i].division === 'LS') {
			text += `\n${data.withdrawInfo[i].name}`;
		}
	}

	text += '\n\n----------------\n\n';

	text += 'Have a great day!\n\n\n';

	text += 'This email was sent from a notification-only address and cannot accept incoming email.\n\nIf you are seeing this version of this message your email client does not support HTML.';

	return text;
}

// this gets the written email from email.html, then gets the data from the sheet and adds it to the email template.  Then returns that as the htmlBody;
function getStuAlertMessage(data) {
	const htmlTemplate = HtmlService.createTemplateFromFile('stu_alert');
	htmlTemplate.data = data; // data is passed to the function but, in this context, is the result of "enrollAlertCompile()".  Here we pass it to the HTML to be added to the email.
	const htmlBody = htmlTemplate.evaluate().getContent();
	return htmlBody;
}

// this take the list of people to send the message to, the subject line, and the email body content both with and without HTML formatting then process it to send out the email.
function processStuAlert(emails, emailBodyHTML, emailSubject, emailBody) {
	const emailsFormatted = ''; // this will hold the comma deliminated list of emails to be sent
	const bccEmails = emails;

	try {
		// this sends the message to everyone on the emailsFormatted list.
		MailApp.sendEmail(emailsFormatted, emailSubject, emailBody, {
			htmlBody: emailBodyHTML,
			bcc: bccEmails.join(','),
			noReply: true,
		});
	} catch (err) {
		Logger.log(`${err} - Could not send student alert`);
	}
}

// this compiles the email body and merges it with the info from enrollAlertCompile() before pushing it out to be processed.
function sendStuAlert(data, emails, emailSubject) {
	const emailBody = getNOHTMLStuAlertMessage(data); // contains the backup email body, if HTML isn't supported.
	const emailBodyHTML = getStuAlertMessage(data); // get the content from the HTML Object.  This is the body of the email (defined on stu_alert.html)

	// this will send the emails, 50 people at a time, to avoid the API limit.
	while (emails.length) {
		processStuAlert(emails.splice(0, 49), emailBodyHTML, emailSubject, emailBody);
	}
}

// this compiles the enrollment changes and evaluates which users should recieve the notification, then sends that info out to be processed before being sent.
function enrollAlertCompile() {
	const stuData = enrollmentUpdate(); // get info about enrollment changes from ArgoNet
	const subject = 'Enrollment Update!'; // define the subject for the email

	// if there have been no changes to enrollment don't send the email.
	if (!stuData.emailLS && !stuData.emailMS && !stuData.emailUS) {
		return Logger.log('no change to enrollment'); // also log that fact to the console.
	}

	let allEmails = [
		'nardulli@rutgersprep.org',
		'lensborn@rutgersprep.org',
		'engelmann@rutgersprep.org',
		'domanski@rutgersprep.org',
		'rutman@rutgersprep.org',
		'nurse@rutgersprep.org',
		'msantowasso@rutgersprep.org',
		'loy@rutgersprep.org',
		'forte@rutgersprep.org',
		'sullivan@rutgersprep.org',
		'smith@rutgersprep.org',
		'printon@rutgersprep.org',
		'ladd@rutgersprep.org',
	]; // list of people that recieve the notificaiton regardless of division.
	const usRecipient = ['ryan@rutgersprep.org', 'bautista-burk@rutgersprep.org', 'chodl@rutgersprep.org']; // US only recipients
	const msRecipient = ['mcmillen@rutgersprep.org', 'simpson@rutgersprep.org', 'marotto@rutgersprep.org', 'bratek@rutgersprep.org']; // MS only recipients
	const lsRecipient = ['tolia@rutgersprep.org', 'keane@rutgersprep.org']; // LS only recipients

	// if there are US students, email the US.
	if (stuData.emailUS) {
		allEmails = [...usRecipient, ...allEmails];
	}

	// if there are MS students, email the MS.
	if (stuData.emailMS) {
		allEmails = [...msRecipient, ...allEmails];
	}

	// if there are LS students, email the LS.
	if (stuData.emailLS) {
		allEmails = [...lsRecipient, ...allEmails];
	}

	updateAll(false, 1); // update student info to the sheet without resetting the user's credentials.
	sendStuAlert(stuData, allEmails, subject); // send email for that user and mark as having been sent.
}
