var Flight = function(flight) {
    var self = this;

    // Observables

    self.callsign = ko.observable(flight.callsign);
    self.plane = ko.observable(flight.plane);
    self.heading = ko.observable(flight.heading);
    self.positions = ko.observableArray(flight.positions);
    self.img = ko.observable(flight.img);
    self.depPort = ko.observable(flight.depPort);
    self.arrPort = ko.observable(flight.arrPort);
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
    self.name = ko.computed(function() {
        if (flight.name) {
            return flight.name;
        }
        else {
            return /*self.airline() + */' Flight ' + self.flight();
        }
    });
    self.marker = ko.computed(function() {
        return flight.marker(self);
    });

};

var map;



var flightControl = function() {
    console.log('Reached flightControl');
    var self = this;
    var apikey = '?appId=11381d70&appKey=59ee672f0e6a4744ca3a7efac46b4663';

    self.flightList = ko.observableArray([]);
    self.currFlight = ko.observable();
    console.dir(self.flightList());

    self.loadFlights = function() {
        console.log('Reached loadFlights');
        delayed = [];
        google.maps.event.removeListener(flightListener);
        var flightUrl = 'https://api.flightstats.com/flex/flightstatus/rest/v2/jsonp/flightsNear/' +
            map.getCenter().lat() + '/' + map.getCenter().lng() + '/' + 25 + apikey +
            '&maxFlights=5&extendedOptions=includeNewFields';
        $.ajax({
            dataType: 'jsonp',
            url: flightUrl,
            success: function(data) {
                console.log('Flights Loaded');
                data.flightPositions.forEach(function(flight) {
                    self.createFlights(flight);
                });
            }
        });
    };

    self.createFlights = function(flight) {
        console.log('Reached createFlights');
        var id = flight.flightId;
        var statusUrl = 'https://api.flightstats.com/flex/flightstatus/rest/v2/jsonp/flight/status/' +
            id + apikey + '&extendedOptions=useInlinedReferences';
        $.ajax({
            dataType: 'jsonp',
            url: statusUrl,
            success: function(data) {
                console.log('More Flight Data Loaded');
                var status = data.flightStatus;
                flight.plane = (status.flightEquipment.scheduledEquipment || status.flightEquipment.actualEquipment).name ||
                    (status.flightEquipment.scheduledEquipment || status.flightEquipment.actualEquipment).iata || 'Unknown';
                flight.airline = status.carrier.name;
                flight.name = /*status.carrier.name +*/ ' Flight ' + status.flightNumber;
                flight.depPort = status.departureAirport.city + ', ' + status.departureAirport.stateCode;
                flight.arrPort = status.arrivalAirport.city + ', ' + status.arrivalAirport.stateCode;
                flight.img = 'http://d3o54sf0907rz4.cloudfront.net/airline-logos/v2/centered/logos/svg/' + status.carrier.fs.toLowerCase() + '-logo.svg';
                flight.marker = self.createMarker;
                self.flightList.push( new Flight(flight) );
                console.log(flight.name + ' Created');
                console.dir(self.flightList());
            },
            error: function(){
                console.log('Error: Flight Data Manually Created');
                flight.plane = 'Plane type not available';
                flight.depPort = 'Departure city not available';
                flight.arrPort = 'Arrival city not available';
                flight.img = 'http://d3o54sf0907rz4.cloudfront.net/airline-logos/v2/centered/logos/svg/' + flight.callsign.slice(0,3).toLowerCase() + '-logo.svg';
                flight.marker = self.createMarker;
                self.flightList.push( new Flight(flight) );
                console.dir(self.flightList());
            }
        });
    window.flightList = self.flightList();
    };

    self.selFlight = function(flight) {
        if(window.innerWidth < 980) {
            self.hideMenu();
        };
        console.log(flight.name() + ' Selected');
        if (self.currFlight()) {
            window.clearInterval(flightTimer);
            var prevFlight = self.currFlight();
            var position = prevFlight.positions()[prevFlight.positions().length - 1];
        };
        self.currFlight(flight);
        console.dir(flight);
        self.iconFly(flight);
        if (prevFlight) {
            prevFlight.marker().setOptions({
                icon: {
                    path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                    fillColor: 'black',
                    rotation: flight.heading(),
                    scale: 4,
                },
                position: {lat: position.lat, lng: position.lon}
            });
        };
    };

    self.hideMenu = function() {
        var list = document.getElementsByClassName('filterItem');
        for (i=0; i < list.length; i++) {
            window.setTimeout(function() {
                self.removeFlight(list[i]), i*10);
            });
        };
    };

    self.iconFly = function() {
        console.log(self.currFlight().name() + ' Flying');
        console.dir(self.currFlight().positions());

        sortDates = function(a, b) {
            return Date.parse(a.date) - Date.parse(b.date);
        };

        var posArray = [];
        posArray = self.currFlight().positions().sort(sortDates);
        var startPos = 0;
        flightTimer = window.setInterval(function() {
            var newPos  = posArray[startPos];
            self.currFlight().marker().setOptions({
                position: {lat: newPos.lat, lng: newPos.lon},
                icon: {
                    path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                    rotation: newPos.course,
                    fillColor: 'blue',
                    scale: 4
                }
            });
            startPos++;
            if (startPos > posArray.length - 1) {
                startPos = 0;
            };
        }, 300);
    };

    self.initialize = function() {
        console.log('Map Initialized');
        var mapOptions = {
          center: {lat: 37.3894, lng: -122.0819},
          zoom: 12,
          disableDefaultUI: true
        };
        map = new google.maps.Map(document.getElementById('mapDiv'), mapOptions);
        mapBounds = new google.maps.LatLngBounds();
        flightListener = google.maps.event.addListener(map, 'tilesloaded', self.loadFlights);
    };

    self.addFlight = function(elem) {
        setTimeout(function() {
            $(elem).filter('li')[0].classList.add('listed');
        }, 30);
    };

    self.removeFlight = function(elem) {
        $(elem).filter('li')[0].classList.toggle('hidden');
    };

    self.hideImg = function(flight) {
        flight.imgLoaded(false);
    };

    google.maps.event.addDomListener(window, 'load', self.initialize);

    self.createMarker = function(flight) {
        console.log(flight.name() + ' Marker Created');
        var position = flight.positions()[flight.positions().length - 1];
        var marker = new google.maps.Marker({
            icon: {
                path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                rotation: flight.heading(),
                scale: 4,
            },
            map: map,
            title: flight.callsign(),
            position: {lat: position.lat, lng: position.lon}
        });
        /* self.marker.title = ko.computed(function() {
            self.airline() + self.name();
        });*/
        mapBounds.extend(marker.position);
        map.fitBounds(mapBounds);
        google.maps.event.addListener(marker, 'click', function() {
            return self.selFlight(flight);
        });
        return marker;
    };
};





ko.applyBindings(new flightControl());
