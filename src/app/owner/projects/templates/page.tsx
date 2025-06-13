"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useCollection } from "react-firebase-hooks/firestore";
import { db } from "@/lib/firebase-client";
import { doc, collection, addDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { Template, SubWorkpackageTemplateItem } from "@/types/project";
import { nanoid } from "nanoid";
import { Timestamp } from 'firebase/firestore';

export default function TemplatesAdminPage() {
  const { user } = useAuth();
  const router = useRouter();
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
    if (!newItem.name) return;
    setTemplateItems([...templateItems, { id: nanoid(8), ...newItem }]);
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
    <main className="max-w-3xl mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">工作包範本管理</h1>
        <button
          className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition"
          onClick={() => setShowModal(true)}
        >
          新增範本
        </button>
      </div>

      {msg && (
        <div className="mb-3 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100 px-3 py-2 rounded relative">
          {msg}
          <button
            className="absolute right-2 top-2 text-lg text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
            onClick={() => setMsg(null)}
            aria-label="關閉"
          >✕</button>
        </div>
      )}

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        {templates.map(template => (
          <div
            key={template.id}
            className="border border-gray-200 dark:border-gray-700 rounded p-3 bg-white dark:bg-gray-800 shadow-sm flex flex-col gap-2"
          >
            <div className="flex justify-between items-center">
              <b className="text-gray-900 dark:text-gray-100">{template.name}</b>
              <span className="text-xs text-gray-500 dark:text-gray-400">{template.category}</span>
            </div>
            <div className="text-gray-600 dark:text-gray-300">{template.description || "無描述"}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">子項目 {template.subWorkpackages?.length || 0}</div>
            <div className="flex gap-2">
              <button
                className="px-2 py-1 rounded bg-green-600 text-white hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-sm"
                onClick={() => handleEditTemplate(template)}
              >編輯</button>
              <button
                className="px-2 py-1 rounded bg-red-600 text-white hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-sm"
                onClick={() => handleDeleteTemplate(template.id)}
              >刪除</button>
            </div>
          </div>
        ))}
        {templates.length === 0 && (
          <div className="col-span-2 text-center py-8 border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800">
            尚未建立任何範本
            <div>
              <button
                className="mt-3 px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                onClick={() => setShowModal(true)}
              >建立第一個範本</button>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/20 dark:bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-lg min-w-[320px] max-w-xl w-full shadow-lg">
            <h2 className="text-lg font-bold mb-3 text-gray-800 dark:text-gray-100">{currentId ? "編輯範本" : "新增範本"}</h2>
            <div className="flex gap-3 mb-2">
              <input
                className="flex-1 px-2 py-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                value={newTemplate.name}
                onChange={e => setNewTemplate({ ...newTemplate, name: e.target.value })}
                placeholder="範本名稱"
              />
              <select
                className="px-2 py-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                value={newTemplate.category}
                onChange={e => setNewTemplate({ ...newTemplate, category: e.target.value })}
              >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <textarea
              className="w-full mb-2 px-2 py-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              value={newTemplate.description}
              onChange={e => setNewTemplate({ ...newTemplate, description: e.target.value })}
              placeholder="描述"
              rows={2}
            />
            <div>
              <b className="text-gray-800 dark:text-gray-100">子工作包項目</b>
              {templateItems.length > 0 && (
                <table className="w-full mb-2 text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-100 dark:bg-gray-800">
                      <th className="p-1 text-left font-medium text-gray-700 dark:text-gray-200">名稱</th>
                      <th className="p-1 text-left font-medium text-gray-700 dark:text-gray-200">描述</th>
                      <th className="p-1 text-left font-medium text-gray-700 dark:text-gray-200">單位</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {templateItems.map(item => (
                      <tr key={item.id} className="border-b border-gray-100 dark:border-gray-700">
                        <td className="p-1 text-gray-900 dark:text-gray-100">{item.name}</td>
                        <td className="p-1 text-gray-700 dark:text-gray-300">{item.description}</td>
                        <td className="p-1 text-gray-700 dark:text-gray-300">{item.unit}</td>
                        <td className="p-1">
                          <button
                            className="px-2 py-0.5 rounded bg-red-500 text-white hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-xs"
                            onClick={() => handleRemoveItem(item.id)}
                          >移除</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <div className="flex gap-2 mb-2">
                <input
                  className="flex-1 px-2 py-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  value={newItem.name}
                  onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                  placeholder="名稱"
                />
                <input
                  className="flex-1 px-2 py-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  value={newItem.description}
                  onChange={e => setNewItem({ ...newItem, description: e.target.value })}
                  placeholder="描述"
                />
                <select
                  className="px-2 py-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  value={newItem.unit}
                  onChange={e => setNewItem({ ...newItem, unit: e.target.value })}
                >
                  {units.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
                <button
                  className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-sm"
                  onClick={handleAddItem}
                  disabled={!newItem.name}
                >新增</button>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                className="px-4 py-1 rounded bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
                onClick={handleCloseModal}
              >取消</button>
              <button
                className="px-4 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                onClick={handleSaveTemplate}
                disabled={saving || !newTemplate.name || templateItems.length === 0}
              >
                {saving ? "儲存中" : "儲存"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}