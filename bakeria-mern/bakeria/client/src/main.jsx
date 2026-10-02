import { createRoot } from 'react-dom/client';
import { BrowserRouter, NavLink, Route, Routes } from 'react-router-dom';
import Menu from './pages/Menu.jsx';
import Dashboard from './pages/Dashboard.jsx';
import './styles.css';

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <header className="top">
      <h1>Grandma's Bakeria</h1>
      <nav className="tabs">
        <NavLink to="/" end>Customer menu</NavLink>
        <NavLink to="/grandma">Grandma's dashboard</NavLink>
      </nav>
    </header>
    <Routes><Route path="/" element={<Menu />} /><Route path="/grandma" element={<Dashboard />} /></Routes>
  </BrowserRouter>
);
