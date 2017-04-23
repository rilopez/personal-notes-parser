const applescript = require("applescript");
const moment = require('moment');

//const isoConvert


function _createNote(notebook, title, content, timestamp,onSucced, onError) {

    let dateStr = moment(timestamp).format("MM/DD/YYYY");
    let timeStr = moment(timestamp).format("HH:mm");
    let
        script = 'tell application "Evernote" to create note title ' + JSON.stringify(title)
            + ' with html ' + JSON.stringify("<pre>"+  content+"</pre>")
            + ' notebook ' + JSON.stringify(notebook)
            + ' created date ' + JSON.stringify(dateStr + " at " + timeStr);


    applescript.execString(script, function (err, rtn) {
        let _script = script;
        if (err) {
            // Something went wrong!
            onError(err,_script);
        }else{
            onSucced(rtn)
        }


    });
}


module.exports.createNote = _createNote;


