import { ImageResponse } from 'next/og'

export const dynamic = 'force-static'

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          position: 'relative',
          display: 'flex',
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          background: '#0f0f10',
          color: '#f8f8f5',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            width: '72%',
            padding: '64px 0 56px 64px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 56,
                height: 56,
                background: '#f8f8f5',
                color: '#0f0f10',
                fontSize: 22,
              }}
            >
              OP
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', marginLeft: 18 }}>
              <div style={{ fontSize: 22, letterSpacing: 2 }}>OPEN-AK</div>
              <div style={{ fontSize: 16, color: '#9c9c9c' }}>/ notes</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 16, color: '#ffd800', letterSpacing: 4 }}>
              A BILINGUAL NOTES TEMPLATE
            </div>
            <div style={{ marginTop: 18, fontSize: 116, lineHeight: 1, letterSpacing: -4 }}>
              NOTES
            </div>
            <div style={{ display: 'flex', width: 240, height: 12, marginTop: 28, background: '#ffd800' }} />
          </div>
          <div style={{ display: 'flex', maxWidth: 600, fontSize: 20, lineHeight: 1.4, color: '#9c9c9c' }}>
            Notes on code, tools, and the practice of making things simpler.
          </div>
        </div>
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            width: '28%',
            background: '#ffd800',
          }}
        />
      </div>
    ),
    { width: 1200, height: 630 },
  )
}
