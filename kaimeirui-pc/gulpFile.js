const gulp = require("gulp");
const stylus = require('gulp-stylus');

gulp.task('styl', function () {
	gulp.src('./src/stylus/*.styl')
		.pipe(stylus())
		.pipe(gulp.dest('./src/css/'))
});

gulp.task('default', ['styl']);
gulp.watch('./src/stylus/*.styl', ['styl'])
