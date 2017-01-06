/**
 * Created by leven on 17/1/5.
 */
 var fs=require("fs");
var _ = require('lodash');
var path=require("path")
var mkdirp=require("mkdirp")

var lineReader = require('line-reader');
var db=[]
;
var fileName=""
var lines=[];
var names=[]

function mkdir(url) {
  
    var a = path.dirname(url);
   
    mkdirp(a, function (err) {
        if (err) console.error(err)
        else console.log('pow!')
    });
}
//fs.writeFileSync('./message.txt', 'Hello Node');

lineReader.eachLine('launch.js', function(line, last) {


    
     if (line.indexOf('/*')==0) {
        
        if(lines.length>0&&fileName){
            write();
        }
        lines.push(line)
         var reg = /\/\*(.*)\*\//g; 
         var tmp = reg.exec(line);
          fileName=tmp[1].trim()
         
      }else{
        lines.push(line)

      } 
      if(last){
         write();

        //console.log(names)
        fs.writeFile("./launch.json", JSON.stringify(names))

      }
});

function write(){
     names.push(fileName)
     var file=__dirname+"/launch/"+fileName
     mkdir(file)
     console.log(__dirname+"/launch/"+fileName)
     fs.writeFile(file, lines.join("\n"), (err) => {
      if (err) throw err;
      console.log('It\'s saved!');
    });
      
      lines=[];
      fileName=""
}
