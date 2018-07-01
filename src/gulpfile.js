var gulp = require('gulp');
var sass = require('gulp-sass');
var cleanCSS = require('gulp-clean-css');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify-es').default;
var htmlmin = require('gulp-htmlmin');
var browserSync = require('browser-sync');
var rename = require('gulp-rename');


gulp.task('default', ['serve','minify','styles','minify-css','scripts'], function() {

});
/*gulp.task('dist', [
	'styles',
	'scripts-dist',
	'minify',
	'serve',
]);*/


gulp.task('minify', function() {
  return gulp.src('*.html')
    .pipe(htmlmin({collapseWhitespace: true}))
    .pipe(htmlmin({removeComments: true}))
    .pipe(gulp.dest('dist'));
});

gulp.task('styles', function() {
	gulp.src('css/**/*.css')
		.pipe(sass({
			outputStyle: 'compressed'
		}).on('error', sass.logError))
		.pipe(gulp.dest('dist/sass'))
});

gulp.task('minify-css', function() {
  return gulp.src('css/*.css')
    .pipe(cleanCSS({compatibility: 'ie8'}))
    .pipe(gulp.dest('dist/sass'));
});

gulp.task('scripts', function(cb) {
	return gulp.src(['js/**/dbhelper.js', 'js/**/main.js', 'js/**/intersection.js', 'js/**/mainRestaurants.js'])
		.pipe(concat('all.js'))
		.pipe(gulp.dest('js'))
    .pipe(rename('uglify.js'))
    .pipe(uglify())
    .pipe(gulp.dest('dist/js'));
});
gulp.task('scripts-restaurant-review', function(cb) {
  return gulp.src(['js/**/dbhelper.js', 'js/**/restaurant_info.js', 'js/**/restaurant_map.js'])
    .pipe(concat('all_restaurant.js'))
    .pipe(gulp.dest('js'))
    .pipe(rename('uglify_restaurant.js'))
    .pipe(uglify().on('error', function(e){
            console.log(e);
         }))
    .pipe(gulp.dest('dist/js'));
});

gulp.task('watch', function() {
  gulp.watch('css/*.css', ['minify-css']);
  gulp.watch('js/*.js', ['scripts']);
});



gulp.task('serve', ['minify','scripts','scripts-restaurant-review', 'minify-css','styles'], function() {
  browserSync.init({
    server: {
            baseDir: "./dist"
        },
    port: 8000
  });
  gulp.watch('*.html', ['minify']).on('change', browserSync.reload);

  gulp.watch('css/*.css', ['minify-css']).on('change', browserSync.reload);
  gulp.watch('js/*.js', ['scripts']).on('change', browserSync.reload);
    gulp.watch('js/*.js', ['scripts-restaurant-review']).on('change', browserSync.reload);

  gulp.watch('css/*.css', ['styles']).on('change', browserSync.reload);

  gulp.watch('*.html').on('change', browserSync.reload);
});


