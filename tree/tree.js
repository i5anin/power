import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

function listFiles(dir, prefix = '') {
    let files;
    try {
        files = fs.readdirSync(dir);
    } catch (err) {
        console.error(chalk.red(`Error reading directory ${dir}: ${err.message}`));
        return;
    }

    files.forEach((file, index) => {
        let fullPath = path.join(dir, file);
        try {
            let stats = fs.statSync(fullPath);
            if (stats.isDirectory()) {
                console.log(chalk.blue(prefix + (index === files.length - 1 ? '└─' : '├─') + file));
                listFiles(fullPath, prefix + (index === files.length - 1 ? '    ' : '|   '));
            } else {
                console.log(prefix + (index === files.length - 1 ? '└─' : '├─') + file);
            }
        } catch (err) {
            console.error(chalk.red(`Error reading file ${fullPath}: ${err.message}`));
        }
    });
}

const directory = 'S:/development/soft.vue.pf-forum/src'; // Используйте свой путь
listFiles(directory);
