import axios from 'axios'
import { $ } from './bling'

/* globals google */

const mapOptions = {
  center: { lat: 43.2, lng: -79.8 },
  zoom: 10
}

function loadPlaces (map, lng = -79.8, lat = 43.2) {
  axios
    .get(`/api/stores/near?lng=${lng}&lat=${lat}`)
    .then(res => {
      const places = res.data
      if (!places.length) return

      const bounds = new google.maps.LatLngBounds()
      const infoWindow = new google.maps.InfoWindow()

      const markers = places.map(place => {
        const [lng, lat] = place.location.coordinates
        const position = { lat, lng }
        bounds.extend(position)
        const marker = new google.maps.Marker({map, position})
        marker.place = place
        return marker
      })

      markers.forEach(marker => marker.addListener('click', function () {
        const html = `
          <div class="popup">
            <a href="/store/${this.place.slug}">
              <img src="/uploads/${this.place.photo || 'store.jpg'}" 
                alt="${this.place.name}"/>
              <p>${this.place.name} - ${this.place.location.address}</p>
            </a>
          </div>
        `

        infoWindow.setContent(html)
        infoWindow.open(map, this)
      }))

      map.setCenter(bounds.getCenter())
      map.fitBounds(bounds)
    })
    .catch(err => {
      console.error(err)
    })
}

function makeMap (mapDiv) {
  if (!mapDiv) return

  const map = new google.maps.Map(mapDiv, mapOptions)
  const input = $('[name="geolocate"]')
  const autocomplete = new google.maps.places.Autocomplete(input)
  autocomplete.addListener('place_changed', event => {
    const place = autocomplete.getPlace()
    const lng = place.geometry.location.lng()
    const lat = place.geometry.location.lat()
    loadPlaces(map, lng, lat)
  })
}

export default makeMap
