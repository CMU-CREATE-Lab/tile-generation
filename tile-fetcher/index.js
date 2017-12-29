const programOptions = require('commander');
const flow = require('nimble');
const packageJson = require('./package.json');
const TileFetcher = require('./TileFetcher');

const MIN_LEVEL = 0;
const MAX_LEVEL = 14;
const DEFAULT_NUM_FETCHERS = 6;
const DEFAULT_HOST = 'localhost';
const DEFAULT_PORT = 8080;
const DEFAULT_WEST = -180;
const DEFAULT_EAST = 179.9999999999999;
const DEFAULT_NORTH = 85.0511;
const DEFAULT_SOUTH = -85.0511;

programOptions
      .version(packageJson.version)
      .option('--style  <Style name>', "Required. The map style name, as it appears in the Tileserver GL tile URL.")
      .option('--level  <Zoom level(s)>', "Required. Zoom level(s) to fetch.  Must be in the range [" + MIN_LEVEL + "," + MAX_LEVEL + "]. Specify multiple levels as a comma-delimted list, a range, or a combination of the two.")
      .option('--dir    <Output directory>', "Required. Directory in which tiles will be saved.")
      .option('--west   <West longitude>', "The west longitude of the bounding box to fetch. Defaults to " + DEFAULT_WEST + " if unspecified.")
      .option('--east   <East longitude>', "The east longitude of the bounding box to fetch. Defaults to " + DEFAULT_EAST + " if unspecified.")
      .option('--north  <North latitude>', "The north latitude of the bounding box to fetch. Defaults to " + DEFAULT_NORTH + " if unspecified.")
      .option('--south  <South latitude>', "The south latitude of the bounding box to fetch. Defaults to " + DEFAULT_SOUTH + " if unspecified.")
      .option('--n      <Num tile fetchers>', "Number of tile fetchers to use. Defaults to " + DEFAULT_NUM_FETCHERS + " if unspecified.")
      .option('--host   <Tile server host>', "Host name of the tile server. Defaults to " + DEFAULT_HOST + " if unspecified.")
      .option('--port   <Tile server port>', "Port number of the tile server. Defaults to " + DEFAULT_PORT + " if unspecified.")
      .option('--start   <x,y>', "Start at the tile specified by the given x and y. This option is ignored if more than one level is specified.")
      .option('--retina', "Fetch retina tiles")
      .option('--dry-run', "Don't actually fetch tiles, just compute what tiles would be fetched and print the results.")
      .parse(process.argv);

var isOptionDefined = function(optionName) {
   return (optionName in programOptions && programOptions[optionName] !== 'undefined')
};

var getOptionalValue = function(optionName, defaultValue) {
   return isOptionDefined(optionName) ? programOptions[optionName] : defaultValue;
};

var fetchTiles = function(styleName,
                          levels,
                          outputDir,
                          west,
                          east,
                          north,
                          south,
                          numFetchers,
                          host,
                          port,
                          isRetina,
                          startingTile,
                          isDryRun) {

   var hostAndPort = host + ":" + port;

   var runMethod = isDryRun ? 'dryRun' : 'run';

   console.log("----------------------------------------------------------------------------------------");
   console.log("Style:          " + styleName);
   console.log("Level(s):       " + levels);
   console.log("Output dir:     " + outputDir);
   console.log("Longitude:      [" + west + ", " + east + "]");
   console.log("Latitude:       [" + south + ", " + north + "]");
   console.log("Num fetchers:   " + numFetchers);
   console.log("Host and port:  " + hostAndPort);
   console.log("Retina tiles?   " + isRetina);
   console.log("Starting tile:  " + JSON.stringify(startingTile));
   console.log("Is Dry Run?     " + isDryRun);

   var totalElapsedMillis = 0;

   // create a TileFetcher instance and job for each level
   var fetchJobs = [];
   levels.forEach(function(level) {
      fetchJobs.push(function(done) {
         new TileFetcher(
               {
                  westLong : west,
                  southLat : south,
                  eastLong : east,
                  northLat : north,
                  zoomLevel : level,
                  numTileFetchers : numFetchers,
                  tileUrlBuilder : (function() {
                     return function(x, y, z) {
                        return "http://" + hostAndPort + "/styles/" + styleName + "/" + z + "/" + x + "/" + y + (isRetina ? "@2x" : "") + ".png";
                     };
                  })(),
                  tileDirectory : outputDir,
                  startX : startingTile ? startingTile.x : null,
                  startY : startingTile ? startingTile.y : null
               }
         )[runMethod](function(err, numFetched, elapsedMillis) {
            totalElapsedMillis += elapsedMillis;
            if (err) {
               console.log("Level " + level + " done, " + numFetched + " tile(s) fetched, but with an error: " + err);
            }
            else {
               console.log("Level " + level + " done! Fetched " + numFetched + " tile" + (numFetched === 1 ? "" : "s") + " in " + (elapsedMillis / 1000).toFixed(2) + " seconds (~" + (numFetched === 0 ? 0 : (elapsedMillis / numFetched).toFixed(2)) + " milliseconds per tile)");
            }
            done(err);
         });
      });
   });

   // run the tile fetching jobs sequentially
   flow.series(fetchJobs, function(err) {
      console.log("----------------------------------------------------------------------------------------");
      if (err) {
         console.log("All done, but with an error: " + err);
      }
      else {
         console.log("All done! Total time: " + (totalElapsedMillis / 1000).toFixed(2) + " seconds");
      }
   });
};

console.log("----------------------------------------------------------------------------------------");
console.log("Validating options...");

var areAllRequiredOptionsSpecified = true;

if (!isOptionDefined('style')) {
   console.log("ERROR: Style name is required");
   areAllRequiredOptionsSpecified = false;
}

if (!isOptionDefined('level')) {
   console.log("ERROR: Level is required");
   areAllRequiredOptionsSpecified = false;
}

if (!isOptionDefined('dir')) {
   console.log("ERROR: Output directory is required");
   areAllRequiredOptionsSpecified = false;
}

if (areAllRequiredOptionsSpecified) {
   var styleName = programOptions['style'];
   var levelStr = programOptions['level'];
   var outputDir = programOptions['dir'];

   // process the specified level(s): allow combo of commas and ranges, storing in a set to remove dupes, and then
   // sorting the set's keys at the end to fetch the levels in order.
   var levelsSet = {};
   var cleanLevel = function(l) {
      var level = parseInt(l);
      if (!isNaN(level)) {
         // clamp to the allowed range
         return Math.min(Math.max(level, MIN_LEVEL), MAX_LEVEL);
      }
      console.log("WARN: Invalid level [" + l + "]");
      return null;
   };

   // split on commas, then split on dash
   levelStr.split(',').forEach(function(levelPiece) {
      var levelRange = levelPiece.split('-');
      if (levelRange.length > 1) {
         var minLevel = cleanLevel(levelRange[0]);
         var maxLevel = cleanLevel(levelRange[1]);
         if (minLevel !== null && maxLevel !== null) {
            // swap min and max in case the user is stupid
            if (minLevel > maxLevel) {
               var temp = maxLevel;
               maxLevel = minLevel;
               minLevel = temp;
            }

            for (var i = minLevel; i <= maxLevel; i++) {
               levelsSet[i] = true;
            }
         }
      }
      else {
         const level = cleanLevel(levelRange[0]);
         if (level !== null) {
            levelsSet[level] = true;
         }
      }
   });

   // create a sorted array of level indeces
   const levels = Object.keys(levelsSet).map(function(i) {
      return parseInt(i)
   }).sort(function(a, b) {
      return a - b;
   });

   var startingTile = null;
   if (isOptionDefined('start')) {
      if (levels.length > 1) {
         console.log("WARN: starting position ignored because more than 1 level is requested.");
      }
      else {
         var xAndY = programOptions['start'].split(',');
         if (xAndY.length === 2) {
            var x = parseInt(xAndY[0]);
            var y = parseInt(xAndY[1]);
            if (isNaN(x) || isNaN(y) || x < 0 || y < 0) {
               console.log("ERROR: invalid starting tile specified, must be of the form x,y, where x and y are both non-negative integers. Ignoring.");
            }
            else {
               startingTile = { x : x, y : y };
            }
         }
         else {
            console.log("ERROR: invalid starting tile specified, must be of the form x,y. Ignoring.");
         }
      }
   }
   else {
      startingTile = null;
   }

   fetchTiles(
         styleName,
         levels,
         outputDir,
         getOptionalValue('west', DEFAULT_WEST),
         getOptionalValue('east', DEFAULT_EAST),
         getOptionalValue('north', DEFAULT_NORTH),
         getOptionalValue('south', DEFAULT_SOUTH),
         getOptionalValue('n', DEFAULT_NUM_FETCHERS),
         getOptionalValue('host', DEFAULT_HOST),
         getOptionalValue('port', DEFAULT_PORT),
         'retina' in programOptions,
         startingTile,
         isOptionDefined('dryRun')
   );
}
