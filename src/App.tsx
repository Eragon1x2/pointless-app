import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Game from './pages/Game';
import CustomGame from './pages/CustomGame';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/game" element={<Game />} />
        <Route path="/custom-game" element={<CustomGame />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
