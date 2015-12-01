var fs = require("fs");
var path = require("path");
var glob = require("glob");
var https = require("https");
var express = require("express");
var morgan = require("morgan");
var helmet = require("helmet");
var compression = require("compression");
var passport = require("passport");
var DigestStrategy = require("passport-http").DigestStrategy;

// read config and users
var config = require("./config.json");
console.log("Configuration loaded");
var userfile = "./" + config.users;
if (!fs.existsSync(userfile)) {
  console.log("User file not found. Create users first using \"node addUser.js username password\"");
  process.exit(0);
}
var users = require(userfile);
console.log("User file loaded");

// set up application
var app = express();
app.set("view engine", "jade");
app.set("views", "./views");
app.use(morgan("combined"));
app.use(helmet());
app.use(compression());
app.use(passport.initialize());
app.use(passport.authenticate("digest", { session: false }));

// check user file during HTTP Digest authentication
passport.use(new DigestStrategy(config.auth, function (username, done) {
  return users[username] ? done(null, {}, users[username]) : done(null, false);
}));

// parses a HTTP Range header
function readRangeHeader(rangeHeader, totalLength) {
  if (rangeHeader == null || rangeHeader.length == 0)
    return null;
  var array = rangeHeader.split(/bytes=([0-9]*)-([0-9]*)/);
  var start = parseInt(array[1]);
  var end = parseInt(array[2]);
  return {
    start: isNaN(start) ? 0 : start,
    end: isNaN(end) ? (totalLength - 1) : end
  };
}

function streamFile(req, res, filename) {
  if (!fs.existsSync(filename)) return res.status(404).end();
  var stat = fs.statSync(filename);
  var range = readRangeHeader(req.headers["range"], stat.size);
  if (range == null) {
    res.status(200);
    res.set("Content-Type", "video/x-matroska");
    res.set("Content-Length", stat.size);
    var fileStream = fs.createReadStream(filename);
    fileStream.pipe(res);
  } else if (range.start >= stat.size || range.end >= stat.size) {
    // request unsatisfiable
    res.status(416);
    res.set("Content-Range", "bytes */" + stat.size);
    res.end();
  } else {
    // partial content
    res.status(206);
    res.set("Content-Type", "video/x-matroska");
    res.set("Content-Length", range.end - range.start + 1);
    res.set("Content-Range", "bytes " + range.start + "-" + range.end + "/" + stat.size);
    res.set("Accept-Range", "bytes");
    var partialStream = fs.createReadStream(filename, range);
    partialStream.pipe(res);
  }
}

// add a root route to list all resources
if (config.enableDirectoryListing) {
  app.get("/", function (req, res) {
    var links = config.resources.map(function (resource) {
      return {
        name: resource.url,
        url: "/" + resource.url
      };
    });
    res.render("index", { title: "resources", links: links });
  });
}

// add routes for each resource
config.resources.forEach(function (resource) {
  var baseUrl = "/" + resource.url;
  // stream route
  app.get(baseUrl + "/*", function (req, res) {
    var filename = req.params[0];
    streamFile(req, res, path.join(resource.dir, filename));
  });
  // list route
  if (!config.enableDirectoryListing) return;
  app.get(baseUrl, function (req, res) {
    glob(resource.glob, { cwd: resource.dir }, function (err, files) {
      if (err) return res.status(500);
      var links = files.map(function (filename) {
        return {
          name: filename,
          url: baseUrl + "/" + encodeURI(filename),
          player: "ololo://" + req.headers.host + baseUrl + "/" + encodeURI(filename)
        }
      });
      res.render("index", { title: resource.url, links: links });
    });
  });
});

// load certificate
var credentials = {
  key: fs.readFileSync(config.key),
  cert: fs.readFileSync(config.cert)
};
console.log("Certificate loaded");

// start the server
var server = https.createServer(credentials, app);
server.listen(config.port, function () {
  var address = server.address();
  console.log("Listening on %s:%s", address.address, address.port);
});

// log uncaught exceptions after successful initialization, but stop the application from crashing while the server is up
process.on("uncaughtException", function (err) {
  console.log("Caught exception: " + err);
});
