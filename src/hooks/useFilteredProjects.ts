import { useMemo } from 'react';
import { useCollection } from 'react-firebase-hooks/firestore';

import { collection, db } from '@/lib/firebase-client';
import type { ProjectDocument } from '@/types/project';
import { formatDate } from '@/utils/dateUtils';

export function useFilteredProjects(searchTerm: string) {
  const [snapshot, loading, error] = useCollection(collection(db, 'projects'));

  const projects = useMemo(() => {
    if (!snapshot) return [];

    const mappedProjects = snapshot.docs.map((doc, idx) => {
      const data = doc.data();
      return {
        id: doc.id,
        idx: idx + 1,
        projectName: data.projectName || doc.id,
        contractId: data.contractId,
        createdAt: formatDate(data.createdAt),
        status: data.status,
      } as ProjectDocument;
    });

    if (!searchTerm.trim()) {
      return mappedProjects;
    }

    const lowercasedFilter = searchTerm.trim().toLowerCase();
    return mappedProjects.filter(
      project =>
        project.projectName.toLowerCase().includes(lowercasedFilter) ||
        String(project.contractId).toLowerCase().includes(lowercasedFilter)
    );
  }, [snapshot, searchTerm]);

  return { projects, loading, error };
}
