## AgentScript Modules Repository

This is a repository for the future version of [AgentScript](http://agentscript.org), an es6 module based project.

### Documentation

Developer Documentation is created by [docco](https://jashkenas.github.io/docco/) and is [available here](./docs/Model.html) Use **Jump To** menu, top right, to navigate between modules.

### Developer Information

To clone a fresh repo, for PRs or your own local verson:
* cd to where you want the asx/ dir to appear.
* git clone https://github.com/backspaces/asx # create skeleton repo
* cd asx # go to new repo
* npm install # install all dev dependencies.
* npm run all # Create all derived files
* open `http://<path to asx>/test.html` and check console for messages

All workflow is npm run scripts.  See package.json's scripts, or simply run `npm run` for a list.

The repo has no "derived" files, i.e. won't run by just cloning. To complete the repo, use `npm run all` which mainly compiles modules (babel) for use by System.js.

### Github Pages

A [gh-pages branch](http://backspaces.github.io/asx/) is used for the site. It contains the complete master repo, including the derived files. A new page is made from master by:
* npm run gh-pages

This can be used to run tests and access modules:
* [http://backspaces.github.io/asx/test.html?navier](http://backspaces.github.io/asx/test.html?navier)
* [http://backspaces.github.io/asx/docs/Model.html](http://backspaces.github.io/asx/docs/Model.html)

It can also be used as a CDN for all the modules:
* import Model from '[http://backspaces.github.io/asx/lib/Model.js](http://backspaces.github.io/asx/lib/Model.js)'
