import { useState } from 'react';
import Home from './components/Home';
import NailTryOn from './components/NailTryOn';
import HairTryOn from './components/HairTryOn';

export type Screen = 'home' | 'nail' | 'hair';

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');

  return (
    <div className="min-h-screen">
      {screen === 'home' && <Home onPick={setScreen} />}
      {screen === 'nail' && <NailTryOn onBack={() => setScreen('home')} />}
      {screen === 'hair' && <HairTryOn onBack={() => setScreen('home')} />}
    </div>
  );
}
