const fs = require("fs");
const path = require("path");

function listFiles(dir, level = 0) {
  let files;
  try {
    files = fs.readdirSync(dir);
  } catch (err) {
    console.error(`Error reading directory ${dir}: ${err.message}`);
    return;
  }

  files.forEach((file) => {
    let fullPath = path.join(dir, file);
    try {
      let stats = fs.statSync(fullPath);
      if (stats.isDirectory()) {
        console.log(" ".repeat(level * 4) + "└─" + file);
        listFiles(fullPath, level + 1);
      } else {
        console.log(" ".repeat(level * 4) + "└─" + file);
      }
    } catch (err) {
      console.error(`Error reading file ${fullPath}: ${err.message}`);
    }
  });
}

const directory = "S:\\development\\soft.vue.pf-forum\\src";
listFiles(directory);
