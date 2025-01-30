import { NextResponse } from 'next/server';

/**
 * Handles both GET (query params) and POST (JSON body) requests for location info.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const locations = searchParams.getAll('locations'); // Array of "lat,lng" strings

  if (locations.length === 0) {
    return NextResponse.json(
      { error: 'Please provide at least one location in the format latitude,longitude.' },
      { status: 400 }
    );
  }

  return await processLocations(locations);
}

export async function POST(request: Request) {
  try {
    const { locations } = await request.json();

    if (!Array.isArray(locations) || locations.length === 0) {
      return NextResponse.json(
        { error: 'Invalid JSON format. Expected {"locations": [{"lat": xx, "lng": yy}, ...]}' },
        { status: 400 }
      );
    }

    // Convert to "lat,lng" format for processing
    const locationStrings = locations.map(({ lat, lng }) => `${lat},${lng}`);

    return await processLocations(locationStrings);
  } catch (error) {
    return NextResponse.json({ error: 'Invalid JSON format' }, { status: 400 });
  }
}

/**
 * Processes location queries, calls Nominatim and Open-Elevation APIs.
 */
async function processLocations(locations: string[]): Promise<Response> {
  try {
    // 1. Fetch Address Data from Nominatim
    const locationData = await Promise.all(
      locations.map(async (loc) => {
        const [lat, lng] = loc.split(',');
        if (!lat || !lng) return null;

        const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&addressdetails=1`;
        const nominatimResponse = await fetch(nominatimUrl, {
          headers: { 'User-Agent': 'pinpoint/1.0' },
        });

        if (!nominatimResponse.ok) {
          throw new Error(`Nominatim API error: ${nominatimResponse.status}`);
        }

        const nominatimData = await nominatimResponse.json();
        const address = nominatimData.address || {};
        const city =
          address.city ||
          address.town ||
          address.village ||
          address.suburb ||
          address.county ||
          'Unknown Location';

        return {
          lat: parseFloat(lat),
          lng: parseFloat(lng),
          city,
          display_name: nominatimData.display_name || '',
        };
      })
    );

    const validLocations = locationData.filter((loc) => loc !== null);
    if (validLocations.length === 0) {
      return NextResponse.json({ error: 'Invalid locations provided.' }, { status: 400 });
    }

    // 2. Fetch Elevation Data (Batch Request)
    const elevationResults = await fetchElevationData(validLocations);

    // 3. Merge Data and Return Response
    const responseData = validLocations.map((loc, index) => ({
      ...loc,
      elevation: elevationResults[index]?.elevation || 0, // Default to sea level if no data
    }));

    return NextResponse.json(responseData);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Internal server error. Please try again later.' },
      { status: 500 }
    );
  }
}

/**
 * Fetches elevation data using Open-Elevation API (chooses GET or POST automatically).
 */
async function fetchElevationData(locations: { lat: number; lng: number }[]): Promise<{ latitude: number; longitude: number; elevation: number }[]> {
  const getQuery = locations.map(({ lat, lng }) => `${lat},${lng}`).join('|');
  const getUrl = `https://api.open-elevation.com/api/v1/lookup?locations=${getQuery}`;

  if (getUrl.length <= 1024) {
    // Use GET if within 1024-byte limit
    const response = await fetch(getUrl);
    if (!response.ok) throw new Error(`Open-Elevation API error: ${response.status}`);
    return (await response.json()).results;
  } else {
    // Use POST if GET request is too long
    const postUrl = `https://api.open-elevation.com/api/v1/lookup`;
    const postData = { locations: locations.map(({ lat, lng }) => ({ latitude: lat, longitude: lng })) };
    const response = await fetch(postUrl, {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(postData),
    });
    if (!response.ok) throw new Error(`Open-Elevation API error: ${response.status}`);
    return (await response.json()).results;
  }
}
