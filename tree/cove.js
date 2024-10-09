import fs from "fs";
import path from "path";
import chalk from "chalk";
import dotenv from "dotenv";

dotenv.config();

// Function to generate a unique short ID
function generateShortId() {
  // You can customize this function to generate your own IDs
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}

// Function to get branch symbols for tree representation
function getBranchSymbols(isLast) {
  return isLast ? "└─" : "├─";
}

// Function to determine file color based on extension
function getColorByExtension(fileName) {
  if (fileName.endsWith(".vue")) return chalk.green;
  if (fileName.endsWith(".js")) return chalk.yellow;
  if (fileName.endsWith(".ts")) return chalk.cyan;
  return chalk.white;
}

// Function to traverse directory and create node and edge data
function listFiles(dir, prefix = "", nodeMap = {}, edgeMap = {}) {
  let items = readDirectory(dir);
  if (!items) return;

  items.forEach((item, index) => {
    const isLast = index === items.length - 1;
    const branchSymbol = getBranchSymbols(isLast);
    const nodeId = generateShortId(); // Using a short ID

    // Create node information
    nodeMap[nodeId] = {
      id: nodeId,
      x: 0, // You'll need to calculate positions for your graph
      y: 0, // You'll need to calculate positions for your graph
      width: 250, // Adjust as needed
      height: 60, // Adjust as needed
      color: item.isDirectory ? "3" : "2",
      type: "text", // Change "text" to "file" and "folder"
      text: item.isDirectory ? item.name : item.name
    };

    const parentId = prefix ? Object.keys(nodeMap).pop() : null; // Get the last added node as parent

    // Create edge information
    if (parentId) {
      edgeMap[`${parentId}-${nodeId}`] = {
        id: `${parentId}-${nodeId}`,
        fromNode: parentId,
        fromSide: "right",
        toNode: nodeId,
        toSide: "left"
      };
    }

    if (item.isDirectory) {
      handleDirectory(item, prefix, branchSymbol, isLast, nodeMap, edgeMap);
    } else {
      handleFile(item, prefix, branchSymbol, nodeId, nodeMap);
    }
  });

  return { nodes: Object.values(nodeMap), edges: Object.values(edgeMap) };
}

// Function to read directory contents
function readDirectory(dir) {
  try {
    let items = fs
      .readdirSync(dir, { withFileTypes: true })
      .filter((dirent) => !dirent.name.startsWith(".")) // Exclude hidden files
      .map((dirent) => ({
        name: dirent.name,
        path: path.join(dir, dirent.name),
        isDirectory: dirent.isDirectory()
      }));

    // Recursively exclude nested 'node_modules'
    items = items.filter((item) => !item.name.startsWith("node_modules"));

    return items.sort((a, b) => sortItems(a, b));
  } catch (err) {
    console.error(chalk.red(`Error reading directory ${dir}: ${err.message}`));
    return null;
  }
}

// Function to sort directory items (folders first, then files)
function sortItems(a, b) {
  if (a.isDirectory && !b.isDirectory) return -1;
  if (!a.isDirectory && b.isDirectory) return 1;
  return a.name.localeCompare(b.name);
}

// Function to process a directory
function handleDirectory(item, prefix, branchSymbol, isLast, nodeMap, edgeMap) {
  const contents = fs.readdirSync(item.path);
  const color = contents.length > 0 ? chalk.blue : chalk.red;
  console.log(color(prefix + branchSymbol + item.name));

  // Calculate position based on depth
  const depth = prefix.split("│").length; // Count "│" to determine depth
  const x = depth * 150; // Increase x-coordinate for each level

  // Update the node's position
  const nodeId = Object.keys(nodeMap).pop(); // Get the last added node
  nodeMap[nodeId].x = x;
  nodeMap[nodeId].y = depth * 40; // Adjust y-coordinate for spacing

  if (contents.length > 0) {
    listFiles(item.path, prefix + (isLast ? "    " : "|   "), nodeMap, edgeMap);
  }
}

// Function to process a file
function handleFile(item, prefix, branchSymbol, nodeId, nodeMap) {
  const color = getColorByExtension(item.name);
  console.log(color(prefix + branchSymbol + item.name));

  // Adding the missing logic to populate nodeMap
  if (!nodeMap[nodeId]) {
    nodeMap[nodeId] = {
      id: nodeId,
      x: 0, // You'll need to calculate positions for your graph
      y: 0, // You'll need to calculate positions for your graph
      width: 250, // Adjust as needed
      height: 60, // Adjust as needed
      color: item.isDirectory ? "3" : "2",
      type: "text", // Change "text" to "file" and "folder"
      text: item.name
    };
  }
}

// Main function
const directory = process.env.DIRECTORY;
if (directory) {
  const result = listFiles(directory);
  fs.writeFileSync("output.json", JSON.stringify(result));
} else {
  console.error(chalk.red("Переменная окружения DIRECTORY не определена."));
}
