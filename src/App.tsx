import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import Landing from './pages/Landing';
import Portal from './pages/Portal';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import Cookies from './pages/Cookies';
import DPA from './pages/DPA';
import NotFound from './pages/NotFound';
import PageTracker from './components/PageTracker';

const App: React.FC = () => {
  return (
    <>
      <Toaster position="top-right" />
      <PageTracker />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/portal" element={<Portal />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/cookies" element={<Cookies />} />
        <Route path="/dpa" element={<DPA />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

export default App;
