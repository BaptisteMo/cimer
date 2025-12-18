import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

interface AddressFeature {
  properties: {
    label: string;
    postcode?: string;
    city?: string;
    context?: string;
  };
  geometry: {
    coordinates: [number, number]; // [lon, lat]
  };
}

interface AddressApiResponse {
  features: AddressFeature[];
}

interface SimplifiedFeature {
  label: string;
  postcode: string | null;
  city: string | null;
  context: string | null;
  lat: number;
  lon: number;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');

  // Validate query parameter
  if (!query || query.trim().length < 3) {
    return NextResponse.json({ features: [] });
  }

  try {
    // Call the French government address API
    const apiUrl = `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&limit=5`;
    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'CMR-Digital-App',
      },
    });

    if (!response.ok) {
      console.error('Address API error:', response.status, response.statusText);
      return NextResponse.json({ features: [] }, { status: 500 });
    }

    const data: AddressApiResponse = await response.json();

    // Simplify the response
    const simplifiedFeatures: SimplifiedFeature[] = data.features.map((feature) => ({
      label: feature.properties.label,
      postcode: feature.properties.postcode || null,
      city: feature.properties.city || null,
      context: feature.properties.context || null,
      lon: feature.geometry.coordinates[0],
      lat: feature.geometry.coordinates[1],
    }));

    return NextResponse.json({ features: simplifiedFeatures });
  } catch (error) {
    console.error('Error fetching address suggestions:', error);
    return NextResponse.json({ features: [] }, { status: 500 });
  }
}
