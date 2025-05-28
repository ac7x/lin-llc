// ProjectList.tsx
import React from "react";
import { useDrag, DragSourceMonitor } from "react-dnd";

export interface Project {
  id: string;
  name: string;
}

interface ProjectListProps {
  projects: Project[];
}

export function ProjectList({ projects }: ProjectListProps) {
  if (!projects || projects.length === 0) {
    return <div>沒有專案</div>;
  }
  return (
    <div>
      {projects.map((project) => (
        <DraggableProject key={project.id} project={project} />
      ))}
    </div>
  );
}

interface DraggableProjectProps {
  project: Project;
}

function DraggableProject({ project }: DraggableProjectProps) {
  const [{ isDragging }, drag] = useDrag<
    Project,
    void,
    { isDragging: boolean }
  >({
    type: "PROJECT",
    item: { ...project },
    collect: (monitor: DragSourceMonitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <div
      ref={drag as unknown as React.Ref<HTMLDivElement>}
      style={{
        opacity: isDragging ? 0.5 : 1,
        border: "1px solid #ccc",
        padding: "4px 8px",
        marginBottom: "4px",
        background: "#fff",
        cursor: "move"
      }}
    >
      {project.name}
    </div>
  );
}