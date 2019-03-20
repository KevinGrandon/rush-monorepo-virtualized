#!/usr/bin/env node

const fs = require('fs');
const {promisify} = require('util');
const execa = require('execa');

const {PACKAGE: pkg} = process.env;

if (!pkg) {
  console.log(
    'No package specified. Please specify a package by: `PACKAGE=______ rush configure`'
  );
  process.exit(0);
}

console.log(`Configuring package: ${pkg}`);

// Maps all packages to folders
const packageNameToFolder = {};

/**
 * Recursive function to add projects to the rush configuration.
 */
function recursivelyAddProjects(rushProjects, deps) {
  if (!deps) {
    return rushProjects;
  }

  Object.keys(deps).forEach(depKey => {
    if (packageNameToFolder[depKey]) {
      const projectFolder = `src/${packageNameToFolder[depKey]}`;
      rushProjects.push({
        packageName: depKey,
        projectFolder,
      });

      // Recursively add deps and devDeps of new dep
      const depPackageContents = require(`${process.cwd()}/${projectFolder}/package.json`);
      rushProjects = recursivelyAddProjects(
        rushProjects,
        depPackageContents.dependencies
      );
      rushProjects = recursivelyAddProjects(
        rushProjects,
        depPackageContents.devDependencies
      );
    }
  });

  return rushProjects;
}

(async () => {
  const rushRunner = `common/scripts/install-run-rush.js`;

  const readFile = promisify(fs.readFile);
  const writeFile = promisify(fs.writeFile);
  const readDir = promisify(fs.readdir);
  const rushConfig = require(`${process.cwd()}/rush.json`);

  // Reset rush config, we should only store a reference to our tooling package by default.
  rushConfig.projects = [
    {
      packageName: 'vrepo',
      projectFolder: 'src/vrepo',
    },
  ];

  // Populate packageNameToFolder
  const folders = await readDir(`${process.cwd()}/src/`);
  folders.forEach(folder => {
    const eachPackageContents = require(`${process.cwd()}/src/${folder}/package.json`);
    packageNameToFolder[eachPackageContents.name] = folder;
  });

  // Populate rush.json projects recursively
  const packageContents = require(`${process.cwd()}/src/${pkg}/package.json`);

  rushConfig.projects.push({
    packageName: `${packageContents.name}`,
    projectFolder: `src/${pkg}`,
  });

  rushConfig.projects = recursivelyAddProjects(
    rushConfig.projects,
    packageContents.dependencies
  );
  rushConfig.projects = recursivelyAddProjects(
    rushConfig.projects,
    packageContents.devDependencies
  );

  console.log('Rush config is: ', rushConfig);
  await writeFile(
    `${process.cwd()}/rush.json`,
    JSON.stringify(rushConfig, null, '  ')
  );

  await execa('node', [rushRunner, 'update']);

  // Re-use lockfile from service and re-install if it exists
  try {
    const existingLockContent = await readFile(
      `${process.cwd()}/src/${pkg}/yarn.lock`
    );
    console.log('Found existing lockfile content, re-generating dependencies.');
    await execa('cp', [
      `${process.cwd()}/src/${pkg}/yarn.lock`,
      'common/config/rush/yarn.lock',
    ]);
    await execa('node', [rushRunner, 'update']);
  } catch (e) {
    console.log(
      'Did not find existing lockfile content, generating new lockfile.'
    );
    await execa('cp', [
      'common/config/rush/yarn.lock',
      `${process.cwd()}/src/${pkg}/yarn.lock`,
    ]);
  }
})();
