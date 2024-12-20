// getLocationInfo.ts

export interface LocationInfo {
  city: string;
  elevation: number;
  latitude: string;
  longitude: string;
  display_name: string;
}

export async function getLocationInfo(lat: string, lng: string): Promise<LocationInfo> {
  try {
    // Construct the API URL with query parameters
    const apiUrl = `/api/map/info?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}`;

    // Make the GET request to the API
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Check if the response is successful
    if (!response.ok) {
      // Attempt to parse the error message from the response
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch location information.');
    }

    // Parse the JSON response
    const data: LocationInfo = await response.json();

    return data;
  } catch (error: any) {
    // Log the error for debugging purposes
    console.error('Error in getLocationInfo:', error);

    // Re-throw the error to be handled by the caller
    throw new Error(error.message || 'An unexpected error occurred.');
  }
}
