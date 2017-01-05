'use strict';
var spawn = require('child_process').spawn,
    node,
    fs=require("fs");
var _=require("lodash")

var browserify = require('browserify');
var source = require('vinyl-source-stream');
//var json=require("../src/client/file.json")

/**
 * Live reload server.
 */
module.exports = function(gulp, plugins) {
    var json= JSON.parse(fs.readFileSync('./src/client/file.json', "utf8"));
    var jss=[]
    _.each(json,function(n){
        jss.push("./src/client/app/"+n)
    }) 
     var b = browserify({
        entries: "./src/client/index.js",
        debug: true
    });

      gulp.task('client:clean', function() {
        return plugins.del(['./public/static']);
    });

     
    gulp.task('client:sharedb', function() {
        return b
            .bundle()

            //Pass desired output filename to vinyl-source-stream
            .pipe(source('sharedb.js'))
            // Start piping stream to tasks!
            .pipe(gulp.dest('./public/static/js/'));
    });

    gulp.task('client:js',function() {

        gulp.src(jss)
            
            // .pipe(plugins.order(json, { base: './src/client/app/' }))
            .pipe(plugins.concat('editor.js'))
            //.pipe(uglify({mangle: false}))
            .pipe(gulp.dest('./public/static/js/'));
    });
    gulp.task('client:watch', function() {
        // Compile LESS files
         gulp.watch('./src/client/app/**/*.js', ['client:js',plugins.browserSync.reload]);

        // gulp.watch([
        //     './src/client/app/**/*.js'

        // ]).on('change', plugins.browserSync.reload);
    });

    gulp.task('client:start',['client:clean','client:js','client:sharedb'], function() {
        plugins.browserSync.init({
            proxy: "http://localhost:4444/editor/scene/487784"
        });
    });

    // gulp.task('serve:start', function() {
    //     return plugins.browserSync.init({
    //         server : (plugins.util.env.root || 'app'),
    //         port   : (plugins.util.env.port || 9000),
    //     });
    // });

};
