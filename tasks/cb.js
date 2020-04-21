#!/usr/bin/env node

const fs = require("fs"),
      path = require("path"),
      cp = require("child_process"),
      http = require("http"),
      https = require("https");

const util = require("util");

const stdin = process.openStdin();

function shell_out(str, pipe = process.stdout)
{
    process.stdout.write(str);
}

function shell_outln(str, pipe = process.stdout)
{
    shell_out(str + "\n", pipe);
}

function project_safetyCheck(flag)
{
    if(flag)
        shell_outln("Creating project...");
    else
    {
        shell_outln("Aborted.");
        process.exit(1);
    }
}

function project_create_packageInfo(packageInfo, primary = false)
{
    const k = [
        "backend-start:create-net", "backend-start:php-fpm", "backend-start:nginx", "backend-start",
        "backend-stop:delete-net", "backend-stop:php-fpm", "backend-stop:nginx", "backend-stop"
    ];

    var p =
    {
        "backend-start:create-net": "docker network create app-net",
        "backend-start:php-fpm": "node .docker/scripts/php-fpm-start",
        "backend-start:nginx": "node .docker/scripts/nginx-start",
        "backend-start": "npm run backend-start:create-net && npm run backend-start:php-fpm && npm run backend-start:nginx",
        
        "backend-stop:delete-net": "docker network rm app-net",
        "backend-stop:php-fpm": "node .docker/scripts/php-fpm-stop",
        "backend-stop:nginx": "node .docker/scripts/nginx-stop",
        "backend-stop": "npm run backend-stop:nginx && npm run backend-stop:php-fpm && npm run backend-stop:delete-net"
    }, p2 = {};

    if(primary)
    {
        p2 =
        {
            "start": "npm run backend-start",
            "stop": "npm run backend-stop"
        };
    }

    if(packageInfo.hasOwnProperty("scripts") && packageInfo.scripts.length > 0)
    {
        var keys = Object.keys(packageInfo.scripts);

        for(var i = 0; i < keys.length; i++)
        {
            if(keys[i] == "start" && primary)
                delete packageInfo.scripts[keys[i]];
            else if(keys[i] == "stop" && primary)
                delete packageInfo.scripts[keys[i]];
            else
            {
                for(var j = 0; j < k.length; j++)
                {
                    if(keys[i] == k[j])
                        delete packageInfo.scripts[keys[i]];
                }
            }
        }
    }

    packageInfo.scripts = {...packageInfo.scripts, ...p, ...p2};
}

function project_create_packageJson(packageInfo)
{
    fs.writeFileSync("package.json", JSON.stringify(packageInfo, null, 2));
}

function __downloadPage(url)
{
    return new Promise((resolve, reject) =>
    {
        https.get(url, (response) =>
        {
            var data_chunks = [];

            response.on("data", (frag) =>
            {
                data_chunks.push(frag);
            });

            response.on("end", () =>
            {
                var resp = Buffer.concat(data_chunks);

                resolve(resp.toString());
            });

            response.on("error", (error) =>
            {
                reject(error);
            });
        });
    });
}

async function project_create_phpFpm_startScript()
{
    const script = await __downloadPage("https://raw.githubusercontent.com/ghifari160/docker-php-base/include/php-fpm-start.js");
    fs.writeFileSync(".docker/scripts/php-fpm-start.js", script);
}

async function project_create_phpFpm_stopScript()
{
    const script = await __downloadPage("https://raw.githubusercontent.com/ghifari160/docker-php-base/include/php-fpm-stop.js");
    fs.writeFileSync(".docker/scripts/php-fpm-stop.js", script);
}

async function project_create_nginx_startScript()
{
    const script = await __downloadPage("https://raw.githubusercontent.com/ghifari160/docker-php-base/include/nginx-start.js");
    fs.writeFileSync(".docker/scripts/nginx-start.js", script);
}

async function project_create_nginx_stopScript()
{
    const script = await __downloadPage("https://raw.githubusercontent.com/ghifari160/docker-php-base/include/nginx-stop.js");
    fs.writeFileSync(".docker/scripts/nginx-stop.js", script);
}

async function project_create_nginx_conf()
{
    const script = await __downloadPage("https://raw.githubusercontent.com/ghifari160/docker-php-base/include/nginx.conf");
    fs.writeFileSync(".docker/nginx/nginx.conf", script);
}

async function project_create_phpFpm_dockerfile()
{
    const script = await __downloadPage("https://raw.githubusercontent.com/ghifari160/docker-php-base/include/dockerfile");
    fs.writeFileSync(".docker/php-fpm/Dockerfile", script);
}

function project_create_directoryStructure(primary = false)
{
    var dirs = [];

    if(primary)
        dirs = [ "src", ".docker", ".docker/scripts", ".docker/nginx", ".docker/php-fpm" ];
    else
        dirs = [ "src", "src/backend", ".docker", ".docker/scripts", ".docker/nginx", ".docker/php-fpm" ];

    for(var i = 0; i < dirs.length; i++)
    {
        if(fs.existsSync(dirs[i]))
        {
            var stats = fs.statSync(dirs[i]);

            if(!stats.isDirectory())
            {
                fs.unlinkSync(dirs[i]);
                fs.mkdirSync(dirs[i]);
            }
        }
        else
            fs.mkdirSync(dirs[i]);
    }
}

function __cp_docker_rm_phpFpm()
{
    try
    {
        cp.execSync("docker rmi g16/php-fpm");
    }
    catch(e){}
}

function __cp_docker_build_phpFpm()
{
    cp.execSync("docker build -t g16/php-fpm .docker/php-fpm");
}

function project_build_phpFpm()
{
    shell_outln("Building docker image...");
    __cp_docker_rm_phpFpm();
    __cp_docker_build_phpFpm();
}

function project_get_packageInfo()
{
    if(fs.existsSync("package.json"))
    {
        return JSON.parse(fs.readFileSync("package.json"));
    }

    return {};
}

function __cp_git_init()
{
    cp.execSync("git init");
}

function project_create_gitRepo()
{
    if(!fs.existsSync(".git"))
        __cp_git_init();
    else
    {
        var stat = fs.statSync(".git");

        if(!stat.isDirectory())
        {
            fs.unlinkSync(".git");
            __cp_git_init();
        }
    }
}

function project_create(packageInfo, primary = false, existing = false)
{
    project_create_packageInfo(packageInfo, primary);

    project_create_packageJson(packageInfo);

    project_create_directoryStructure(primary);

    project_create_phpFpm_dockerfile();
    project_create_phpFpm_startScript();
    project_create_phpFpm_stopScript();

    project_create_nginx_conf();
    project_create_nginx_startScript();
    project_create_nginx_stopScript();

    project_create_gitRepo();

    project_build_phpFpm();
    
    shell_outln("Project created.");
    process.exit(0);
}

var packageInfo = {},
    step = 0,
    primary = false;

packageInfo = project_get_packageInfo();

shell_out(`package name: [${(packageInfo.hasOwnProperty("name")) ? packageInfo.name : path.basename(process.cwd())}] `);
stdin.addListener("data", (data) =>
{
    var input = data.toString().trim();
    
    switch(step)
    {
        case 0:
            if(packageInfo.hasOwnProperty("name"))
                packageInfo.name = (input.length > 0) ? input : packageInfo.name;
            else
                packageInfo.name = (input.length > 0) ? input : path.basename(process.cwd());
            packageInfo.name = packageInfo.name.toLowerCase();
            shell_out(`version: (${(packageInfo.hasOwnProperty("version")) ? packageInfo.version : "0.1.0"})`);
            break;

        case 1:
            if(packageInfo.hasOwnProperty("version"))
                packageInfo.version = (input.length > 0) ? input : packageInfo.version;
            else
                packageInfo.version = (input.length > 0) ? input : "0.1.0";
            shell_out(`author: ${(packageInfo.hasOwnProperty("author")) ? "(" + packageInfo.author + ") " : ""}`);
            break;
        
        case 2:
            if(packageInfo.hasOwnProperty("author"))
                packageInfo.author = (input.length > 0) ? input : packageInfo.author;
            else
                packageInfo.author = input;
            shell_out(`license: ${(packageInfo.hasOwnProperty("license")) ? "(" + packageInfo.license + ") " : ""}`);
            break;
        
        case 3:
            if(packageInfo.hasOwnProperty("license"))
                packageInfo.license = (input.length > 0) ? input : packageInfo.license;
            else
                packageInfo.license = input;
            shell_out("Primary? [y/n] ");
            break;
    }

    if(step == 4)
    {
        if(input != "y" && input != "n")
        {
            shell_outln("Invalid. Try again.");
            shell_out("Primary? [y/n] ");
        }
        else
        {
            primary = (input == "y") ? true : false;
            shell_out(`${(packageInfo.hasOwnProperty("name")) ? "Update" : "Create"} project? [y/n] `);
            step++;
        }
    }
    else if(step == 5)
    {
        if(input == "y")
        {
            project_safetyCheck(true);
            project_create(packageInfo, primary);
        }
        else if(input == "n")
            project_safetyCheck(false);
        else
        {
            shell_outln("Invalid. Try again.");
            shell_out(`${(packageInfo.hasOwnProperty("name")) ? "Update" : "Create"} project? [y/n] `);
        }
    }

    if(step < 4)
        step++;
});