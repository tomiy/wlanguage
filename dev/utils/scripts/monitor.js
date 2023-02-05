const chokidar = require('chokidar');
const yaml = require('js-yaml');
const fs = require('fs');

// Var used to trigger initialization log messages. It is required by vsCode tasks (attribute : "ProblemMatcher").
// The ProblemMatcher is waiting for start and end messages before launching the debugger
var init = false;

// One-liner for current directory
chokidar.watch('./syntaxes/**/*.yaml').on('all', (event, path) => {
    if (!init) {
        console.log("Initializing watched directories");
    }

    if (['add', 'change'].includes(event)) {
        console.log(event, path);
        // Get document, or throw exception on error
        try {
            const jsonData = JSON.stringify(yaml.load(fs.readFileSync(path, 'utf8')), null, '    ');
            if (jsonData == undefined) throw `Fle ${path} is empty, file generation skipped`;
            fs.writeFile(`${path.replace(/\.[^/.]+$/, "")}.json`, jsonData, (err) => {if (err) throw err});
        } catch (e) {
            console.log(e);
        }
    }

    if (!init) {
        console.log("Initialization completed : watching changes...");
    }
});