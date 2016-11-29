var fs = require('fs');
var crypto = require('crypto');
var Evernote = require('evernote').Evernote;
var xmlbuilder = require('xmlbuilder');
var _ = require('underscore');
var limit = require("simple-rate-limiter");
var exports = module.exports = {};




function getClient(authToken, isSandbox, isChina) {
    var client = new Evernote.Client({token: authToken, sandbox: isSandbox, china: isChina});

    var userStore = client.getUserStore();

    userStore.checkVersion(
        "Evernote EDAMTest (Node.js)",
        Evernote.EDAM_VERSION_MAJOR,
        Evernote.EDAM_VERSION_MINOR,
        function (err, versionOk) {
            console.log("Is my Evernote API version up to date? " + versionOk);
            console.log();
            if (!versionOk) {
                process.exit(1);
            }
        }
    );

    return client;
}


function textToENML(text) {
    var xml = xmlbuilder.create('en-note', {version: '1.0', encoding: 'UTF-8', standalone: false},
        {sysID: 'http://xml.evernote.com/pub/enml2.dtd'},
        {allowSurrogateChars: true});


    xml.ele("pre").txt(text);

    var xmlExportedString = xml.end({
        pretty: true,
        indent: '  ',
        newline: '\n',
        allowEmpty: false
    });
    return xmlExportedString;
}


function EvernoteApi() {
    var authToken = process.env.EVERNOTE_AUTH_TOKEN || "your developer token";
    var isSandbox = true;
    var isChina = false;

    if (authToken == "your developer token") {
        console.log("Please fill in your developer token in a OS Env variable named EVERNOTE_AUTH_TOKEN");
        console.log("To get a developer token, visit https://sandbox.evernote.com/api/DeveloperToken.action");
        process.exit(1);
    }

    var client = getClient(authToken, isSandbox, isChina)
    var noteStore = client.getNoteStore();
    var notebooksCache = {};
    var reqCounter = 0;

    function _createNote(notebookGuid, title, content, created) {
        var note = new Evernote.Note();
        note.notebookGuid = notebookGuid;
        note.title = title;
        note.content = textToENML(content);
        note.created = created;

        noteStore.createNote(note, function (err, createdNote) {
            if (err) {
                console.log("err: " + JSON.stringify(err));
                process.exit(1);

            }

        });
    }

    this.createNote = limit(function (notebookName, title, content, created) {
        reqCounter++;

        if (notebooksCache[notebookName]) {
            console.log("reqCounter: " + reqCounter + " using notebook cache");
            _createNote(notebooksCache[notebookName].guid, title, content, created);


        } else {
            console.log("reqCounter: " + reqCounter + " without notebook cache");
            noteStore.listNotebooks(function (err, notebooks) {

                if (err) {
                    console.log("err:" + JSON.stringify(err));
                    process.exit(1);
                }

                var notebook = null;
                for (var i in notebooks) {
                    if (notebooks[i].name === notebookName) {
                        notebook = notebooks[i];
                        break;
                    }
                }
                if (!notebook) {
                    console.log("notebook named " + notebookName + " not found");
                    process.exit(1);
                }
                notebooksCache[notebookName] = notebook;
                _createNote(notebook.guid, title, content, created);


            });
        }


    }).to(1).per(1000);


}


exports.EvernoteApi = EvernoteApi;




