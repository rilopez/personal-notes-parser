const fs = require('fs');
const path = require('path');
const LineByLineReader = require('line-by-line');
const _ = require('underscore');
const moment = require('moment');
const util = require('util');
const Datastore = require('nedb');
const crypto = require('crypto');
const config = require('./config');

const IS_LINE_REGEX = new RegExp("-{4,}");
const IS_LINE_NOTE_START = new RegExp("\/\/-{2,}");

const db = new Datastore({filename: config.dbPath, autoload: true});


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

function exportNotesFromTextFile(diaryPath) {
    var row = 0;
    var notes = [];
    var currentNote = {text: ""};
    var previousDashInfo;
    var lastKnownTimestamp = null;

    var parsedFilename = path.basename(diaryPath, ".txt");

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
            var noteTimestamp = lineInfo.timestamp || lastKnownTimestamp;
            var momentNote = (noteTimestamp ? noteTimestamp : moment());
            var timestampStr = momentNote.toISOString();
            currentNote = {
                md5: null,
                evernoteGuid: null,
                isSyncWithEvernote: false,
                timestamp: timestampStr,
                diaryName: parsedFilename,
                text: "",
                noteNumber:notes.length
            };
            notes.push(currentNote);
        }
        currentNote.text += line + "\n";
        previousDashInfo = lineInfo;
    });

    lr.on('end', function () {
        var exportedJsonFile = path.join(config.targetDir, parsedFilename + '.json');

        _.each(notes, function (note) {
            const hash = crypto.createHash('md5');
            note.md5 = hash.update(note.text).digest('hex');
            note.isSyncWithEvernote = false;
            db.insert(note, function (err, newDoc) {
                if (err) {
                    console.log("Error while saving note " + note.title + " ", err);
                }
            });
        });

        fs.writeFileSync(exportedJsonFile, JSON.stringify(notes, null, 2), 'utf-8');
        console.log(" notes  Readed:" + notes.length, ' diaryPath:' + diaryPath);
    });
}


//--- Main program
let indexErrorHandler = function (err) {
    if (err) {console.error(err)}
};

db.remove({}, {multi: true}, function (err, numRemoved) {
    console.log("[cleaning db]  numRemoved: " + numRemoved + " err" + err);
});


db.ensureIndex({ fieldName: 'isSyncWithEvernote' }, indexErrorHandler);
db.ensureIndex({ fieldName: 'md5'}, indexErrorHandler);
db.ensureIndex({ fieldName: 'evernoteGuid'}, indexErrorHandler);



fs.readdir(config.sourceDir, function (err, files) {
    files.forEach(function (file) {
        if (path.extname(file) == ".txt") {
            exportNotesFromTextFile(path.join(config.sourceDir, file));
        }
    });
});

