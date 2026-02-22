import React from 'react';
import RamadanTable from '../components/ramadan/RamadanTable';  // ✅ Correct path with ../

const RamadanPage = () => {
  return (
    <div className="space-y-6">
      <RamadanTable />
    </div>
  );
};

export default RamadanPage;
