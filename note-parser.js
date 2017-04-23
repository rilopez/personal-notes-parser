var fs = require('fs');
var path = require('path');
var LineByLineReader = require('line-by-line');
var _ = require('underscore');
var moment = require('moment');

var EvernoteApi = require('./evernote-api.js').EvernoteApi;


var IS_LINE_REGEX = new RegExp("-{4,}");
var IS_LINE_NOTE_START = new RegExp("\/\/-{2,}");

function tryToExtractTimestamp(textLine) {
    var yearReg = '(20[0-1][0-9])';            ///< Allows a number between 2014 and 2029
    var monthReg = '(0[1-9]|1[0-2])';               ///< Allows a number between 00 and 12
    var dayReg = '(0[1-9]|1[0-9]|2[0-9]|3[0-1])';   ///< Allows a number between 00 and 31
    var hourReg = '([0-1][0-9]|2[0-3])';            ///< Allows a number between 00 and 24
    var minReg = '([0-5][0-9])';                    ///< Allows a number between 00 and 59
    var secReg = '([0-5][0-9])';                    ///< Allows a number between 00 and 59
    var timestampFormats = [
        {
            format: 'MM/DD/YYYY HH:mm:ss',
            regex: new RegExp(monthReg + '/' + dayReg + '/' + yearReg + ' ' + hourReg + ':' + minReg + ':' + secReg, 'g')
        },
        {
            format: 'DD/MM/YYYY HH:mm:ss',
            regex: new RegExp(dayReg + '/' + monthReg + '/' + yearReg + ' ' + hourReg + ':' + minReg + ':' + secReg, 'g')
        },
        {
            format: 'YYYY-MM-DDTHH:mm:ss',
            regex: new RegExp(yearReg + '-' + monthReg + '-' + dayReg + 'T' + hourReg + ':' + minReg + ':' + secReg, 'g')
        },
        {
            format: 'MM/DD/YYYY',
            regex: new RegExp(monthReg + '/' + dayReg + '/' + yearReg, 'g')
        },
        {
            format: 'DD/MM/YYYY',
            regex: new RegExp(dayReg + '/' + monthReg + '/' + yearReg, 'g')
        },
    ];


    var formatItem = _.find(timestampFormats, function (item) {
        return item.regex.test(textLine);
    });


    if (formatItem) {
        var regexResult = textLine.match(formatItem.regex);
        return moment(regexResult[0], formatItem.format);
    }

    return null;


}

function getLineInfo(textLine) {
    var info = {
        containsDashLine: IS_LINE_REGEX.test(textLine),
        isNoteStart: IS_LINE_NOTE_START.test(textLine)
    };

    if (info.containsDashLine && /[0-9]+/.test(textLine)) {
        info.timestamp = tryToExtractTimestamp(textLine);
    }
    return info;
}

function exportNotesFromTextFile(diaryPath, evernoteApi) {
    return new Promise((resolve, reject) => {
        var row = 0;
        var notes = [];
        var currentNote = {text: ""};
        var previousDashInfo;
        var lastKnownTimestamp = null;
        var notesExported = 0;


        notes.push(currentNote);
        var lr = new LineByLineReader(diaryPath, {skipEmptyLines: false});
        lr.on("open", function () {
            console.log('exporting notes in :' + diaryPath);

        });
        lr.on('error', function (err) {
            console.log('ERROR exporting notes in :' + diaryPath);
            throw err;
        });


        lr.on('line', function (line) {
            var lineInfo = getLineInfo(line);

            lineInfo.row = ++row;
            if (lineInfo.timestamp) {
                lastKnownTimestamp = lineInfo.timestamp;
            }

            if (lineInfo.timestamp || lineInfo.isNoteStart) {
                currentNote = {
                    timestamp: lineInfo.timestamp || lastKnownTimestamp,
                    text: ""
                }
                notes.push(currentNote);
            }

            currentNote.text += line + "\n";
            previousDashInfo = lineInfo;
        });

        lr.on('end', function () {

            var parsedFilename = path.basename(diaryPath, ".txt");

            const promises = []
            _.each(notes, function (note) {
                if (note.text) {

                    notesExported++;

                    var momentNote = (note.timestamp ? note.timestamp : moment());
                    var timestampStr = momentNote.format("YYYY-MM-DDThh:mm:ss");
                    var timestamp = momentNote.utc().valueOf();
                    var noteTitle = parsedFilename + "-" + "note-" + notesExported + " " + timestampStr;

                    promises.push(evernoteApi.createNote("testbook", noteTitle, note.text, timestamp));
                }
            })
            console.log(" notes exported:" + notesExported + " , Readed:" + notes.length, ' diaryPath:' + diaryPath);
            Promise.all(promises)
                .then((notes) => {
                        resolve(notes)
                })
                .catch((err) => {
                    reject(err)
                })
        });
    })
}


//--- Main program

var sourceDir = __dirname;
var evernoteApi = new EvernoteApi();

let parsing = true
function parse (files) {
    const promises = []
    files.forEach(function (file) {
        console.log(file);
        if (path.extname(file) == ".txt") {
            promises.push(exportNotesFromTextFile(path.join(sourceDir, file), evernoteApi));
        }
    });

    Promise.all(promises)
        .then((notes) => {
            console.log('done');
            parsing = false;
        })
        .catch((err) => {
            console.log(err);
            parsing = false;
        })
}

function wait () {
    if (parsing) {
        setTimeout(() => {
            wait()
        }, 1000)
    } else {
        process.exit(0)
    }
}

fs.readdir(sourceDir, function (err, files) {
    if (err) {
        console.log(err)
    }
    parse(files)
    wait()
});
