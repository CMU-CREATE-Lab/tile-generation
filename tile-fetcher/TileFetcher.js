const flow = require('nimble');
const path = require('path');
const superagent = require('superagent-ls');
const mkdirp = require('mkdirp');
const fs = require('fs');

// Got these from http://wiki.openstreetmap.org/wiki/Slippy_map_tilenames#ECMAScript_.28JavaScript.2FActionScript.2C_etc..29
function lng2tile(lon, zoom) {
   return (Math.floor((lon + 180) / 360 * Math.pow(2, zoom)));
}

function lat2tile(lat, zoom) {
   return (Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom)));
}

var TileFetcher = function(config) {

   // make sure these are the correct data types
   config.northLat = parseFloat(config.northLat);
   config.westLong = parseFloat(config.westLong);
   config.southLat = parseFloat(config.southLat);
   config.eastLong = parseFloat(config.eastLong);
   config.zoomLevel = parseInt(config.zoomLevel);
   config.numTileFetchers = Math.max(parseInt(config.numTileFetchers), 1);
   config.port = parseInt(config.numTileFetchers);

   // based off of code from http://wiki.openstreetmap.org/wiki/Slippy_map_tilenames#ECMAScript_.28JavaScript.2FActionScript.2C_etc..29
   var yMin = lat2tile(config.northLat, config.zoomLevel);
   var xMin = lng2tile(config.westLong, config.zoomLevel);
   var yMax = lat2tile(config.southLat, config.zoomLevel);
   var xMax = lng2tile(config.eastLong, config.zoomLevel);
   var numTilesWide = Math.abs(xMin - xMax) + 1;
   var numTilesHigh = Math.abs(yMin - yMax) + 1;
   var totalTiles = numTilesWide * numTilesHigh;
   var numPercentageChunks = 20;
   var numTilesPerPercentageChunk = Math.floor(totalTiles / numPercentageChunks);

   var isRunning = false;
   var startTimeMillis = 0;
   var tileFetchers = [];
   var numFetched = 0;
   var zoomLevelStr = config.zoomLevel.toString();
   var tileDirectory = path.resolve(path.join(config.tileDirectory, '.'));

   console.log("----------------------------------------------------------------------------------------");
   console.log("Level " + config.zoomLevel + ": Generating " + totalTiles + " tiles (" + numTilesWide + " x " + numTilesHigh + ")...");
   // console.log("   Longitude:    [" + config.westLong + ", " + config.eastLong + "]");
   // console.log("   Latitude:     [" + config.southLat + ", " + config.northLat + "]");
   // console.log("   x:            [" + xMin + ", " + xMax + "]");
   // console.log("   y:            [" + yMin + ", " + yMax + "]");

   var getTileCoords = function(i) {
      // return them as strings
      return {
         x : (i % numTilesWide + xMin).toString(),
         y : (Math.floor(i / numTilesWide) + yMin).toString()
      }
   };

   var getNextIndex = function() {
      return numFetched >= totalTiles ? -1 : numFetched++;
   };

   var fetchTile = function(fetcherIndex, done) {
      var index = getNextIndex();
      if (index >= 0) {
         var tileCoords = getTileCoords(index);
         var url = config.tileUrlBuilder(tileCoords.x, tileCoords.y, config.zoomLevel);
         superagent
               .get(url)
               .type('png')
               .end(function(err, res) {
                  if (err) {
                     done(err);
                  }
                  else {
                     if (res.body) {
                        if (res.status >= 200 && res.status < 300) {
                           var fileDir = path.resolve(path.join(tileDirectory, '/' + zoomLevelStr + '/' + tileCoords.x));
                           mkdirp.sync(fileDir);
                           fs.writeFileSync(path.join(fileDir, '.', tileCoords.y + ".png"), res.body);
                        }
                        else {
                           console.log("   WARN: ignoring respose with HTTP " + res.status + " for " + url);
                        }
                     }
                     else {
                        console.log("   WARN: empty response for " + url);
                     }

                     if (totalTiles > numPercentageChunks && index !== 0 && (index % numTilesPerPercentageChunk === 0)) {
                        console.log("   " + Math.round(index / totalTiles * 100) + "% done");
                     }

                     setTimeout(function() {
                        fetchTile(fetcherIndex, done);
                     }, 0);
                  }
               });
      }
      else {
         setTimeout(done, 0);
      }
   };

   var createFetcher = function(fetcherIndex) {
      return function(done) {
         fetchTile(fetcherIndex, done);
      }
   };

   this.run = function(callback) {
      if (isRunning) {
         console.log("ERROR: fetcher is already running, ignoring this run request");
      }
      else {
         isRunning = true;
         startTimeMillis = Date.now();
         numFetched = 0;

         // create fetchers
         for (var i = 0; i < config.numTileFetchers; i++) {
            tileFetchers.push(createFetcher(i));
         }

         // run fetchers
         flow.parallel(tileFetchers, function(err) {
            isRunning = false;
            callback(err, totalTiles, Date.now() - startTimeMillis)
         });
      }
   };

};

module.exports = TileFetcher;


