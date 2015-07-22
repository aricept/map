# Project 5 - Single Page Neighborhood Map App
I started this project in February; then my daughter ended up in the hospital, my position changed 4 times, and my wife had our son - fun times!  I didn't even touch it from February until July.  So let's see how I did!

##FlightMap
My project utilizes the [FlightStats](http://www.flightstats.com) flight tracking API to get a list of flights and positions around Mountain View, CA, and then uses their FlightStatus API to get more info about the flights - departure city and time, arrival city and time, plane, etc - to display to the user.

Try [FlightMap](http://aricept.github.io/map) on GitHub.  I went through the FlightStats evaluation license while testing, and switched to a commercial license to complete the project.

The main layout consists of the map, a list of the flights, and a search widget.  Each flight is represented on the map by a marker in its last reported position and heading.  Clicking the marker, or the flight in the menu, will animate the marker along its last reported positions.

This will also open an infobox in the menu which displays info about the flight - departure and arrival cities, times, and the flight's plane.  If one is available, there will be a link to an illustration of the plane specific to carrier and plane type, sourced from planefinder.net.

(Side note: I tried using Yahoo's "Yahoo Query Language" to perform web scraping for these image URLs dynamically, but the response was inconsistent and led to poor user experience, so I just grabbed the URL format and dynamically create it in the app.  YQL looks like it could be awesome, but my attempts to utilize it have been less than stellar.)

There are three field search options; by default, the app searches the following fields:
* Flight Number
* Airline
* Departure and Arrival Cities
* Plane Name and Model

These can be limited using the search category icons which appea above the search icon when the bar is open:
* Plane Type
* Cities
* Airline and Flight Number

This is a full text search, so it can match strings in the middle of any of these searchable fields; ~DAL~ matches ~Dallas~ and Delta flights, for instance, since Delta's callsign is DAL.  ~LAS~ will match ~Dallas~ and ~Las Vegas~.

###References
I read through the Knockout documentation and referenced the Mozilla Developer Network several times; the MDN article on Array.some() was awesome in minimizing the size of the search function.
