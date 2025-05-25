// src/app/admin/schedule/page.tsx
"use client";

import React, { useState } from 'react';
import TimelineComponent from '../../../components/Timeline';

const SchedulePage: React.FC = () => {
  const [groupName, setGroupName] = useState('');
  const [itemName, setItemName] = useState('');
  const [itemStart, setItemStart] = useState('');

  const handleAddGroup = () => {
    // Logic to add group
  };

  const handleAddItem = () => {
    // Logic to add item
  };

  return (
    <div>
      <h1>Schedule</h1>
      <div>
        <input
          type="text"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          placeholder="Group Name"
        />
        <button onClick={handleAddGroup}>Add Group</button>
      </div>
      <div>
        <input
          type="text"
          value={itemName}
          onChange={(e) => setItemName(e.target.value)}
          placeholder="Item Name"
        />
        <input
          type="text"
          value={itemStart}
          onChange={(e) => setItemStart(e.target.value)}
          placeholder="Item Start Date"
        />
        <button onClick={handleAddItem}>Add Item</button>
      </div>
      <TimelineComponent />
    </div>
  );
};

export default SchedulePage;