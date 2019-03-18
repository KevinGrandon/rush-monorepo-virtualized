#!/usr/bin/env node

const {PACKAGE: pkg} = process.env;
const fs = require('fs');
const {promisify} = require('util');
const execa = require('execa');

if (!pkg) {
  console.log(
    'No package specified. Please specify a package by: `PACKAGE=______ rush configure`'
  );
  process.exit(0);
}

console.log(`Configuring package: ${pkg}`);

(async () => {
  const readFile = promisify(fs.readFile);
  const rushConfig = await readFile(`${process.cwd()}/rush.json`);

  console.log('Rush config is: ', String(rushConfig));

  const {stdout} = await execa('rush update');
  console.log(stdout);
})();
