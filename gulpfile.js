var gulp = require('gulp'),
    rev = require('gulp-rev'),
    revReplace = require('gulp-rev-replace'),
    useref = require('gulp-useref'),
    uglify = require('gulp-uglify'),
    del = require('del'),
    minifycss = require('gulp-minify-css'),
    gulpif = require('gulp-if'),
    connect = require('gulp-connect'),
    notify = require('gulp-notify');

gulp.task("index", function () {


    var userefAssets = useref.assets();

    return gulp.src("src/*.html")
        .pipe(userefAssets)      // Concatenate with gulp-useref
        .pipe(gulpif('*.js', uglify()))
        .pipe(gulpif('*.css', minifycss()))
        .pipe(rev())                // Rename the concatenated files
        .pipe(userefAssets.restore())
        .pipe(useref())
        .pipe(revReplace())         // Substitute in new filenames
        .pipe(gulp.dest('public'))
        .pipe(notify({message: 'Task complete'}));
});
//connect
gulp.task('connect', function () {
    connect.server({
        root: 'src',
        livereload: true
    });
});
//clean
gulp.task('clean', function () {
    del(['public'])
});

gulp.task('default', ['clean'], function () {
    gulp.start('index');
});

gulp.task('serve', ['connect']);

