#!/usr/bin/env node

import { lstatSync, watch } from "node:fs";
import { resolve } from "node:path";
import { spawn } from "node:child_process";

const WATCHER_DELAY = 10 * 1000;
const STATIC_DIR_NAME = "static";
let WORKING_DIR = "./";
let WATCH_DIR = "";
let TIMEOUT;

if (process.argv.length < 3) {
    console.log("Folder to watch not set");
    process.exit(1);
}

WATCH_DIR = process.argv[2];

if (process.argv.length >= 4) {
    WORKING_DIR = process.argv[3];
}

if (!lstatSync(WATCH_DIR).isDirectory()) {
    console.log(`${WATCH_DIR} is not folder`);
    process.exit(1);
}

const collectStatic = () => {
    const proc = spawn(`rm -rf ${resolve(WORKING_DIR, STATIC_DIR_NAME)} && python manage.py collectstatic`, {
        shell: true,
        stdio: ["inherit", "pipe", "pipe"],
    });

    proc.stdout.setEncoding("utf8");
    proc.stdout.on("data", (output) => {
        console.log(output);
    });
};

watch(WATCH_DIR, { recursive: true }, (eventType, filename) => {
    clearTimeout(TIMEOUT);
    TIMEOUT = setTimeout(collectStatic, WATCHER_DELAY);
});
