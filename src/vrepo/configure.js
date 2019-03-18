#!/usr/bin/env node

const {PACKAGE: pkg} = process.env;

if (!pkg) {
  console.log(
    'No package specified. Please specify a package by: `PACKAGE=______ rush configure`'
  );
  process.exit(0);
}

console.log(`Configuring package: ${pkg}`);
