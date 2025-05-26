'use client';

import React, { useState } from 'react';
import TimelineComponent, { TimelineItem } from '../../../components/Timeline';
import TestTimelineControl from '../../../components/TestTimelineControl';

const SchedulePage: React.FC = () => {
  const [items, setItems] = useState<TimelineItem[]>([]);

  return (
    <div>
      <h1>行程排程</h1>
      <TestTimelineControl />
      <TimelineComponent items={items} onItemsChange={setItems} />
    </div>
  );
};

export default SchedulePage;
