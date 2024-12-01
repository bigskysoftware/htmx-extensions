# Contributing
Thank you for your interest in contributing! Because we're a small team, we have a couple contribution guidelines that make it easier for us to triage all the incoming suggestions.

## Core extensions vs community extensions
This repository was created along the release of [htmx 2](https://htmx.org/posts/2024-06-17-htmx-2-0-0-is-released/) ; before that, extensions were pushed to the same repository as the main library.\
This could lead to some confusion, as some extensions were created by the core maintainers, while others were suggested & pushed by the community. Issues would then appear on the same repository for the core library, core extensions, or community extensions.\
As we were adding more extensions, this also meant more support to provide, with an always-growing list.\
As we worked on htmx 2, we decided to move the extensions to a separate repository, to clearly split apart the core library from its extensions and simplify their maintenance.\
We decided to keep the already existing extensions in, that we will keep providing support for.\
As we are a small team, we hope you'll understand that we can't do that with all extensions!\
This is why, you will find most core extensions sources in this repository (except [idiomorph](https://github.com/bigskysoftware/idiomorph) which has its own), and *some* of the community extensions along. That's htmx 1's legacy!

## Have a cool extension to suggest?
Feel free to create any extension to fit your project and needs! This system was designed with this goal in mind.\
If you feel your extension could be useful for other developers:
1. Create a repository of your own to host it.
1. We suggest mimicking our extension structure (with a test suite, a `package.json`, and a `README` documentation) for consistency, but you're free to do as you wish ; it's your repository after all!
1. Open a PR against the [htmx repository's extensions list file](https://github.com/bigskysoftware/htmx/blob/master/www/content/extensions/_index.md), branch `master`, to add your extension to the list.

## Issues
1. See an issue that you also have? Give it a reaction (and comment, if you have something to add). We note that!
1. We don't have an issue template yet, but the more detailed your description of the issue, the more quickly we'll be able to evaluate it.
1. If you haven't gotten any traction on an issue, feel free to bump it in the #issues-and-pull-requests channel on our Discord.
1. Want to contribute but don't know where to start? Look for issues with the "help wanted" tag.

## Creating a Development Environment
### Pre-requisites
All core or community extensions that have their sources on this repository, are located under the `src` folder, in a subfolder of their own.

To create a development environment for a htmx extension, you'll need the following tools on your system:

- Node.js 20.x or later
- Chrome or Chromium

Additionally, the environment variable `CHROME_PATH` must contain the full path to the Chrome or Chromium binary on your system.

### Installing Packages
To install an extension's required packages, run the following command in its respective `src/` subfolder:

```bash
npm install
```

### Running Automated Tests
To verify that your htmx extension environment is working correctly, you can run the extension's automated tests with the following command:

```bash
npm test
```

## Pull Requests
### Technical Requirements
1. Please include test cases in the extension's `/test` subfolder. If you are fixing a bug, basically prove the bug first with a failing test, then prove that your change resolves it!
1. We squash all PRs, so you're welcome to submit with as many commits as you like; they will be evaluated as a single, standalone change.

### Review Guidelines
1. Open PRs represent issues that we're actively thinking working on merging (at a pace we can manage). If we think a proposal needs more discussion, or that the existing code would require a lot of back-and-forth to merge, we might close it and suggest you make an issue.
1. Smaller PRs are easier and quicker to review. If we feel that the scope of your changes is too large, we will close the PR and try to suggest ways that the change could be broken down.
1. Refactors that do not make functional changes will be automatically closed, unless explicitly solicited. Imagine someone came into your house unannounced, rearranged a bunch of furniture, and left.
1. Typo fixes in the documentation (not the code comments) are welcome, but formatting or debatable grammar changes will be automatically closed.
1. If you think we closed something incorrectly, feel free to (politely) tell us why! We're human and make mistakes.
