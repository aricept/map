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
        }
    });
    this.flight = ko.computed(function() {
        this.callsign.slice(3);
    });
    this.name = ko.computed(this.)
}

var map, jobList, jobMarkers = [];
function initialize() {

    var mapOptions = {
      center: {lat: 37.76258118134766, lng: -122.44835037231447},
      zoom: 12
    };
    map = new google.maps.Map(document.getElementById('mapDiv'), mapOptions);
    flightListener = google.maps.event.addListener(map, 'tilesloaded', getFlights);
    //map.setCenter(mapCenter);

}

function loadFlights() {
    google.maps.event.removeListener(flightListener);
    var bounds = map.getBounds();
    var flightOptions = {};
    var boundsSw = bounds.getSouthWest();
    var boundsNe = bounds.getNorthEast();
    flightOptions.topLat = 37;
    flightOptions.rightLon = -122;
    flightOptions.bottomLat = 38.5;
    flightOptions.leftLon = -123;
    test = $.ajax('https://api.flightstats.com/flex/flightstatus/rest/v2/jsonp/flightsNear/' + flightOptions.topLat + '/' + flightOptions.leftLon + '/' + flightOptions.bottomLat + '/' + flightOptions.rightLon + '?appId=11381d70&appKey=59ee672f0e6a4744ca3a7efac46b4663&maxFlights=10&extendedOptions=includeNewFields', {dataType: 'jsonp'}). done(function(data) {
        data.flightPositions.forEach(function(flight) {
            model.flights(flight);
        })
    });
}

function createMarkers (data) {
    data.flightPositions.forEach(function(flight) {
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
    });
}
google.maps.event.addDomListener(window, 'load', initialize);