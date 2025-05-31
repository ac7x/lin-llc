"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useDocument } from "react-firebase-hooks/firestore";
import { doc } from "firebase/firestore";
import { db } from "@/modules/shared/infrastructure/persistence/firebase/firebase-client";
import { Project, Zone } from "@/types/project";
import { Disclosure } from '@headlessui/react';

export default function ProjectDetailPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const projectId = params?.project as string;
    const [projectDoc, loading, error] = useDocument(doc(db, "projects", projectId));

    if (loading) return <div>載入中...</div>;
    if (error) return <div>錯誤: {error.message}</div>;
    if (!projectDoc?.exists()) return <div>找不到專案</div>;

    const project = projectDoc.data() as Project;

    return (
        <main className="max-w-4xl mx-auto p-4">
            <h1 className="text-2xl font-bold mb-6">{project.projectName}</h1>

            {/* 專案基本資訊 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
                <h2 className="text-xl font-bold mb-4">專案資訊</h2>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-gray-500">協調者</label>
                        <div>{project.coordinator || '-'}</div>
                    </div>
                    <div>
                        <label className="text-gray-500">監工</label>
                        <div>{project.supervisor || '-'}</div>
                    </div>
                    <div>
                        <label className="text-gray-500">安全人員</label>
                        <div>{project.safetyOfficer || '-'}</div>
                    </div>
                    <div>
                        <label className="text-gray-500">地區</label>
                        <div>{project.region || '-'}</div>
                    </div>
                    <div>
                        <label className="text-gray-500">地址</label>
                        <div>{project.address || '-'}</div>
                    </div>
                    <div>
                        <label className="text-gray-500">起始日</label>
                        <div>{project.startDate ? new Date(project.startDate).toLocaleDateString() : '-'}</div>
                    </div>
                    <div>
                        <label className="text-gray-500">預估結束日</label>
                        <div>{project.estimatedEndDate ? new Date(project.estimatedEndDate).toLocaleDateString() : '-'}</div>
                    </div>
                    <div>
                        <label className="text-gray-500">業主</label>
                        <div>{project.owner || '-'}</div>
                    </div>
                </div>
            </div>

            {/* 分區列表 */}
            {project.zones && project.zones.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                    <Disclosure defaultOpen={false}>
                        {({ open }) => (
                            <div>
                                <Disclosure.Button className="w-full px-6 py-3 flex items-center justify-between bg-gray-50 dark:bg-gray-900 rounded-t-lg">
                                    <h2 className="text-xl font-bold">工作分區</h2>
                                    <span className="text-xl">{open ? '−' : '+'}</span>
                                </Disclosure.Button>
                                <Disclosure.Panel className="p-6">
                                    <div className="grid gap-4">
                                        {project.zones.map((zone: Zone) => (
                                            <div
                                                key={zone.zoneId}
                                                className={`p-4 border rounded-lg ${searchParams.get('zone') === zone.zoneId
                                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                                    : ''
                                                    }`}
                                            >
                                                <h3 className="font-bold mb-2">{zone.zoneName}</h3>
                                                <p className="text-gray-600 dark:text-gray-400">{zone.desc || '暫無描述'}</p>
                                            </div>
                                        ))}
                                    </div>
                                </Disclosure.Panel>
                            </div>
                        )}
                    </Disclosure>
                </div>
            )}
        </main>
    );
}