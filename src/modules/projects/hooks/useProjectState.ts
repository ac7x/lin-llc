import { useState, useCallback } from 'react';

interface Project {
  id: string;
  projectName: string;
  status: string;
  [key: string]: any;
}

export function useProjectState(initialProject?: Project) {
  const [project, setProject] = useState<Project | undefined>(initialProject);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const updateProject = useCallback((updates: Partial<Project>) => {
    if (!project) return;
    setProject((prev: Project | undefined) => prev ? { ...prev, ...updates } : undefined);
  }, [project]);

  const resetProject = useCallback((newProject?: Project) => {
    setProject(newProject);
    setIsEditing(false);
    setIsLoading(false);
  }, []);

  const startEditing = useCallback(() => {
    setIsEditing(true);
  }, []);

  const stopEditing = useCallback(() => {
    setIsEditing(false);
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setIsLoading(loading);
  }, []);

  return {
    project,
    isEditing,
    isLoading,
    updateProject,
    resetProject,
    startEditing,
    stopEditing,
    setLoading,
  };
} 