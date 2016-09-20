/*
Copyright (c) 2015 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

'use strict';

// Include Gulp & tools we'll use
var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var del = require('del');
var runSequence = require('run-sequence');
var browserSync = require('browser-sync');
var reload = browserSync.reload;
var merge = require('merge-stream');
var path = require('path');
var fs = require('fs');
var glob = require('glob-all');
var historyApiFallback = require('connect-history-api-fallback');
var packageJson = require('./package.json');
var crypto = require('crypto');
var ensureFiles = require('./tasks/ensure-files.js');

// var ghPages = require('gulp-gh-pages');

var AUTOPREFIXER_BROWSERS = [
  'ie >= 10',
  'ie_mob >= 10',
  'ff >= 30',
  'chrome >= 34',
  'safari >= 7',
  'opera >= 23',
  'ios >= 7',
  'android >= 4.4',
  'bb >= 10'
];

var DIST = 'dist';
var production = false;

var dist = function(subpath) {
  return !subpath ? DIST : path.join(DIST, subpath);
};

var styleTask = function(stylesPath, srcs) {
  return gulp.src(srcs.map(function(src) {
      return path.join('app', stylesPath, src);
    }))
    .pipe($.changed(stylesPath, {extension: '.css'}))
    // .pipe($.autoprefixer(AUTOPREFIXER_BROWSERS))
    .pipe(gulp.dest('.tmp/' + stylesPath))
    .pipe($.minifyCss())
    .pipe(gulp.dest(dist(stylesPath)))
    .pipe($.size({title: stylesPath}));
};

var imageOptimizeTask = function(src, dest) {
  return gulp.src(src)
    .pipe($.imagemin({
      progressive: true,
      interlaced: true
    }))
    .pipe(gulp.dest(dest))
    .pipe($.size({title: 'images'}));
};

var optimizeHtmlTask = function(src, dest) {
  var assets = $.useref.assets({
    searchPath: ['.tmp', 'app']
  });

  return gulp.src(src)
    .pipe(assets)
    // Concatenate and minify styles
    // In case you are still using useref build blocks
    .pipe($.if('*.css', $.minifyCss()))
    .pipe(assets.restore())
    .pipe($.useref())
    // Minify any HTML
    .pipe($.if('*.html', $.minifyHtml({
      quotes: true,
      empty: true,
      spare: true
    })))
    // Output files
    .pipe(gulp.dest(dest))
    .pipe($.size({
      title: 'html'
    }));
};

// Compile and automatically prefix stylesheets
gulp.task('styles', function() {
  return styleTask('styles', ['**/*.css']);
});

gulp.task('elements', function() {
  return styleTask('elements', ['**/*.css']);
});

// Ensure that we are not missing required files for the project
// "dot" files are specifically tricky due to them being hidden on
// some systems.
gulp.task('ensureFiles', function(cb) {
  var requiredFiles = ['.bowerrc'];

  ensureFiles(requiredFiles.map(function(p) {
    return path.join(__dirname, p);
  }), cb);
});

// Optimize images
gulp.task('images', function() {
  return imageOptimizeTask('app/images/**/*', dist('images'));
});

// Copy all files at the root level (app)
gulp.task('copy', function() {
  var app = gulp.src([
    'app/*',
    '!app/.git',
    '!app/scss',
    '!app/test',
    '!app/elements',
    '!app/bower_components',
    '!app/scripts',
    '!app/cache-config.json',
    '!**/.DS_Store'
  ], {
    dot: true
  }).pipe(gulp.dest(dist()));

  gulp.src(['app/_locales/**/*.*'], {base: 'app'})
    .pipe(gulp.dest(dist()));

  // Copy over only the bower_components we need
  // These are things which cannot be vulcanized
  var bower = gulp.src([
    // 'app/bower_components/{page,webcomponentsjs,platinum-sw,sw-toolbox,promise-polyfill}/**/*'
  ]).pipe(gulp.dest(dist('bower_components')));

  return merge(app, bower)
    .pipe($.size({
      title: 'copy'
    }));
});

// Copy web fonts to dist
gulp.task('fonts', function() {
  return gulp.src(['app/fonts/**'])
  .pipe(gulp.dest(dist('fonts')))
  .pipe($.size({
    title: 'fonts'
  }));
});

// Scan your HTML for assets & optimize them
gulp.task('html', function() {
  return optimizeHtmlTask(
    ['app/**/*.html', '!app/{elements,test,bower_components}/**/*.html'],
    dist());
});

// Vulcanize granular configuration
gulp.task('vulcanize', function() {
  return gulp.src(['.tmp/elements/elements.html'])
    .pipe($.vulcanize({
      stripComments: true,
      inlineCss: true,
      inlineScripts: true,
      stripExcludes: ['iron-flex-layout/*'],
      stripComments: true,
    }))
    .pipe($.crisper({ scriptInHead: false, onlySplit: false }))
    .pipe($.if('*.js', $.if(production, $.uglify({ preserveComments: 'false' }))))
    .pipe(gulp.dest(dist('elements')))
    .pipe($.size({title: 'vulcanize'}));
});

// Clean output directory
gulp.task('clean', function() {
  return del(['.tmp', dist()]);
});

// Load custom tasks from the `tasks` directory
try {
  require('require-dir')('tasks');
} catch (err) {}

////////////////////////////////////////////////////////////////////////////////

gulp.task('styles', function() {
  var stylesPath = 'styles';
  return gulp.src('app/scss/main.scss')
    .pipe($.sass().on('error', $.sass.logError))
    .pipe(gulp.dest('.tmp/' + stylesPath))
    .pipe($.minifyCss())
    .pipe(gulp.dest(dist(stylesPath)))
    .pipe($.size({title: stylesPath}));
});

gulp.task('scripts', function() {
 return gulp.src(['app/scripts/**/*.js'])
  .pipe($.babel({presets: ['es2015']}))
  .pipe($.if(production, $.uglify({preserveComments: 'false'})))
  .pipe(gulp.dest(dist('scripts')));
});

// Transpile all JS to ES5.
gulp.task('elements-babel', function() {
 return gulp.src(['app/elements/**/*.{js,html}'])
  .pipe($.sourcemaps.init())
  .pipe($.if('*.html', $.crisper({scriptInHead: false}))) // Extract JS from .html files
  .pipe($.if('*.js', $.babel({presets: ['es2015']})))
  .pipe($.sourcemaps.write('.'))
  .pipe(gulp.dest('.tmp/elements'));
});

gulp.task('elements-watch', function(cb) {
  runSequence('elements-babel', 'vulcanize', cb);
});

gulp.task('default', ['clean'], function(cb) {

  // Uncomment 'cache-config' if you are going to use service workers.
  runSequence(
    ['ensureFiles', 'copy', 'styles'],
    ['scripts', 'elements-babel'],
    // 'elements',
    ['images', 'fonts', 'html'],
    'vulcanize', // 'cache-config',
    cb);

  // Watch Files For Changes & Reload
  gulp.watch(['app/*'], ['copy', reload]);
  gulp.watch(['app/images/**/*'], ['images', reload]);
  gulp.watch(['app/scripts/**/*.js'], ['scripts', reload]);
  gulp.watch(['app/scss/**/*.scss'], ['styles', reload]);
  gulp.watch(['app/elements/**/*.{js,html}'], ['elements-watch', reload]);
});

gulp.task('build', ['clean'], function(cb) {

  production = true;
  // Uncomment 'cache-config' if you are going to use service workers.
  runSequence(
    ['ensureFiles', 'copy', 'styles'],
    ['scripts', 'elements-babel'],
    // 'elements',
    ['images', 'fonts', 'html'],
    'vulcanize', // 'cache-config',
    cb);
});
