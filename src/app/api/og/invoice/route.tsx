import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code') || 'SR-2026';
    const customer = searchParams.get('customer') || 'Pelanggan';
    const total = Number(searchParams.get('total')) || 0;
    const service = searchParams.get('service') || 'Home Massage & Spa';
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

    const formatRp = (num: number) =>
      'Rp ' + (num || 0).toLocaleString('id-ID');

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#FDFBF7',
            padding: '48px 56px',
            fontFamily: 'sans-serif',
            justifyContent: 'space-between',
            position: 'relative',
            border: '16px solid #8B5E3C',
          }}
        >
          {/* Top Accent Strip */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '12px',
              backgroundColor: '#8B5E3C',
            }}
          />

          {/* Header Row */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              width: '100%',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div
                style={{
                  fontSize: 34,
                  fontWeight: 900,
                  color: '#8B5E3C',
                  letterSpacing: '0.05em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                🌿 SerenaRaga
              </div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: '0.3em',
                  color: '#8B5E3C',
                  opacity: 0.85,
                  marginTop: 4,
                  textTransform: 'uppercase',
                }}
              >
                Comfortable Home Massage
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
              }}
            >
              <div
                style={{
                  backgroundColor: '#8B5E3C',
                  color: '#ffffff',
                  fontSize: 16,
                  fontWeight: 900,
                  fontStyle: 'italic',
                  padding: '6px 16px',
                  borderRadius: 8,
                  letterSpacing: '0.1em',
                  marginBottom: 6,
                }}
              >
                INVOICE
              </div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 800,
                  fontFamily: 'monospace',
                  color: '#52525b',
                }}
              >
                #{code}
              </div>
            </div>
          </div>

          {/* Center Card Content */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: '#ffffff',
              borderRadius: 20,
              padding: '28px 36px',
              border: '2px solid #e4e4e7',
              boxShadow: '0 8px 24px rgba(139,94,60,0.08)',
              marginTop: 16,
              marginBottom: 16,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  borderLeft: '4px solid #8B5E3C',
                  paddingLeft: 16,
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 900,
                    textTransform: 'uppercase',
                    letterSpacing: '0.2em',
                    color: '#8B5E3C',
                    opacity: 0.8,
                    marginBottom: 4,
                  }}
                >
                  Ditujukan Untuk:
                </div>
                <div
                  style={{
                    fontSize: 28,
                    fontWeight: 900,
                    color: '#27272a',
                  }}
                >
                  {customer}
                </div>
              </div>

              {/* Status Badge */}
              <div
                style={{
                  backgroundColor: '#ecfdf5',
                  border: '2px solid #a7f3d0',
                  color: '#059669',
                  fontSize: 14,
                  fontWeight: 900,
                  padding: '6px 16px',
                  borderRadius: 100,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                ✓ LUNAS / PAID
              </div>
            </div>

            {/* Service details */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: 16,
                borderTop: '2px dashed #e4e4e7',
              }}
            >
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: '#3f3f46',
                }}
              >
                💆 {service}
              </div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#71717a',
                }}
              >
                📅 {date}
              </div>
            </div>
          </div>

          {/* Bottom Total Ribbon & Social */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#8B5E3C',
              borderRadius: 16,
              padding: '20px 32px',
              color: '#ffffff',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 2,
                  height: 32,
                  backgroundColor: 'rgba(255,255,255,0.4)',
                }}
              />
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  letterSpacing: '0.2em',
                  color: 'rgba(255,255,255,0.9)',
                }}
              >
                Total Tagihan:
              </div>
            </div>

            <div
              style={{
                fontSize: 32,
                fontWeight: 900,
                fontStyle: 'italic',
                letterSpacing: '0.02em',
              }}
            >
              {formatRp(total)}
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e: any) {
    console.error('OG generation error:', e);
    return new Response('Failed to generate image', { status: 500 });
  }
}
