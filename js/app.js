var Flight = function(data) {
    this.callsign = ko.observable(data.callsign);
    this.airline = ko.computed(function() {
        var abbr = this.callsign.slice(0,2);
        switch(abbr) {
            case 'ual':
            return 'United Airlines';

            case 'swa':
            return 'Southwest Airlines';

            case 'skw':
            return 'Skywest Airlines';

            case 'fdx':
            return 'FedEx';

            case 'dal':
            return 'Delta Airlines';

            case 'cpz':
            return 'Compass Airlines';

            case 'urf':
            return 'Surf Air';

            default:
            return abbr;
        }
    });
    this.flight = ko.computed(function() {
        return this.callsign.slice(3);
    });
    this.name = ko.computed(function() {
        return this.airline + ' Flight ' + this.flight;
    });
    this.heading = ko.observable(data.heading);
    this.positions = ko.observableArray(data.positions);
    this.marker = new google.maps.Marker({
                icon: {
                    path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                    rotation: this.heading,
                    scale: 4
                },
                map: map,
                title: this.name,
                position: {lat: this.positions[positions - 1].lat, lng: this.positions[positions - 1].lon}
            });
};

var map, jobList, jobMarkers = [];
function initialize() {

    var mapOptions = {
      center: {lat: 37.76258118134766, lng: -122.44835037231447},
      zoom: 12
    };
    map = new google.maps.Map(document.getElementById('mapDiv'), mapOptions);
    flightListener = google.maps.event.addListener(map, 'tilesloaded', loadFlights);
    //map.setCenter(mapCenter);

}


var flightControl = function() {
    this.flightList = ko.observableArray([]);

    this.loadFlights = function() {
        google.maps.event.removeListener(flightListener);
        var bounds = map.getBounds();
        var flightOptions = {};
        var boundsSw = bounds.getSouthWest();
        var boundsNe = bounds.getNorthEast();
        flightOptions.topLat = 38.5;
        flightOptions.rightLon = -122;
        flightOptions.bottomLat = 37;
        flightOptions.leftLon = -123;
        test = $.ajax('https://api.flightstats.com/flex/flightstatus/rest/v2/jsonp/flightsNear/' + flightOptions.topLat + '/' + flightOptions.leftLon + '/' + flightOptions.bottomLat + '/' + flightOptions.rightLon + '?appId=11381d70&appKey=59ee672f0e6a4744ca3a7efac46b4663&maxFlights=10&extendedOptions=includeNewFields', {dataType: 'jsonp'}). done(function(data) {
            data.flightPositions.forEach(function(flightData) {
                planeData = $.ajax('https://query.yahooapis.com/v1/public/yql?q=select%20content%20from%20html%20where%20url%3D%27http%3A%2F%2Fplanefinder.net%2Fdata%2Fflight%2FSWA4035%27%20and%20xpath%3D%27%2F%2Ftd%2Fspan%27&format=json&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys');

                this.flightList.push( new Flight(flightData) );
            });
        });

    };

    this.createMarkers = function(flight) {
        //data.flightPositions.forEach(function(flight) {
            var positions = flight.positions.length;
            var marker = new google.maps.Marker({
                icon: {
                    path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                    rotation: flight.heading,
                    scale: 4
                },
                map: map,
                title: flight.callsign,
                position: {lat: flight.positions[positions - 1].lat, lng: flight.positions[positions - 1].lon}
            });
    };
};

ko.applyBindings(flightControl);
google.maps.event.addDomListener(window, 'load', initialize);

