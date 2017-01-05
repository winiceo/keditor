'use strict';
var spawn = require('child_process').spawn,
    node,
    fs=require("fs");
var _=require("lodash")

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
    gulp.task('client:shardeb', function() {
      return plugins.browserify('./src/client/sharedbClient.js')
        
        
       .pipe(gulp.dest('./src/client/sharedb.js'));
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

    gulp.task('client:start', function() {
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
