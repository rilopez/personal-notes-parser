var applescript = require("applescript");

// Very basic AppleScript command. Returns the song name of each
// currently selected track in iTunes as an 'Array' of 'String's.
var script = 'tell application "Evernote" to create note title "Note 1" with text "Here is my new text note" notebook "testnotes" ';

applescript.execString(script, function(err, rtn) {
    if (err) {
        // Something went wrong!
        throw err;
    }

    console.log("rtn:", JSON.stringify(rtn));
});