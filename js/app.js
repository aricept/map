var Flight = function(flight) {
    var self = this;

    // Observables
    self.inList = ko.observable(true);
    self.hidden = ko.observable(false);
    self.callsign = ko.observable(flight.callsign);
    self.plane = ko.observable(flight.plane);
    self.heading = ko.observable(flight.heading);
    self.depPort = ko.observable(flight.depPort);
    self.arrPort = ko.observable(flight.arrPort);
    self.img = ko.observable(flight.img);
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
    self.departed = ko.computed(function() {
        var city = self.depPort().city;
        if (self.depPort().stateCode) {
            return city + ', ' + self.depPort().stateCode;
        }
        else {
            return city + ', ' + self.depPort().countryName;
        }
    });
    self.depTime = ko.computed(function() {
        var dpTime = flight.depTime.split('T');
        console.log(dpTime[1]);
        var timeComp = dpTime[1].split(':');
        if (timeComp[0] > 12) {
            console.log((timeComp[0] - 12) + ':' + timeComp[1] + ' PM Local')
            return (timeComp[0] - 12) + ':' + timeComp[1] + ' PM Local';
        }
        else if (timeComp[0] === 12) {
            return timeComp[0] + ':' + timeComp[1] + ' PM Local';
        }
        else {
            console.log(timeComp[0] + ':' + timeComp[1] + ' AM Local')
            return timeComp[0] + ':' + timeComp[1] + ' AM Local';
        }
    });
    self.arriving = ko.computed(function() {
        var city = self.arrPort().city;
        if (self.arrPort().stateCode) {
            return city + ', ' + self.arrPort().stateCode;
        }
        else {
            return city + ', ' + self.arrPort().countryName
        }
    });
    self.arrTime = ko.computed(function() {
        var arTime = flight.arrTime.split('T');
        var timeComp = arTime[1].split(':');
        if (parseInt(timeComp[0]) > 12) {
            return (parseInt(timeComp[0]) - 12) + ':' + timeComp[1] + ' PM Local Time';
        }
        else {
            return timeComp[0] + ':' + timeComp[1] + 'AM Local Time';
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
    self.positions = ko.computed(function() {
        return flight.posData(flight.positions);
    });
    self.marker = ko.computed(function() {
        return flight.marker(self);
    });


};

var map;



var flightControl = function() {
    var self = this;
    var apikey = '?appId=11381d70&appKey=59ee672f0e6a4744ca3a7efac46b4663';

    self.flightList = ko.observableArray([]);
    self.filteredList = ko.observableArray([]);
    self.currFlight = ko.observable();
    window.currFlight = self.currFlight();
    self.listVis = ko.observable(true);
    self.searchVis = ko.observable(false);
    self.searchBox = ko.observable('');
    self.searchWords = ko.computed(function() {
        return self.searchBox().split(' ');
    });
    self.infoVis = ko.observable(true);
    self.flightError = ko.observable(false);

    self.sortPos = function(flight) {
        console.dir(flight);
        sortDates = function(a, b) {
            return Date.parse(a.date) - Date.parse(b.date);
        };

        return flight.sort(sortDates);
    }

    self.loadFlights = function() {
        google.maps.event.removeListener(flightListener);
        var flightUrl = 'https://api.flightstats.com/flex/flightstatus/rest/v2/jsonp/flightsNear/' +
            map.getCenter().lat() + '/' + map.getCenter().lng() + '/' + 25 + apikey +
            '&maxFlights=5&extendedOptions=includeNewFields';
        $.ajax({
            dataType: 'jsonp',
            url: flightUrl,
            success: function(data) {
                if (data.error) {
                    return self.flightError(true);
                }
                data.flightPositions.forEach(function(flight) {
                    self.createFlights(flight);
                });
            },
        });
    };

    self.createFlights = function(flight) {
        var id = flight.flightId;
        var statusUrl = 'https://api.flightstats.com/flex/flightstatus/rest/v2/jsonp/flight/status/' +
            id + apikey + '&extendedOptions=useInlinedReferences';
        $.ajax({
            dataType: 'jsonp',
            url: statusUrl,
            success: function(data) {
                var status = data.flightStatus;
                flight.plane = (status.flightEquipment.scheduledEquipment || status.flightEquipment.actualEquipment).name ||
                    (status.flightEquipment.scheduledEquipment || status.flightEquipment.actualEquipment).iata || 'Unknown';
                flight.airline = status.carrier.name;
                flight.name = 'Flight ' + status.flightNumber;
                flight.depPort = status.departureAirport;
                flight.arrPort = status.arrivalAirport;
                flight.depTime = status.departureDate.dateLocal;
                flight.arrTime = status.arrivalDate.dateLocal;
                flight.img = 'http://d3o54sf0907rz4.cloudfront.net/airline-logos/v2/centered/logos/svg/' + status.carrier.fs.toLowerCase() + '-logo.svg';
                flight.marker = self.createMarker;
                flight.posData = self.sortPos;
                self.flightList.push( new Flight(flight) );
            },
            error: function(){
                flight.plane = 'Plane type not available';
                flight.depPort = 'Departure city not available';
                flight.arrPort = 'Arrival city not available';
                flight.img = 'http://d3o54sf0907rz4.cloudfront.net/airline-logos/v2/centered/logos/svg/' + flight.callsign.slice(0,3).toLowerCase() + '-logo.svg';
                flight.marker = self.createMarker;
                flight.posData = self.sortPos;
                self.flightList.push( new Flight(flight) );
            }
        });
    window.flightList = self.flightList();
    };

    self.selFlight = function(flight, origin) {
        if(window.innerWidth < 980) {
            if (origin !== 'marker') {
                self.hideMenu();
            }
        };
        if (self.currFlight()) {
            window.clearInterval(flightTimer);
            var prevFlight = self.currFlight();
            var position = prevFlight.positions()[prevFlight.positions().length - 1];
        };
        self.currFlight(flight);
        if (prevFlight) {
            prevFlight.marker().setOptions({
                icon: {
                    path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                    fillColor: 'black',
                    rotation: prevFlight.heading(),
                    scale: 4,
                },
                position: {lat: position.lat, lng: position.lon}
            });
        };
        if (self.currFlight()) {
            self.iconFly();
        }
    };

    self.hideMenu = function() {
        self.listVis(!self.listVis());
    };

    self.iconFly = function() {
        var posArray = [];
        var startPos = 0;
        var newBounds = new google.maps.LatLngBounds();
        posArray = self.currFlight().positions();

        for (i=0; i < posArray.length; i++) {
            var boundPoint = new google.maps.LatLng(posArray[i].lat, posArray[i].lon);
            newBounds.extend(boundPoint);
        };
        map.fitBounds(newBounds);

        flightTimer = window.setInterval(function() {
            var newPos  = posArray[startPos];
            self.currFlight().marker().setOptions({
                position: {lat: newPos.lat, lng: newPos.lon},
                icon: {
                    path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                    rotation: newPos.course,
                    strokeColor: 'blue',
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
        $(elem).filter('li')[0].classList.toggle('listed');
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
                strokeColor: 'black'
            },
            map: map,
            title: flight.callsign(),
            position: {lat: position.lat, lng: position.lon}
        });
        mapBounds.extend(marker.position);
        map.fitBounds(mapBounds);
        google.maps.event.addListener(marker, 'click', function() {
            return self.selFlight(flight, 'marker');
        });
        return marker;
    };

    self.searchToggle = function() {
        self.searchVis(!self.searchVis());
    };

    self.infoToggle = function() {
        self.infoVis(!self.infoVis());
    };

    self.searchFlights = function() {
        var searchBounds = new google.maps.LatLngBounds();
        self.flightList().forEach(function(flight) {
            flight.inList(false);
            flight.hidden(false);
            flight.marker().setMap(null);
            self.searchWords().forEach(function(word) {
                if (flight.airline().toLowerCase().search(word.toLowerCase()) != -1 ||
                    flight.departed().toLowerCase().search(word.toLowerCase()) != -1 ||
                    flight.arriving().toLowerCase().search(word.toLowerCase()) != -1 ||
                    flight.flight().toLowerCase().search(word.toLowerCase()) != -1) {
                        flight.inList(true);
                        flight.marker().setMap(map);
                }
            });
        });

        self.flightList.sort(function(a,b) {
            return b.inList() - a.inList();
        });

        if (!self.currFlight()) {
                map.fitBounds(mapBounds);
            }

        if (!self.currFlight().inList()) {
            self.selFlight(null);
            map.fitBounds(mapBounds);
        }

        var visibility = window.setTimeout(function() {
            self.flightList().forEach(function(flight) {
                if (!flight.inList()) {
                    flight.hidden(true);
                }
            });
        }, 1100);

    };
};





ko.applyBindings(new flightControl());
