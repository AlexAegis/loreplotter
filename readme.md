# [LorePlotter](https://alexaegis.github.io/loreplotter/)

[![Build Status](https://travis-ci.com/AlexAegis/loreplotter.svg?branch=master)](https://travis-ci.com/AlexAegis/loreplotter) [![Codacy Badge](https://api.codacy.com/project/badge/Grade/9b155010806741a897cc8420898f4e84)](https://www.codacy.com/app/AlexAegis/loreplotter?utm_source=github.com&utm_medium=referral&utm_content=AlexAegis/loreplotter&utm_campaign=Badge_Grade) [![Maintainability](https://api.codeclimate.com/v1/badges/9f9e5eb2c8a3ccd58f22/maintainability)](https://codeclimate.com/github/AlexAegis/loreplotter/maintainability) [![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://github.com/prettier/prettier) [![Greenkeeper badge](https://badges.greenkeeper.io/AlexAegis/loreplotter.svg)](https://greenkeeper.io/)

This project is a prototype tool for writers to ensure consistency in their work. It maps `actor` entities into a `globe`, and enforcing the laws of physics while doing so. Each one has a maximum possible speed which can be changed in an `event` of said `actor`. Based on this, the time difference between neighbouring events, their positions and the size of the planet, the application ensures that every actor, no matter what can reach from one event the next. It also tracks arbitrary properties in key-value pairs over time aswell. These are propagated down the timeline. If you inspect an actor at any given time you'll always see the latest values for every existing property of that actor. You can play back these scenarios to see these changes over-time. All the checks and constrainst work over-time, if you try to move an actor while playing you can essentially track that actors every possible position it could've possibly go over that period of time. The property handling is useful to evaluate what could happen when two actors meet, so you can see what each of them know, and figure out what would change.

Clicking on the title of the project or the link in the repositories description will take you to the application. It has a permament `Example` project for you to try out.

> A hungarian documentation is also available under the releases section as a `pdf`.

## Project usage

To install all required dependencies

```bash
npm install
```

To start a dev server

```bash
npm run start
```

To build the project

```bash
npm run build
```

To open the built project in a local http-server

```bash
npm run start:prod
```

Check bundle sizes

```bash
webpack-bundle-analyzer dist/loreplotter/stats-es2015.json
```

## Technologies

### [Angular 8](https://angular.io/)

> **Frontend** framework

### [NPM](https://www.npmjs.com/)

> **Package manager** for JS projects

### [Sass](https://sass-lang.com/)

> **CSS** extension

### [Three](https://threejs.org/)

> **WebGL** graphics

### [Tween](https://github.com/tweenjs/tween.js/)

> **Animation** easing

### [RxDB](https://rxdb.info/)

> **Reactive database** interface

### [NgRx](https://ngrx.io/)

> **State** management

### [FontAwesome](https://fontawesome.com/)

> **Icons**, awesome ones

### [PlantUML](http://plantuml.com)

> **Diagram** tool. On windows, install with `choco plantuml`

## Recommendations

### [Visual Studio Code](https://code.visualstudio.com/)

> **IDE** for mainly the frontend but can be used for both. [Settings](./.vscode/)

### [Fira Code](https://github.com/tonsky/FiraCode)

> **Font** with ligatures

### [LiveReload](https://chrome.google.com/webstore/detail/livereload/jnihajbhpnppcggbcgedagnkighmdlei)

> **Reload the Page** for Chrome when the server changes

## Services

### [GitHub](https://github.com/)

> **Git** repository

### [GitHub Pages](https://pages.github.com/)

> **Static** hosting

### [Travis](https://travis-ci.com/)

> **Continuous Integration** solution

### [Codacy](https://app.codacy.com/)

> **Code review** tool

### [Code Climate](https://codeclimate.com/dashboard)

> **Code review** tool for maintainability and coverage

### [Snyk](https://snyk.io/)

> **Vulnerability** detection

### [Shields.io](https://shields.io/#/)

> **Badges** to look cool
