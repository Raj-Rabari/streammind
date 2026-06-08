import React, { useActionState } from 'react';

interface AiAnalyzerProps {
  containerName: string;
}

export default function AiAnalyzer({ containerName }: AiAnalyzerProps) {
  // React 19's useActionState takes an async function and an initial state.
  // It returns: [currentData, formSubmitAction, isPendingFlag]
  const [analysis, submitAction, isPending] = useActionState(
    async (_prevState: string | null, _formData: FormData) => {
      try {
        // Trigger the backend to snapshot the ring buffer and call Gemini
        const result = await window.electronAPI.analyzeLogs(containerName);
        return result;
      } catch (error: any) {
        return `❌ Diagnostics Failed: ${error.message}`;
      }
    },
    null
  );

  return (
    <div style={{ 
      padding: '1rem', 
      background: '#0f172a', // Deep slate blue to differentiate the AI zone
      borderBottom: '1px solid #1e293b' 
    }}>
      <form action={submitAction} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <span style={{ color: '#38bdf8', fontWeight: 'bold', letterSpacing: '0.5px' }}>
          ✨ Gemini Diagnostics
        </span>
        
        <button
          type="submit"
          disabled={isPending}
          style={{
            background: isPending ? '#334155' : '#38bdf8',
            color: isPending ? '#94a3b8' : '#0f172a',
            border: 'none',
            padding: '0.4rem 1rem',
            borderRadius: '4px',
            cursor: isPending ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
            transition: 'background 0.2s'
          }}
        >
          {isPending ? 'Analyzing Context Window...' : 'Diagnose Last 50 Lines'}
        </button>
      </form>
      
      {/* Render the AI response if it exists */}
      {analysis && (
        <div style={{ 
          marginTop: '1rem', 
          padding: '1rem', 
          background: '#020617', 
          borderRadius: '6px', 
          color: '#e2e8f0', 
          lineHeight: '1.6',
          fontFamily: 'system-ui, sans-serif'
        }}>
          <div style={{ whiteSpace: 'pre-wrap' }}>
            {analysis}
          </div>
        </div>
      )}
    </div>
  );
}