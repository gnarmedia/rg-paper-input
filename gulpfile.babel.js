'use strict';

import gulp             from 'gulp';
import gulpLoadPlugins  from 'gulp-load-plugins';

// postCSS Plugins
import autoprefixer    from 'autoprefixer';
import cssnano         from 'cssnano';

// Node Plugins
import del          from 'del';
import runSequence  from 'run-sequence';
import browserSync  from 'browser-sync';

// import logOutput    from 'log-output';
// import nodeAdapter  from 'log-output-node';
// logOutput.adapter(nodeAdapter());
// logOutput.adapter(nodeAdapter(process.stderr));

const $ = gulpLoadPlugins();
const reload = browserSync.reload;

const _src = 'src';
const _dist = 'dist';
const _demo = 'demo';
const _tmp = '.tmp';
const _test = 'test';

/**
 * Lint Javascript including Tests
 * @param  {Array}  files   stream of Vinyl files to pipe to plugins
 * @param  {Object} options eslint linting options
 * @return {Stream}         stream
 */
function lint (files, options) {
  return () => {
    return gulp.src(files)
      .pipe($.using({
        prefix: 'Linting: ',
        color: 'green'
      }))
      //  .pipe(reload({stream: true, once: true}))
      .pipe($.eslint(options))
      .pipe($.eslint.format())
      //  .pipe($.if(!browserSync.active, $.eslint.failAfterError()))
    ;
  };
}

const testLintOptions = {
  env: {
    jasmine: true
  }
};

// Lint JS
gulp.task('lint',      lint(_src + '/*.js'));
gulp.task('lint:tests', lint(_test + '/*.js', testLintOptions));

// Check JS Code Style
gulp.task('jscs', () => {
  gulp.src(_src + '/*.js')
    .pipe($.using({
      prefix: 'JSCSing: ',
      color: 'green'
    }))
    .pipe($.jscs({
      configPath: '.jscsrc',
      fix: false
    }))
  ;
});

// Clean build directory
gulp.task('clean:prep', del.bind(null, [_dist, _tmp, 'maps']));

// Clean .tmp of CSS and JS
gulp.task('clean:tmp',   del.bind(null, [_tmp + '/*.css', _tmp + '/*.js']));
gulp.task('clean:final', del.bind(null, [_tmp]));

// Process Jade
gulp.task('build:html', () => {
  return gulp.src([_src + '/*.jade', '!' + _src + '/demo.jade'])
    // Jade task
    .pipe($.using({
      prefix: 'Processing Jade: ',
      color: 'green'
    }))
    .pipe($.jade({ pretty: true }))
    .pipe(gulp.dest(_tmp))
  ;
});

// Process Jade
gulp.task('build:demo', () => {
  return gulp.src(_src + '/demo.jade')
    // Jade task
    .pipe($.using({
      prefix: 'Processing Jade: ',
      color: 'green'
    }))
    .pipe($.jade({ pretty: true }))
    .pipe($.rename("index.html"))
    .pipe(gulp.dest(_demo))
  ;
});

// Process CSS
gulp.task('build:css', () => {
  var processors = [
    autoprefixer({browsers: ['last 1 version']}),
    cssnano()
  ];
  return gulp.src(_src + '/*.css')
    .pipe($.using({
      prefix: 'Processing CSS: ',
      color: 'green'
    }))
    .pipe($.postcss(processors))
    .pipe(gulp.dest(_tmp))
  ;
});

// Process JS
gulp.task('build:js', () => {
  return gulp.src(_src + '/*.js')
    .pipe($.using({
      prefix: 'Processing JS: ',
      color: 'green'
    }))
    .pipe($.sourcemaps.init())
    .pipe($.babel())
    .pipe($.uglify())
    .pipe($.sourcemaps.write('../maps'))
    .pipe(gulp.dest(_tmp))
  ;
});

// Inline CSS and JS
gulp.task('inline', () => {
  return gulp.src(_tmp + '/*.html')
    .pipe($.using({
      prefix: 'Inlining CSS and JS: ',
      color: 'green'
    }))
    .pipe($.inline())
    .pipe(gulp.dest(_tmp))
  ;
});

// Build Riot Tag
gulp.task('build:tag', () => {
  return gulp.src(_tmp + '/*.html')
    .pipe($.using({
      prefix: 'Generating Tag JS: ',
      color: 'green'
    }))
    .pipe($.riot({ compact: true }))
    // .pipe($.extensionChange({ afterExtension: 'tag' }))
    .pipe(gulp.dest(_dist))
  ;
});

gulp.task('minify:js', () => {
  return gulp.src(_dist + '/*.js')
    .pipe($.using({
      prefix: 'Minifying Tag JS: ',
      color: 'green'
    }))
    .pipe($.uglify())
    .pipe($.extensionChange({
      afterExtension: 'min.js',
      copy: true
    }))
    .pipe(gulp.dest(_dist))
  ;
});

// gulp.task('prep', ['build:html', 'build:css', 'build:js']);
// prep
gulp.task('prep', (callback) => {
  $.sequence(
    [
      'lint',
      'lint:tests',
      'jscs',
    ],
    'clean:prep',
    callback
    // logOutput.adapter(nodeAdapter(process.stderr))
  );
});

// Serve
gulp.task('serve', function () {

  runSequence(
    'build:demo'
  );

  browserSync({
    notify: false,
    port: 9000,
    server: {
      baseDir: [_demo],
      routes: {
        '/bower_components': 'bower_components',
        '/dist': _dist,
      }
    }
  });

  gulp.watch([
    _dist + '/*.js',
    _demo + '/index.html'
  ]).on('change', reload);

  gulp.watch(_src + '/demo.jade', ['build:demo']);
});

// Build Component
gulp.task('build', (callback) => {
  $.sequence(
    'prep',
    [
      'build:html',
      'build:css',
      'build:js',
    ],
    'inline',
    'clean:tmp',
    'build:tag',
    'minify:js',
    'clean:final',
    callback
    // logOutput.adapter(nodeAdapter(process.stderr))
  );
});

// TODO: transpile demo Jade
// TODO: look into flow
// TODO: finish serve functionality including browserSync server

gulp.task('default', () => {
  gulp.start('build');
});
