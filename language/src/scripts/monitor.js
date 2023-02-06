const chokidar = require('chokidar');
const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');

// Var used to trigger initialization log messages. It is required by vsCode tasks (attribute : "ProblemMatcher").
// The ProblemMatcher is waiting for start and end messages before launching the debugger
var problemMatcherStartMessage = "Files change detected";
var problemMatcherEndMessage = "Files processed : watching changes...";

// tmLanguage watcher
chokidar.watch('./language/src/data/syntaxes/wlanguage.tmLanguage.yaml').on('all', (event, pathString) => {
    console.log(problemMatcherStartMessage);

    if (['add', 'change'].includes(event)) {
        console.log(event, pathString);
        // Get document, or throw exception on error
        try {
            const jsonData = JSON.stringify(yaml.load(fs.readFileSync(pathString, 'utf8')), null, '    ');
            if (jsonData == undefined) throw `File ${pathString} is empty, file generation skipped`;
            let destination = `${pathString.replace('src', 'dist').replace(/\.[^/.]+$/, "")}.json`;

            fs.mkdir(path.dirname(destination), { recursive: true }, (err) => {
                if (err) throw err;
                fs.writeFile(destination, jsonData, (err) => { if (err) throw err });
            });
        } catch (e) {
            console.log(e);
        }
    }

    console.log(problemMatcherEndMessage);
});