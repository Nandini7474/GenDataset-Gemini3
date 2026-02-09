import React from 'react';
import Navbar from './components/Navbar';
import DatasetForm from './components/DatasetForm';
import ErrorBoundary from './components/ErrorBoundary';
import HeroSection from './components/Herosection';

function App() {
  return (
    <div className="min-h-screen pb-10 overflow-x-hidden bg-gradient-to-b from-purple-50 to-white">
      <Navbar />
      <ErrorBoundary>
        <HeroSection />
        <section className="relative bg-gradient-to-b from-purple-50 to-white">
        <DatasetForm />
        </section>
      </ErrorBoundary>
    </div>
  );
}

export default App;
