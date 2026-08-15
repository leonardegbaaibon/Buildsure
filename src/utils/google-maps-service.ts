/**
 * Google Maps API Service
 * Handles Google Places Autocomplete, Geocoding, Static Map URLs, and Google Maps Links.
 */

export const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';

export interface PlacePrediction {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
}

export interface PlaceDetails {
  placeId: string;
  formattedAddress: string;
  streetAddress: string;
  city: string;
  state: string;
  country: string;
  latitude: number;
  longitude: number;
}

/**
 * Fetch Google Places Autocomplete suggestions for an address query
 */
export async function getAddressPredictions(input: string): Promise<PlacePrediction[]> {
  if (!input || input.trim().length < 2) return [];

  const query = input.trim();

  // 1. Try Google Places Autocomplete API if key is present
  if (GOOGLE_MAPS_API_KEY) {
    try {
      const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
        query
      )}&types=address&components=country:ng&key=${GOOGLE_MAPS_API_KEY}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && Array.isArray(data.predictions)) {
        return data.predictions.map((p: any) => ({
          placeId: p.place_id,
          description: p.description,
          mainText: p.structured_formatting?.main_text || p.description,
          secondaryText: p.structured_formatting?.secondary_text || '',
        }));
      }
    } catch {
      // Fallback to OpenStreetMap geocoding below
    }
  }

  // 2. OpenStreetMap / Nominatim Geocoding API for live real-time address predictions
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      query
    )}&addressdetails=1&limit=5&countrycodes=ng`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'BuildSureApp/1.0' },
    });
    const data = await response.json();

    if (Array.isArray(data)) {
      return data.map((item: any, idx: number) => {
        const addr = item.address || {};
        const road = addr.road || addr.suburb || item.display_name.split(',')[0];
        const cityState = [addr.city || addr.town || addr.state_district, addr.state]
          .filter(Boolean)
          .join(', ');

        return {
          placeId: item.place_id ? String(item.place_id) : `osm-${idx}`,
          description: item.display_name,
          mainText: road,
          secondaryText: cityState,
        };
      });
    }
  } catch {
    // Return empty on error
  }

  return [];
}

/**
 * Fetch Place Details (lat, lng, city, state) for a selected prediction
 */
export async function getPlaceDetails(prediction: PlacePrediction): Promise<PlaceDetails> {
  const parts = prediction.description.split(',').map((s) => s.trim());
  const streetAddress = prediction.mainText || parts[0] || '';
  const city = parts.length > 2 ? parts[parts.length - 3] : parts[1] || 'Abuja';
  const state = parts.length > 1 ? parts[parts.length - 2] : 'FCT';

  let lat = 9.0765;
  let lng = 7.3986;

  if (GOOGLE_MAPS_API_KEY && prediction.placeId && !prediction.placeId.startsWith('osm-')) {
    try {
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${prediction.placeId}&fields=geometry,address_components&key=${GOOGLE_MAPS_API_KEY}`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.result?.geometry?.location) {
        lat = json.result.geometry.location.lat;
        lng = json.result.geometry.location.lng;
      }
    } catch {
      // Use defaults
    }
  }

  return {
    placeId: prediction.placeId,
    formattedAddress: prediction.description,
    streetAddress,
    city,
    state,
    country: 'Nigeria',
    latitude: lat,
    longitude: lng,
  };
}

/**
 * Generate Google Static Maps API image URL
 */
export function getGoogleStaticMapUrl(
  address: string,
  latitude?: number,
  longitude?: number
): string {
  const loc = latitude && longitude ? `${latitude},${longitude}` : encodeURIComponent(address);

  if (GOOGLE_MAPS_API_KEY) {
    return `https://maps.googleapis.com/maps/api/staticmap?center=${loc}&zoom=15&size=600x300&maptype=roadmap&markers=color:0xD87C24%7Clabel:P%7C${loc}&key=${GOOGLE_MAPS_API_KEY}`;
  }

  // Fallback high-quality static map image
  const searchLoc = encodeURIComponent(address || 'Abuja, Nigeria');
  return `https://static-maps.yandex.ru/1.x/?l=map&size=600,300&z=15&text=${searchLoc}`;
}

/**
 * Open address in Google Maps app or web browser
 */
export function getGoogleMapsUrl(address: string, latitude?: number, longitude?: number): string {
  if (latitude && longitude) {
    return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}
