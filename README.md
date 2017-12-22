# Generating Raster Tiles from Vector Map Data

A collection of tools--with (hopefully) clear documentation--for generating raster map tiles from vector map data and a Mapbox GL style.

The toolchain consists of [Maputnik](https://github.com/maputnik/editor) for creating/editing Mapbox GL styles, [Tileserver GL](https://openmaptiles.org/docs/host/tileserver-gl/) to apply the style(s) to [vector map data](https://openmaptiles.com/downloads/planet/) and serve up raster tiles, and a custom script to scrape and save the tiles as PNGs.

## How to Generate Tiles

Here's everything you'll need to do to generate tiles.  Some stuff I've already done for you and included in this project.  I'll walk you through the rest.

### Tileserver GL

First, you'll need Tileserver GL installed.  There are at least a couple ways to install, but apparently using Docker is the easiest. Go ahead and skip to that section below unless you want details on what doesn't work.

#### Installing with Node.js

The tl;dr is that you shouldn't even bother trying to just do the simple `npm install -g tileserver-gl` method.  You'll go crazy.  If you use Node.js 8.x, it'll fail due to a 403 when pulling one of the assets.  Turns out you need to have Node 6.x (see https://github.com/klokantech/tileserver-gl/issues/216).  I switched to Node.js 6.12.1 and retried and, hey, guess what?!?  That failed too with this lovely error:

`ENOENT: no such file or directory, rename '/Users/chris/n/lib/node_modules/.staging/@mapbox/point-geometry-c12f351f' -> '/Users/chris/n/lib/node_modules/tileserver-gl/node_modules/@mapbox/point-geometry'`

Googling that and you'll find a bunch of posts which pretty much just say, "screw it, man, just use docker".  So, using Docker...

#### Installing with Docker

Despite complaints from coworkers about how annoying Docker is, it seems to be my best (only?) option for the Mac, so I installed [Docker](https://docs.docker.com/docker-for-mac/install/#download-docker-for-mac) and ran it.

Following the instructions at [https://openmaptiles.org/docs/host/tileserver-gl/](https://openmaptiles.org/docs/host/tileserver-gl/), I installed tileserver-gl by doing this:

	docker pull klokantech/tileserver-gl

#### Other Required Pieces

Before trying to run it, you'll need to download some required bits, just because they're too big to put in this project.

##### Map Data

You'll need vector map data.  If you want the whole planet, you'd better have both time and disk space...it's ~51 GB.  I did my initial tests with two different datasets: the United States and Great Britain.  They're large, 6.7GB and 1.2GB respectively, so they're not included here.  You'll need to download the .mbtiles archives from OpenMapTiles here:

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Whole Planet<br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;https://openmaptiles.com/downloads/planet/

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;United States<br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;https://openmaptiles.com/downloads/north-america/us/

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Great Britain<br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;https://openmaptiles.com/downloads/europe/great-britain/

Just save them into the `tileserver-gl/mbtiles` directory in this project.

##### Fonts

The styles we're using require some fonts.  Note that I'm using v1.1, because v2 changes the name of some fonts, but the styles below haven't been updated accordingly (yet?).  Anyway, you can download the zip from here:

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;https://github.com/openmaptiles/fonts/releases/tag/v1.1

Extract the zip into a directory named `fonts` located under the `tileserver-gl` directory in this project.

##### Styles

I've already downloaded and included some styles in the project, but here's where I found them.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Klokantech Basic v1.3<br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;https://github.com/openmaptiles/klokantech-basic-gl-style/releases

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;OSM Bright v1.3<br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;https://github.com/openmaptiles/osm-bright-gl-style/releases

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Positron v1.4<br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;https://github.com/openmaptiles/positron-gl-style/releases

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Dark Matter v1.3<br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;https://github.com/openmaptiles/dark-matter-gl-style/releases

I've also included some styles of my own based on some of the above.  

##### Config

I've included three tileserver-gl configuration files for the styles included here plus the map data and fonts you downloaded above:
    
    tileserver-gl-config-planet.json
    tileserver-gl-config-north-america_us.json
    tileserver-gl-config-europe_great-britain.json
  
If the mbtiles files you downloaded have filenames different than what's referenced in the above JSON config files, you'll need to fix the config file(s) accordingly.

#### Running Tileserver GL

Now that all the pieces are in place, you should be able to run tileserver-gl and explore the map data with each of the various styles.  Open a terminal window and `cd` to the root directory of this project and run either of these commands, depending on which data set you want to view:

    docker run --rm -it -v $(pwd):/createlab -p 8080:80 klokantech/tileserver-gl --config /createlab/tileserver-gl-config-planet.json

or

    docker run --rm -it -v $(pwd):/createlab -p 8080:80 klokantech/tileserver-gl --config /createlab/tileserver-gl-config-north-america_us.json

or

    docker run --rm -it -v $(pwd):/createlab -p 8080:80 klokantech/tileserver-gl --config /createlab/tileserver-gl-config-europe_great-britain.json
   
Brief description of some of the parts of those commands:
* `-v $(pwd):/createlab` Mounts a volume in Docker named `/createlab` and binds it to the current directory.  This lets us reference files in the Mac OS filesystem from tileserver-gl. Notice the various paths in the tileserver-gl config files which start with `/createlab`
* `-p 8080:80` Maps port 8080 on the Mac to port 80 in Docker.  
* `--config /createlab/*.json` Tells tileserver-gl where to find the config file

Once it's running, test it out by opening a browser and going to [http://localhost:8080/](http://localhost:8080/).

### Maputnik

Maputnik is a really nice, browser-based editor for Mapbox GL styles.  If you're happy with the styles included here, you can skip this entire section and just jump down to the **Generating Tiles** section below.

#### Installing Maputnik

The tl;dr is to just use a prebuilt binary.  And if you're on a Mac, I've included one in the project.  Now for the longer story...

Instructions for installing are here:

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;https://github.com/maputnik/editor

What they don't make clear is that installing it fails with both Node.js 4.x and 6.x.  I finally got it installed with Node.js 8.9.2.  But, they also don't make clear how you can use this version to edit an existing file, other than doing an "upload".  The pre-built binary version has an option to specify a JSON style file, and even watch for external changes to that file.  That's easier, so just use the latest prebuilt binary, which you'll find here (I'm using `maputnik_darwin` v1.0.1):

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;https://github.com/maputnik/editor/releases

I've included the binary in this project, so if you're on a Mac you shouldn't need to do anything, just run it.  

#### Slight Wrinkle

The only wrinkle is that the style file has URLs for where it can find vector map data, sprites, and fonts ("glyphs").  I have one for Maputnik, and a slightly different one for Tileserver GL.  If you compare `tileserver-gl/styles/osm-bright-cpb-gl-style/maputnik-style-local.json` and `tileserver-gl/styles/osm-bright-cpb-gl-style/style-local.json`, you'll see those three fields differ as shown below:

**maputnik-style-local.json**
```json
  "sources": {
    "openmaptiles": {
      "type": "vector",
      "url": "https://free.tilehosting.com/data/v3.json?key=RiS4gsgZPZqeeMlIyxFo"
    }
  },
  "sprite": "https://openmaptiles.github.io/osm-bright-gl-style/sprite",
  "glyphs": "https://free.tilehosting.com/fonts/{fontstack}/{range}.pbf?key=RiS4gsgZPZqeeMlIyxFo",
``` 

**style-local.json**
```json
  "sources": {
    "openmaptiles": {
      "type": "vector",
      "url": "mbtiles://{v3}"
    }
  },
  "sprite": "{styleJsonFolder}/sprite",
  "glyphs": "{fontstack}/{range}.pbf",
``` 

So, basically, you'll want to run Maputnik so that it's editing the `maputnik-style-local.json` file, because it'll be getting map data, sprites, and fonts for the whole earth from the cloud.  That is, you won't need local copies just to edit the style.  Once you get the style working how you want it, you can apply those changes to `style-local.json` and then fire up Tileserver GL to apply the style to your local vector map data and check your work.

#### Running Maputnik

From this project's root directory, launch Maputnik to edit the OSM Bright CPB style with:

```
./maputnik/maputnik_darwin --watch --file ./tileserver-gl/styles/osm-bright-cpb-gl-style/maputnik-style-local.json
```

For the Klokantech Basic CPB style, launch with:

```
./maputnik/maputnik_darwin --watch --file ./tileserver-gl/styles/klokantech-basic-cpb-gl-style/maputnik-style-local.json
```

For the Dark Matter CPB style, launch with:

```
./maputnik/maputnik_darwin --watch --file ./tileserver-gl/styles/dark-matter-cpb-gl-style/maputnik-style-local.json
```

Then open a browser and go to [http://localhost:8000](http://localhost:8000).

If you make changes, don't forget to apply them (but not the three URLs shown above!) to `style-local.json`.

#### The Style Editing and Verification Process

Here's what to do to edit a style:
1. Run Maputnik, pointed at the maputnik version of the style you want to edit. The "maputnik version" just means those three URLs are pointing to the cloud rather than local. In this repo, that's the `maputnik-style-local.json` file.
2. Copy style changes to the tileserver-gl version of the style. In this repo, that's the `style-local.json` file.
3. Run tileserver-gl, and verify that your style looks good with the vector map data you have.

### Generating Tiles

At long last, we can finally generate the tiles...

It's simple enough to just write a script to fetch all tiles for a given level and lat/long bounding box directly from Tileserver GL, so that's what I did.  It's a Node.js script in the `tile-fetcher` directory. I used Node.js 8.9.2, but it might work for other versions.  

#### Installation

Do this to install dependencies:

```
$ cd tile-fetcher
$ npm install
```

#### Options

You specify the bounding box, levels, style, etc. through command line arguments to the script.  Do `node index.js --help` to see the options.  Here are the required options:

| Option | Description |
|--------|-------------|
|`--style  <Style name>`|The map style name, as it appears in the Tileserver GL tile URL, e.g. `klokantech-basic-cpb`.|
|`--level  <Zoom level(s)>`|Zoom level(s) to generate.  Must be in the range [0,14]. Specify multiple levels as a comma-delimted list, a range, or a combination of the two.|
|`--dir    <Output directory> `|Directory in which tiles will be saved.|

Here are the optional options:

| Option | Description |
|--------|-------------|
|`--west   <West longitude>   `|The west longitude of the bounding box to generate. Defaults to `-180` if unspecified.|
|`--east   <East longitude>   `|The east longitude of the bounding box to generate. Defaults to `179.9999999999999` if unspecified.|
|`--north  <North latitude>   `|The north latitude of the bounding box to generate. Defaults to `85.0511` if unspecified.|
|`--south  <South latitude>   `|The south latitude of the bounding box to generate. Defaults to `-85.0511` if unspecified.|
|`--n      <Num tile fetchers>`|Number of tile fetchers to use. Defaults to `6` if unspecified.|
|`--host   <Tile server host> `|Host name of the tile server. Defaults to `localhost` if unspecified.|
|`--port   <Tile server port> `|Port number of the tile server. Defaults to `8080` if unspecified.|
|`--retina                    `|Generate retina tiles|

#### Running

Here's an example for generating levels 0-8 for the entire Earth using the `klokantech-basic-cpb` style (this is assuming you have Tileserver GL running with the `tileserver-gl-config-planet.json` and listening on port 8080, as shown above):

```
$ node index.js --style klokantech-basic-cpb  --dir ./tiles/klokantech-basic-cpb --level 0-8
```

This will generate retina tiles for levels 1-4 and levels 7 and 9 for the United States using the `dark-matter-cpb` style, assuming Tileserver GL is listening on port 8081:

```
$ node index.js --style dark-matter-cpb  --dir ./tiles/dark-matter-cpb@2x --level 1-4,7,9 --port 8081 --west -125.3321 --east -65.7421 --south 23.8991 --north 49.4325 --retina
```

For zoom levels having more than 20 tiles, you'll get a progress report approximately every 5%.

#### Viewing Tiles

Once you have some tiles generated, you can preview them using the `tile-viewer.html` file (also in the `tile-fetcher` directory), which you may need to edit according to where you saved your tiles.
