import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ItemMaster from './pages/ItemMaster';
import QuotationsList from './pages/QuotationsList';
import CreateQuote from './pages/CreateQuote';
import QuotationView from './pages/QuotationView';
import Billbook from './pages/Billbook';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/items" element={<ItemMaster />} />
          <Route path="/quotations" element={<QuotationsList />} />
          <Route path="/quotations/new" element={<CreateQuote />} />
          <Route path="/quotations/:id/edit" element={<CreateQuote />} />
          <Route path="/quotations/:id" element={<QuotationView />} />
          <Route path="/billbook" element={<Billbook />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
