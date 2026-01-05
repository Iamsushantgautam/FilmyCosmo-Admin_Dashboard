import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import Home from './pages/Home';
import Admin from './pages/Admin';
import MovieGrid from './pages/moviegrip';
import MovieDetail from './pages/MovieDetail';
import './index.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />}>
          <Route index element={<Home />} />
          <Route path="admin" element={<Admin />} />
          <Route path="moviegrip" element={<MovieGrid />} />
          <Route path="movie/:id" element={<MovieDetail />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
