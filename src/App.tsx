import styled from 'styled-components';
import GameTable from './components/GameTable';
import { GameProvider } from './context/GameContext';
import { HudLayoutProvider } from './context/HudLayoutContext';
import { HudAnchorProvider } from './context/HudAnchorContext';

const AppContainer = styled.div`
  width: 100vw;
  width: 100dvw;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
`;

function App() {
  return (
    <GameProvider>
      <HudLayoutProvider>
        <HudAnchorProvider>
          <AppContainer>
            <GameTable />
          </AppContainer>
        </HudAnchorProvider>
      </HudLayoutProvider>
    </GameProvider>
  );
}

export default App;
