import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

/**
 * Company Search API Route
 *
 * Searches French companies using the official "Annuaire des Entreprises" API.
 *
 * External API: https://recherche-entreprises.api.gouv.fr
 *
 * Query Parameters:
 * - q: Search query (company name, SIRET, or SIREN) - minimum 2 characters
 *
 * Response Format:
 * {
 *   results: [
 *     {
 *       siren: string;           // 9-digit SIREN number
 *       siret: string | null;    // 14-digit SIRET number of main establishment (siege)
 *       name: string;            // Company name
 *       address: string;         // Full address of main establishment
 *       postcode: string | null; // Postal code
 *       city: string | null;     // City name
 *       naf: string | null;      // NAF/APE activity code
 *     }
 *   ]
 * }
 */

// External API response types
interface ExternalApiSiege {
  siret?: string;
  geo_adresse?: string;
  adresse?: string;
  code_postal?: string;
  libelle_commune?: string;
  activite_principale?: string;
}

interface ExternalApiCompany {
  siren: string;
  nom_complet?: string;
  nom_raison_sociale?: string;
  siege?: ExternalApiSiege;
  activite_principale?: string;
}

interface ExternalApiResponse {
  results: ExternalApiCompany[];
  total_results?: number;
}

// Our simplified response types
interface SimplifiedCompany {
  siren: string;
  siret: string | null;
  name: string;
  address: string;
  postcode: string | null;
  city: string | null;
  naf: string | null;
}

interface CompanySearchResponse {
  results: SimplifiedCompany[];
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');

  // Validate query parameter
  if (!query || query.trim().length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    // Call the French government company search API
    // https://recherche-entreprises.api.gouv.fr/docs/
    const apiUrl = `https://recherche-entreprises.api.gouv.fr/search?q=${encodeURIComponent(query)}&per_page=5`;

    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'CMR-Digital-App',
      },
    });

    if (!response.ok) {
      console.error('Company search API error:', response.status, response.statusText);
      return NextResponse.json({ results: [] }, { status: 500 });
    }

    const data: ExternalApiResponse = await response.json();

    // Map external API response to our simplified structure
    const simplifiedResults: SimplifiedCompany[] = (data.results || []).map((company) => {
      // Company name: prefer nom_complet, fallback to nom_raison_sociale
      const name = company.nom_complet || company.nom_raison_sociale || 'N/A';

      // Siege (main establishment) data
      const siege = company.siege || {};

      // Address: prefer geo_adresse (geocoded), fallback to adresse
      const address = siege.geo_adresse || siege.adresse || 'N/A';

      // SIRET of main establishment
      const siret = siege.siret || null;

      // Postal code and city
      const postcode = siege.code_postal || null;
      const city = siege.libelle_commune || null;

      // NAF/APE code: prefer from siege, fallback to company-level
      const naf = siege.activite_principale || company.activite_principale || null;

      return {
        siren: company.siren,
        siret,
        name,
        address,
        postcode,
        city,
        naf,
      };
    });

    const result: CompanySearchResponse = {
      results: simplifiedResults,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching company data:', error);
    return NextResponse.json({ results: [] }, { status: 500 });
  }
}
