"use client";

import { useState, useMemo } from "react";
import { useFirebase } from "@/hooks/useFirebase";
import { Timestamp } from "firebase/firestore";
import { useCollection } from "react-firebase-hooks/firestore";
import { Template, SubWorkpackageTemplateItem } from "@/types/project";
import { nanoid } from "nanoid";

export default function TemplatesAdminPage() {
  const { db, doc, collection, addDoc, updateDoc, deleteDoc, auth } = useFirebase();
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
    setSaving(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error();
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
    <main style={{ maxWidth: 900, margin: "0 auto", padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <h1>工作包範本管理</h1>
        <button onClick={() => setShowModal(true)}>新增範本</button>
      </div>

      {msg && (
        <div style={{ marginBottom: 12 }}>
          {msg}
          <button style={{ float: "right" }} onClick={() => setMsg(null)}>✕</button>
        </div>
      )}

      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "1fr 1fr" }}>
        {templates.map(template => (
          <div key={template.id} style={{ border: "1px solid #ddd", padding: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <b>{template.name}</b>
              <span>{template.category}</span>
            </div>
            <div>{template.description || "無描述"}</div>
            <div>子項目 {template.subWorkpackages?.length || 0}</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => handleEditTemplate(template)}>編輯</button>
              <button onClick={() => handleDeleteTemplate(template.id)}>刪除</button>
            </div>
          </div>
        ))}
        {templates.length === 0 && (
          <div style={{ gridColumn: "1/3", textAlign: "center", padding: 32, border: "1px solid #ddd" }}>
            尚未建立任何範本
            <div>
              <button style={{ marginTop: 12 }} onClick={() => setShowModal(true)}>建立第一個範本</button>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div style={{
          position: "fixed", left: 0, top: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.2)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50
        }}>
          <div style={{ background: "#fff", padding: 24, borderRadius: 8, minWidth: 320, maxWidth: 600, width: "100%" }}>
            <h2>{currentId ? "編輯範本" : "新增範本"}</h2>
            <div style={{ display: "flex", gap: 12, marginBottom: 8 }}>
              <input
                value={newTemplate.name}
                onChange={e => setNewTemplate({ ...newTemplate, name: e.target.value })}
                placeholder="範本名稱"
                style={{ flex: 1 }}
              />
              <select
                value={newTemplate.category}
                onChange={e => setNewTemplate({ ...newTemplate, category: e.target.value })}
              >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <textarea
              value={newTemplate.description}
              onChange={e => setNewTemplate({ ...newTemplate, description: e.target.value })}
              placeholder="描述"
              style={{ width: "100%", marginBottom: 8 }}
              rows={2}
            />
            <div>
              <b>子工作包項目</b>
              {templateItems.length > 0 && (
                <table style={{ width: "100%", marginBottom: 8 }}>
                  <thead>
                    <tr>
                      <th>名稱</th>
                      <th>描述</th>
                      <th>單位</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {templateItems.map(item => (
                      <tr key={item.id}>
                        <td>{item.name}</td>
                        <td>{item.description}</td>
                        <td>{item.unit}</td>
                        <td>
                          <button onClick={() => handleRemoveItem(item.id)}>移除</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                <input
                  value={newItem.name}
                  onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                  placeholder="名稱"
                  style={{ flex: 1 }}
                />
                <input
                  value={newItem.description}
                  onChange={e => setNewItem({ ...newItem, description: e.target.value })}
                  placeholder="描述"
                  style={{ flex: 1 }}
                />
                <select
                  value={newItem.unit}
                  onChange={e => setNewItem({ ...newItem, unit: e.target.value })}
                >
                  {units.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
                <button onClick={handleAddItem} disabled={!newItem.name}>新增</button>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button onClick={handleCloseModal}>取消</button>
              <button
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