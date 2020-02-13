const fs = require("fs");
const net = require("net");
const request = require("request");
const log = console.log;
const readline = require("readline");

const readLine2 = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});
//input function
const getArguments = function() {
  return process.argv.slice(2);
};
//download function
const getFileSize = (path, callback) => {
  const stats = fs.statSync(path);
  const fileSizeInBytes = stats.size;
  return callback(
    null,
    `Downloaded and saved ${fileSizeInBytes} bytes to ${path}`
  );
};
//file saved
const writeFile = (data, path, callback) => {
  fs.writeFile(path, data, error => {
    if (error) return callback(error, null);
    return callback(null, "File saved!");
  });
};

const promtToOverwrite = callback => {
  readLine2.question(
    `File already exists, would you like to overwrite? (Y/N) `,
    replace => {
      if (/[yY]/.test(replace)) {
        callback(null, true);
      } else {
        return callback("File can't be replaced", null);
      }
      readLine2.close();
    }
  );
};

const checkIfFile = (path, callback) => {
  fs.stat(path, (error, stats) => {
    if (error) {
      if (error.code === "ENOENT") {
        return callback(null, false);
      } else {
        return callback(error, null);
      }
    }
    callback(null, stats.isFile());
  });
};

const fetchPage = (url, path, callback) => {
  request(url, (error, resp, body) => {
    if (error) return callback(error, null);
    if (resp.statusCode !== 200) {
      return callback(
        Error(
          `Status Code ${resp.statusCode} when fetching page. Response: ${body}`
        ),
        null
      );
    }
    callback(null, body);
  });
};

const getInput = callback => {
  const paths = getArguments();
  if (!/[.][/][a-zA-Z0-9-]+[.][a-zA-Z0-9-]+/.test(paths[1])) {
    callback(possibleErrors.PATH_ERROR, null);
    printMessage("general");
  } else {
    fetchPage(paths[0], paths[1], (error, data) => {
      if (error) {
        return callback(error, null);
      }
      checkIfFile(paths[1], (error, exists) => {
        if (error) {
          return callback(error, null);
        }
        if (exists) {
          promtToOverwrite((error, replace) => {
            if (error) {
              return callback(error, null);
            }
            if (replace) {
              // a replace
              writeFile(data, paths[1], (error, success) => {
                if (error) {
                  return callback(error, null);
                } else if (success) {
                  getFileSize(paths[1], (error, success) => {
                    return callback(null, success);
                  });
                }
              });
            }
          });
        } else {
          writeFile(data, paths[1], (error, success) => {
            if (error) {
              return callback(error, null);
            } else if (success) {
              getFileSize(paths[1], (error, success) => {
                return callback(null, success);
              });
            }
          });
        }
      });
    });
  }
};
//error function
const printMessage = key => console.log(possibleErrors[key]);

const possibleErrors = {
  general:
    "Use the function like this:\n" +
    "node fetcher.js http://www.example.com/ ./index.html",
  PATH_ERROR: "The path seem to be invalid"
};

getInput((error, success) => {
  if (error) {
    printMessage("It didn't work!", error);
    printMessage(possibleErrors.general);
    return;
  } else {
    console.log(success);
  }
});
