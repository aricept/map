function initialize() {
    var mapOptions = {
      center: { lat: -90, lng: 32},
      zoom: 8
    };
    var map = new google.maps.Map(document.getElementById('mapDiv'),
        mapOptions);
}
google.maps.event.addDomListener(window, 'load', initialize);