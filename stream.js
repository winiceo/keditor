/**
 * Created by leven on 17/1/4.
 */
var Duplex = require('stream').Duplex,
    WebSocketServer = require('ws').Server;


// Pass in pass through stream
// server option is passed to the WebSocketServer initialization
module.exports = function(store, serverOptions, clientOptions) {

    if (!clientOptions) clientOptions = {};
    // store.on('model', function(model) {
    //     model.on('bundle', function(bundle) {
    //         bundle.racerWebSocket = clientOptions;
    //     });
    // });
    //
    // store.on('bundle', function(browserify) {
    //     browserify.add(__dirname + '/browser');
    // });

    var wss = new WebSocketServer(serverOptions);
    wss.on('connection', function(client) {
        //store.emit('client', client);
        var stream = createStream(client,function(a){
            "use strict";
            console.log(a)
        });
        var agent = store.listen(stream);
        //store.emit('share agent', agent, stream);
    });

};

/**
 * @param {EventEmitters} client is a WebSocket client session for a given
 * browser window/tab that is has a connection
 * @return {Duplex} stream
 */
function createStream(client, logger) {
    var stream = new Duplex({ objectMode: true });
    stream._write = function stream__write(chunk, encoding, callback) {
        log('server -> client\n ', chunk, '\n');
        clientSend(JSON.stringify(chunk));
        callback();
    };

    stream._read = function stream__read() {};

    stream.headers = client.upgradeReq.headers;
    stream.remoteAddress = client.upgradeReq.connection.remoteAddress;

    client.on('message', function onMessage(msg) {
        log('client -> server\n ', msg, '\n');

        if (msg === 'ping') {
            clientSend('pong');
            //log('server -> client\n', 'pong\n');
            return;
        }
        //console.log("==============")

        //console.log(msg)
        if (msg==="auth") {
            return true;
        }

        if (/^auth/.test(msg)) {
            return clientSend('auth{"id":10695}');
        }

        if (/^selection/.test(msg)) {
            return //clientSend('auth{"id":10695}');
        }

        if (/^project/.test(msg)) {
            return //clientSend('auth{"id":10695}');
        }


        var ws=JSON.parse(msg)
        // console.log(ws.c=="scenes")

        // if(ws.c=="scenes"){

        //    var data='{"data":{"data":{"name":"Untitled","created":"2017-01-02T10:11:35.696Z","settings":{"physics":{"gravity":[0,-9.8,0]},"render":{"fog_end":1000,"tonemapping":0,"skybox":null,"fog_density":0.01,"gamma_correction":1,"exposure":1,"fog_start":1,"global_ambient":[0.2,0.2,0.2],"skyboxIntensity":1,"fog_color":[0,0,0],"lightmapMode":1,"fog":"none","lightmapMaxResolution":2048,"skyboxMip":0,"lightmapSizeMultiplier":16}},"scene":487210,"entities":{"d7b45b72-d0d3-11e6-a4ac-22000ac481df":{"position":[0,-1,0],"scale":[8,1,8],"name":"Plane","parent":"d7b4546a-d0d3-11e6-a4ac-22000ac481df","resource_id":"d7b45b72-d0d3-11e6-a4ac-22000ac481df","components":{"model":{"lightMapSizeMultiplier":1,"castShadows":true,"castShadowsLightmap":true,"lightmapped":false,"materialAsset":null,"receiveShadows":true,"enabled":true,"castShadowsLightMap":false,"asset":null,"lightmapSizeMultiplier":1,"type":"plane","lightMapped":false,"isStatic":false}},"rotation":[0,0,0],"enabled":true,"children":["2173d142-a3e9-45db-acf5-762fa0fffb9e"],"tags":[]},"d7b4546a-d0d3-11e6-a4ac-22000ac481df":{"position":[0,0,0],"scale":[1,1,1],"name":"Root","parent":null,"resource_id":"d7b4546a-d0d3-11e6-a4ac-22000ac481df","components":{},"rotation":[0,0,0],"enabled":true,"children":["d7b4582a-d0d3-11e6-a4ac-22000ac481df","d7b459ce-d0d3-11e6-a4ac-22000ac481df","d7b45b72-d0d3-11e6-a4ac-22000ac481df","f9a375d2-a72b-4fc7-95b2-83614c4e1e8d","d1abaa9c-49fc-46de-a1ee-7af7b9bcf831","6da53233-f6eb-4e2c-918f-04df998463d1"],"tags":[]},"d7b459ce-d0d3-11e6-a4ac-22000ac481df":{"position":[0,0.5,0],"scale":[1,1,1],"name":"Box","parent":"d7b4546a-d0d3-11e6-a4ac-22000ac481df","resource_id":"d7b459ce-d0d3-11e6-a4ac-22000ac481df","components":{"model":{"lightMapSizeMultiplier":1,"castShadows":true,"castShadowsLightmap":true,"lightmapped":false,"materialAsset":null,"receiveShadows":true,"enabled":true,"castShadowsLightMap":false,"asset":null,"lightmapSizeMultiplier":1,"type":"sphere","lightMapped":false,"isStatic":false}},"rotation":[0,0,0],"enabled":true,"children":[],"tags":[]},"d7b4582a-d0d3-11e6-a4ac-22000ac481df":{"position":[2,2,-2],"scale":[1,1,1],"name":"Light","parent":"d7b4546a-d0d3-11e6-a4ac-22000ac481df","resource_id":"d7b4582a-d0d3-11e6-a4ac-22000ac481df","components":{"light":{"castShadows":true,"shadowDistance":16,"vsmBlurSize":11,"shadowUpdateMode":2,"normalOffsetBias":0.04,"color":[1,1,1],"falloffMode":0,"shadowResolution":1024,"outerConeAngle":45,"enabled":true,"range":8,"affectDynamic":true,"intensity":1,"affectLightmapped":false,"vsmBlurMode":1,"innerConeAngle":40,"shadowBias":0.04,"bake":false,"type":"directional","shadowType":0,"vsmBias":0.01,"isStatic":false,"bakeDir":true,"cookieAsset":null,"cookieIntensity":1,"cookieFalloff":true,"cookieChannel":"rgb","cookieAngle":0,"cookieScale":[1,1],"cookieOffset":[0,0]}},"rotation":[45,135,0],"enabled":true,"children":["994c710e-351f-4728-9bc6-0db3e780e761"],"tags":[]},"2173d142-a3e9-45db-acf5-762fa0fffb9e":{"name":"Sphere","tags":[],"enabled":true,"resource_id":"2173d142-a3e9-45db-acf5-762fa0fffb9e","parent":"d7b45b72-d0d3-11e6-a4ac-22000ac481df","children":[],"position":[0,0,0.25],"rotation":[0,0,0],"scale":[1,1,1],"components":{"model":{"enabled":true,"isStatic":false,"type":"sphere","asset":null,"materialAsset":null,"castShadows":true,"castShadowsLightmap":true,"receiveShadows":true,"lightmapped":false,"lightmapSizeMultiplier":1}}},"f9a375d2-a72b-4fc7-95b2-83614c4e1e8d":{"name":"Zone","tags":[],"enabled":true,"resource_id":"f9a375d2-a72b-4fc7-95b2-83614c4e1e8d","parent":"d7b4546a-d0d3-11e6-a4ac-22000ac481df","children":[],"position":[0,0,1.1716241836547852],"rotation":[0,0,0],"scale":[1,1,1],"components":{"zone":{"enabled":true,"size":[1,1,3.3432483673095703]}}},"d1abaa9c-49fc-46de-a1ee-7af7b9bcf831":{"name":"Capsule","tags":[],"enabled":true,"resource_id":"d1abaa9c-49fc-46de-a1ee-7af7b9bcf831","parent":"d7b4546a-d0d3-11e6-a4ac-22000ac481df","children":["8850d3e2-f729-4146-a3a1-547e5e24478b"],"position":[0,0,0],"rotation":[0,0,0],"scale":[1,1,1],"components":{"model":{"enabled":true,"isStatic":false,"type":"capsule","asset":null,"materialAsset":null,"castShadows":true,"castShadowsLightmap":true,"receiveShadows":true,"lightmapped":false,"lightmapSizeMultiplier":1}}},"8850d3e2-f729-4146-a3a1-547e5e24478b":{"name":"Sphere","tags":[],"enabled":true,"resource_id":"8850d3e2-f729-4146-a3a1-547e5e24478b","parent":"d1abaa9c-49fc-46de-a1ee-7af7b9bcf831","children":["166dd76a-65e5-431b-8776-575f4fb1e1c6","97b84fc5-e5a6-4142-b5b1-0156937cfff0"],"position":[0,0,0],"rotation":[0,0,0],"scale":[1,1,1],"components":{"model":{"enabled":true,"isStatic":false,"type":"sphere","asset":null,"materialAsset":null,"castShadows":true,"castShadowsLightmap":true,"receiveShadows":true,"lightmapped":false,"lightmapSizeMultiplier":1}}},"166dd76a-65e5-431b-8776-575f4fb1e1c6":{"name":"Model","tags":[],"enabled":true,"resource_id":"166dd76a-65e5-431b-8776-575f4fb1e1c6","parent":"8850d3e2-f729-4146-a3a1-547e5e24478b","children":["d8f8ef52-f210-4098-b01e-8d74d47f71a3"],"position":[0,0,0],"rotation":[0,0,0],"scale":[1,1,1],"components":{"model":{"enabled":true,"isStatic":false,"type":"asset","asset":null,"materialAsset":null,"castShadows":true,"castShadowsLightmap":true,"receiveShadows":true,"lightmapped":false,"lightmapSizeMultiplier":1}}},"d8f8ef52-f210-4098-b01e-8d74d47f71a3":{"name":"Cylinder","tags":[],"enabled":true,"resource_id":"d8f8ef52-f210-4098-b01e-8d74d47f71a3","parent":"166dd76a-65e5-431b-8776-575f4fb1e1c6","children":["894e15e7-14d4-411a-bdbc-c081082eb5ef","8cdb0225-00e0-4721-9947-b657ff308b34","4f0f46ac-7922-4f1d-80ce-31a76a8d7606","0ebfe053-4651-437d-8641-2fe075870069","d8433051-41ef-4f84-b7cf-c48fcc5ddd0d","1a38572e-b1fe-47a3-98c3-ad061e43a3bb"],"position":[0,0.8576746582984924,-1.786338448524475],"rotation":[0,0,0],"scale":[1.6141537427902222,0.6382249209250972,1.6141537427902222],"components":{"model":{"enabled":true,"isStatic":false,"type":"sphere","asset":null,"materialAsset":null,"castShadows":true,"castShadowsLightmap":true,"receiveShadows":true,"lightmapped":false,"lightmapSizeMultiplier":1}}},"894e15e7-14d4-411a-bdbc-c081082eb5ef":{"name":"Directional Light","tags":[],"enabled":true,"resource_id":"894e15e7-14d4-411a-bdbc-c081082eb5ef","parent":"d8f8ef52-f210-4098-b01e-8d74d47f71a3","children":[],"position":[0,0,0],"rotation":[0,0,0],"scale":[1,1,1],"components":{"light":{"enabled":true,"type":"directional","isStatic":false,"bake":false,"affectDynamic":true,"color":[1,1,1],"intensity":1,"castShadows":false,"shadowType":0,"shadowDistance":16,"shadowResolution":1024,"shadowBias":0.04,"normalOffsetBias":0.04,"vsmBlurMode":1,"vsmBlurSize":11,"vsmBias":0.01,"range":8,"falloffMode":0,"innerConeAngle":40,"outerConeAngle":45,"cookieAsset":null,"cookieIntensity":1,"cookieFalloff":true,"cookieChannel":"rgb","cookieAngle":0,"cookieOffset":[0,0],"cookieScale":[1,1],"bakeDir":true,"affectLightmapped":false,"shadowUpdateMode":2}}},"8cdb0225-00e0-4721-9947-b657ff308b34":{"name":"Directional Light","tags":[],"enabled":true,"resource_id":"8cdb0225-00e0-4721-9947-b657ff308b34","parent":"d8f8ef52-f210-4098-b01e-8d74d47f71a3","children":[],"position":[0,-0.3089757561683655,-0.0005812644958496094],"rotation":[0,0,0],"scale":[1,1,1],"components":{"light":{"enabled":true,"type":"directional","isStatic":false,"bake":false,"affectDynamic":true,"color":[1,1,1],"intensity":1,"castShadows":false,"shadowType":0,"shadowDistance":16,"shadowResolution":1024,"shadowBias":0.04,"normalOffsetBias":0.04,"vsmBlurMode":1,"vsmBlurSize":11,"vsmBias":0.01,"range":8,"falloffMode":0,"innerConeAngle":40,"outerConeAngle":45,"cookieAsset":null,"cookieIntensity":1,"cookieFalloff":true,"cookieChannel":"rgb","cookieAngle":0,"cookieOffset":[0,0],"cookieScale":[1,1],"bakeDir":true,"affectLightmapped":false,"shadowUpdateMode":2}}},"4f0f46ac-7922-4f1d-80ce-31a76a8d7606":{"name":"Directional Light","tags":[],"enabled":true,"resource_id":"4f0f46ac-7922-4f1d-80ce-31a76a8d7606","parent":"d8f8ef52-f210-4098-b01e-8d74d47f71a3","children":[],"position":[100,-0.3089757561683655,-0.0005812644958496094],"rotation":[0,0,0],"scale":[1,1,1],"components":{"light":{"enabled":true,"type":"directional","isStatic":false,"bake":false,"affectDynamic":true,"color":[1,1,1],"intensity":1,"castShadows":false,"shadowType":0,"shadowDistance":16,"shadowResolution":1024,"shadowBias":0.04,"normalOffsetBias":0.04,"vsmBlurMode":1,"vsmBlurSize":11,"vsmBias":0.01,"range":8,"falloffMode":0,"innerConeAngle":40,"outerConeAngle":45,"cookieAsset":null,"cookieIntensity":1,"cookieFalloff":true,"cookieChannel":"rgb","cookieAngle":0,"cookieOffset":[0,0],"cookieScale":[1,1],"bakeDir":true,"affectLightmapped":false,"shadowUpdateMode":2}}},"0ebfe053-4651-437d-8641-2fe075870069":{"name":"Directional Light","tags":[],"enabled":true,"resource_id":"0ebfe053-4651-437d-8641-2fe075870069","parent":"d8f8ef52-f210-4098-b01e-8d74d47f71a3","children":[],"position":[0,-0.3089757561683655,-0.0005812644958496094],"rotation":[0,0,0],"scale":[1,1,1],"components":{"light":{"enabled":true,"type":"directional","isStatic":false,"bake":false,"affectDynamic":true,"color":[1,1,1],"intensity":1,"castShadows":false,"shadowType":0,"shadowDistance":16,"shadowResolution":1024,"shadowBias":0.04,"normalOffsetBias":0.04,"vsmBlurMode":1,"vsmBlurSize":11,"vsmBias":0.01,"range":8,"falloffMode":0,"innerConeAngle":40,"outerConeAngle":45,"cookieAsset":null,"cookieIntensity":1,"cookieFalloff":true,"cookieChannel":"rgb","cookieAngle":0,"cookieOffset":[0,0],"cookieScale":[1,1],"bakeDir":true,"affectLightmapped":false,"shadowUpdateMode":2}}},"d8433051-41ef-4f84-b7cf-c48fcc5ddd0d":{"name":"Directional Light","tags":[],"enabled":true,"resource_id":"d8433051-41ef-4f84-b7cf-c48fcc5ddd0d","parent":"d8f8ef52-f210-4098-b01e-8d74d47f71a3","children":[],"position":[0,-0.3089757561683655,-0.0005812644958496094],"rotation":[0,0,0],"scale":[1,1,1],"components":{"light":{"enabled":true,"type":"directional","isStatic":false,"bake":false,"affectDynamic":true,"color":[1,1,1],"intensity":1,"castShadows":false,"shadowType":0,"shadowDistance":16,"shadowResolution":1024,"shadowBias":0.04,"normalOffsetBias":0.04,"vsmBlurMode":1,"vsmBlurSize":11,"vsmBias":0.01,"range":8,"falloffMode":0,"innerConeAngle":40,"outerConeAngle":45,"cookieAsset":null,"cookieIntensity":1,"cookieFalloff":true,"cookieChannel":"rgb","cookieAngle":0,"cookieOffset":[0,0],"cookieScale":[1,1],"bakeDir":true,"affectLightmapped":false,"shadowUpdateMode":2}}},"1a38572e-b1fe-47a3-98c3-ad061e43a3bb":{"name":"Directional Light","tags":[],"enabled":true,"resource_id":"1a38572e-b1fe-47a3-98c3-ad061e43a3bb","parent":"d8f8ef52-f210-4098-b01e-8d74d47f71a3","children":[],"position":[0,-0.3089757561683655,-0.0005812644958496094],"rotation":[0,0,0],"scale":[1,1,1],"components":{"light":{"enabled":true,"type":"directional","isStatic":false,"bake":false,"affectDynamic":true,"affectLightMapped":false,"color":[1,1,1],"intensity":1,"castShadows":false,"shadowType":0,"shadowDistance":16,"shadowResolution":1024,"shadowBias":0.04,"normalOffsetBias":0.04,"vsmBlurMode":1,"vsmBlurSize":11,"vsmBias":0.01,"range":8,"falloffMode":0,"innerConeAngle":40,"outerConeAngle":45,"cookieAsset":null,"cookieIntensity":1,"cookieFalloff":true,"cookieChannel":"rgb","cookieAngle":0,"cookieOffset":[0,0],"cookieScale":[1,1],"bakeDir":true,"affectLightmapped":false,"shadowUpdateMode":2}}},"994c710e-351f-4728-9bc6-0db3e780e761":{"name":"Model","tags":[],"enabled":true,"resource_id":"994c710e-351f-4728-9bc6-0db3e780e761","parent":"d7b4582a-d0d3-11e6-a4ac-22000ac481df","children":[],"position":[0,0,0],"rotation":[0,0,0],"scale":[1,1,1],"components":{"model":{"enabled":true,"isStatic":false,"type":"asset","asset":null,"materialAsset":null,"castShadows":true,"castShadowsLightmap":true,"receiveShadows":true,"lightmapped":false,"lightmapSizeMultiplier":1}}},"97b84fc5-e5a6-4142-b5b1-0156937cfff0":{"name":"Directional Light","tags":[],"enabled":true,"resource_id":"97b84fc5-e5a6-4142-b5b1-0156937cfff0","parent":"8850d3e2-f729-4146-a3a1-547e5e24478b","children":[],"position":[0,0,0],"rotation":[0,0,0],"scale":[1,1,1],"components":{"light":{"enabled":true,"type":"directional","isStatic":false,"bake":false,"affectDynamic":true,"color":[1,1,1],"intensity":1,"castShadows":false,"shadowType":0,"shadowDistance":16,"shadowResolution":1024,"shadowBias":0.04,"normalOffsetBias":0.04,"vsmBlurMode":1,"vsmBlurSize":11,"vsmBias":0.01,"range":8,"falloffMode":0,"innerConeAngle":40,"outerConeAngle":45,"cookieAsset":null,"cookieIntensity":1,"cookieFalloff":true,"cookieChannel":"rgb","cookieAngle":0,"cookieOffset":[0,0],"cookieScale":[1,1],"bakeDir":true,"affectLightmapped":false,"shadowUpdateMode":2}}},"6da53233-f6eb-4e2c-918f-04df998463d1":{"name":"Cylinder","tags":[],"enabled":true,"resource_id":"6da53233-f6eb-4e2c-918f-04df998463d1","parent":"d7b4546a-d0d3-11e6-a4ac-22000ac481df","children":[],"position":[0,0,0],"rotation":[0,0,0],"scale":[1,1,1],"components":{"model":{"enabled":true,"isStatic":false,"type":"cylinder","asset":null,"materialAsset":null,"castShadows":true,"castShadowsLightmap":true,"receiveShadows":true,"lightmapped":false,"lightmapSizeMultiplier":1}}}},"project_id":448674},"type":"http://sharejs.org/types/JSONv0","v":42,"docName":"487210","m":{"ctime":1483351895696.5881,"mtime":1483360433777}},"a":"sub","c":"scenes","d":"487210"}'
        //         return clientSend(data)


        // }
        // if(ws.a=="bs"){

        //    var data='{"s":{"assets":{"6195265":{"data":{"scope":{"type":"project","id":448674},"user_id":10695,"source_asset_id":null,"source":false,"tags":[],"name":"New Css","revision":1,"preload":true,"meta":null,"data":null,"type":"css","file":{"filename":"asset.css","size":1,"hash":"68b329da9893e34099c7d8ad5cb9c940"},"region":"eu-west-1","path":[],"task":null},"type":"http://sharejs.org/types/JSONv0","v":2,"docName":"6195265","m":{"ctime":1483355361415,"mtime":1483355361537}},"6195266":{"data":{"scope":{"type":"project","id":448674},"user_id":10695,"source_asset_id":null,"source":false,"tags":[],"name":"New Html","revision":1,"preload":true,"meta":null,"data":null,"type":"html","file":{"filename":"asset.html","size":1,"hash":"68b329da9893e34099c7d8ad5cb9c940"},"region":"eu-west-1","path":[],"task":null},"type":"http://sharejs.org/types/JSONv0","v":2,"docName":"6195266","m":{"ctime":1483355404391,"mtime":1483355404503}},"6195519":{"data":{"scope":{"type":"project","id":448674},"user_id":10695,"source_asset_id":null,"source":false,"tags":[],"name":"New Css","revision":1,"preload":true,"meta":null,"data":null,"type":"css","file":{"filename":"asset.css","size":1,"hash":"68b329da9893e34099c7d8ad5cb9c940"},"region":"eu-west-1","path":[],"task":null},"type":"http://sharejs.org/types/JSONv0","v":2,"docName":"6195519","m":{"ctime":1483357292889,"mtime":1483357292998}},"6202128":{"data":{"scope":{"type":"project","id":448674},"user_id":10695,"source_asset_id":null,"source":false,"tags":[],"name":"New Css","revision":1,"preload":true,"meta":null,"data":null,"type":"css","file":{"filename":"asset.css","size":1,"hash":"68b329da9893e34099c7d8ad5cb9c940"},"region":"eu-west-1","path":[],"task":null},"type":"http://sharejs.org/types/JSONv0","v":2,"docName":"6202128","m":{"ctime":1483364198480,"mtime":1483364198609}}}},"a":"bs"}'
        //         return clientSend(data)


        // }
        // console.log("==============")
        // console.log(ws)
        //return data(ws)

        stream.push(JSON.parse(msg));
    });

    stream.on('error', function onError(err) {
        client.close(err);
    });

    client.on('close', function onClose(reason) {
        stream.push(null);
        stream.emit('close');
        log('client went away');
        client.close(reason);
    });

    stream.on('end', function onEnd() {
        client.close();
    });

    store.listen(stream);

    function clientSend(message) {
        if (client.readyState === client.OPEN) {
            client.send(message);
        }
    }
}