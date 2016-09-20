[Fold At Chrome Web Store](https://chrome.google.com/webstore/detail/fold-new-tabpopup-4-bookm/gfaneniadbhfdegjkgjefacoiafhmola)
## Fold Dashboard

> A customizable dashboard for Chrome made by Micromer (a Polymer Fork)

## Getting Started

### Install dependencies

#### Quick-start

With Node.js installed, run the following one liner from the root of fold download:

```sh
npm install -g gulp bower && npm install && bower install
```

#### Prerequisites

Fold requires the following major dependencies:

- Node.js, used to run JavaScript tools from the command line.
- npm, the node package manager, installed with Node.js and used to install Node.js packages.
- gulp, a Node.js-based build tool.
- bower, a Node.js-based package manager used to install front-end packages (like Polymer).

**To install dependencies:**

1)  Check your Node.js version.

```sh
node --version
```

The version should be at or above 0.12.x.

2)  If you don't have Node.js installed, or you have a lower version, go to [nodejs.org](https://nodejs.org) and click on the big green Install button.

3)  Install `gulp` and `bower` globally.

```sh
npm install -g gulp bower
```

This lets you run `gulp` and `bower` from the command line.

4)  Install Fold's local `npm` and `bower` dependencies.

```sh
cd fold && npm install && bower install
```

#### Lodash Custom build
This is already done but in case it was needed. First install lodash and then run the following to create the custom built.
`lodash include=get,set,cloneDeep,forOwn,each,isPlainObject`


### Development workflow

#### Serve / watch

```sh
gulp
```

Drag and drop the `dist` folder into Chrome extensions page.

#### Build & Vulcanize

```sh
gulp build
```

Build and optimize the current project, ready for deployment. This includes vulcanization, image, script, stylesheet and HTML optimization and minification.

## Dependency Management

Fold uses [Bower](http://bower.io) for package management. This makes it easy to keep your elements up to date and versioned. For tooling, we use npm to manage Node.js-based dependencies.

## Contributing

At this point, this is a demonstration project and not ready for community contribution. Feel free to contact if you have any ideas.
