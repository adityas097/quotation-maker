import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ItemMaster from './pages/ItemMaster';
import QuotationsList from './pages/QuotationsList';
import ClientMaster from './pages/ClientMaster';
import CreateQuote from './pages/CreateQuote';
import QuotationView from './pages/QuotationView';
import Billbook from './pages/Billbook';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="items" element={<ItemMaster />} />
          <Route path="clients" element={<ClientMaster />} />
          <Route path="quotations" element={<QuotationsList />} />
          <Route path="/quotations/new" element={<CreateQuote />} />
          <Route path="/quotations/:id/edit" element={<CreateQuote />} />
          <Route path="/quotations/:id" element={<QuotationView />} />
          <Route path="/billbook" element={<Billbook />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
