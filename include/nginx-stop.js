#!/usr/bin/env node

const path = require("path"),
      cp = require("child_process");

var cmd = `docker stop app-nginx && docker rm app-nginx`;

cp.execSync(cmd);