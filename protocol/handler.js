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
var url = process.argv.slice(2)[0];
var parsed = parse(url);

// change protocol to https:
parsed.set("protocol", config.protocol || "https:");

// optionally write authentication into the url
if (config.username && config.password) {
  parsed.set("username", config.username);
  parsed.set("password", config.password);
}

// start player
startDetachedProcess(config.command, util.format(config.arguments || "%s", parsed.href));
