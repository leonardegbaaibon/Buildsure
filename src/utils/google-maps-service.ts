/**
 * Google Maps API Service
 * Handles Google Places Autocomplete, Geocoding, Static Map URLs, and Google Maps Links.
 */

export const GOOGLE_MAPS_API_KEY =
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyBuziBVHkyvx9sUh27c0II2ZJ9eYPnYoNg';

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

  if (!GOOGLE_MAPS_API_KEY) {
    console.warn('[GoogleMapsService] EXPO_PUBLIC_GOOGLE_MAPS_API_KEY is not set.');
    return [];
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
      query
    )}&components=country:ng&location=9.0765,7.3986&radius=500000&key=${GOOGLE_MAPS_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && Array.isArray(data.predictions)) {
      return data.predictions.map((p: any) => ({
        placeId: p.place_id,
        description: p.description,
        mainText: p.structured_formatting?.main_text || p.description,
        secondaryText: p.structured_formatting?.secondary_text || '',
      }));
    } else if (data.status !== 'ZERO_RESULTS') {
      console.warn(`[GoogleMapsService] Places Autocomplete error status: ${data.status}`, data.error_message);
    }
  } catch (error) {
    console.error('[GoogleMapsService] Failed to fetch Google Places predictions:', error);
  }

  return [];
}

/**
 * Fetch Place Details (lat, lng, city, state) for a selected prediction from Google Places API
 */
export async function getPlaceDetails(prediction: PlacePrediction): Promise<PlaceDetails> {
  const parts = prediction.description.split(',').map((s) => s.trim());
  let streetAddress = prediction.mainText || parts[0] || '';
  let city = parts.length > 2 ? parts[parts.length - 3] : parts[1] || 'Abuja';
  let state = parts.length > 1 ? parts[parts.length - 2] : 'FCT';
  let country = 'Nigeria';
  let lat = 9.0765;
  let lng = 7.3986;

  if (GOOGLE_MAPS_API_KEY && prediction.placeId) {
    try {
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(
        prediction.placeId
      )}&fields=geometry,address_components,formatted_address&key=${GOOGLE_MAPS_API_KEY}`;
      const res = await fetch(url);
      const json = await res.json();

      if (json.status === 'OK' && json.result) {
        const result = json.result;

        if (result.geometry?.location) {
          lat = result.geometry.location.lat;
          lng = result.geometry.location.lng;
        }

        if (Array.isArray(result.address_components)) {
          let streetNumber = '';
          let route = '';
          let pointName = '';

          for (const comp of result.address_components) {
            const types: string[] = comp.types || [];
            if (types.includes('street_number')) {
              streetNumber = comp.long_name;
            } else if (types.includes('route')) {
              route = comp.long_name;
            } else if (types.includes('point_of_interest') || types.includes('establishment') || types.includes('premise')) {
              pointName = comp.long_name;
            } else if (types.includes('locality') || types.includes('administrative_area_level_2') || types.includes('sublocality')) {
              if (!city || city === 'Abuja') {
                city = comp.long_name;
              }
            } else if (types.includes('administrative_area_level_1')) {
              state = comp.long_name;
            } else if (types.includes('country')) {
              country = comp.long_name;
            }
          }

          if (route) {
            streetAddress = streetNumber ? `${streetNumber} ${route}` : route;
          } else if (pointName) {
            streetAddress = pointName;
          }
        }
      }
    } catch (error) {
      console.error('[GoogleMapsService] Failed to fetch Google Place details:', error);
    }
  }

  return {
    placeId: prediction.placeId,
    formattedAddress: prediction.description,
    streetAddress,
    city,
    state,
    country,
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

  return '';
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
