var crypto = require("crypto");
var fs = require("fs");

// get config and user file
var config = require("./config.json");
var userfile = "./" + config.users;
var users = {};
if (fs.existsSync(userfile)) {
  users = require(userfile);
}

// copied from the passport-http DigestStrategy implementation
function md5(str, encoding) {
  return crypto
    .createHash("md5")
    .update(str)
    .digest(encoding || "hex");
}

if (process.argv.length < 4) {
  console.log("Usage: node addUser.js username password");
  process.exit(0);
}

// parse username and password from command line arguments
var username = process.argv[2];
var password = process.argv[3];

// add user to the list
users[username] = {
  ha1: md5(username + ":" + config.auth.realm + ":" + password)
};

// write updated list to file
fs.writeFileSync(userfile, JSON.stringify(users, null, 2));

console.log("User added successfully");
