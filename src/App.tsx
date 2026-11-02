import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './lib/auth/AuthContext';
import { Atmosphere, AtmosphereVariant } from './components/atmosphere/Atmosphere';
import { FloatingNav } from './components/shell/FloatingNav';
import { Footer } from './components/shell/Footer';
import { CommandPalette, SkipLink } from './components/shell/CommandPalette';
import { RequireSession } from './components/auth/RequireSession';
import { Toaster } from 'sonner';

// Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { UploadPage } from './pages/UploadPage';
import { AnalysisPage } from './pages/AnalysisPage';
import { SamplePage } from './pages/SamplePage';
import { MethodologyPage } from './pages/MethodologyPage';
import { HistoryPage } from './pages/HistoryPage';
import { NotFoundPage } from './pages/NotFoundPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AppLayout() {
  const location = useLocation();
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // Determine Atmosphere variant by path
  let variant: AtmosphereVariant = 'app';
  if (location.pathname === '/') {
    variant = 'hero';
  } else if (location.pathname === '/login') {
    variant = 'auth';
  } else if (location.pathname.startsWith('/analysis') || location.pathname.startsWith('/samples')) {
    variant = 'report';
  }

  return (
    <div className="relative min-h-screen bg-[#07111F] text-[#F7FAFC] flex flex-col justify-between overflow-x-hidden">
      <SkipLink />
      <Atmosphere variant={variant} />

      <FloatingNav onOpenCommandPalette={() => setCommandPaletteOpen(true)} />
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />

      <main id="content" className="flex-1 z-10">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/upload"
            element={
              <RequireSession>
                <UploadPage />
              </RequireSession>
            }
          />
          <Route
            path="/analysis/:jobId"
            element={
              <RequireSession>
                <AnalysisPage />
              </RequireSession>
            }
          />
          <Route path="/samples/:id" element={<SamplePage />} />
          <Route path="/methodology" element={<MethodologyPage />} />
          <Route
            path="/history"
            element={
              <RequireSession>
                <HistoryPage />
              </RequireSession>
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      <Footer />

      <Toaster
        theme="dark"
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#0B1A2D',
            border: '1px solid #17324F',
            color: '#F7FAFC',
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
          },
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <AppLayout />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
