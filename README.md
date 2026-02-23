# AD / ArgoNet Auto Import Scripts
This is a series of tools used to automate and track the creation of new accounts across all systems at RPS. It's specifically designed to create student accounts over the summer, but can be used at any time.
	
## Where Hosted
Google Apps Script / Google Sheets (it's specifically tied to a Google Sheet)

## How to Use


## Built For
RPS Tech Department

## Schedule
Most functions are on demand.

enrollAlertCompile() runs once daily at 10am. This updates the sheet with new enrollment info and populates new info for use in account creation. It also triggers an automatic email alert in the event that there is an enrollment change, in order to ensure everyone is aware that it occurred.

## Authentication
Exporting the CSV for use in updating Active Directory requires, only, that you have access to the spreadsheet. Although, you'll also need the corresponding Powershell scripts for those CSVs to be of any use.

The following 5 functions are added to the sheet automatically when you open it (in a drop down). The permissions for each are as follows:

Update Student Info
Update ArgoNet - Platform Manager
Send Emails to Students
Send Test Email
Reset Sheet

## Users Given Access
narduli@rutgersprep.org
All users in Tech Shared Drive

## Dependencies
npm & node.js - other dependencies as listed in package.json

CLASP.  installed by running 
```
npm i @google/clasp -g
```
A short tutorial on clasp can be found here: https://medium.com/geekculture/how-to-write-google-apps-script-code-locally-in-vs-code-and-deploy-it-with-clasp-9a4273e2d018

## Endpoints
Blackbaud SKY API - School - User update
Blackbaud SKY API - School - Users custom fields create
Blackbaud SKY API - School - Users custom fields update

## Advanced Lists
None

## Google Drive Link
None

## Google Drive Owner
N/A
