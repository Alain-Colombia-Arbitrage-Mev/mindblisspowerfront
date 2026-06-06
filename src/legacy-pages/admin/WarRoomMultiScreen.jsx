import { useState, useEffect } from 'react';
import { useSimulation } from '@/lib/SimulationEngine';
import { createWarRoomNavigation } from '@/lib/warRoomNavigationContext';
import { getRootLeader } from '@/lib/warRoomDataAdapter';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Play, Pause, Minimize2 } from 'lucide-react';
import VisualOverlayLayer from '@/components/admin/VisualOverlayLayer';
import OverlayControl from '@/components/admin/OverlayControl';
import CinematicBackdropLayer from '@/components/admin/CinematicBackdropLayer';
import CinematicFocusLayer from '@/components/admin/CinematicFocusLayer';
import CinematicEventHighlight from '@/components/admin/CinematicEventHighlight';
import {
  detectPaymentIssue,
  detectLeaderIssue,
  detectConversionChange,
  detectGrowthSignal,
  detectActiveAlert,
  resolveOverlayIntensity,
} from '@/components/admin/OverlayEffectsEngine';

// Import all screen components
import WarRoomScreen1GlobalOverview from '@/components/admin/WarRoomScreen1GlobalOverview';
import WarRoomScreen2Activity from '@/components/admin/WarRoomScreen2Activity';
import WarRoomScreen3Payments from '@/components/admin/WarRoomScreen3Payments';
import WarRoomScreen4Leaders from '@/components/admin/WarRoomScreen4Leaders';
import WarRoomScreen5AI from '@/components/admin/WarRoomScreen5AI';
import WarRoomScreen6Marketing from '@/components/admin/WarRoomScreen6Marketing';
import AlertDisplay from '@/components/admin/AlertDisplay';
import WarRoomCommandCenter from '@/components/admin/WarRoomCommandCenter';

const SCREENS = [
  { id: 0, name: 'Command Center', component: WarRoomCommandCenter },
  { id: 1, name: 'Global Overview', component: WarRoomScreen1GlobalOverview },
  { id: 2, name: 'Activity + Growth', component: WarRoomScreen2Activity },
  { id: 3, name: 'Payments + Finance', component: WarRoomScreen3Payments },
  { id: 4, name: 'Leaders + Network', component: WarRoomScreen4Leaders },
  { id: 5, name: 'AI Brain + Actions', component: WarRoomScreen5AI },
  { id: 6, name: 'Campaigns + Marketing', component: WarRoomScreen6Marketing },
];

export default function WarRoomMultiScreen() {
  const sim = useSimulation();
  const [activeScreen, setActiveScreen] = useState(0); // Default to Command Center
  const [navigation, setNavigation] = useState(null);

  // Initialize navigation with root leader
  useEffect(() => {
    const root = getRootLeader();
    if (root && !navigation) {
      setNavigation(createWarRoomNavigation(root));
    }
  }, [navigation]);
  const [autoRotate, setAutoRotate] = useState(false);
  const [rotationInterval, setRotationInterval] = useState(8);
  const [presentationMode, setPresentationMode] = useState(false);
  const [overlayEnabled, setOverlayEnabled] = useState(true);
  const [overlayIntensity, setOverlayIntensity] = useState('medium');
  const [prevKpis, setPrevKpis] = useState(null);
  const [overlayEvents, setOverlayEvents] = useState([]);
  const [focusedModule, setFocusedModule] = useState(null);
  const [highlightEvent, setHighlightEvent] = useState(null);

  // Auto-rotation logic
  useEffect(() => {
    if (!autoRotate) return;
    const timer = setInterval(() => {
      setActiveScreen(prev => (prev + 1) % SCREENS.length);
    }, rotationInterval * 1000);
    return () => clearInterval(timer);
  }, [autoRotate, rotationInterval]);

  // AI event detection & overlay trigger
  useEffect(() => {
    const detectedEvents = [];
    const paymentIssue = detectPaymentIssue(sim.kpis);
    const leaderIssue = detectLeaderIssue(sim.activityLog);
    const conversionChange = detectConversionChange(sim.kpis, prevKpis);
    const growthSignal = detectGrowthSignal(sim.kpis);
    const activeAlert = detectActiveAlert(sim.activityLog);

    if (paymentIssue.detected) detectedEvents.push(paymentIssue);
    if (leaderIssue.detected) detectedEvents.push(leaderIssue);
    if (conversionChange.detected) detectedEvents.push(conversionChange);
    if (growthSignal.detected) detectedEvents.push(growthSignal);
    if (activeAlert.detected) detectedEvents.push(activeAlert);

    if (detectedEvents.length > 0) {
      setOverlayEvents(detectedEvents);
      // Trigger cinematic event highlight on critical events
      const criticalEvent = detectedEvents.find(e => e.severity === 'critical');
      if (criticalEvent) {
        setHighlightEvent({
          eventId: `event-${Date.now()}`,
          position: { x: window.innerWidth / 2, y: window.innerHeight / 2, width: 300, height: 200 },
          severity: criticalEvent.severity,
          label: criticalEvent.message,
        });
      }
    }

    setPrevKpis(sim.kpis);
  }, [sim.kpis, sim.activityLog]);

  const currentScreen = SCREENS[activeScreen];
  const CurrentComponent = currentScreen.component;

  const handlePrevScreen = () => {
    setActiveScreen(prev => (prev - 1 + SCREENS.length) % SCREENS.length);
  };

  const handleNextScreen = () => {
    setActiveScreen(prev => (prev + 1) % SCREENS.length);
  };

  return (
    <div className="h-screen overflow-hidden flex flex-col relative" style={{ background: '#000000' }}>
      {/* Cinematic Backdrop */}
      <CinematicBackdropLayer />

      {/* AI Visual Overlay Layer */}
      <VisualOverlayLayer enabled={overlayEnabled} intensity={overlayIntensity} events={overlayEvents} />

      {/* Cinematic Event Highlight */}
      {highlightEvent && (
        <CinematicEventHighlight
          event={highlightEvent}
          onComplete={() => setHighlightEvent(null)}
        />
      )}

      {/* Cinematic Focus Layer with full-screen component */}
      <CinematicFocusLayer onFocusChange={setFocusedModule}>
        {({ handleModuleClick, focusedId }) => (
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeScreen}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="h-full w-full"
          >
            <CurrentComponent sim={sim} presentationMode={presentationMode} navigation={navigation} onNavigate={setNavigation} />
          </motion.div>
          </AnimatePresence>
          </div>
          )}
          </CinematicFocusLayer>

      {/* Control Bar — Hidden in Presentation Mode */}
      {!presentationMode && (
        <motion.div
          initial={{ y: 60 }}
          animate={{ y: 0 }}
          className="flex-shrink-0 px-6 py-4 flex items-center justify-between"
          style={{ background: 'rgba(4,10,22,0.95)', borderTop: '1px solid rgba(255,255,255,0.07)' }}
        >
          {/* Left: Navigation */}
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrevScreen}
              className="p-2 rounded-lg transition-all hover:bg-white/10"
              style={{ color: 'rgba(255,255,255,0.6)' }}
            >
              <ChevronLeft size={16} />
            </button>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 700 }}>
                SCREEN {activeScreen + 1} / {SCREENS.length}
              </span>
              <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, fontWeight: 600 }}>
                {currentScreen.name}
              </span>
            </div>

            <button
              onClick={handleNextScreen}
              className="p-2 rounded-lg transition-all hover:bg-white/10"
              style={{ color: 'rgba(255,255,255,0.6)' }}
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Center: Screen Indicators */}
          <div className="flex items-center gap-1.5">
            {SCREENS.map((screen, i) => (
              <button
                key={screen.id}
                onClick={() => setActiveScreen(i)}
                className="h-2 rounded-full transition-all"
                style={{
                  width: i === activeScreen ? 24 : 8,
                  background: i === activeScreen ? '#3b82f6' : 'rgba(255,255,255,0.2)',
                }}
              />
            ))}
          </div>

          {/* Right: Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAutoRotate(!autoRotate)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all"
              style={{
                background: autoRotate ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)',
                color: autoRotate ? '#10b981' : 'rgba(255,255,255,0.5)',
                border: autoRotate ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(255,255,255,0.1)',
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              {autoRotate ? <Pause size={12} /> : <Play size={12} />}
              {autoRotate ? 'ROTATING' : 'MANUAL'}
            </button>

            {autoRotate && (
              <div className="flex items-center gap-1.5 px-2 py-1.5" style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>
                <span>Every</span>
                <select
                  value={rotationInterval}
                  onChange={e => setRotationInterval(Number(e.target.value))}
                  className="px-1.5 py-0.5 rounded text-xs"
                  style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)', border: 'none' }}
                >
                  {[4, 6, 8, 10, 12, 15].map(s => <option key={s} value={s}>{s}s</option>)}
                </select>
              </div>
            )}

            <div className="w-px h-6" style={{ background: 'rgba(255,255,255,0.1)' }} />

            <button
              onClick={() => setPresentationMode(!presentationMode)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all"
              style={{
                background: presentationMode ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.05)',
                color: presentationMode ? '#3b82f6' : 'rgba(255,255,255,0.5)',
                border: presentationMode ? '1px solid rgba(59,130,246,0.3)' : '1px solid rgba(255,255,255,0.1)',
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              <Minimize2 size={12} />
              PRESENTATION
            </button>
          </div>
        </motion.div>
      )}

      {/* Security Alerts — Hidden in Presentation Mode */}
      {!presentationMode && (
        <div className="absolute bottom-6 right-6 w-96 max-h-64 overflow-y-auto z-40">
          <AlertDisplay compact maxAlerts={3} />
        </div>
      )}

      {/* Overlay Control Panel — visible only when not focused */}
      {!focusedModule && (
      <OverlayControl
        enabled={overlayEnabled}
        onToggle={() => setOverlayEnabled(!overlayEnabled)}
        intensity={overlayIntensity}
        onIntensityChange={setOverlayIntensity}
        onMinimalMode={() => setOverlayIntensity(overlayIntensity === 'low' ? 'medium' : 'low')}
      />
      )}
    </div>
  );
}