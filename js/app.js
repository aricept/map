/******* Model for all Flights, using data pulled from flightstats.net *******/

var Flight = function(flight) {
    var self = this;

    // Observables
    self.callsign = ko.observable(flight.callsign);
    self.carrier = ko.observable(flight.carrier);
    self.planeImg = ko.observable(flight.planeImg);
    self.heading = ko.observable(flight.heading);
    self.depPort = ko.observable(flight.depPort);
    self.arrPort = ko.observable(flight.arrPort);
    self.img = ko.observable(flight.img);
    self.icon = ko.observable(flight.icon);

    // Booleans used to determine if images correctly loaded; if not, the View will not display them.
    self.planeLoaded = ko.observable(true);
    self.imgLoaded = ko.observable(true);

    // Computed Observables
    self.flight = ko.computed(function() {
        return self.callsign().slice(3);
    });
    self.airline = ko.computed(function() {
        if (flight.airline) {
            return flight.airline;
        }
        else {
            return self.callsign().slice(0,3);
        }
    });

    /* The following observables create the departure and arrival cities and times for display in the info box */
    self.departed = ko.computed(function() {
        if (self.depPort().city) {
            var city = self.depPort().city;
            if (self.depPort().stateCode) {
                return city + ', ' + self.depPort().stateCode;
            }
            else {
                return city + ', ' + self.depPort().countryName;
            }
        }
        else {
            return self.depPort();
        }
        });
    self.depTime = ko.computed(function() {
        if (flight.depTime) {
            var dpTime = flight.depTime.split('T');
            var timeComp = dpTime[1].split(':');
            if (parseInt(timeComp[0]) > 12) {
                return (parseInt(timeComp[0]) - 12) + ':' + timeComp[1] + ' PM';
            }
            else if (parseInt(timeComp[0]) === 12) {
                return timeComp[0] + ':' + timeComp[1] + ' PM';
            }
            else {
                return timeComp[0] + ':' + timeComp[1] + ' AM';
            }
        }
        else {
            return 'Unknown Time';
        }
    });
    self.arriving = ko.computed(function() {
        if (self.arrPort().city) {
            var city = self.arrPort().city;
            if (self.arrPort().stateCode) {
                return city + ', ' + self.arrPort().stateCode;
            }
            else {
                return city + ', ' + self.arrPort().countryName;
            }
        }
        else {
            return self.arrPort();
        }
    });
    self.arrTime = ko.computed(function() {
        if(flight.arrTime) {
            var arTime = flight.arrTime.split('T');
            var timeComp = arTime[1].split(':');
            if (parseInt(timeComp[0] ) > 12) {
                return (parseInt(timeComp[0]) - 12) + ':' + timeComp[1] + ' PM';
            }
            else if (parseInt(timeComp[0]) === 12) {
                return timeComp[0] + ':' + timeComp[1] + ' PM';
            }
            else {
                return timeComp[0] + ':' + timeComp[1] + ' AM';
            }
        }
        else {
            return 'Unknown Time';
        }
    });
    self.name = ko.computed(function() {
        if (flight.name) {
            return flight.name;
        }
        else {
            return 'Flight ' + self.flight();
        }
    });

    /* This observable reference a function in the ViewModel which sorts its array of positions by time observed;
        this ensures the positions are in the correct order for the flight animation */
    self.positions = ko.computed(function() {
        return flight.posData(flight.positions);
    });

    /* References a function in the ViewModel which creates a marker for a given flight.  Making this an observable
        makes it easy to reference the marker later for position changes, etc. */
    self.marker = ko.computed(function() {
        return flight.marker(self);
    });

    /* This observable gets around inconsistency in the delivery of equipment information  from the data source. When possible,
        it displays a user-friendly name; if not available it displays an equipment code. */
    self.plane = ko.computed(function() {
        if (flight.plane.scheduledEquipment) {
            var sched = flight.plane.scheduledEquipment;
            if (sched.name === '??' || sched.name === null || sched.name === undefined) {
                return sched.iata;
            }
            else {
                return sched.name;
            }
        }
        else if (flight.plane.actualEquipment) {
            var act = flight.plane.actualEquipment;
            if(act.name === '??' || act.name === null || act.name === undefined) {
                return act.iata;
            }
            else {
                return act.name;
            }
        }
    });

    /* Creates an array of the "searchable terms" for this flight using the flightTerms() ViewModel function.
        This is then used by the ViewModel's search function to filter as the user types. */
    self.searchables = ko.computed(function() {
        return flight.searchables(self);
    });

    /* Observable that queries the ViewModel if its flight is in the filtered list, based on its searchables array.  This allows
        the flight's inList status to change dynamically based on user input. */
    self.inList = ko.computed(function() {
        return flight.inList(self);
    });

};

/******** The ViewModel which controls data flow between the View and the Model. ********/
var flightControl = function() {
    var map;
    var self = this;

    // Observables
    self.flightList = ko.observableArray([]);
    self.currFlight = ko.observable();
    self.flightError = ko.observable(false);
    self.photoView = ko.observable(false);
    self.listVis = ko.observable(true);
    self.searchVis = ko.observable(false);
    self.searchBox = ko.observable('');
    self.infoVis = ko.observable(true);

    // Computed Observables
    /* This observable manages the appearance of the current flight in the ViewModel. If the current flight
        is in the user filtered list, it does nothing (returns "true" for "flight is in the list");
        if it is not, it deselects the flight.  This prevents it from coming back into the filtered list as
        still selected and animated. Since it is an observable, it does not need to be called directly to act.*/
    self.currFlightListed = ko.computed(function() {
        if (self.currFlight()) {
            if (self.currFlight().inList()) {
                return true;
            }
            if (!self.currFlight().inList()) {
                self.selFlight(null);
                return false;
            }
        }
    });

    /* mapMonitor adds and removes markers from the map based on the user filtered list.  It acts as a "forEach"
        binding on the map markers.  Before changing the marker display (by calling .setMap()), it checks if it is
        already set, to avoid flashing and inefficient calls. */
    self.mapMonitor = ko.computed(function() {
        return self.flightList().forEach(function(flight) {
            if (flight.inList()) {
                return flight.marker().getMap() === map || flight.marker().setMap(map);
            }
            if (!flight.inList()) {
                return flight.marker().getMap() === null || flight.marker().setMap(null);
            }
        });
    });

    // A array of the user entered search terms; allows the return of matches against any word and not just the phrase.
    self.searchWords = ko.computed(function() {
        return self.searchBox().split(' ');
    });

    // The subset of flights that match some term of the user's input, which is used to generate our UI.
    self.filteredList = ko.computed(function() {
        return self.flightList().filter(function(flight) {
            return flight.inList();
        });
    });

    // Boolean to return a "no results display".
    self.results = ko.computed(function() {
        return self.filteredList().length === 0;
    });

    /* An Object for the search category UI.  This MUCH simplified the way the interface was built and handled.
        It takes in 3 strings, used to construct the UI and delegate which arrays of searchables should be used.*/
    var SearchType = function(type, icon, title) {
        this.type = ko.observable(type);
        this.icon = ko.observable(icon);
        this.title = ko.observable(title);
    };

    /* The array of search categories for multi-field searching.  Without a category selected, all fields are searched.
        The "icon" field here is used to implement Google's Material Design Icon ligatures.  The "title" field is used
        in the mouseover tooltip. */
    self.searchTypes = ko.observableArray([
        new SearchType('flight', 'flight_takeoff', 'Search Plane Types'),
        new SearchType('city', 'location_city', 'Search Cities'),
        new SearchType('airline', 'flight', 'Search Flights and Airlines'),
    ]);

    self.searchCat = ko.observable('');

    //Initializes the map, and begins loading flights once the map tiles have loaded.
    self.initialize = function() {
        var mapOptions = {
          center: {lat: 37.3894, lng: -122.0819},
          zoom: 12,
          disableDefaultUI: true
        };
        map = new google.maps.Map(document.getElementById('mapDiv'), mapOptions);
        mapBounds = new google.maps.LatLngBounds();
        flightListener = google.maps.event.addListener(map, 'tilesloaded', self.loadFlights);
    };

    // Queries the flightstats.com API for flights near Mountain View, CA, then sends the results another function.
    self.loadFlights = function() {
        google.maps.event.removeListener(flightListener);
        var flightUrl = 'flightData.json'
        $.ajax({
            dataType: 'json',
            url: flightUrl,
            success: function(data) {
                if (data.error) {
                    return self.flightError(true);
                }
                data.flightPositions.forEach(function(flight) {
                    flight.planeImg = '';
                    self.createFlights(flight);
                });
            },
        });
    };

    /* This function makes another API call for each flight in the previous data.  This second API call gets more
        info to build our Model and View.  */
    self.createFlights = function(flight) {
        var id = flight.flightId;
        var statusUrl = id + '.json';
        $.ajax({
            dataType: 'json',
            url: statusUrl,
            success: function(data) {
                var status = data.flightStatus;
                flight.plane = status.flightEquipment;

                // planefinder.net unfortuantely has no API to get these image URLs; and I could find no other good source for images.
                // YQL was tried to webscrape them from planefinder.net, but the results were inconsistent.
                flight.planeImg = 'http://planefinder.net/flightstat/v1/getImage.php?airlineCode=' + status.carrier.icao + '&aircraftType=' + (status.flightEquipment.scheduledEquipment || status.flightEquipment.actualEquipment).iata + '&skipFuzzy=0';

                flight.airline = status.carrier.name;
                flight.name = 'Flight ' + status.flightNumber;
                flight.depPort = status.departureAirport;
                flight.arrPort = status.arrivalAirport;
                flight.depTime = status.departureDate.dateLocal;
                flight.arrTime = status.arrivalDate.dateLocal;
                flight.tail = status.flightEquipment.tailNumber;
                flight.carrier = status.carrier.icao;
                flight.img = 'http://planefinder.net/flightstat/v1/getLogoRedirect.php?airlineCode=' + flight.carrier + '&requestThumb=0&isSSL=0';
                flight.icon = 'http://planefinder.net/flightstat/v1/getLogoRedirect.php?airlineCode=' + flight.carrier + '&requestThumb=1&isSSL=0';

                // The following assign ViewModel functions to the flight, which the Model uses as computed observables.
                flight.marker = self.createMarker;
                flight.posData = self.sortPos;
                flight.searchables = self.flightTerms;
                flight.inList = self.searchFlights;

                var newflight = self.flightList.push(new Flight(flight));
            },
            error: function(){
                flight.plane = 'Plane type not available';
                flight.depPort = 'Departure city not available';
                flight.arrPort = 'Arrival city not available';
                flight.img = 'http://planefinder.net/flightstat/v1/getLogoRedirect.php?airlineCode=' + flight.callsign.slice(3,0) + '&requestThumb=0&isSSL=0';
                flight.icon = 'http://planefinder.net/flightstat/v1/getLogoRedirect.php?airlineCode=' + flight.callsign.slice(3,0) + '&requestThumb=1&isSSL=0';
                flight.planeImg = '';
                flight.marker = self.createMarker;
                flight.posData = self.sortPos;
                flight.searchables = self.flightTerms;
                flight.inList = self.searchFlights;
                self.flightList.push(new Flight(flight));
            }
        });
    };

    // Array sort function to sort flight positions in chronological order.
    self.sortPos = function(flight) {

        sortDates = function(a, b) {
            return Date.parse(a.date) - Date.parse(b.date);
        };

        return flight.sort(sortDates);
    };

    /* Creates a marker for the flight, and ensures the marker is within the visible map range. Loads the marker image asynchronously,
        and has a fallback in acse the image fails to load. Sets a click action on the marker to select that flight. */
    self.createMarker = function(flight) {
        var position = flight.positions()[flight.positions().length - 1];
        var logo = new Image();
        var marker = new google.maps.Marker({
            map: null,
            title: flight.callsign(),
            position: {lat: position.lat, lng: position.lon}
        });
        logo.onload = function() {
            marker.setOptions({
                icon: flight.icon(),
                map: map
            });
        };
        logo.onerror = function() {
            marker.setOptions({
                icon: {
                    path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                    rotation: flight.heading(),
                    scale: 4,
                    strokeColor: 'black'
                },
                map: map
            });
        };
        logo.src = flight.icon();
        mapBounds.extend(marker.position);
        map.fitBounds(mapBounds);
        google.maps.event.addListener(marker, 'click', function() {
            return self.selFlight(flight, 'marker');
        });
        return marker;
    };

    /* Selects a flight on user click of the menu item or map marker. Deselects the previous selection and replaces its map
        marker. Starts the flight path animation. */
    self.selFlight = function(flight, event) {

        /*Tests if the clicked item was the marker, or the menu item.  If the menu, scrolls the item into view.
            I could not find a good way to reference the flight's menu item during the click from the marker. */
        if (flight !== null && event !== 'marker') {
            event.currentTarget.scrollIntoView(true);
        }

        if (self.currFlight()) {
            window.clearInterval(flightTimer);
            var prevFlight = self.currFlight();
            var position = prevFlight.positions()[prevFlight.positions().length - 1];
        }
        self.currFlight(flight);
        if (prevFlight) {
            prevFlight.marker().setOptions({
                position: {lat: position.lat, lng: position.lon}
            });
        }
        if (self.currFlight()) {
            self.iconFly();
        }
    };

    // Toggles the state of the flight list menu.
    self.hideMenu = function() {
        self.listVis(!self.listVis());
    };

    /* Animates the flight path of the selected flight.  Using requestAnimationFrame was not useful,
        since there are so few positions.  Resizes the map to ensure the full flight path is visible. */
    self.iconFly = function() {
        var posArray = [];
        var startPos = 0;
        var newBounds = new google.maps.LatLngBounds();
        posArray = self.currFlight().positions();

        for (i=0; i < posArray.length; i++) {
            var boundPoint = new google.maps.LatLng(posArray[i].lat, posArray[i].lon);
            newBounds.extend(boundPoint);
        }
        map.fitBounds(newBounds);

        flightTimer = window.setInterval(function() {
            var newPos  = posArray[startPos];
            self.currFlight().marker().setOptions({
                position: {lat: newPos.lat, lng: newPos.lon},
            });
            startPos++;
            if (startPos > posArray.length - 1) {
                startPos = 0;
            }
        }, 300);
    };

    // Used by the filteredList forEach binding before each item is added to the View; animates the addition.
    self.addFlight = function(elem) {
        window.setTimeout(function() {
            $(elem).addClass('listed');
        }, 100);
    };

    // Used by the filteredList forEach binding before each item is removed from the View; animates the removal.
    self.removeFlight = function(elem) {
        $(elem).removeClass('listed');
        window.setTimeout(function() {
            $(elem).remove();
        }, 1001);
    };

    // Called if the airline logo image fails to load, and triggers the View to not display the logo.
    self.hideImg = function(flight) {
        flight.imgLoaded(false);
    };

    // Called if the plane image fails to load, and triggers the View not to display the plane image available icon.
    self.planeImgError = function(flight) {
        flight.planeLoaded(false);
    };

    // Toggles the visibility of the search bar.
    self.searchToggle = function() {
        self.searchVis(!self.searchVis());
    };

    // Toggles the visibility of the info box.
    self.infoToggle = function() {
        self.infoVis(!self.infoVis());
    };

    // Toggles the visibility of the plane photo lightbox.
    self.togglePhoto = function() {
        self.photoView(!self.photoView());
    };

    /* Used as the flight.inList() function; compares user input against a flight's searchables list to determine if
        the flight should be in the filtered list.  */
    self.searchFlights = function(flight) {
        var inlist;
        return self.searchWords().some(function(word) {
            return flight.searchables().toString().toLowerCase().search(word.toLowerCase()) !== -1;
        });
    };

    /* The following function serves as the ViewModel's connection to the search category models.  It is used by the Flight models
        to generate a list of searchable terms against which user input is matched. It limits searches to a specific field; if none
        are selected, all fields are searched. Selecting after a search will also immediately filter the list to results for only
        that field.*/
    self.flightTerms = function(flight) {
        var terms = [];
        if (self.searchCat()) {
            switch(self.searchCat().type()) {
                case 'airline':
                    terms = terms.concat(flight.flight(), flight.airline());
                    return terms;
                case 'city':
                    terms = terms.concat(flight.arriving(), flight.departed());
                    return terms;
                case 'flight':
                    terms = terms.concat(flight.plane());
                    return terms;
            }
            terms = terms.concat(flight.flight(), flight.arriving(), flight.departed(), flight.plane(), flight.airline());
            return terms;
        }
        else {
            terms = terms.concat(flight.flight(), flight.arriving(), flight.departed(), flight.plane(), flight.airline());
            return terms;
        }
    };

    // This function toggles the selected search type, or untoggles if already selected.
    self.searchCatToggle = function(type) {
        if (type === self.searchCat()) {
            self.searchCat('');
        }
        else {
            self.searchCat(type);
        }
    };

    google.maps.event.addDomListener(window, 'load', self.initialize);

};

ko.applyBindings(new flightControl());
