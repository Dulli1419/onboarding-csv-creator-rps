# apps-script-template
This is a blank project to use as a starting point for future Google Apps Scripts projects.
	
## Where Hosted
N/A

## How to Use
First - Make sure to have both npm and node.js installed (installing node should automatically install npm).  Node.js is available here: https://nodejs.org/en/download/

Duplicate the repository by clicking "Use this template" on the web interface (https://github.com/Dulli1419/apps-script-template) and then select "Create a new repository".  Once created clone it to your workspace to get started.

After you clone the new repository make sure to run 
```
npm init
```
from terminal, wiithin the directory, to update the package.json file as is appropriate.

finally run
```
npm install
```
from terminal, within the directory, to quickly install all dependencies listed in package.json

NOTE: the .gitignore file includes a reservation for a directory called "localDev".  Create that directory as a quick place to keep all of your files that you want kept local only.

Note: the .gitignore also excludes the node_modules folder.  You may want to remove this from the .gitignore from your project but that folder will be populated by package.json when your run
```
npm install
```
so it didn't seem necessary to keep it as part of the repository in the template.

Also note that this file brings in basic configurations to start working with CLASP.  To pull in your Google Apps Script Projcet run
```
clasp login //only needed if you are not authenticated against your GAS account
clasp clone GASPROJECT_ID
```
When your clone the project from GAS any files with the same name (as in code.js) will be overwritten with the version from GAS, but other nothing will be deleted.  CLASP auto converts .gs files to .js for local development and vice versa so you don't need to worry about managing that.

## Built For
Personal Use, quick starting development.

## Schedule
N/A

## Authentication
N/A

## Users Given Access
N/A

## Dependencies
npm & node.js - other dependencies as listed in package.json

CLASP.  installed by running 
```
npm i @google/clasp -g
```
A short tutorial on clasp can be found here: https://medium.com/geekculture/how-to-write-google-apps-script-code-locally-in-vs-code-and-deploy-it-with-clasp-9a4273e2d018

## Endpoints
None

## Advanced Lists
None

## Google Drive Link
None

## Google Drive Owner
N/A
