"use client";

import React from 'react';
import TimelineComponent from '../../../components/Timeline';

const SchedulePage: React.FC = () => {
  // UI 和資料操作全部移到 TimelineComponent，這裡只做單純渲染
  return (
    <div>
      <h1>Schedule</h1>
      <TimelineComponent />
    </div>
  );
};

export default SchedulePage;