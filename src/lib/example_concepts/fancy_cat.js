var fs = require('fs'),
    path = require('path'),
    outputFile = process.argv[2],
    count = 0,
    numFiles;

fs.readdir('.', function(e, files) {
    'use strict';
    fs.writeFileSync(outputFile, 'var testFiles = [');
    numFiles = files.length;
    for (var i = numFiles; i--;) {
        if (path.extname(files[i]) === '.yaml') {
            transformFile(files[i]);
        } else {
            numFiles--;
        }
    }
});

var transformFile = function(filename) {
        'use strict';

        fs.readFile(filename, 'utf-8', function(err, text) {
            
            var newText = '{name: \''+filename+'\', content: ';
            newText += text.replace(/^.*$/mg, function(content) {

                return "'"+content+"\\n'+";
            });

            // Hack to avoid the trailing + sign
            newText += "''},\n";
            fs.appendFileSync(outputFile, newText);
            console.log('File written to '+outputFile);
            console.log('count is', count);
            console.log('numFiles is', numFiles);
            if (++count === numFiles) {
                console.log('calling finishFile');
                finishFile();
            }
        });
};

var finishFile = function() {
    fs.appendFileSync(outputFile, '];');
};
