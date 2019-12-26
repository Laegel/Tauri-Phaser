var http = require("http"),
  url = require("url"),
  path = require("path"),
  fs = require("fs"),
  port = process.argv[2] || 8888;

http
  .createServer(function(request, response) {
    const toFetch = request.url === "/" ? "/index.html" : request.url;

    console.log("./dist" + toFetch);
    

    fs.readFile("./dist" + toFetch, "binary", function(err, file) {
      if (err) {
        response.writeHead(500, { "Content-Type": "text/plain" });
        response.write(err + "\n");
        response.end();
        return;
      }

      response.writeHead(200);
      response.write(file, "binary");
      response.end();
    });
  })
  .listen(parseInt(port, 10));
