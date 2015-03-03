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

    // Marker creation
    self.marker = createMarker(flight);
    self.marker.title = self.airline() + self.name();

};

var map;

var flightControl = function() {
    var self = this;
    var apikey = '?appId=11381d70&appKey=59ee672f0e6a4744ca3a7efac46b4663';
    self.flightList = ko.observableArray([]);


    self.loadFlights = function() {
        google.maps.event.removeListener(flightListener);
        var flightUrl = 'https://api.flightstats.com/flex/flightstatus/rest/v2/jsonp/flightsNear/' +
            map.getCenter().lat() + '/' + map.getCenter().lng() + '/' + 25 + apikey +
            '&maxFlights=5&extendedOptions=includeNewFields';
        $.ajax({
            dataType: 'jsonp',
            url: flightUrl,
            success: function(data) {self.createFlights(data);}
        });
    };

    self.createFlights = function(data) {
        data.flightPositions.forEach(function(flight) {
            //flight.marker = self.createMarker(flight);
            var id = flight.flightId;
            var statusUrl = 'https://api.flightstats.com/flex/flightstatus/rest/v2/jsonp/flight/status/' +
                id + apikey + '&extendedOptions=useInlinedReferences';
            $.ajax({
                dataType: 'jsonp',
                url: statusUrl,
                success: function(data) {
                    console.dir(data);
                    var status = data.flightStatus;
                    flight.plane = (status.flightEquipment.scheduledEquipment || status.flightEquipment.actualEquipment).name ||
                        (status.flightEquipment.scheduledEquipment || status.flightEquipment.actualEquipment).iata || 'Unknown';
                    flight.airline = status.carrier.name;
                    flight.name = /*status.carrier.name +*/ ' Flight ' + status.flightNumber;
                    flight.depPort = status.departureAirport.city + ', ' + status.departureAirport.stateCode;
                    flight.arrPort = status.arrivalAirport.city + ', ' + status.arrivalAirport.stateCode;
                    flight.img = 'http://d3o54sf0907rz4.cloudfront.net/airline-logos/v2/centered/logos/svg/' + status.carrier.fs.toLowerCase() + '-logo.svg';
                    self.flightList.push( new Flight(flight) );
                },
                error: function(){
                    flight.plane = 'Plane type not available';
                    flight.depPort = 'Departure city not available';
                    flight.arrPort = 'Arrival city not available';
                    flight.img = 'http://d3o54sf0907rz4.cloudfront.net/airline-logos/v2/centered/logos/svg/' + flight.callsign.slice(0,3).toLowerCase() + '-logo.svg';;
                    self.flightList.push( new Flight(flight) );
                }
            });
        });
        window.flightList = self.flightList();
    };


    self.initialize = function() {
        var mapOptions = {
          center: {lat: 37.3894, lng: -122.0819},
          zoom: 12,
          disableDefaultUI: true
        };
        map = new google.maps.Map(document.getElementById('mapDiv'), mapOptions);
        flightListener = google.maps.event.addListener(map, 'tilesloaded', self.loadFlights);
    };

    self.addFlight = function(elem) {
        setTimeout(function() {
            $(elem).filter('li')[0].classList.add('listed');
        }, 30);
    };

    self.removeFlight = function(elem) {

        $(elem).filter('li')[0].classList.remove('listed');
    };

    self.hideImg = function(flight) {
        flight.imgLoaded(false);
    };

    google.maps.event.addDomListener(window, 'load', self.initialize);

};

createMarker = function(flight) {
    var position = flight.positions[flight.positions.length - 1];
    var marker = new google.maps.Marker({
            icon: {
                path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                rotation: flight.heading,
                scale: 4
            },
            map: map,
            title: flight.callsign,
            position: {lat: position.lat, lng: position.lon}
        });
        return marker;
    };

ko.applyBindings(new flightControl());