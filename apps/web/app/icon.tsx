import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const size = {
  width: 32,
  height: 32,
}

export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 24,
          background: 'hsl(262 83% 58%)', // Primary color
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          borderRadius: 6,
          fontWeight: 'bold',
          fontFamily: 'system-ui',
        }}
      >
        a!
      </div>
    ),
    {
      ...size,
    }
  )
}