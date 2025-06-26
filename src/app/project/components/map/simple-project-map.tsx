'use client';

import React from 'react';
import { ProjectMap } from './project-map';
import { mapService } from './map-service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation } from 'lucide-react';
import type { Project } from '../../types';

interface SimpleProjectMapProps {
  project: Project;
  className?: string;
  showTitle?: boolean;
  height?: number;
}

/**
 * 簡單的專案地圖展示組件
 */
export function SimpleProjectMap({
  project,
  className = '',
  showTitle = true,
  height = 300,
}: SimpleProjectMapProps) {
  // 如果沒有地區或地址資訊，不顯示地圖
  if (!project.region && !project.address) {
    return null;
  }

  // 計算距離到台北市中心（示例）
  const calculateDistanceToTaipei = () => {
    if (!project.region) return null;
    
    const taipeiCenter = mapService.getCityCoordinates('台北市');
    const projectLocation = mapService.getCityCoordinates(project.region);
    const distance = mapService.calculateDistance(taipeiCenter, projectLocation);
    
    return Math.round(distance);
  };

  const distanceToTaipei = calculateDistanceToTaipei();

  if (!showTitle) {
    return (
      <div className={className}>
        <ProjectMap
          address={project.address}
          region={project.region}
          projectName={project.name}
          height={height}
          showControls={false}
          interactive={false}
        />
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          專案位置
        </CardTitle>
        <div className="flex flex-wrap gap-2">
          {project.region && (
            <Badge variant="secondary" className="text-xs">
              <Navigation className="h-3 w-3 mr-1" />
              {project.region}
            </Badge>
          )}
          {distanceToTaipei && (
            <Badge variant="outline" className="text-xs">
              距離台北約 {distanceToTaipei} 公里
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ProjectMap
          address={project.address}
          region={project.region}
          projectName={project.name}
          height={height}
          showControls={true}
          interactive={false}
        />
      </CardContent>
    </Card>
  );
} 