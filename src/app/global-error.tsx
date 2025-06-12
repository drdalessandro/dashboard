'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global error:', error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          padding: '20px',
          textAlign: 'center',
        }}>
          <h1 style={{ color: '#e53e3e', marginBottom: '20px' }}>Something went wrong!</h1>
          <p style={{ marginBottom: '20px' }}>
            We're sorry, but there was an error loading the healthcare platform.
          </p>
          <button
            onClick={() => reset()}
            style={{
              backgroundColor: '#4299e1',
              color: 'white',
              padding: '10px 20px',
              borderRadius: '5px',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
