// app/api/locationInfo/route.js

import { NextResponse } from 'next/server';

/**
 * Handles GET requests to retrieve location information based on longitude and latitude.
 * 
 * @param {Request} request - The incoming request object.
 * @returns {Response} - JSON response containing city name and elevation.
 */
export async function GET(request: Request) {
  // Parse the URL to extract query parameters
  const { searchParams } = new URL(request.url);
  const lng = searchParams.get('lng');
  const lat = searchParams.get('lat');

  // Validate that both lng and lat are provided
  if (!lng || !lat) {
    return NextResponse.json(
      { error: 'Please provide both longitude (lng) and latitude (lat) parameters.' },
      { status: 400 }
    );
  }

  try {
    // 1. Call Nominatim API for reverse geocoding to get address information
    const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;
    const nominatimResponse = await fetch(nominatimUrl, {
      headers: {
        'User-Agent': 'pinpoint/1.0',
      },
    });

    // Check if the Nominatim API request was successful
    if (!nominatimResponse.ok) {
      throw new Error('Failed to retrieve data from Nominatim API.');
    }

    const nominatimData = await nominatimResponse.json();

    // Extract the city name from the address data
    const address = nominatimData.address;
    const city = address.city || address.town || address.village || 'Unknown City';
    console.log("Address: " + address);

    // 2. Call Open-Elevation API to get elevation data
    const elevationUrl = `https://api.open-elevation.com/api/v1/lookup?locations=${lat},${lng}`;
    const elevationResponse = await fetch(elevationUrl);

    // Check if the Open-Elevation API request was successful
    if (!elevationResponse.ok) {
      throw new Error('Failed to retrieve data from Open-Elevation API.');
    }

    const elevationData = await elevationResponse.json();
    const elevation = elevationData.results[0].elevation; // Elevation in meters
    console.log("Elevation: " + address);

    // 3. Return the collected information as a JSON response
    return NextResponse.json({
      city,
      elevation, // Elevation in meters
      latitude: lat,
      longitude: lng,
      display_name: nominatimData.display_name,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Internal server error. Please try again later.' },
      { status: 500 }
    );
  }
}
