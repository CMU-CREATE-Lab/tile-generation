Downloaded fonts from:

   https://github.com/openmaptiles/fonts/releases

Downloaded styles from:

   Klokantech Basic
   https://github.com/openmaptiles/klokantech-basic-gl-style/releases

   OSM Bright
   https://github.com/openmaptiles/osm-bright-gl-style/releases

   Positron
   https://github.com/openmaptiles/positron-gl-style/releases

Run from this directory with:

   docker run --rm -it -v $(pwd):/createlab -p 8080:80 klokantech/tileserver-gl --config /createlab/tileserver-gl-config.json