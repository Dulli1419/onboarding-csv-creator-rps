# AD / ArgoNet Auto Import Scripts
This is a series of tools used to automate and track the creation of new accounts across all systems at RPS. It's specifically designed to create student accounts over the summer, when we need to create many accounts very quickly, but can be used at any time.
	
## Where Hosted
Google Apps Script / Google Sheets<br>
it's specifically tied to this [sheet](https://docs.google.com/spreadsheets/d/1fl1uDZPox8sVJmpBiUOaBEXR6FjhW3CxCYyzMfTDIxM/edit?gid=1712760920#gid=1712760920)

## How to Use
The individual functions can be executed from the 'Custom' dropdown that the script automatically populates when the sheet is open.  They work as follows:

* Update Student Info - Update Student Info on the Sheet, data is pulled from ArgoNet.
* Update ArgoNet - Update ArgoNet with the info that is populated on the sheet.
* Send Emails to Students - Sends pre-written welcome email to students, including username and temporary password. Emails will only be sent if the 'Email Sent' column is blank and if the student is in the Upper School.
* Send Test Email - Will request the email address where the test email should be sent. Fake student info will be automatically populated. This is used for proofreading the email that is sent using 'Send Emails to Students'
* Reset Sheet - Clears most of the data from the sheet in order to reset the info back to zero before pulling new data from ArgoNet. Should be used in between school years.

The function enrollAlertCompile() is schedule and triggered by a separate account - that will take care of itself.

How to properly prepare the environment to receive this data, when to use it, in what order, and notes about potential pitfalls are outside the scope of this README. Please see this [document](https://docs.google.com/document/d/1F4UmhmGVFSpLfkO7m_QHJk1Y3RL5uVTYzRuuJKM6JOw/edit?tab=t.0) for step by step instructions.

## Built For
RPS Tech Department

## Schedule
Most functions are on demand.

enrollAlertCompile() runs once daily at 10am. This updates the sheet with new enrollment info and populates new info for use in account creation. It also triggers an automatic email alert in the event that there is an enrollment change, in order to ensure everyone is aware that it occurred. This is run by googleapi@rutgersprep.org and doesn't require any other use to have access to it.

Recipients for enrollAlertCompile() can be updated in the file send_stu_alert.js.  At time of writing recipients start on line 139.

## Authentication
To access anything you'll need access to the sheet where everything resides, and you'll need to give the scripts permission to run on your Google Account. The sheet has the scripts attached to it, and can be found in the Tech Shared Drive.

Exporting the CSV for use in updating Active Directory requires, only, that you have access to the spreadsheet. Although, you'll also need the corresponding PowerShell scripts for those CSVs to be of any use (not kept in this repo).

The following 5 functions are added to the sheet automatically when you open it (in a drop down). The ArgoNet roles needed for each are as follows:

* Update Student Info - Any Manager Role (inc. Platform Manager); Access to Advanced List 150265; Access to Advanced List 150529
* Update ArgoNet - Platform Manager; SKY API Data Sync; All roles listed for 'Update Student Info'
* Send Emails to Students - None, everything is done with data on the sheet
* Send Test Email - None, everything is done with data on the sheet
* Reset Sheet - None, everything is done with data on the sheet

## Users Given Access
narduli@rutgersprep.org<br>
All users in Tech Shared Drive

## Dependencies
ArgoNet Access Library:<br>
Script ID: 1Ap988uVZ1D8CZmRw1f3JlpFJgpUh_IUzQeTuFRUbp9na4ytqB0ntZvJt<br>
Ver. 12 at time of writing.

## Endpoints
* Blackbaud SKY API - School - Core years
* Blackbaud SKY API - School - Users extended by role(s)
* Blackbaud SKY API - School - Users enrollments by year
* Blackbaud SKY API - School - List Single
* Blackbaud SKY API - School - User update
* Blackbaud SKY API - School - Users custom fields create
* Blackbaud SKY API - School - Users custom fields update

## Advanced Lists
"All Students for account Creation" | Created By: Michael Nardulli | ID: 150265<br>
"All Students for Account Deactivation" | Created By: Michael Nardulli | ID: 150529

## Google Drive Link
Sheet: https://docs.google.com/spreadsheets/d/1fl1uDZPox8sVJmpBiUOaBEXR6FjhW3CxCYyzMfTDIxM/edit?gid=1712760920#gid=1712760920

Script: https://script.google.com/home/projects/12V4gJg-MBjhq_etXdvn7YsTsvjQFekPW_qhxLgT3HLIsod_D7X3PjQ0c/edit

## Google Drive Owner
Tech Shared Drive
