#!/usr/bin/env node

const path = require("path"),
      cp = require("child_process");

var cmd = `docker run -d --name app --network app-net -v ${path.resolve(process.cwd(), "src/backend")}:/var/www/app g16/php-fpm`;

cp.execSync(cmd);