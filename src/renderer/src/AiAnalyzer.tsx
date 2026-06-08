import React, { useActionState } from 'react';
import { Sparkles, Bot, Loader2 } from 'lucide-react';

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
    <div className="bg-slate-900 border-b border-slate-800 p-5 relative overflow-hidden">
      {/* Subtle magical glow effect in background */}
      <div className="absolute top-0 right-1/4 -mr-20 -mt-20 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none animate-pulse duration-1000"></div>
      <div className="absolute bottom-0 left-1/4 -ml-20 -mb-20 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>
      
      <div className="relative z-10 flex flex-col gap-4 max-w-5xl mx-auto">
        <form action={submitAction} className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-sky-400 font-semibold tracking-wide">
            <div className="p-2 bg-sky-500/10 rounded-lg border border-sky-500/20 shadow-[0_0_10px_rgba(56,189,248,0.15)]">
              <Bot className="w-5 h-5" />
            </div>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-emerald-400 text-lg">
              Gemini Diagnostics
            </span>
          </div>
          
          <button
            type="submit"
            disabled={isPending}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all duration-300 shadow-lg active:scale-95 ${
              isPending 
                ? 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700 shadow-none' 
                : 'bg-gradient-to-r from-sky-500 to-emerald-500 hover:from-sky-400 hover:to-emerald-400 text-slate-950 border border-transparent shadow-[0_0_20px_rgba(56,189,248,0.25)] hover:shadow-[0_0_30px_rgba(56,189,248,0.5)]'
            }`}
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-sky-400" />
                <span className="text-slate-300">Analyzing Context...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Diagnose Last 50 Lines
              </>
            )}
          </button>
        </form>
        
        {/* Render the AI response if it exists */}
        {analysis && (
          <div className="mt-2 bg-slate-950/80 backdrop-blur-md border border-slate-800/80 rounded-xl p-6 text-slate-200 leading-relaxed font-sans shadow-inner">
            <div className="whitespace-pre-wrap text-sm leading-7">
              {analysis}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}