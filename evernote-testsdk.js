fs = require('fs');
crypto = require('crypto');
Evernote = require('evernote').Evernote;

//
// A simple Evernote API demo script that lists all notebooks in the user's
// account and creates a simple test note in the default notebook.
//
// Before running this sample, you must fill in your Evernote developer token.
//
// To run (Unix):
//   node EDAMTest.js
//

// Real applications authenticate with Evernote using OAuth, but for the
// purpose of exploring the API, you can get a developer token that allows
// you to access your own Evernote account. To get a developer token, visit
// https://sandbox.evernote.com/api/DeveloperToken.action
var authToken = "S=s1:U=9321a:E=16002e88f30:C=158ab3760b8:P=1cd:A=en-devtoken:V=2:H=dfa4dbac924b0d1b93b75916355ad1ff";

if (authToken == "your developer token") {
    console.log("Please fill in your developer token");
    console.log("To get a developer token, visit https://sandbox.evernote.com/api/DeveloperToken.action");
    process.exit(1);
}

// Initial development is performed on our sandbox server.
//
// To use the production service, set isSandbox to false and replace your
// developer token above with a token from
// https://www.evernote.com/api/DeveloperToken.action
//
// To use the Evernote China service, set isSandbox to false and isChina to true, then replace your
// developer token above with a token from
// https://app.yinxiang.com/api/DeveloperToken.action
//
// For more information about Evernote China service, please visit
// https://dev.evernote.com/doc/articles/bootstrap.php
var isSandbox = true;
var isChina = false;
var client = new Evernote.Client({token: authToken, sandbox: isSandbox, china: isChina});

var userStore = client.getUserStore();

userStore.checkVersion(
    "Evernote EDAMTest (Node.js)",
    Evernote.EDAM_VERSION_MAJOR,
    Evernote.EDAM_VERSION_MINOR,
    function(err, versionOk) {
        console.log("Is my Evernote API version up to date? " + versionOk);
        console.log();
        if (!versionOk) {
            process.exit(1);
        }
    }
);

var noteStore = client.getNoteStore();

// List all of the notebooks in the user's account
var notebooks = noteStore.listNotebooks(function(err, notebooks) {
    console.log("Found " + notebooks.length + " notebooks:");
    for (var i in notebooks) {
        console.log("  * " + notebooks[i].name);
    }
});

// To create a new note, simply create a new Note object and fill in
// attributes such as the note's title.
var note = new Evernote.Note();
note.title = "Test note from EDAMTest.js";


// The content of an Evernote note is represented using Evernote Markup Language
// (ENML). The full ENML specification can be found in the Evernote API Overview
// at http://dev.evernote.com/documentation/cloud/chapters/ENML.php
note.content = '<?xml version="1.0" encoding="UTF-8"?>';
note.content += '<!DOCTYPE en-note SYSTEM "http://xml.evernote.com/pub/enml2.dtd">';
note.content += '<en-note>Here is the Evernote logo:<br/>';

note.content += '</en-note>';

// Finally, send the new note to Evernote using the createNote method
// The new Note object that is returned will contain server-generated
// attributes such as the new note's unique GUID.
noteStore.createNote(note, function(err, createdNote) {
    console.log();
    console.log("Creating a new note in the default notebook");
    console.log();
    console.log("Successfully created a new note with GUID: " + createdNote.guid);
});