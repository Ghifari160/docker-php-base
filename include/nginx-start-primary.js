#!/usr/bin/env node

const path = require("path"),
      cp = require("child_process");

var cmd = `docker run -d --name app-nginx --network app-net -p 9000:80 -v ${path.resolve(process.cwd(), ".docker/nginx/nginx.conf")}:/etc/nginx/nginx.conf:ro -v ${path.resolve(process.cwd(), "src")}:/var/www/app nginx`;

cp.execSync(cmd);