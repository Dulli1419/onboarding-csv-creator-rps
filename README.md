# AD / ArgoNet Auto Import Scripts
This is a series of tools used to automate and track the creation of new accounts across all systems at RPS. It's specifically designed to create student accounts over the summer, when we need to create many accounts very quickly, but can be used at any time.
	
## Where Hosted
Google Apps Script / Google Sheets<br>
it's specifically tied to this sheet: https://docs.google.com/spreadsheets/d/1fl1uDZPox8sVJmpBiUOaBEXR6FjhW3CxCYyzMfTDIxM/edit?gid=1712760920#gid=1712760920

## How to Use


## Built For
RPS Tech Department

## Schedule
Most functions are on demand.

enrollAlertCompile() runs once daily at 10am. This updates the sheet with new enrollment info and populates new info for use in account creation. It also triggers an automatic email alert in the event that there is an enrollment change, in order to ensure everyone is aware that it occurred. This is run by googleapi@rutgersprep.org and doesn't require any other use to have access to it.

Recipients for enrollAlertCompile() can be updated in the file send_stu_alert.js.  At time of writing recipieints start on line 139.

## Authentication
To access anything you'll need access to the sheet where everything resides, and you'll need to give the scripts permission to run on your Google Account. The sheet has the scripts attached to it, and can be found in the Tech Shared Drive.

Exporting the CSV for use in updating Active Directory requires, only, that you have access to the spreadsheet. Although, you'll also need the corresponding Powershell scripts for those CSVs to be of any use (not kept in this repo).

The following 5 functions are added to the sheet automatically when you open it (in a drop down). The ArgoNet roles needed for each are as follows:

Update Student Info - Any Manager Role (inc. Platform Manager); Access to Advanced List 150265; Access to Advanced List 150529;  <br>
Update ArgoNet - Platform Manager; SKY API Data Sync; All roles listed for 'Update Student Info'<br>
Send Emails to Students - None, everything is done with data on the sheet<br>
Send Test Email - None, everything is done with data on the sheet<br>
Reset Sheet - None, everything is done with data on the sheet

## Users Given Access
narduli@rutgersprep.org
All users in Tech Shared Drive

## Dependencies


## Endpoints
Blackbaud SKY API - School - Core years<br>
Blackbaud SKY API - School - User update<br>
Blackbaud SKY API - School - Users custom fields create<br>
Blackbaud SKY API - School - Users custom fields update

## Advanced Lists
150265
150529

## Google Drive Link
Sheet: https://docs.google.com/spreadsheets/d/1fl1uDZPox8sVJmpBiUOaBEXR6FjhW3CxCYyzMfTDIxM/edit?gid=1712760920#gid=1712760920

Script: https://script.google.com/home/projects/12V4gJg-MBjhq_etXdvn7YsTsvjQFekPW_qhxLgT3HLIsod_D7X3PjQ0c/edit

## Google Drive Owner
Tech Shared Drive
