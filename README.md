# UI-Grid : An AngularJS data grid

[![Coverage Status](https://coveralls.io/repos/github/angular-ui/ui-grid/badge.svg?branch=master)](https://coveralls.io/github/angular-ui/ui-grid?branch=master)
[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2Fangular-ui%2Fui-grid.svg?type=shield)](https://app.fossa.io/projects/git%2Bgithub.com%2Fangular-ui%2Fui-grid?ref=badge_shield)
[![npm](https://img.shields.io/npm/dm/angular-ui-grid.svg)](https://www.npmjs.com/package/angular-ui-grid)
[![OpenCollective](https://opencollective.com/ui-grid/backers/badge.svg)](#backers)
[![OpenCollective](https://opencollective.com/ui-grid/sponsors/badge.svg)](#sponsors)
[![Gitter](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/angular-ui/ui-grid?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge)

# Help!

Head to http://ui-grid.info for documentation and tutorials. Join https://gitter.im/angular-ui/ui-grid to discuss development and ask for specific help.

We're always looking for new contributors, for pro-level contribution guidelines look at [Contributor.md](CONTRIBUTING.md), if you're more of a first-timer with open source (or just need a refresher), look at [First Time Open Source Contributor.md](FIRST_TIMER.md), also look at [Developer.md](DEVELOPER.md)

Need Some Inspiration? Have a look at our open [good first issue](https://github.com/angular-ui/ui-grid/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22) issues, or the [help wanted](https://github.com/angular-ui/ui-grid/issues?q=is%3Aissue+is%3Aopen+label%3A%22help+wanted%22) issues if you are looking for more of a challenge

# Installing

## Bower

```bash
    bower install angular-ui-grid
```

```html
    <link rel="stylesheet" type="text/css" href="bower_components/angular-ui-grid/ui-grid.min.css">
<script src="bower_components/angular-ui-grid/ui-grid.min.js"></script>
```

## NPM

```bash
    npm install angular-ui-grid
```

```html
    <link rel="stylesheet" type="text/css" href="node_modules/angular-ui-grid/ui-grid.min.css">
    <script src="node_modules/angular-ui-grid/ui-grid.min.js">
```

## CDN

You can use [jsdelivr.com](https://www.jsdelivr.com)'s cdn url to access the files. Just alter the version as you need.

* https://cdn.jsdelivr.net/gh/angular-ui/bower-ui-grid/ui-grid.min.js
* https://cdn.jsdelivr.net/gh/angular-ui/bower-ui-grid/ui-grid.min.css

# Angular Compatibility

UI-Grid is currently compatible with Angular versions ranging from 1.4.x to 1.8.x.

# Feature Stability

UI-Grid comes bundled with several features. Not all of them are currently stable.  See the list below for the stability of each:

Feature           | Release state
-------------------        | --------- |
[auto-resize-grid](http://ui-grid.info/docs/#/tutorial/213_auto_resizing) ([API](http://ui-grid.info/docs/#/api/ui.grid.autoResize))  | beta
[cellnav](http://ui-grid.info/docs/#/tutorial/202_cellnav) ([API](http://ui-grid.info/docs/#/api/ui.grid.cellNav)) | stable
[edit](http://ui-grid.info/docs/#/tutorial/201_editable) ([API](http://ui-grid.info/docs/#/api/ui.grid.edit)) | stable
[expandable](http://ui-grid.info/docs/#/tutorial/216_expandable_grid) ([API](http://ui-grid.info/docs/#/api/ui.grid.expandable))    | alpha
[exporter](http://ui-grid.info/docs/#/tutorial/206_exporting_data) ([API](http://ui-grid.info/docs/#/api/ui.grid.exporter))      | stable
[grouping](http://ui-grid.info/docs/#/tutorial/209_grouping) ([API](http://ui-grid.info/docs/#/api/ui.grid.grouping))      | beta
[importer](http://ui-grid.info/docs/#/tutorial/207_importing_data) ([API](http://ui-grid.info/docs/#/api/ui.grid.importer))      | stable
[infinite-scroll](http://ui-grid.info/docs/#/tutorial/212_infinite_scroll) ([API](http://ui-grid.info/docs/#/api/ui.grid.infiniteScroll))           | beta
[move-columns](http://ui-grid.info/docs/#/tutorial/217_column_moving) ([API](http://ui-grid.info/docs/#/api/ui.grid.moveColumns))    | alpha
[pagination](http://ui-grid.info/docs/#/tutorial/214_pagination) ([API](http://ui-grid.info/docs/#/api/ui.grid.pagination))    | alpha
[pinning](http://ui-grid.info/docs/#/tutorial/203_pinning) ([API](http://ui-grid.info/docs/#/api/ui.grid.pinning))       | stable
[resize-columns](http://ui-grid.info/docs/#/tutorial/204_column_resizing) ([API](http://ui-grid.info/docs/#/api/ui.grid.resizeColumns))  | stable
[row-edit](http://ui-grid.info/docs/#/tutorial/205_row_editable) ([API](http://ui-grid.info/docs/#/api/ui.grid.rowEdit))      | stable
[saveState](http://ui-grid.info/docs/#/tutorial/208_save_state) ([API](http://ui-grid.info/docs/#/api/ui.grid.saveState))     | stable
[selection](http://ui-grid.info/docs/#/tutorial/210_selection) ([API](http://ui-grid.info/docs/#/api/ui.grid.selection))       | stable
[tree-base](http://ui-grid.info/docs/#/tutorial/215_treeView) ([API](http://ui-grid.info/docs/#/api/ui.grid.treeBase))     | beta
[tree-view](http://ui-grid.info/docs/#/tutorial/215_treeView) ([API](http://ui-grid.info/docs/#/api/ui.grid.treeView))       | beta

For more details on the features check the [Tutorials](http://ui-grid.info/docs/#/tutorial).

# Plugins

UI-Grid has an excellent plugin system. Most new features can be added as plugins. Please see some discussion of that in the [Developer guidelines](DEVELOPER.md).
There is a [list of known plugins](http://ui-grid.info/docs/#/tutorial/299_third_party_features) on the tutorial site. If you would
like your plugin added to that list, please [edit the tutorial page](misc/tutorial/299_third_party_features.ngdoc) and send a pull request.

# Building

The first step is to install dependencies. `git` is required and must be available from the command line. If you don't have it, install git and ensure that the executable is in your path. If you are new to git, the easiest way to install is by installing the github client.

The `grunt` command line utility is also required.

    # If you don't already have the grunt-cli installed:
    > npm install -g grunt-cli

With `git` and `grunt-cli` installed you simply run the following commands to install all dependencies.

    > npm install
    > grunt install

The default grunt task will test and build files into `dist/`

    > grunt

# Developing

Development "watch" task. This will automatically rebuild from source on changes, reload Gruntfile.js if you change it, and rebuild the docs.

1. A server on localhost:9002 serving whichever directory you checked out, with livereload. Navigate to http://localhost:9002/misc/demo to see the [demo files](http://localhost:9002/misc/demo/grid-directive.html).
2. A server on localhost:9003 serving the ./docs directory. These are the docs built from source with grunt-uidocs-generator.



> grunt dev

By default `grunt dev` will start several karma background watchers that will run the tests against multiple versions of angular. You may specify the version(s) you want to use with the `--angular` flag:

    > grunt dev --angular=1.6.7

    > grunt dev --angular=1.5.11,1.6.7

You can also use the `--browsers` specify what browsers to test with (ChromeHeadless is the default).

    > grunt dev --browsers=Chrome

    # Run a single test run against multiple browsers
    > grunt karma:single --browsers=Chrome,Firefox,IE

By default the `dev` tasks runs e2e tests with protractor. If you have problems with them running slow or hanging, you can disable them with the `--no-e2e` flag:

    > grunt dev --no-e2e

The grunt task is getting slower as the body of tests gets larger.  If you're only working on the core functionality you can disable the unit tests on the features with the `--core` flag:

    > grunt dev --core

As a shortcut for options that the developers frequently use, there is also a `--fast` flag, which equates to `--core --no-e2e --angular=<latest>`:

    > grunt dev --fast

## Karmangular

The `karmangular` task runs tests serially against multiple browsers (it is used internally by the `dev` task).

    # Run tests against all available versions of Angular on Chrome
    > grunt karmangular --browsers=Chrome

    # Run tests with a couple versions of Angular against the default ChromeHeadless browser
    > grunt karmangular --angular=1.5.11,1.6.7

## SauceLabs

ui-grid is set up to run against SauceLabs. You must have the `SAUCE_ACCESS_KEY` environment variable set.

    # Execute tests for a couple versions of angular on IE8
    > grunt karmangular --angular=1.5.11,1.6.7 --browsers=SL_IE_8

    # Run the watch tasks against IE10
    > grunt dev --browsers=SL_IE10

The full list of SauceLabs browsers can be seen by running `grunt saucebrowsers`. Usually it should suffice to let Travis do this testing automatically, unless you're trying to debug a browser-specific issue.

# What Happened to 2.x?

As of the 3.0 release, 2.x is officially deprecated. There will be no further releases. If for some reason you need to find the 2.x source please see the [2.x branch](https://github.com/angular-ui/ng-grid-legacy).

The 2.x docs are here: [https://github.com/angular-ui/ng-grid-legacy/wiki](https://github.com/angular-ui/ng-grid-legacy/wiki).

# Repository Rename

With the 3.0 release, the repository has been renamed from "ng-grid" to "ui-grid".

All network traffic to GitHub should redirect automatically but they say you should update your git remote url:

    git remote set-url origin https://github.com/angular-ui/ui-grid.git

# Thanks

Thanks to [Sauce Labs](http://saucelabs.com) and [BrowserStack](http://www.browserstack.com) for providing their testing platforms to open source projects for free.



# Backers

Support us with a monthly donation and help us continue our activities. [[Become a backer](https://opencollective.com/ui-grid#backer)]

<a href="https://opencollective.com/ui-grid/backer/0/website" target="_blank"><img src="https://opencollective.com/ui-grid/backer/0/avatar.svg"></a>
<a href="https://opencollective.com/ui-grid/backer/1/website" target="_blank"><img src="https://opencollective.com/ui-grid/backer/1/avatar.svg"></a>
<a href="https://opencollective.com/ui-grid/backer/2/website" target="_blank"><img src="https://opencollective.com/ui-grid/backer/2/avatar.svg"></a>
<a href="https://opencollective.com/ui-grid/backer/3/website" target="_blank"><img src="https://opencollective.com/ui-grid/backer/3/avatar.svg"></a>
<a href="https://opencollective.com/ui-grid/backer/4/website" target="_blank"><img src="https://opencollective.com/ui-grid/backer/4/avatar.svg"></a>
<a href="https://opencollective.com/ui-grid/backer/5/website" target="_blank"><img src="https://opencollective.com/ui-grid/backer/5/avatar.svg"></a>
<a href="https://opencollective.com/ui-grid/backer/6/website" target="_blank"><img src="https://opencollective.com/ui-grid/backer/6/avatar.svg"></a>
<a href="https://opencollective.com/ui-grid/backer/7/website" target="_blank"><img src="https://opencollective.com/ui-grid/backer/7/avatar.svg"></a>
<a href="https://opencollective.com/ui-grid/backer/8/website" target="_blank"><img src="https://opencollective.com/ui-grid/backer/8/avatar.svg"></a>
<a href="https://opencollective.com/ui-grid/backer/9/website" target="_blank"><img src="https://opencollective.com/ui-grid/backer/9/avatar.svg"></a>
<a href="https://opencollective.com/ui-grid/backer/10/website" target="_blank"><img src="https://opencollective.com/ui-grid/backer/10/avatar.svg"></a>
<a href="https://opencollective.com/ui-grid/backer/11/website" target="_blank"><img src="https://opencollective.com/ui-grid/backer/11/avatar.svg"></a>
<a href="https://opencollective.com/ui-grid/backer/12/website" target="_blank"><img src="https://opencollective.com/ui-grid/backer/12/avatar.svg"></a>
<a href="https://opencollective.com/ui-grid/backer/13/website" target="_blank"><img src="https://opencollective.com/ui-grid/backer/13/avatar.svg"></a>
<a href="https://opencollective.com/ui-grid/backer/14/website" target="_blank"><img src="https://opencollective.com/ui-grid/backer/14/avatar.svg"></a>
<a href="https://opencollective.com/ui-grid/backer/15/website" target="_blank"><img src="https://opencollective.com/ui-grid/backer/15/avatar.svg"></a>
<a href="https://opencollective.com/ui-grid/backer/16/website" target="_blank"><img src="https://opencollective.com/ui-grid/backer/16/avatar.svg"></a>
<a href="https://opencollective.com/ui-grid/backer/17/website" target="_blank"><img src="https://opencollective.com/ui-grid/backer/17/avatar.svg"></a>
<a href="https://opencollective.com/ui-grid/backer/18/website" target="_blank"><img src="https://opencollective.com/ui-grid/backer/18/avatar.svg"></a>
<a href="https://opencollective.com/ui-grid/backer/19/website" target="_blank"><img src="https://opencollective.com/ui-grid/backer/19/avatar.svg"></a>
<a href="https://opencollective.com/ui-grid/backer/20/website" target="_blank"><img src="https://opencollective.com/ui-grid/backer/20/avatar.svg"></a>
<a href="https://opencollective.com/ui-grid/backer/21/website" target="_blank"><img src="https://opencollective.com/ui-grid/backer/21/avatar.svg"></a>
<a href="https://opencollective.com/ui-grid/backer/22/website" target="_blank"><img src="https://opencollective.com/ui-grid/backer/22/avatar.svg"></a>
<a href="https://opencollective.com/ui-grid/backer/23/website" target="_blank"><img src="https://opencollective.com/ui-grid/backer/23/avatar.svg"></a>
<a href="https://opencollective.com/ui-grid/backer/24/website" target="_blank"><img src="https://opencollective.com/ui-grid/backer/24/avatar.svg"></a>
<a href="https://opencollective.com/ui-grid/backer/25/website" target="_blank"><img src="https://opencollective.com/ui-grid/backer/25/avatar.svg"></a>
<a href="https://opencollective.com/ui-grid/backer/26/website" target="_blank"><img src="https://opencollective.com/ui-grid/backer/26/avatar.svg"></a>
<a href="https://opencollective.com/ui-grid/backer/27/website" target="_blank"><img src="https://opencollective.com/ui-grid/backer/27/avatar.svg"></a>
<a href="https://opencollective.com/ui-grid/backer/28/website" target="_blank"><img src="https://opencollective.com/ui-grid/backer/28/avatar.svg"></a>
<a href="https://opencollective.com/ui-grid/backer/29/website" target="_blank"><img src="https://opencollective.com/ui-grid/backer/29/avatar.svg"></a>


# Sponsors

Become a sponsor and get your logo on our website and on our README on Github with a link to your site. [[Become a sponsor](https://opencollective.com/ui-grid#sponsor)]

<a href="https://opencollective.com/ui-grid/sponsor/0/website" target="_blank"><img src="https://opencollective.com/ui-grid/sponsor/0/avatar.svg"></a>
<a href="https://opencollective.com/ui-grid/sponsor/1/website" target="_blank"><img src="https://opencollective.com/ui-grid/sponsor/1/avatar.svg"></a>
<a href="https://opencollective.com/ui-grid/sponsor/2/website" target="_blank"><img src="https://opencollective.com/ui-grid/sponsor/2/avatar.svg"></a>
<a href="https://opencollective.com/ui-grid/sponsor/3/website" target="_blank"><img src="https://opencollective.com/ui-grid/sponsor/3/avatar.svg"></a>
<a href="https://opencollective.com/ui-grid/sponsor/4/website" target="_blank"><img src="https://opencollective.com/ui-grid/sponsor/4/avatar.svg"></a>
<a href="https://opencollective.com/ui-grid/sponsor/5/website" target="_blank"><img src="https://opencollective.com/ui-grid/sponsor/5/avatar.svg"></a>
<a href="https://opencollective.com/ui-grid/sponsor/6/website" target="_blank"><img src="https://opencollective.com/ui-grid/sponsor/6/avatar.svg"></a>
<a href="https://opencollective.com/ui-grid/sponsor/7/website" target="_blank"><img src="https://opencollective.com/ui-grid/sponsor/7/avatar.svg"></a>
<a href="https://opencollective.com/ui-grid/sponsor/8/website" target="_blank"><img src="https://opencollective.com/ui-grid/sponsor/8/avatar.svg"></a>
<a href="https://opencollective.com/ui-grid/sponsor/9/website" target="_blank"><img src="https://opencollective.com/ui-grid/sponsor/9/avatar.svg"></a>
<a href="https://opencollective.com/ui-grid/sponsor/10/website" target="_blank"><img src="https://opencollective.com/ui-grid/sponsor/10/avatar.svg"></a>
<a href="https://opencollective.com/ui-grid/sponsor/11/website" target="_blank"><img src="https://opencollective.com/ui-grid/sponsor/11/avatar.svg"></a>
<a href="https://opencollective.com/ui-grid/sponsor/12/website" target="_blank"><img src="https://opencollective.com/ui-grid/sponsor/12/avatar.svg"></a>
<a href="https://opencollective.com/ui-grid/sponsor/13/website" target="_blank"><img src="https://opencollective.com/ui-grid/sponsor/13/avatar.svg"></a>
<a href="https://opencollective.com/ui-grid/sponsor/14/website" target="_blank"><img src="https://opencollective.com/ui-grid/sponsor/14/avatar.svg"></a>
<a href="https://opencollective.com/ui-grid/sponsor/15/website" target="_blank"><img src="https://opencollective.com/ui-grid/sponsor/15/avatar.svg"></a>
<a href="https://opencollective.com/ui-grid/sponsor/16/website" target="_blank"><img src="https://opencollective.com/ui-grid/sponsor/16/avatar.svg"></a>
<a href="https://opencollective.com/ui-grid/sponsor/17/website" target="_blank"><img src="https://opencollective.com/ui-grid/sponsor/17/avatar.svg"></a>
<a href="https://opencollective.com/ui-grid/sponsor/18/website" target="_blank"><img src="https://opencollective.com/ui-grid/sponsor/18/avatar.svg"></a>
<a href="https://opencollective.com/ui-grid/sponsor/19/website" target="_blank"><img src="https://opencollective.com/ui-grid/sponsor/19/avatar.svg"></a>
<a href="https://opencollective.com/ui-grid/sponsor/20/website" target="_blank"><img src="https://opencollective.com/ui-grid/sponsor/20/avatar.svg"></a>
<a href="https://opencollective.com/ui-grid/sponsor/21/website" target="_blank"><img src="https://opencollective.com/ui-grid/sponsor/21/avatar.svg"></a>
<a href="https://opencollective.com/ui-grid/sponsor/22/website" target="_blank"><img src="https://opencollective.com/ui-grid/sponsor/22/avatar.svg"></a>
<a href="https://opencollective.com/ui-grid/sponsor/23/website" target="_blank"><img src="https://opencollective.com/ui-grid/sponsor/23/avatar.svg"></a>
<a href="https://opencollective.com/ui-grid/sponsor/24/website" target="_blank"><img src="https://opencollective.com/ui-grid/sponsor/24/avatar.svg"></a>
<a href="https://opencollective.com/ui-grid/sponsor/25/website" target="_blank"><img src="https://opencollective.com/ui-grid/sponsor/25/avatar.svg"></a>
<a href="https://opencollective.com/ui-grid/sponsor/26/website" target="_blank"><img src="https://opencollective.com/ui-grid/sponsor/26/avatar.svg"></a>
<a href="https://opencollective.com/ui-grid/sponsor/27/website" target="_blank"><img src="https://opencollective.com/ui-grid/sponsor/27/avatar.svg"></a>
<a href="https://opencollective.com/ui-grid/sponsor/28/website" target="_blank"><img src="https://opencollective.com/ui-grid/sponsor/28/avatar.svg"></a>
<a href="https://opencollective.com/ui-grid/sponsor/29/website" target="_blank"><img src="https://opencollective.com/ui-grid/sponsor/29/avatar.svg"></a>
## My Practice Change
This line was added to practice making a pull request and merging it.
