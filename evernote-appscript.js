var applescript = require("applescript");
var exports = module.exports = {};

function _createNote(notebook, title, content, timestamp){

var
    script = 'tell application "Evernote" to create note title ' + JSON.stringify(title)
           +' with text '+ JSON.stringify(content)
         + ' notebook ' + JSON.stringify(notebook);



    console.log('--------------------------');
    console.log(script);

    applescript.execString(script, function(err, rtn) {
        var _script = script;
        if (err) {
            // Something went wrong!
            console.log(_script);
            throw err;
        }

        console.log("rtn:", JSON.stringify(rtn));
    });


}






exports.createNote= _createNote;


