# @selfxyz/core

SDK for verifying passport proofs from Self.

## Installation

You can install with this command:

```bash
npm install @selfxyz/core
# or
yarn add @selfxyz/core
```

## Initialization

Initialize the verifier with your RPC URL and application scope:

```typescript
import { SelfBackendVerifier } from "@selfxyz/core";

const selfBackendVerifier = new SelfBackendVerifier(
  process.env.CELO_RPC_URL as string,  // e.g., 'https://forno.celo.org'
  process.env.SCOPE as string,         // Your application's unique scope identifier
);
```

## Configuration

You can configure which verification rules to apply:

```typescript
// Set minimum age verification (must be between 10-100)
selfBackendVerifier.setMinimumAge(20);

// Set nationality verification
selfBackendVerifier.setNationality('France');

// Set excluded countries verification (max 40 countries)
selfBackendVerifier.excludeCountries('Iran', 'North Korea', 'Russia', 'Syria');

// Enable passport number OFAC check (default: false)
selfBackendVerifier.enablePassportNoOfacCheck();

// Enable name and date of birth OFAC check (default: false)
selfBackendVerifier.enableNameAndDobOfacCheck();

// Enable name and year of birth OFAC check (default: false)
selfBackendVerifier.enableNameAndYobOfacCheck();
```

## Verification

Verify a proof with the received proof and public signals:

```typescript
const result = await selfBackendVerifier.verify(proof, publicSignals);
```

## Extracting User Identifier

You can extract the user identifier from the public signals:

```typescript
import { getUserIdentifier } from "@selfxyz/core";

const userId = await getUserIdentifier(publicSignals);
```

## Verification Result

The `verify` method returns a detailed verification result:

```typescript
export interface SelfVerificationResult {
  // Overall verification status
  isValid: boolean;
  
  // Detailed validation statuses
  isValidDetails: {
    isValidScope: boolean;        // Proof was generated for the expected scope
    isValidAttestationId: boolean; // Attestation ID matches expected value
    isValidProof: boolean;        // Cryptographic validity of the proof
    isValidNationality: boolean;  // Nationality check (when enabled)
  };
  
  // User identifier from the proof
  userId: string;
  
  // Application scope
  application: string;
  
  // Cryptographic nullifier to prevent reuse
  nullifier: string;
  
  // Revealed data from the passport
  credentialSubject: {
    merkle_root?: string;         // Merkle root used for proof generation
    attestation_id?: string;      // Identity type (1 for passport)
    current_date?: string;        // Proof generation timestamp
    issuing_state?: string;       // Passport issuing country
    name?: string;                // User's name
    passport_number?: string;     // Passport number
    nationality?: string;         // User's nationality
    date_of_birth?: string;       // Date of birth
    gender?: string;              // Gender
    expiry_date?: string;         // Passport expiry date
    older_than?: string;          // Age verification result
    passport_no_ofac?: boolean;   // Passport OFAC check result
    name_and_dob_ofac?: boolean;  // Name and DOB OFAC check result
    name_and_yob_ofac?: boolean;  // Name and birth year OFAC check result
  };
  
  // Original proof data
  proof: {
    value: {
      proof: any;
      publicSignals: any;
    };
  };
  
  // Error information if verification failed
  error?: any;
}
```

## API Implementation Example

Here's an example of implementing an API endpoint that uses the SDK:

```typescript
import { NextApiRequest, NextApiResponse } from 'next';
import { getUserIdentifier, SelfBackendVerifier, countryCodes } from '@selfxyz/core';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { proof, publicSignals } = req.body;

      if (!proof || !publicSignals) {
        return res.status(400).json({ message: 'Proof and publicSignals are required' });
      }

      // Extract user ID from the proof
      const userId = await getUserIdentifier(publicSignals);
      console.log("Extracted userId:", userId);

      // Initialize and configure the verifier
      const selfBackendVerifier = new SelfBackendVerifier(
        'https://forno.celo.org',
        'my-application-scope'
      );
      
      // Configure verification options
      selfBackendVerifier.setMinimumAge(18);
      selfBackendVerifier.excludeCountries(
        countryCodes.IRN,   // Iran
        countryCodes.PRK    // North Korea
      );
      selfBackendVerifier.enableNameAndDobOfacCheck();

      // Verify the proof
      const result = await selfBackendVerifier.verify(proof, publicSignals);
      
      if (result.isValid) {
        // Return successful verification response
        return res.status(200).json({
          status: 'success',
          result: true,
          credentialSubject: result.credentialSubject
        });
      } else {
        // Return failed verification response
        return res.status(400).json({
          status: 'error',
          result: false,
          message: 'Verification failed',
          details: result.isValidDetails
        });
      }
    } catch (error) {
      console.error('Error verifying proof:', error);
      return res.status(500).json({
        status: 'error',
        result: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  } else {
    return res.status(405).json({ message: 'Method not allowed' });
  }
}
```

## Working with Country Codes

The SDK provides a `countryCodes` object for referencing ISO country codes:

```typescript
import { countryCodes } from '@selfxyz/core';

// Examples of usage
const iranCode = countryCodes.IRN;  // "Iran"
const northKoreaCode = countryCodes.PRK;  // "North Korea"

// Use in excludeCountries
selfBackendVerifier.excludeCountries(
  countryCodes.IRN,
  countryCodes.PRK,
  countryCodes.SYR
);
```

## Integration with SelfQRcode

This backend SDK is designed to work with the `@selfxyz/qrcode` package. When configuring your QR code, set the verification endpoint to point to your API that uses this SDK:

```typescript
import { SelfAppBuilder } from '@selfxyz/qrcode';

const selfApp = new SelfAppBuilder({
  appName: 'My Application',
  scope: 'my-application-scope',
  endpoint: 'https://my-api.com/api/verify', // Your API using SelfBackendVerifier
  logoBase64: myLogoBase64,
  userId,
  disclosures: {
    name: true,
    nationality: true,
    date_of_birth: true,
    passport_number: true,
    minimumAge: 20,
    excludedCountries: ["IRN", "PRK"],
    ofac: true,
  },
}).build();
```

## Advanced API Implementation

For a more advanced implementation example, see the [Self Playground verify.ts API](https://github.com/selfxyz/playground/blob/main/pages/api/verify.ts). This implementation demonstrates:

1. **Dynamic configuration retrieval** - The API retrieves user-specific verification options from a Vercel KV store, allowing for personalized verification rules:

```typescript
// Try to retrieve options from store using userId
if (userId) {
  const savedOptions = await kv.get(userId) as SelfApp["disclosures"];
  if (savedOptions) {
    // Apply saved options for minimum age, excluded countries, and OFAC checks
    minimumAge = savedOptions.minimumAge || minimumAge;
    // ... additional option processing
  }
}
```

2. **Selective disclosure handling** - The API respects user-selected disclosure settings and masks undisclosed fields:

```typescript
if (result.isValid) {
  const filteredSubject = { ...result.credentialSubject };
  
  if (!enabledDisclosures.issuing_state && filteredSubject) {
    filteredSubject.issuing_state = "Not disclosed";
  }
  // ... additional field masking based on disclosure settings
  
  res.status(200).json({
    status: 'success',
    result: result.isValid,
    credentialSubject: filteredSubject,
    // ... include verification options in response
  });
}
```

3. **Country code conversion** - The API handles conversion between country codes and names in both directions:

```typescript
excludedCountryList = savedOptions.excludedCountries.map(
  (code: string) => countryCodes[code as keyof typeof countryCodes] || code
);

// And converting back for response
excludedCountries: excludedCountryList.map(countryName => {
  const entry = Object.entries(countryCodes).find(([_, name]) => name === countryName);
  return entry ? entry[0] : countryName;
})
```

This implementation provides a complete reference for building a production-ready verification API with dynamic configuration options and proper response handling.
