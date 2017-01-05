var server=require("./index")
var route=require("./route")
server({
    appRoutes:{
        "blog":"/blog",
        "assets":"/assets"
    }

},function(event,options){
    "use strict";

    event.on("routes",function(app,backend){
         route(app,backend)
    })

})
