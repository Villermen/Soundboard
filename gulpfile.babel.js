import autoprefixer from 'autoprefixer';
import babelify from 'babelify';
import browserify from 'browserify';
import buffer from 'vinyl-buffer';
import cssnano from 'cssnano';
import del from 'del';
import fs from 'fs-extra';
import gulp from 'gulp';
import gulpif from 'gulp-if';
import gulpLivereload from 'gulp-livereload';
import gulpSourcemaps from 'gulp-sourcemaps';
import log from 'fancy-log';
import path from 'path';
import postcss from 'gulp-postcss';
import rename from 'gulp-rename';
import sass from 'gulp-sass';
import sourceStream from 'vinyl-source-stream';
import svgify from 'svg-browserify';
import uglify from 'gulp-uglify';
import watchify from 'watchify';
import { argv } from 'yargs';

const publicDir = `${__dirname}/public`;
const distDir = `${__dirname}/dist`;
const buildDir = `${publicDir}/build`;

const {
    compress = true,
    livereload = false,
    sourcemaps = false,
} = argv;

const browserifyOptions = {
    entries: ['frontend/src/main.js'],
    debug: sourcemaps,
};

gulp.task('clean:styles', () => del([`${buildDir}/*.{css,css.map}`]));

const buildStyles = () => {
    const sassOptions = {
        importer(url) {
            let resolvedUrl = url;

            if (url[0] === '~') {
                resolvedUrl = path.resolve('node_modules', url.substr(1));
            }

            return { file: resolvedUrl };
        },
    };

    const processors = [
        autoprefixer({ browsers: ['last 1 version'] }),
    ];

    if (compress) {
        processors.push(cssnano());
    }

    return gulp.src('frontend/styles/**/*.scss')
        .pipe(gulpif(sourcemaps, gulpSourcemaps.init()))
        .pipe(sass(sassOptions).on('error', sass.logError))
        .pipe(postcss(processors))
        .pipe(rename('style.css'))
        .pipe(gulpif(sourcemaps, gulpSourcemaps.write('./')))
        .pipe(gulp.dest(buildDir))
        .pipe(gulpif(livereload, gulpLivereload()));
};

gulp.task('build:styles', gulp.series(
    'clean:styles',
    buildStyles
));

gulp.task('watch:styles', () => {
    if (livereload) {
        gulpLivereload.listen();
    }

    gulp.watch('frontend/styles/**/*.scss', gulp.series('build:styles'));
});

gulp.task('clean:scripts', () => del([`${buildDir}/*.{js,js.map}`]));

function createBundler(options = {}) {
    return browserify({...browserifyOptions, ...options})
        .transform(babelify)
        .transform(svgify);
}

function bundle(bundler) {
    log('[browserify] Bundle start');

    return bundler.bundle(() => log('[browserify] Bundle completed'))
        .on('error', (err) => {
            log('[browserify]', err.toString());
        })
        .pipe(sourceStream('main.js'))
        .pipe(rename('script.js'))
        .pipe(buffer())
        .pipe(gulpif(sourcemaps, gulpSourcemaps.init({ loadMaps: true })))
        .pipe(gulpif(compress, uglify()))
        .pipe(gulpif(sourcemaps, gulpSourcemaps.write('./')))
        .pipe(gulp.dest(buildDir))
        .pipe(gulpif(livereload, gulpLivereload()));
}

const buildScripts = () => {
    // Copy dist files to public once
    fs.copy(distDir, publicDir, { clobber: false }, (error) => {
        if (error && error.code !== 'EEXIST') {
            throw error;
        }
    });

    // Below code plain just doesn't work while documentation states it should.
    gulp.src('dist/config.json')
      .pipe(rename('config.json'))
      .pipe(gulp.dest(publicDir, { overwrite: false }));

    return bundle(createBundler());
};

gulp.task('build:scripts', gulp.series(
    'clean:scripts',
    buildScripts
));

gulp.task('watch:scripts', () => {
    if (livereload) {
        gulpLivereload.listen();
    }

    const bundler = createBundler(watchify.args)
        .plugin(watchify);

    bundler.on('update', () => {
        log('[watch:scripts] Scripts changed, starting build');
        bundle(bundler);
    });
    bundle(bundler);
});

gulp.task('clean:iconfont', () => del([`${buildDir}/iconfont/`]));

const buildIconfont = () =>
    gulp.src('frontend/iconfont/**/*.{css,eot,svg,ttf,woff,woff2}')
    .pipe(gulp.dest(`${buildDir}/iconfont`));

gulp.task('build:iconfont', gulp.series(
    'clean:iconfont',
    buildIconfont
));

gulp.task('build', gulp.parallel(
    'build:scripts',
    'build:styles',
    'build:iconfont'
));

gulp.task('watch', gulp.parallel(
    'watch:scripts',
    'watch:styles'
));
