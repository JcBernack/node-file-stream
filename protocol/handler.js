var util = require("util");
var parse = require("url-parse");
var spawn = require("child_process").spawn;
var config = require("./config.json");

function startDetachedProcess(command, arguments) {
  console.log("executing", command, arguments);
  var child = spawn(command, [arguments], {
    detached: true,
    stdio: ["ignore", "ignore", "ignore"]
  });
  child.unref();
}

// parse input url
if (process.argv.length < 3) {
  console.log("URL argument missing");
  process.exit(0);
}
var url = parse(process.argv[2]);

// change protocol to https:
url.set("protocol", config.protocol || "https:");

// optionally write authentication into the url
if (config.username && config.password) {
  url.set("username", config.username);
  url.set("password", config.password);
}

// start player
startDetachedProcess(config.command, util.format(config.arguments || "%s", url.href));
