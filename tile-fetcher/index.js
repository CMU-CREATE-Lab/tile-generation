const TileFetcher = require('./TileFetcher');

const STYLE_NAME = 'klokantech-basic-cpb';

new TileFetcher(
      {
         // whole planet
         westLong : -180,     // west long
         southLat : -85.0511, // south lat
         eastLong : 180,      // east long
         northLat : 85.0511,  // north lat

         // USA
         // westLong : -125.3321, // west long
         // southLat : 23.8991,    // south lat
         // eastLong : -65.7421,   // east long
         // northLat : 49.4325, // north lat

         zoomLevel : 10,
         numTileFetchers : 6,

         tileUrlBuilder : function(x, y, z) {
            // retina tiles
            // return "http://localhost:8080/styles/" + STYLE_NAME + "/" + z + "/" + x + "/" + y + "@2x.png";

            // non-retina tiles
            return "http://localhost:8080/styles/" + STYLE_NAME + "/" + z + "/" + x + "/" + y + ".png";
         },

         tileDirectory : './tiles/' + STYLE_NAME
      }
).run();
