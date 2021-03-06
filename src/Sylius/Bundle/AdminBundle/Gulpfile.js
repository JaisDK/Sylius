var concat = require('gulp-concat');
var env = process.env.GULP_ENV;
var gulp = require('gulp');
var gulpif = require('gulp-if');
var livereload = require('gulp-livereload');
var merge = require('merge-stream');
var order = require('gulp-order');
var sass = require('gulp-sass');
var sourcemaps = require('gulp-sourcemaps');
var uglify = require('gulp-uglify');
var uglifycss = require('gulp-uglifycss');
var argv = require('yargs').argv;
var path = require('path');

var rootPath = argv.rootPath;
var adminRootPath = rootPath + 'admin/';
var vendorPath = argv.vendorPath || '';
var vendorAdminPath = '' === vendorPath ? '' : vendorPath + 'AdminBundle/';
var vendorUiPath = '' === vendorPath ? '../UiBundle/' : vendorPath + 'UiBundle/';
var nodeModulesPath = argv.nodeModulesPath;

var paths = {
    admin: {
        js: [
            nodeModulesPath + 'jquery/dist/jquery.min.js',
            nodeModulesPath + 'semantic-ui-css/semantic.min.js',
            vendorUiPath + 'Resources/private/js/**',
            vendorAdminPath + 'Resources/private/js/**'
        ],
        sass: [
            vendorUiPath + 'Resources/private/sass/**',
            vendorAdminPath + 'Resources/private/sass/**'
        ],
        css: [
            nodeModulesPath + 'semantic-ui-css/semantic.min.css',
            vendorUiPath + 'Resources/private/css/**',
            vendorAdminPath + 'Resources/private/css/**'
        ],
        img: [
            vendorUiPath + 'Resources/private/img/**',
            vendorAdminPath + 'Resources/private/img/**'
        ]
    }
};

var sourcePathMap = [
    {
        sourceDir: path.relative('', vendorAdminPath + 'Resources/private/'),
        destPath: '/SyliusAdminBundle/'
    },
    {
        sourceDir: path.relative('', vendorUiPath + 'Resources/private/'),
        destPath: '/SyliusUiBundle/'
    },
    {
        sourceDir: path.relative('', nodeModulesPath),
        destPath: '/node_modules/'
    }
];

var mapSourcePath = function mapSourcePath(sourcePath, file) {
    for (var spec of sourcePathMap) {
        if (sourcePath.substring(0, spec.sourceDir.length) === spec.sourceDir) {
            return spec.destPath + sourcePath.substring(spec.sourceDir.length);
        }
    }

    return sourcePath;
};

gulp.task('admin-js', function () {
    return gulp.src(paths.admin.js, { base: './' })
        .pipe(gulpif(env !== 'prod', sourcemaps.init()))
        .pipe(concat('app.js'))
        .pipe(gulpif(env === 'prod', uglify()))
        .pipe(gulpif(env !== 'prod', sourcemaps.mapSources(mapSourcePath)))
        .pipe(gulpif(env !== 'prod', sourcemaps.write('./')))
        .pipe(gulp.dest(adminRootPath + 'js/'))
    ;
});

gulp.task('admin-css', function() {
    gulp.src([nodeModulesPath+'semantic-ui-css/themes/**/*']).pipe(gulp.dest(adminRootPath + 'css/themes/'));

    var cssStream = gulp.src(paths.admin.css, { base: './' })
        .pipe(gulpif(env !== 'prod', sourcemaps.init()))
        .pipe(concat('css-files.css'))
    ;

    var sassStream = gulp.src(paths.admin.sass, { base: './' })
        .pipe(gulpif(env !== 'prod', sourcemaps.init()))
        .pipe(sass())
        .pipe(concat('sass-files.scss'))
    ;

    return merge(cssStream, sassStream)
        .pipe(order(['css-files.css', 'sass-files.scss']))
        .pipe(concat('style.css'))
        .pipe(gulpif(env === 'prod', uglifycss()))
        .pipe(gulpif(env !== 'prod', sourcemaps.mapSources(mapSourcePath)))
        .pipe(gulpif(env !== 'prod', sourcemaps.write('./')))
        .pipe(gulp.dest(adminRootPath + 'css/'))
        .pipe(livereload())
    ;
});

gulp.task('admin-img', function() {
    return gulp.src(paths.admin.img)
        .pipe(gulp.dest(adminRootPath + 'img/'))
    ;
});

gulp.task('admin-watch', function() {
    livereload.listen();

    gulp.watch(paths.admin.js, ['admin-js']);
    gulp.watch(paths.admin.sass, ['admin-css']);
    gulp.watch(paths.admin.css, ['admin-css']);
    gulp.watch(paths.admin.img, ['admin-img']);
});

gulp.task('default', ['admin-js', 'admin-css', 'admin-img']);
gulp.task('watch', ['default', 'admin-watch']);
