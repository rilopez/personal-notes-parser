const evernoteAppScript = new  require('./evernote-appscript.js');
const Datastore = require('nedb');
const _ = require('underscore');
const config = require('./config');
const db = new Datastore({filename: config.dbPath, autoload: true});
const limit = require("simple-rate-limiter");

let uploadToEvernote = limit(function(notebookName, note, onSucced, onError) {


    if (note.text){
       let noteTitle = note.diaryName + " N" +note.noteNumber + " "+ note.timestamp;
       evernoteAppScript.createNote(notebookName, noteTitle, note.text, note.timestamp,onSucced,onError);
    }else{
       console.log("note ignored because is empty "+ note._id);
    }

    // evernoteApi.createNote(notebookName, title, content, created)
    //             .then( onSucced)
    //            .catch(onError);
}).to(5).per(1000).evenly(true);

db.update({isSyncWithEvernote:true}, { $set: { isSyncWithEvernote: false } }, {multi:true}, function (err, numAffected) {
  console.log("reset flag isSyncWithEvernote  for "+numAffected +" records", err);
});



db.find({isSyncWithEvernote:false}, function (err, notes) {
    if (err) {
        console.error(err);
        return;
    }

    let noteCounter = 0;
    _.each(notes, function (note) {
        noteCounter++;
        let noteInfo = noteCounter + " of " + notes.length + " " + note.md5 + " " + note.diaryName+" " + note.noteNumber;

        let onSucced = ()=> {
            console.log("noteSaved ", noteInfo);
            db.update(note, { $set: { isSyncWithEvernote: true } }, {}, function (err, numAffected) {

            });
        };
        let onError = (err,appleScript)=> {
            console.error("error saving the note ",noteInfo,err);
            console.log("the script was \n",appleScript);
        };
        uploadToEvernote("testbook", note,onSucced,onError)

    });

});

