/**
 * Google Maps Integration v1
 * Advanced venue mapping and navigation system for Lightning Talk Circle
 */

class MapsSystem {
  constructor(options = {}) {
    this.options = {
      apiKey: options.apiKey || this.getApiKey(),
      defaultZoom: 15,
      defaultCenter: { lat: 35.6762, lng: 139.6503 }, // Tokyo
      mapContainerId: 'map-container',
      searchRadius: 1000, // meters
      language: 'ja',
      region: 'JP',
      ...options
    };

    this.map = null;
    this.markers = [];
    this.infoWindow = null;
    this.directionsService = null;
    this.directionsRenderer = null;
    this.currentPosition = null;
    this.eventMarker = null;
    this.nearbyServices = [];
    this.isLoaded = false;

    this.init();
  }

  /**
   * Initialize the Maps system
   */
  async init() {
    try {
      if (!this.options.apiKey) {
        throw new Error('Google Maps API key is required');
      }

      await this.loadGoogleMapsAPI();
      this.setupEventListeners();

      console.log('Maps system initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Maps system:', error);
      this.showError('地図システムの初期化に失敗しました');
    }
  }

  /**
   * Load Google Maps API dynamically
   */
  async loadGoogleMapsAPI() {
    return new Promise((resolve, reject) => {
      // Check if already loaded
      if (window.google && window.google.maps) {
        this.isLoaded = true;
        resolve();
        return;
      }

      // Create script element
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${this.options.apiKey}&libraries=places,geometry&language=${this.options.language}&region=${this.options.region}`;
      script.async = true;
      script.defer = true;

      script.onload = () => {
        this.isLoaded = true;
        resolve();
      };

      script.onerror = () => {
        reject(new Error('Failed to load Google Maps API'));
      };

      document.head.appendChild(script);
    });
  }

  /**
   * Initialize map for event venue
   */
  async initializeEventMap(eventData, containerId = null) {
    if (!this.isLoaded) {
      await this.loadGoogleMapsAPI();
    }

    const container = document.getElementById(containerId || this.options.mapContainerId);
    if (!container) {
      throw new Error(`Map container not found: ${containerId || this.options.mapContainerId}`);
    }

    // Parse venue location
    const venueLocation = this.parseLocation(eventData.venue);
    if (!venueLocation) {
      throw new Error('Invalid venue location data');
    }

    // Create map
    this.map = new google.maps.Map(container, {
      zoom: this.options.defaultZoom,
      center: venueLocation,
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true,
      zoomControl: true,
      styles: this.getMapStyles()
    });

    // Initialize services
    this.directionsService = new google.maps.DirectionsService();
    this.directionsRenderer = new google.maps.DirectionsRenderer({
      map: this.map,
      panel: document.getElementById('directions-panel')
    });
    this.infoWindow = new google.maps.InfoWindow();

    // Add event venue marker
    await this.addEventVenueMarker(eventData, venueLocation);

    // Get user location and add nearby services
    await this.getCurrentLocation();
    await this.addNearbyServices(venueLocation);

    return this.map;
  }

  /**
   * Parse location from various formats
   */
  parseLocation(venue) {
    if (!venue) {
      return null;
    }

    // If venue is already coordinates
    if (venue.lat && venue.lng) {
      return { lat: parseFloat(venue.lat), lng: parseFloat(venue.lng) };
    }

    // If venue has coordinates in different format
    if (venue.latitude && venue.longitude) {
      return { lat: parseFloat(venue.latitude), lng: parseFloat(venue.longitude) };
    }

    // If venue has address, we'll need to geocode it
    if (venue.address) {
      return this.geocodeAddress(venue.address);
    }

    return null;
  }

  /**
   * Geocode address to coordinates
   */
  async geocodeAddress(address) {
    return new Promise((resolve, reject) => {
      const geocoder = new google.maps.Geocoder();

      geocoder.geocode(
        {
          address,
          region: this.options.region,
          language: this.options.language
        },
        (results, status) => {
          if (status === 'OK' && results[0]) {
            const { location } = results[0].geometry;
            resolve({
              lat: location.lat(),
              lng: location.lng()
            });
          } else {
            reject(new Error(`Geocoding failed: ${status}`));
          }
        }
      );
    });
  }

  /**
   * Add event venue marker with detailed info
   */
  async addEventVenueMarker(eventData, location) {
    const venueIcon = {
      url: '/images/venue-marker.png',
      scaledSize: new google.maps.Size(40, 40),
      origin: new google.maps.Point(0, 0),
      anchor: new google.maps.Point(20, 40)
    };

    this.eventMarker = new google.maps.Marker({
      position: location,
      map: this.map,
      title: eventData.venue?.name || eventData.title,
      icon: venueIcon,
      animation: google.maps.Animation.DROP
    });

    // Create detailed info window content
    const infoContent = this.createVenueInfoContent(eventData);

    this.eventMarker.addListener('click', () => {
      this.infoWindow.setContent(infoContent);
      this.infoWindow.open(this.map, this.eventMarker);
    });

    this.markers.push(this.eventMarker);
  }

  /**
   * Create venue info window content
   */
  createVenueInfoContent(eventData) {
    const venue = eventData.venue || {};
    const emergencyContacts = eventData.emergencyContacts || [];

    return `
      <div class="venue-info-window">
        <div class="venue-header">
          <h3>${venue.name || eventData.title}</h3>
          <span class="event-badge">${eventData.type || 'ライトニングトーク'}</span>
        </div>
        
        <div class="venue-details">
          ${
  venue.address
    ? `
            <div class="venue-address">
              <span class="icon">📍</span>
              <span>${venue.address}</span>
            </div>
          `
    : ''
}
          
          ${
  eventData.datetime
    ? `
            <div class="event-time">
              <span class="icon">🕐</span>
              <span>${new Date(eventData.datetime).toLocaleString('ja-JP')}</span>
            </div>
          `
    : ''
}
          
          ${
  venue.phone
    ? `
            <div class="venue-phone">
              <span class="icon">📞</span>
              <a href="tel:${venue.phone}">${venue.phone}</a>
            </div>
          `
    : ''
}
        </div>

        <div class="venue-actions">
          <button class="map-btn primary" onclick="mapsSystem.getDirections()">
            🧭 道順を表示
          </button>
          <button class="map-btn" onclick="mapsSystem.shareLocation()">
            📤 位置を共有
          </button>
        </div>

        ${
  emergencyContacts.length > 0
    ? `
          <div class="emergency-contacts">
            <h4>🚨 緊急連絡先</h4>
            ${emergencyContacts
    .map(
      contact => `
              <div class="emergency-contact">
                <span class="contact-name">${contact.name}</span>
                <a href="tel:${contact.phone}" class="contact-phone">${contact.phone}</a>
              </div>
            `
    )
    .join('')}
          </div>
        `
    : ''
}
      </div>
    `;
  }

  /**
   * Get user's current location
   */
  async getCurrentLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        position => {
          this.currentPosition = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };

          // Add user location marker
          this.addUserLocationMarker();
          resolve(this.currentPosition);
        },
        error => {
          console.warn('Could not get user location:', error);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  }

  /**
   * Add user location marker
   */
  addUserLocationMarker() {
    if (!this.currentPosition) {
      return;
    }

    const userIcon = {
      url: '/images/user-location.png',
      scaledSize: new google.maps.Size(20, 20),
      origin: new google.maps.Point(0, 0),
      anchor: new google.maps.Point(10, 10)
    };

    const userMarker = new google.maps.Marker({
      position: this.currentPosition,
      map: this.map,
      title: '現在地',
      icon: userIcon
    });

    this.markers.push(userMarker);
  }

  /**
   * Add nearby services around the venue
   */
  async addNearbyServices(venueLocation) {
    const placesService = new google.maps.places.PlacesService(this.map);

    const serviceTypes = [
      { type: 'restaurant', icon: '🍽️', name: 'レストラン' },
      { type: 'cafe', icon: '☕', name: 'カフェ' },
      { type: 'convenience_store', icon: '🏪', name: 'コンビニ' },
      { type: 'hospital', icon: '🏥', name: '病院' },
      { type: 'police', icon: '👮', name: '警察署' },
      { type: 'subway_station', icon: '🚇', name: '駅' }
    ];

    for (const service of serviceTypes) {
      try {
        await this.searchNearbyPlaces(placesService, venueLocation, service);
      } catch (error) {
        console.warn(`Failed to search for ${service.name}:`, error);
      }
    }
  }

  /**
   * Search for nearby places of specific type
   */
  searchNearbyPlaces(placesService, location, serviceType) {
    return new Promise((resolve, reject) => {
      const request = {
        location,
        radius: this.options.searchRadius,
        type: [serviceType.type]
      };

      placesService.nearbySearch(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
          // Limit to top 3 results per type
          const limitedResults = results.slice(0, 3);

          limitedResults.forEach(place => {
            this.addServiceMarker(place, serviceType);
          });

          resolve(limitedResults);
        } else {
          reject(new Error(`Places search failed: ${status}`));
        }
      });
    });
  }

  /**
   * Add service marker
   */
  addServiceMarker(place, serviceType) {
    const marker = new google.maps.Marker({
      position: place.geometry.location,
      map: this.map,
      title: place.name,
      icon: {
        url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(this.createServiceIcon(serviceType.icon))}`,
        scaledSize: new google.maps.Size(30, 30),
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(15, 15)
      }
    });

    const infoContent = `
      <div class="service-info">
        <h4>${serviceType.icon} ${place.name}</h4>
        <p class="service-type">${serviceType.name}</p>
        ${place.rating ? `<div class="rating">⭐ ${place.rating}</div>` : ''}
        ${place.vicinity ? `<div class="address">📍 ${place.vicinity}</div>` : ''}
        <button class="map-btn" onclick="mapsSystem.getDirectionsToPlace('${place.place_id}')">
          道順を表示
        </button>
      </div>
    `;

    marker.addListener('click', () => {
      this.infoWindow.setContent(infoContent);
      this.infoWindow.open(this.map, marker);
    });

    this.markers.push(marker);
    this.nearbyServices.push({ place, marker, serviceType });
  }

  /**
   * Create service icon SVG
   */
  createServiceIcon(emoji) {
    return `
      <svg width="30" height="30" xmlns="http://www.w3.org/2000/svg">
        <circle cx="15" cy="15" r="12" fill="white" stroke="#333" stroke-width="2"/>
        <text x="15" y="20" text-anchor="middle" font-size="14">${emoji}</text>
      </svg>
    `;
  }

  /**
   * Get directions from user location to venue
   */
  async getDirections() {
    if (!this.currentPosition) {
      await this.getCurrentLocation();
    }

    if (!this.currentPosition || !this.eventMarker) {
      this.showError('現在地またはイベント会場が見つかりません');
      return;
    }

    const request = {
      origin: this.currentPosition,
      destination: this.eventMarker.getPosition(),
      travelMode: google.maps.TravelMode.TRANSIT,
      transitOptions: {
        modes: [
          google.maps.TransitMode.SUBWAY,
          google.maps.TransitMode.TRAIN,
          google.maps.TransitMode.BUS
        ],
        routingPreference: google.maps.TransitRoutePreference.FEWER_TRANSFERS
      }
    };

    this.directionsService.route(request, (result, status) => {
      if (status === 'OK') {
        this.directionsRenderer.setDirections(result);
        this.showDirectionsPanel();
      } else {
        this.showError('道順の取得に失敗しました');
      }
    });
  }

  /**
   * Get directions to specific place
   */
  async getDirectionsToPlace(placeId) {
    if (!this.currentPosition) {
      await this.getCurrentLocation();
    }

    if (!this.currentPosition) {
      this.showError('現在地が見つかりません');
      return;
    }

    const request = {
      origin: this.currentPosition,
      destination: { placeId },
      travelMode: google.maps.TravelMode.WALKING
    };

    this.directionsService.route(request, (result, status) => {
      if (status === 'OK') {
        this.directionsRenderer.setDirections(result);
        this.showDirectionsPanel();
      } else {
        this.showError('道順の取得に失敗しました');
      }
    });
  }

  /**
   * Share current location
   */
  async shareLocation() {
    if (!this.eventMarker) {
      return;
    }

    const position = this.eventMarker.getPosition();
    const url = `https://maps.google.com/?q=${position.lat()},${position.lng()}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'イベント会場の場所',
          text: 'Lightning Talk Circle イベント会場の位置です',
          url
        });
      } catch (error) {
        console.log('Share cancelled or failed:', error);
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(url);
      this.showSuccess('場所のURLをクリップボードにコピーしました');
    }
  }

  /**
   * Show directions panel
   */
  showDirectionsPanel() {
    const panel = document.getElementById('directions-panel');
    if (panel) {
      panel.style.display = 'block';
      panel.scrollIntoView({ behavior: 'smooth' });
    }
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Listen for resize events
    window.addEventListener('resize', () => {
      if (this.map) {
        google.maps.event.trigger(this.map, 'resize');
      }
    });

    // Listen for visibility changes
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.map) {
        google.maps.event.trigger(this.map, 'resize');
      }
    });
  }

  /**
   * Get map styles for custom appearance
   */
  getMapStyles() {
    return [
      {
        featureType: 'poi',
        elementType: 'labels',
        stylers: [{ visibility: 'on' }]
      },
      {
        featureType: 'transit',
        elementType: 'labels',
        stylers: [{ visibility: 'on' }]
      }
    ];
  }

  /**
   * Get API key from environment or configuration
   */
  getApiKey() {
    // Try multiple sources for API key
    return (
      window.GOOGLE_MAPS_API_KEY ||
      document.querySelector('meta[name="google-maps-api-key"]')?.content ||
      localStorage.getItem('googleMapsApiKey') ||
      null
    );
  }

  /**
   * Show error message
   */
  showError(message) {
    console.error('Maps Error:', message);

    // Create error notification
    const notification = document.createElement('div');
    notification.className = 'maps-error-notification';
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #ef4444;
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      z-index: 10000;
      font-weight: 500;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 5000);
  }

  /**
   * Show success message
   */
  showSuccess(message) {
    console.log('Maps Success:', message);

    // Create success notification
    const notification = document.createElement('div');
    notification.className = 'maps-success-notification';
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #10b981;
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      z-index: 10000;
      font-weight: 500;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 3000);
  }

  /**
   * Clear all markers
   */
  clearMarkers() {
    this.markers.forEach(marker => {
      marker.setMap(null);
    });
    this.markers = [];
    this.nearbyServices = [];
  }

  /**
   * Center map on venue
   */
  centerOnVenue() {
    if (this.eventMarker) {
      this.map.setCenter(this.eventMarker.getPosition());
      this.map.setZoom(this.options.defaultZoom);
    }
  }

  /**
   * Toggle nearby services visibility
   */
  toggleNearbyServices(serviceType) {
    this.nearbyServices.forEach(service => {
      if (!serviceType || service.serviceType.type === serviceType) {
        const visible = service.marker.getVisible();
        service.marker.setVisible(!visible);
      }
    });
  }

  /**
   * Destroy the maps system
   */
  destroy() {
    this.clearMarkers();

    if (this.map) {
      this.map = null;
    }

    if (this.directionsRenderer) {
      this.directionsRenderer.setMap(null);
      this.directionsRenderer = null;
    }

    this.directionsService = null;
    this.infoWindow = null;
    this.currentPosition = null;
    this.eventMarker = null;
  }
}

// Global instance for easy access
const mapsSystem = null;

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Auto-initialize maps with data attributes
  document.querySelectorAll('[data-maps-system]').forEach(element => {
    const options = JSON.parse(element.dataset.mapsSystem || '{}');
    element.mapsSystem = new MapsSystem(options);
  });
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MapsSystem;
}
