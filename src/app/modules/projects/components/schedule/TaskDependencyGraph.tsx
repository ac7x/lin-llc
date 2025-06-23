/**
 * 任務依賴圖組件
 * 
 * 使用 vis-network 顯示任務依賴關係圖
 */

'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
// @ts-ignore
import { Network } from 'vis-network';
import { DataSet } from 'vis-data';
import 'vis-network/styles/vis-network.css';

import { projectStyles } from '@/app/modules/projects/styles';
import type { ScheduleItem, ScheduleDependency } from '../../services/scheduleService';
import { 
  getScheduleItemStatus, 
  getScheduleItemPriority,
  getScheduleItemStatusColor,
  getScheduleItemPriorityColor
} from '../../utils/scheduleUtils';

interface TaskDependencyGraphProps {
  scheduleItems: ScheduleItem[];
  dependencies: ScheduleDependency[];
  onNodeClick?: (item: ScheduleItem) => void;
  onEdgeClick?: (dependency: ScheduleDependency) => void;
  height?: string;
  showLabels?: boolean;
  showProgress?: boolean;
}

interface NetworkNode {
  id: string;
  label: string;
  title?: string;
  color?: string;
  borderWidth?: number;
  borderColor?: string;
  shape?: string;
  size?: number;
  font?: {
    size?: number;
    color?: string;
    face?: string;
  };
  group?: string;
}

interface NetworkEdge {
  id: string;
  from: string;
  to: string;
  arrows: string;
  color?: string;
  width?: number;
  title?: string;
  dashes?: boolean;
}

export default function TaskDependencyGraph({
  scheduleItems,
  dependencies,
  onNodeClick,
  onEdgeClick,
  height = '600px',
  showLabels = true,
  showProgress = true,
}: TaskDependencyGraphProps) {
  const networkRef = useRef<HTMLDivElement>(null);
  const networkInstanceRef = useRef<Network | null>(null);
  const [selectedNode, setSelectedNode] = useState<ScheduleItem | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<ScheduleDependency | null>(null);

  // 準備節點數據
  const networkNodes = useMemo(() => {
    const nodes: NetworkNode[] = scheduleItems.map(item => {
      const status = getScheduleItemStatus(item);
      const priority = getScheduleItemPriority(item);
      const statusColor = getScheduleItemStatusColor(status);
      const priorityColor = getScheduleItemPriorityColor(priority);
      
      // 根據狀態和優先級設定節點顏色
      let nodeColor = '#3b82f6'; // 預設藍色
      let borderColor = '#1d4ed8';
      
      if (status === 'completed') {
        nodeColor = '#22c55e';
        borderColor = '#16a34a';
      } else if (status === 'overdue') {
        nodeColor = '#ef4444';
        borderColor = '#dc2626';
      } else if (priority === 'critical') {
        nodeColor = '#f97316';
        borderColor = '#ea580c';
      }
      
      return {
        id: item.id,
        label: showLabels ? item.title : '',
        title: `${item.title}\n類型: ${item.type}\n狀態: ${status}\n優先級: ${priority}\n進度: ${item.progress}%`,
        color: nodeColor,
        borderWidth: 2,
        borderColor: borderColor,
        shape: item.type === 'milestone' ? 'diamond' : 'box',
        size: item.type === 'milestone' ? 30 : 25,
        font: {
          size: 12,
          color: '#1f2937',
          face: 'Arial',
        },
        group: item.type,
      };
    });

    return new DataSet(nodes);
  }, [scheduleItems, showLabels]);

  // 準備邊緣數據
  const networkEdges = useMemo(() => {
    const edges: NetworkEdge[] = dependencies.map(dep => {
      const fromItem = scheduleItems.find(item => item.id === dep.from);
      const toItem = scheduleItems.find(item => item.id === dep.to);
      
      let edgeColor = '#6b7280';
      let edgeWidth = 2;
      let isDashed = false;
      
      // 根據依賴類型設定邊緣樣式
      switch (dep.type) {
        case 'finish-to-start':
          edgeColor = '#3b82f6';
          break;
        case 'start-to-start':
          edgeColor = '#f59e0b';
          isDashed = true;
          break;
        case 'finish-to-finish':
          edgeColor = '#8b5cf6';
          isDashed = true;
          break;
        case 'start-to-finish':
          edgeColor = '#ef4444';
          edgeWidth = 3;
          break;
      }
      
      return {
        id: dep.id,
        from: dep.from,
        to: dep.to,
        arrows: 'to',
        color: edgeColor,
        width: edgeWidth,
        title: `依賴類型: ${dep.type}\n從: ${fromItem?.title || dep.from}\n到: ${toItem?.title || dep.to}`,
        dashes: isDashed,
      };
    });

    return new DataSet(edges);
  }, [dependencies, scheduleItems]);

  // 初始化網路圖
  useEffect(() => {
    if (!networkRef.current) return;

    const options = {
      nodes: {
        shape: 'box',
        font: {
          size: 12,
          face: 'Arial',
        },
        borderWidth: 2,
        shadow: true,
      },
      edges: {
        width: 2,
        shadow: true,
        smooth: {
          enabled: true,
          type: 'continuous',
          roundness: 0.5,
        },
      },
      physics: {
        enabled: true,
        solver: 'forceAtlas2Based',
        forceAtlas2Based: {
          gravitationalConstant: -50,
          centralGravity: 0.01,
          springLength: 100,
          springConstant: 0.08,
          damping: 0.4,
        },
        stabilization: {
          enabled: true,
          iterations: 1000,
          updateInterval: 100,
        },
      },
      interaction: {
        hover: true,
        tooltipDelay: 200,
        zoomView: true,
        dragView: true,
      },
      layout: {
        improvedLayout: true,
        hierarchical: {
          enabled: false,
          direction: 'UD',
          sortMethod: 'directed',
        },
      },
      groups: {
        milestone: {
          shape: 'diamond',
          color: { background: '#fef3c7', border: '#f59e0b' },
        },
        workPackage: {
          shape: 'box',
          color: { background: '#dbeafe', border: '#3b82f6' },
        },
        subWorkPackage: {
          shape: 'box',
          color: { background: '#f3e8ff', border: '#8b5cf6' },
        },
      },
    };

    // 創建網路圖實例
    const network = new Network(
      networkRef.current,
      { nodes: networkNodes, edges: networkEdges },
      options
    );

    networkInstanceRef.current = network;

    // 事件處理
    network.on('click', (params: any) => {
      if (params.nodes.length > 0) {
        const nodeId = params.nodes[0];
        const item = scheduleItems.find(i => i.id === nodeId);
        if (item) {
          setSelectedNode(item);
          onNodeClick?.(item);
        }
      } else {
        setSelectedNode(null);
      }

      if (params.edges.length > 0) {
        const edgeId = params.edges[0];
        const dependency = dependencies.find(d => d.id === edgeId);
        if (dependency) {
          setSelectedEdge(dependency);
          onEdgeClick?.(dependency);
        }
      } else {
        setSelectedEdge(null);
      }
    });

    return () => {
      if (networkInstanceRef.current) {
        networkInstanceRef.current.destroy();
        networkInstanceRef.current = null;
      }
    };
  }, [networkNodes, networkEdges, scheduleItems, dependencies, onNodeClick, onEdgeClick]);

  // 更新網路圖數據
  useEffect(() => {
    if (networkInstanceRef.current) {
      networkInstanceRef.current.setData({ nodes: networkNodes, edges: networkEdges });
    }
  }, [networkNodes, networkEdges]);

  // 網路圖控制方法
  const fitAllNodes = () => {
    if (networkInstanceRef.current) {
      networkInstanceRef.current.fit();
    }
  };

  const focusOnNode = (nodeId: string) => {
    if (networkInstanceRef.current) {
      networkInstanceRef.current.focus(nodeId, { scale: 1.5 });
    }
  };

  const highlightCriticalPath = () => {
    // 高亮關鍵路徑（這裡可以實作更複雜的關鍵路徑算法）
    const criticalNodes = scheduleItems.filter(item => 
      getScheduleItemPriority(item) === 'critical'
    );
    
    if (networkInstanceRef.current) {
      networkInstanceRef.current.selectNodes(criticalNodes.map(item => item.id));
    }
  };

  const resetView = () => {
    if (networkInstanceRef.current) {
      networkInstanceRef.current.fit();
      networkInstanceRef.current.unselectAll();
    }
  };

  return (
    <div className="task-dependency-graph-container">
      {/* 控制列 */}
      <div className="task-dependency-graph-controls mb-4">
        <div className="flex items-center space-x-2">
          <button
            onClick={fitAllNodes}
            className={projectStyles.button.outline}
            title="適應所有節點"
          >
            適應視圖
          </button>
          <button
            onClick={highlightCriticalPath}
            className={projectStyles.button.outline}
            title="高亮關鍵路徑"
          >
            關鍵路徑
          </button>
          <button
            onClick={resetView}
            className={projectStyles.button.outline}
            title="重置視圖"
          >
            重置
          </button>
        </div>
      </div>

      {/* 網路圖容器 */}
      <div 
        ref={networkRef} 
        className="task-dependency-graph-network"
        style={{ height }}
      />

      {/* 選中節點詳情 */}
      {selectedNode && (
        <div className="task-dependency-graph-details mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
            節點詳情
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-400">名稱:</span>
              <span className="ml-2 font-medium">{selectedNode.title}</span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">類型:</span>
              <span className="ml-2 font-medium">{selectedNode.type}</span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">進度:</span>
              <span className="ml-2 font-medium">{selectedNode.progress}%</span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">狀態:</span>
              <span className="ml-2 font-medium">{getScheduleItemStatus(selectedNode)}</span>
            </div>
          </div>
        </div>
      )}

      {/* 選中邊緣詳情 */}
      {selectedEdge && (
        <div className="task-dependency-graph-details mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
            依賴關係詳情
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-400">類型:</span>
              <span className="ml-2 font-medium">{selectedEdge.type}</span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">從:</span>
              <span className="ml-2 font-medium">{selectedEdge.from}</span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">到:</span>
              <span className="ml-2 font-medium">{selectedEdge.to}</span>
            </div>
          </div>
        </div>
      )}

      {/* 圖例 */}
      <div className="task-dependency-graph-legend mt-4 p-4 bg-white dark:bg-gray-900 border rounded-lg">
        <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">圖例</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">節點類型</h5>
            <div className="space-y-2">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-yellow-400 border-2 border-yellow-600 transform rotate-45 mr-2"></div>
                <span className="text-sm">里程碑</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-blue-400 border-2 border-blue-600 mr-2"></div>
                <span className="text-sm">工作包</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-purple-400 border-2 border-purple-600 mr-2"></div>
                <span className="text-sm">子工作包</span>
              </div>
            </div>
          </div>
          <div>
            <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">依賴類型</h5>
            <div className="space-y-2">
              <div className="flex items-center">
                <div className="w-8 h-0.5 bg-blue-500 mr-2"></div>
                <span className="text-sm">完成到開始</span>
              </div>
              <div className="flex items-center">
                <div className="w-8 h-0.5 bg-yellow-500 border-dashed border-t-2 mr-2"></div>
                <span className="text-sm">開始到開始</span>
              </div>
              <div className="flex items-center">
                <div className="w-8 h-0.5 bg-red-500 mr-2"></div>
                <span className="text-sm">開始到完成</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .task-dependency-graph-container {
          width: 100%;
        }
        
        .task-dependency-graph-network {
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          overflow: hidden;
        }
        
        .task-dependency-graph-details {
          min-width: 200px;
        }
      `}</style>
    </div>
  );
}
