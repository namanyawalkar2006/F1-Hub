/**
 * F1 Hub — Real-Time Formula 1 Application
 * REAL DATA • STRONG BACKEND • FAST LIVE UPDATES • SIMPLE UI • POLISHED MOTORSPORT MOTION
 */

import React, { lazy, Suspense, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Header, NavView } from './components/common/Header';
import { IntroSplash } from './components/common/IntroSplash';
import { Footer } from './components/common/Footer';
import { useLiveF1 } from './hooks/useLiveF1';

const HomeView = lazy(() =>
  import('./components/home/HomeView').then(({ HomeView }) => ({ default: HomeView })),
);
const LiveView = lazy(() =>
  import('./components/live/LiveView').then(({ LiveView }) => ({ default: LiveView })),
);
const CalendarView = lazy(() =>
  import('./components/calendar/CalendarView').then(({ CalendarView }) => ({ default: CalendarView })),
);
const CircuitsView = lazy(() =>
  import('./components/circuits/CircuitsView').then(({ CircuitsView }) => ({ default: CircuitsView })),
);
const StandingsView = lazy(() =>
  import('./components/standings/StandingsView').then(({ StandingsView }) => ({ default: StandingsView })),
);
const ResultsView = lazy(() =>
  import('./components/results/ResultsView').then(({ ResultsView }) => ({ default: ResultsView })),
);
const DriverProfileView = lazy(() =>
  import('./components/drivers/DriverProfileView').then(({ DriverProfileView }) => ({ default: DriverProfileView })),
);
const ConstructorProfileView = lazy(() =>
  import('./components/constructors/ConstructorProfileView').then(({ ConstructorProfileView }) => ({
    default: ConstructorProfileView,
  })),
);

const getDriverRefFromHash = (hash: string) => {
  const rawRef = hash.slice(7);
  try {
    return decodeURIComponent(rawRef);
  } catch {
    return rawRef;
  }
};

const getConstructorRefFromHash = (hash: string) => {
  const rawRef = hash.slice(5);
  try {
    return decodeURIComponent(rawRef);
  } catch {
    return rawRef;
  }
};

const viewMetadata: Record<NavView, { title: string; description: string }> = {
  HOME: {
    title: 'F1 Hub | Formula 1 Calendar, Circuits, Standings & Results',
    description: 'Explore Formula 1 schedules, circuit guides, driver and constructor standings, race results, and available live timing.',
  },
  LIVE: {
    title: 'F1 Live Timing & Race Control | F1 Hub',
    description: 'Follow available Formula 1 session timing, race control messages, weather, and driver data.',
  },
  CALENDAR: {
    title: 'Formula 1 Race Calendar | F1 Hub',
    description: 'Browse the Formula 1 season calendar, Grand Prix dates, circuits, and session schedules.',
  },
  CIRCUITS: {
    title: 'All 24 Formula 1 Circuits | Track Guides | F1 Hub',
    description: 'Explore all 24 Formula 1 circuit guides with track layouts, lengths, corners, DRS zones, and lap records.',
  },
  STANDINGS: {
    title: 'Formula 1 Driver Standings | F1 Hub',
    description: 'View Formula 1 driver championship positions, points, wins, and team details.',
  },
  TEAMS: {
    title: 'Formula 1 Constructor Standings | F1 Hub',
    description: 'View Formula 1 constructor championship standings, points, and team profiles.',
  },
  RESULTS: {
    title: 'Formula 1 Race Results | F1 Hub',
    description: 'Browse Formula 1 Grand Prix classifications, podiums, and race results.',
  },
  DRIVER: {
    title: 'Formula 1 Driver Profile | F1 Hub',
    description: 'Explore Formula 1 driver statistics, results, and championship history.',
  },
  TEAM: {
    title: 'Formula 1 Team Profile | F1 Hub',
    description: 'Explore Formula 1 constructor statistics, drivers, and championship results.',
  },
};

export default function App() {
  const [hasEntered, setHasEntered] = useState(false);
  const [activeView, setActiveView] = useState<NavView>(() => {
    // Support URL param ?autostart=1 or hash
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1' || params.get('view') === 'live') {
      return 'LIVE';
    }
    const hash = window.location.hash.replace('#', '').toUpperCase();
    if (hash.startsWith('DRIVER/')) return 'DRIVER';
    if (hash.startsWith('TEAM/')) return 'TEAM';
    if (['HOME', 'LIVE', 'CALENDAR', 'CIRCUITS', 'STANDINGS', 'TEAMS', 'RESULTS'].includes(hash)) {
      return hash as NavView;
    }
    return 'HOME';
  });
  const [selectedDriverRef, setSelectedDriverRef] = useState(() => {
    const hash = window.location.hash.slice(1);
    return hash.toLowerCase().startsWith('driver/') ? getDriverRefFromHash(hash) : '';
  });
  const [selectedConstructorRef, setSelectedConstructorRef] = useState(() => {
    const hash = window.location.hash.slice(1);
    return hash.toLowerCase().startsWith('team/') ? getConstructorRefFromHash(hash) : '';
  });

  const { liveState, isLoading, loadError, selectedSessionKey, switchSession, refresh } = useLiveF1();

  useEffect(() => {
    const metadata = viewMetadata[activeView];
    document.title = metadata.title;
    document
      .querySelector<HTMLMetaElement>('meta[name="description"]')
      ?.setAttribute('content', metadata.description);
  }, [activeView]);

  const handleNavigate = (view: NavView) => {
    if (view === 'DRIVER' || view === 'TEAM') return;
    setActiveView(view);
    setSelectedDriverRef('');
    setSelectedConstructorRef('');
    window.location.hash = view.toLowerCase();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectDriver = (driverRef: string) => {
    setSelectedDriverRef(driverRef);
    setSelectedConstructorRef('');
    setActiveView('DRIVER');
    window.location.hash = `driver/${encodeURIComponent(driverRef)}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectConstructor = (constructorRef: string) => {
    setSelectedConstructorRef(constructorRef);
    setSelectedDriverRef('');
    setActiveView('TEAM');
    window.location.hash = `team/${encodeURIComponent(constructorRef)}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Sync hash changes from browser back/forward
  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.slice(1);
      if (hash.toLowerCase().startsWith('driver/')) {
        setSelectedConstructorRef('');
        setSelectedDriverRef(getDriverRefFromHash(hash));
        setActiveView('DRIVER');
      } else if (hash.toLowerCase().startsWith('team/')) {
        setSelectedDriverRef('');
        setSelectedConstructorRef(getConstructorRefFromHash(hash));
        setActiveView('TEAM');
      } else if (['HOME', 'LIVE', 'CALENDAR', 'CIRCUITS', 'STANDINGS', 'TEAMS', 'RESULTS'].includes(hash.toUpperCase())) {
        setSelectedDriverRef('');
        setSelectedConstructorRef('');
        setActiveView(hash.toUpperCase() as NavView);
      }
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  if (!hasEntered) {
    return <IntroSplash onEnter={() => setHasEntered(true)} />;
  }

  return (
    <div className="app-shell min-h-screen flex flex-col text-neutral-100">
      {/* Navigation Header */}
      <Header
        activeView={activeView}
        onNavigate={handleNavigate}
      />

      {/* Main Content Area with Smooth Motion Transitions */}
      <main className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeView}
            initial={{ opacity: 0, y: 14, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -14, filter: 'blur(6px)' }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            <Suspense
              fallback={
                <div role="status" className="mx-auto max-w-7xl px-6 py-16 text-center text-sm text-neutral-400">
                  Loading race data...
                </div>
              }
            >
              {activeView === 'HOME' && (
                <HomeView
                  liveState={liveState}
                  onNavigate={handleNavigate}
                  onSelectDriver={handleSelectDriver}
                  onSelectConstructor={handleSelectConstructor}
                />
              )}
              {activeView === 'LIVE' && (
                <LiveView
                  state={liveState}
                  isLoading={isLoading}
                  loadError={loadError}
                  selectedSessionKey={selectedSessionKey}
                  onSelectSession={switchSession}
                  onSelectDriver={handleSelectDriver}
                  onSelectConstructor={handleSelectConstructor}
                  onRefresh={refresh}
                />
              )}
              {activeView === 'CALENDAR' && <CalendarView />}
              {activeView === 'CIRCUITS' && <CircuitsView />}
              {(activeView === 'STANDINGS' || activeView === 'TEAMS') && (
                <StandingsView
                  initialTab={activeView === 'TEAMS' ? 'CONSTRUCTORS' : 'DRIVERS'}
                  onSelectDriver={handleSelectDriver}
                  onSelectConstructor={handleSelectConstructor}
                />
              )}
              {activeView === 'RESULTS' && (
                <ResultsView onSelectDriver={handleSelectDriver} onSelectConstructor={handleSelectConstructor} />
              )}
              {activeView === 'DRIVER' && selectedDriverRef && (
                <DriverProfileView
                  driverRef={selectedDriverRef}
                  onNavigate={handleNavigate}
                  onSelectConstructor={handleSelectConstructor}
                />
              )}
              {activeView === 'TEAM' && selectedConstructorRef && (
                <ConstructorProfileView
                  constructorRef={selectedConstructorRef}
                  onNavigate={handleNavigate}
                  onSelectDriver={handleSelectDriver}
                />
              )}
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
