const TileFetcher = require('./TileFetcher');

new TileFetcher(
      {
         westLong : -125.3321, // west long
         southLat : 23.8991,    // south lat
         eastLong : -65.7421,   // east long
         northLat : 49.4325, // north lat
         zoomLevel : 10,
         numTileFetchers : 6,
         tileUrlBuilder : function(x, y, z) {
            // retina tiles
            // return "http://localhost:8080/styles/osm-bright-cpb/" + z + "/" + x + "/" + y + "@2x.png";

            // non-retina tiles
            return "http://localhost:8080/styles/osm-bright-cpb/" + z + "/" + x + "/" + y + ".png";
         },
         tileDirectory : './tiles/osm-bright-cpb'
      }
).run();
