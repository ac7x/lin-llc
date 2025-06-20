/**
 * 專案範本管理頁面
 * 
 * 提供專案範本的管理功能，包含：
 * - 範本新增/編輯/刪除
 * - 範本項目管理
 * - 範本預覽
 * - 範本匯出/匯入
 * - 範本分類管理
 */

"use client";

import { useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useCollection } from "react-firebase-hooks/firestore";
import { db } from "@/lib/firebase-client";
import { doc, collection, addDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { Template, SubWorkpackageTemplateItem } from "@/types/project";
import { nanoid } from "nanoid";
import { Timestamp } from 'firebase/firestore';

export default function TemplatesAdminPage() {
  const { user } = useAuth();
  const [templatesSnapshot] = useCollection(collection(db, "templates"));
  const [showModal, setShowModal] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const [newTemplate, setNewTemplate] = useState({
    name: "",
    description: "",
    category: "建築",
  });
  const [templateItems, setTemplateItems] = useState<SubWorkpackageTemplateItem[]>([]);
  const [newItem, setNewItem] = useState({
    name: "",
    description: "",
    unit: "項",
  });

  const templates = useMemo(() => {
    if (!templatesSnapshot) return [];
    return templatesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    })) as Template[];
  }, [templatesSnapshot]);

  const categories = [
    "水電", "清潔", "沐運", "測試", "維護", "其他"
  ];
  const units = [
    "項", "個", "塊", "片", "組", "套", "張", "米", "公尺", "公分", "坪", "平方公尺", "立方公尺", "噸"
  ];

  const handleAddItem = () => {
    if (!newItem.name || !user) return;
    const now = Timestamp.now();
    setTemplateItems([...templateItems, {
      id: nanoid(8),
      ...newItem,
      createdBy: user.uid,
      createdAt: now,
      updatedAt: now
    }]);
    setNewItem({ name: "", description: "", unit: "項" });
  };

  const handleRemoveItem = (itemId: string) => {
    setTemplateItems(items => items.filter(item => item.id !== itemId));
  };

  const handleSaveTemplate = async () => {
    if (!newTemplate.name || templateItems.length === 0 || saving) return;
    if (!user) {
      setMsg("請先登入");
      return;
    }
    setSaving(true);
    try {
      const now = Timestamp.now();
      const templateData: Omit<Template, 'id'> = {
        ...newTemplate,
        subWorkpackages: templateItems,
        createdBy: user.uid,
        createdAt: now,
        updatedAt: now,
      };
      if (currentId) {
        await updateDoc(doc(db, "templates", currentId), templateData);
        setMsg("已更新");
      } else {
        await addDoc(collection(db, "templates"), templateData);
        setMsg("已建立");
      }
      setShowModal(false);
      resetForm();
    } catch {
      setMsg("儲存失敗");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm("確定要刪除？")) return;
    try {
      await deleteDoc(doc(db, "templates", templateId));
      setMsg("已刪除");
    } catch {
      setMsg("刪除失敗");
    }
  };

  const handleEditTemplate = (template: Template) => {
    setCurrentId(template.id);
    setNewTemplate({
      name: template.name,
      description: template.description,
      category: template.category,
    });
    setTemplateItems(template.subWorkpackages || []);
    setShowModal(true);
  };

  const resetForm = () => {
    setNewTemplate({ name: "", description: "", category: "建築" });
    setTemplateItems([]);
    setCurrentId(null);
  };

  const handleCloseModal = () => {
    resetForm();
    setShowModal(false);
  };

  return (
    <main className="max-w-4xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">工作包範本管理</h1>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center"
            onClick={() => setShowModal(true)}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            新增範本
          </button>
        </div>

        {msg && (
          <div className="mb-6 bg-blue-50 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 p-4 rounded-lg relative">
            {msg}
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
              onClick={() => setMsg(null)}
              aria-label="關閉"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
          {templates.map(template => (
            <div
              key={template.id}
              className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">{template.name}</h3>
                  <span className="inline-block px-2 py-1 mt-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full">
                    {template.category}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    className="p-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors duration-200"
                    onClick={() => handleEditTemplate(template)}
                    title="編輯"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    className="p-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors duration-200"
                    onClick={() => handleDeleteTemplate(template.id)}
                    title="刪除"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-3">{template.description || "無描述"}</p>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                子項目數量：{template.subWorkpackages?.length || 0}
              </div>
            </div>
          ))}
          {templates.length === 0 && (
            <div className="col-span-2 text-center py-12 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
              <svg className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-500 dark:text-gray-400 mb-4">尚未建立任何範本</p>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 inline-flex items-center"
                onClick={() => setShowModal(true)}
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                建立第一個範本
              </button>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-2xl">
            <h2 className="text-xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
              {currentId ? "編輯範本" : "新增範本"}
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">範本名稱</label>
                  <input
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                    value={newTemplate.name}
                    onChange={e => setNewTemplate({ ...newTemplate, name: e.target.value })}
                    placeholder="範本名稱"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">類別</label>
                  <select
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                    value={newTemplate.category}
                    onChange={e => setNewTemplate({ ...newTemplate, category: e.target.value })}
                  >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">描述</label>
                <textarea
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                  value={newTemplate.description}
                  onChange={e => setNewTemplate({ ...newTemplate, description: e.target.value })}
                  placeholder="描述"
                  rows={3}
                />
              </div>
              <div>
                <h3 className="text-lg font-medium mb-3 text-gray-900 dark:text-gray-100">子工作包項目</h3>
                {templateItems.length > 0 && (
                  <div className="mb-4 overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-50 dark:bg-gray-900">
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">名稱</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">描述</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">單位</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {templateItems.map(item => (
                          <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors duration-200">
                            <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">{item.name}</td>
                            <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300">{item.description}</td>
                            <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300">{item.unit}</td>
                            <td className="px-4 py-2 text-sm">
                              <button
                                className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors duration-200"
                                onClick={() => handleRemoveItem(item.id)}
                                title="移除"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <input
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                      value={newItem.name}
                      onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                      placeholder="名稱"
                    />
                  </div>
                  <div>
                    <input
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                      value={newItem.description}
                      onChange={e => setNewItem({ ...newItem, description: e.target.value })}
                      placeholder="描述"
                    />
                  </div>
                  <div>
                    <select
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                      value={newItem.unit}
                      onChange={e => setNewItem({ ...newItem, unit: e.target.value })}
                    >
                      {units.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                  <div>
                    <button
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={handleAddItem}
                      disabled={!newItem.name}
                    >
                      新增項目
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                onClick={handleCloseModal}
              >
                取消
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleSaveTemplate}
                disabled={saving || !newTemplate.name || templateItems.length === 0}
              >
                {saving ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    儲存中
                  </span>
                ) : "儲存"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}