import React from 'react';
import Navbar from './components/Navbar';
import DatasetForm from './components/DatasetForm';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <div className="min-h-screen pb-10">
      <Navbar />
      <ErrorBoundary>
        <DatasetForm />
      </ErrorBoundary>
    </div>
  );
}

export default App;
