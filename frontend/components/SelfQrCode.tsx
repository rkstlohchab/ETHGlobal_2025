import { useEffect, useState } from 'react'
import { countries, SelfQRcodeWrapper } from '@selfxyz/qrcode'
import { SelfAppBuilder } from '@selfxyz/qrcode'

export default function Verify() {
  const [selfApp, setSelfApp] = useState<any | null>(null)

  useEffect(() => {
    const userId = '0xYourUserEthAddress' // or a UUID depending on your setup
    
    const app = new SelfAppBuilder({
      version: 2,
      appName: process.env.NEXT_PUBLIC_SELF_APP_NAME || 'Self Docs',
      scope: process.env.NEXT_PUBLIC_SELF_SCOPE || 'self-docs',
      endpoint: `${process.env.NEXT_PUBLIC_SELF_ENDPOINT}`,
      logoBase64: 'https://i.postimg.cc/mrmVf9hm/self.png',
      userId,
      endpointType: 'staging_celo',
      userIdType: 'hex', // 'hex' for EVM address or 'uuid' for uuidv4
      userDefinedData: 'Hello from the Docs!!',
      disclosures: {
        // What you want to verify from the user's identity
        minimumAge: 18,
        excludedCountries: [countries.CUBA, countries.IRAN, countries.NORTH_KOREA, countries.RUSSIA],

        // What you want users to
        nationality: true,
        gender: true,
      },
    }).build()

    setSelfApp(app)
  }, [])

  const handleSuccessfulVerification = () => {
    // Persist the attestation / session result to your backend, then gate content
    console.log('Verified!')
  }

  return (
    <div>
      {selfApp ? (
        <SelfQRcodeWrapper
          selfApp={selfApp}
          onSuccess={handleSuccessfulVerification}
          onError={() => {
            console.error('Error: Failed to verify identity')
          }}
        />
      ) : (
        <div>
          <p>Loading QR Code...</p>
        </div>
      )}
    </div>
  )
}