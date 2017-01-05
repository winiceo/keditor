var app=require("./app")
var route=require("./route")
var middleware=require("./middleware")
app({
    appRoutes:{
        "blog":"/blog",
        "assets":"/assets"
    }

},function(event,options){
    "use strict";

    event.on("routes",function(app,backend){
         route(app,backend)
    })

    event.on("middleware",function(app,backend){
        middleware(app,backend)
    })

})
