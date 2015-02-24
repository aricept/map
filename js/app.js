var Flight = function(flight) {
    var self = this;

    // Observables

    self.callsign = ko.observable(flight.callsign);
    self.plane = ko.observable(flight.plane);
    self.heading = ko.observable(flight.heading);
    self.positions = ko.observableArray(flight.positions);

    // Computed Observables

    self.flight = ko.computed(function() {
        return self.callsign().slice(3);
    });
    self.airline = ko.computed(function() {
        if(flight.airline) {
            return flight.airline;
        }
        else {
            return self.callsign().slice(0,3);
        }
    });
    self.name = ko.computed(function() {
        return self.airline() + ' Flight ' + self.flight();
    });

    // Marker creation
    self.marker = createMarker(flight);
    self.marker.title = self.name();

};

var map;

var flightControl = function() {
    var self = this;
    self.flightList = ko.observableArray([]);


    self.loadFlights = function() {
        google.maps.event.removeListener(flightListener);
        var flightOptions = {};
        flightOptions.topLat = 38;
        flightOptions.rightLon = -122;
        flightOptions.bottomLat = 37.6;
        flightOptions.leftLon = -122.7;
        var flightUrl = 'https://api.flightstats.com/flex/flightstatus/rest/v2/jsonp/flightsNear/' +
            flightOptions.topLat + '/' +
            flightOptions.leftLon + '/' +
            flightOptions.bottomLat + '/' +
            flightOptions.rightLon +
            '?appId=11381d70&appKey=59ee672f0e6a4744ca3a7efac46b4663&maxFlights=10&extendedOptions=includeNewFields';
        $.ajax({
            dataType: 'jsonp',
            url: flightUrl,
            success: function(data) {self.createFlights(data);}
        });
    };

    self.createFlights = function(data) {
        console.log('createFlights() reached');
        data.flightPositions.forEach(function(flight) {
            //flight.marker = self.createMarker(flight);
            var cs = flight.callsign;
            var pdUrl = 'https://query.yahooapis.com/v1/public/yql?q=select%20content%20from%20html%20where%20url%3D%27http%3A%2F%2Fplanefinder.net%2Fdata%2Fflight%2F' + cs + '%27%20and%20xpath%3D%27%2F%2Ftd%2Fspan%7C%2F%2Fh1%27&format=json&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys';
            $.ajax({
                url: pdUrl,
                success: function(data) {
                    console.dir(data);
                    if (data.query.count !== 0) {
                        flight.plane = data.query.results.span[3];
                        h1 = data.query.results.h1;
                        h1 = h1.slice(h1.indexOf('—')+2).trim();
                        flight.airline = h1;
                        flight.planeImg = 'http://planefinder.net/flightstat/v1/getImage.php?airlineCode=' +
                            flight.callsign.slice(0,3) + '&aircraftType=' + flight.plane;
                    }
                    else {
                        flight.plane = 'Plane type not available';
                        flight.planeImg = 'Plane image not available';
                    }
                    self.flightList.push( new Flight(flight) );
                },
                error: function(){
                    flight.plane = 'Plane type not available';
                    flight.planeImg = 'Plane image not available';
                    self.flightList.push( new Flight(flight) );
                }
            });
        });
        window.flightList = self.flightList();
    };


    self.initialize = function() {
        var mapOptions = {
          center: {lat: 37.76258118134766, lng: -122.44835037231447},
          zoom: 12,
          disableDefaultUI: true
        };
        map = new google.maps.Map(document.getElementById('mapDiv'), mapOptions);
        flightListener = google.maps.event.addListener(map, 'tilesloaded', self.loadFlights);
    };



    google.maps.event.addDomListener(window, 'load', self.initialize);


};

createMarker = function(flight) {
    var marker = new google.maps.Marker({
            icon: {
                path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                rotation: flight.heading,
                scale: 4
            },
            map: map,
            title: flight.callsign,
            position: {lat: flight.positions[0].lat, lng: flight.positions[0].lon}
        });
        return marker;
    };

ko.applyBindings(new flightControl());