// =============================================================================
// MINDI Phase 1 — Home Page
// Graph canvas + chat panel + upload panel.
// =============================================================================
'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useAuth } from './auth/useAuth';
import { useBrainGraph } from '../hooks/useBrainGraph';
import { useOffline } from '../hooks/useOffline';
import FileUploader from './ingest/FileUploader';
import ChatPanel from './chat/ChatPanel';
import SignIn from './auth/SignIn';
import type { BrainNode } from '../../../../shared/types/node';

const GraphCanvas = dynamic(() => import('./graph/GraphCanvas'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-indigo-400/40 border-t-indigo-400 rounded-full animate-spin" aria-label="Loading graph" />
    </div>
  ),
});

type Panel = 'graph' | 'chat' | 'upload';

const PANELS: Array<{ id: Panel; icon: string; label: string }> = [
  { id: 'graph',  icon: '🧠', label: 'Brain' },
  { id: 'chat',   icon: '💬', label: 'Chat'  },
  { id: 'upload', icon: '📄', label: 'Add'   },
];

export default function HomePage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { nodes, loading: graphLoading, connectNodes } = useBrainGraph(user?.uid ?? null);
  const { isOnline } = useOffline();

  const [activePanel, setActivePanel] = useState<Panel>('graph');
  const [selectedNode, setSelectedNode] = useState<BrainNode | null>(null);

  if (authLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-indigo-400/40 border-t-indigo-400 rounded-full animate-spin" aria-label="Loading Mindi" />
    </div>
  );

  if (!user) return <SignIn />;

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Skip link */}
      <a href="#main-content" className="skip-link">Skip to main content</a>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-5 py-3.5 border-b border-white/5 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-xl font-bold tracking-tight text-white">Mindi</h1>
          {nodes.length > 0 && <span className="text-xs text-white/25 hidden sm:block">{nodes.length} nodes</span>}
          {!isOnline && (
            <span className="text-[10px] bg-amber-500/15 text-amber-400 px-2 py-0.5 rounded-full" role="status">Offline</span>
          )}
        </div>
        <button onClick={signOut}
          className="text-xs text-white/30 hover:text-white/60 transition-colors px-2 py-1 min-h-[44px] rounded"
          aria-label="Sign out">
          Sign out
        </button>
      </header>

      {/* Main */}
      <main id="main-content" className="flex-1 overflow-hidden relative z-10" tabIndex={-1}>
        {PANELS.map(({ id }) => (
          <div key={id}
            className={`absolute inset-0 transition-opacity duration-200 ${activePanel === id ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
            role={activePanel === id ? 'region' : undefined}
            aria-label={activePanel === id ? id : undefined}
          >
            {id === 'graph' && (
              graphLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="w-8 h-8 border-2 border-indigo-400/40 border-t-indigo-400 rounded-full animate-spin" />
                </div>
              ) : nodes.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-4">
                  <span className="text-6xl" aria-hidden="true">🧠</span>
                  <div className="text-center space-y-1">
                    <p className="text-white/60 font-medium">Your brain is empty</p>
                    <p className="text-white/30 text-sm">Upload a file to get started</p>
                  </div>
                  <button onClick={() => setActivePanel('upload')}
                    className="px-4 py-2.5 bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 rounded-xl text-sm hover:bg-indigo-500/30 transition-all min-h-[44px]">
                    Upload your first file →
                  </button>
                </div>
              ) : (
                <GraphCanvas nodes={nodes} onConnect={connectNodes} onNodeDrill={setSelectedNode} />
              )
            )}

            {id === 'chat' && (
              <div className="h-full max-w-2xl mx-auto"><ChatPanel /></div>
            )}

            {id === 'upload' && (
              <div className="h-full max-w-lg mx-auto px-5 py-8 overflow-y-auto">
                <div className="space-y-4">
                  <div>
                    <h2 className="font-display text-lg font-semibold text-white">Add to your brain</h2>
                    <p className="text-white/40 text-sm mt-1">Upload notes, code, emails, or docs.</p>
                  </div>
                  <FileUploader uid={user.uid} />
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Node detail sidebar */}
        {selectedNode && (
          <div className="absolute right-0 top-0 h-full w-72 backdrop-blur-sm bg-black/40 border-l border-white/8 z-20 p-5 overflow-y-auto"
            role="complementary" aria-label={`Details: ${selectedNode.title}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-sm font-semibold text-white truncate pr-2">{selectedNode.title}</h3>
              <button onClick={() => setSelectedNode(null)} aria-label="Close node details"
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all min-w-[44px] min-h-[44px]">✕</button>
            </div>
            <dl className="space-y-2.5 text-xs text-white/60">
              {[['Region', selectedNode.region], ['Version', `v${selectedNode.version}`], ['Confidence', `${Math.round(selectedNode.confidence * 100)}%`]].map(([k, v]) => (
                <div key={k} className="flex justify-between"><dt className="text-white/30">{k}</dt><dd className="text-white/80 capitalize">{v}</dd></div>
              ))}
              {selectedNode.isEncrypted && <dd className="text-amber-400">🔒 Encrypted</dd>}
              {selectedNode.contradictionFlag && <dd className="text-amber-400">⚠ Contradiction flagged</dd>}
              {selectedNode.styleMetrics && (
                <div className="pt-2 border-t border-white/5 space-y-1.5">
                  <p className="text-[10px] text-white/30 uppercase tracking-wide">Style Metrics</p>
                  <div className="flex justify-between"><dt className="text-white/30">Avg sentence</dt><dd className="text-white/70">{selectedNode.styleMetrics.avgSentenceLength}w</dd></div>
                  <div className="flex justify-between"><dt className="text-white/30">Formality</dt><dd className="text-white/70">{Math.round(selectedNode.styleMetrics.formalityScore * 100)}%</dd></div>
                  <div className="flex justify-between"><dt className="text-white/30">Structure</dt><dd className="text-white/70 capitalize">{selectedNode.styleMetrics.dominantStructure}</dd></div>
                </div>
              )}
            </dl>
          </div>
        )}
      </main>

      {/* Bottom nav */}
      <nav className="relative z-10 flex items-center justify-around px-2 py-2 border-t border-white/5 backdrop-blur-sm" aria-label="Main navigation">
        {PANELS.map(({ id, icon, label }) => (
          <button key={id} onClick={() => setActivePanel(id)}
            aria-current={activePanel === id ? 'page' : undefined}
            className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-all duration-150 min-w-[44px] min-h-[44px]
              ${activePanel === id ? 'text-white' : 'text-white/30 hover:text-white/60'}`}>
            <span className="text-lg leading-none" aria-hidden="true">{icon}</span>
            <span className="text-[10px] font-medium">{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
