import React, { useState, useEffect } from 'react';
import { PageId, TimeBlockData, InverterBayStatus, SystemLog } from './types';
import { DispatchStrategy } from './api';
import {
  INITIAL_24HR_DATA,
  INVERTER_BAYS as INITIAL_BAYS,
  SYSTEM_LOGS as INITIAL_LOGS,
} from './data/mockData';
import { Header } from './components/Header';
import { HeroPage } from './components/HeroPage';
import { ImpactPage } from './components/ImpactPage';
import { ControlRoomPage } from './components/ControlRoomPage';
import { ProbabilisticPage } from './components/ProbabilisticPage';
import { DigitalTwinPage } from './components/DigitalTwinPage';
import { ClimateSandboxPage } from './components/ClimateSandboxPage';
import { Footer } from './components/Footer';
import { MethodAssumptionsDrawer } from './components/MethodAssumptionsDrawer';

export default function App() {
  const [activePage, setActivePage] = useState<PageId>('hero');
  const [currentBlock, setCurrentBlock] = useState<number>(49); // 12:15 PM peak curtailment window
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<string>('2024-03-15');
  const [strategy, setStrategy] = useState<DispatchStrategy>('sunbank');
  const [isMethodDrawerOpen, setIsMethodDrawerOpen] = useState<boolean>(false);
  const [inverterBays, setInverterBays] = useState<InverterBayStatus[]>(INITIAL_BAYS);
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>(INITIAL_LOGS);

  const full24hrData = INITIAL_24HR_DATA;
  const currentData: TimeBlockData = full24hrData[currentBlock - 1] || full24hrData[48];

  // Simulation timer when isPlaying is true (replays 96 real blocks of selected date)
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentBlock((prev) => {
        const next = prev >= 96 ? 1 : prev + 1;
        return next;
      });
    }, 1200);

    return () => clearInterval(interval);
  }, [isPlaying]);

  // Dynamically update inverter bays and logs slightly as time progresses
  useEffect(() => {
    if (!currentData) return;

    setInverterBays((prev) =>
      prev.map((bay) => {
        if (bay.id === 'bay-3') {
          // BESS PCS array reflects charge/discharge
          return {
            ...bay,
            fillPercent: currentData.socPercent,
            powerKW: Math.round(Math.abs(currentData.bessPowerMW) * 1000),
            tempC: currentData.cellTempC,
            status: currentData.cellTempC > 42 ? 'watch' : 'nominal',
          };
        }
        if (bay.id === 'bay-4') {
          // 33kV Feeder
          const isHigh = currentData.solarGenMW > 30;
          return {
            ...bay,
            fillPercent: Math.min(100, Math.round((currentData.solarGenMW / 50) * 100)),
            status: isHigh ? 'watch' : 'nominal',
          };
        }
        return bay;
      })
    );
  }, [currentBlock, currentData]);

  const handleNavigate = (page: PageId) => {
    setActivePage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResetBlock = () => {
    setCurrentBlock(49); // Reset to 12:15 PM peak
    setIsPlaying(false);
  };

  const handleApplyScenario = (scenarioId: string, dayDate?: string) => {
    if (dayDate) {
      setSelectedDate(dayDate);
    }
    if (scenarioId === 'monsoon') {
      setCurrentBlock(60); // 15:00 rain squall
    } else if (scenarioId === 'winter_fog' || scenarioId === 'winter-fog') {
      setCurrentBlock(36); // 09:00 dense fog
    } else if (scenarioId === 'summer_heat' || scenarioId === 'summer-heat') {
      setCurrentBlock(48); // 12:00 heat peak
    } else if (scenarioId === 'stubble_haze' || scenarioId === 'stubble-haze') {
      setCurrentBlock(52); // 13:00 haze
    } else if (scenarioId === 'clear') {
      setCurrentBlock(48);
    }
    setActivePage('control');
    setIsPlaying(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-amber-500/20 selection:text-amber-900 bg-slate-950">
      {/* Vertical Glass Navigation Dock */}
      <Header
        activePage={activePage}
        onNavigate={handleNavigate}
        isPlaying={isPlaying}
        onTogglePlay={() => setIsPlaying(!isPlaying)}
        currentBlock={currentBlock}
        onResetBlock={handleResetBlock}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
      />

      {/* Main Content Area Offset for Vertical Dock (Desktop) & Bottom Glass Bar (Mobile) */}
      <div className="flex-1 flex flex-col md:pl-20 lg:pl-64 w-full transition-all duration-300 min-w-0 pb-16 md:pb-0">
        <main className="flex-1 w-full min-w-0">
          {activePage === 'hero' && <HeroPage onNavigate={handleNavigate} />}
          {activePage === 'impact' && (
            <ImpactPage
              selectedDate={selectedDate}
              onOpenMethodDrawer={() => setIsMethodDrawerOpen(true)}
            />
          )}
          {activePage === 'control' && (
            <ControlRoomPage
              currentData={currentData}
              full24hrData={full24hrData}
              currentBlock={currentBlock}
              onSelectBlock={setCurrentBlock}
              isPlaying={isPlaying}
              onTogglePlay={() => setIsPlaying(!isPlaying)}
              selectedDate={selectedDate}
              strategy={strategy}
              onSelectStrategy={setStrategy}
            />
          )}
          {activePage === 'forecasting' && (
            <ProbabilisticPage
              full24hrData={full24hrData}
              currentBlock={currentBlock}
              selectedDate={selectedDate}
            />
          )}
          {activePage === 'digital-twin' && (
            <DigitalTwinPage
              currentData={currentData}
              selectedDate={selectedDate}
              strategy={strategy}
              onSelectStrategy={setStrategy}
            />
          )}
          {activePage === 'sandbox' && (
            <ClimateSandboxPage onApplyScenarioToSim={handleApplyScenario} />
          )}
        </main>

        {/* Quiet Footer */}
        <Footer
          activePage={activePage}
          onNavigate={handleNavigate}
          onOpenMethodDrawer={() => setIsMethodDrawerOpen(true)}
        />
      </div>

      {/* Slide-Over Method & Assumptions Drawer */}
      <MethodAssumptionsDrawer
        isOpen={isMethodDrawerOpen}
        onClose={() => setIsMethodDrawerOpen(false)}
      />
    </div>
  );
}
