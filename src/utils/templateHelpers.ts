import { Template, SubWorkpackageTemplateItem, TemplateToSubWorkpackageOptions, SubWorkpackage, Task } from '@/types/project';
import { nanoid } from 'nanoid';
import { Timestamp } from 'firebase/firestore';

/**
 * 將範本項目轉換為子工作包
 * @param templateItem 範本項目
 * @param options 轉換選項
 * @returns 子工作包實例
 */
export function templateItemToSubWorkpackage(
    templateItem: SubWorkpackageTemplateItem,
    options?: TemplateToSubWorkpackageOptions
): SubWorkpackage {
    const now = Timestamp.now();
    const { estimatedStartDate, estimatedEndDate } = options || {};

    // 創建任務
    const tasks: Task[] = (templateItem.tasks || []).map(task => ({
        id: nanoid(8),
        name: task.name,
        description: task.description || '',
        status: 'pending',
        completed: false,
        createdAt: now
    }));

    return {
        id: nanoid(8),
        name: templateItem.name,
        description: templateItem.description || '',
        estimatedQuantity: templateItem.estimatedQuantity,
        actualQuantity: 0,
        unit: templateItem.unit,
        progress: 0,
        status: 'pending',
        tasks: tasks,
        createdAt: now,
        estimatedStartDate: estimatedStartDate,
        estimatedEndDate: estimatedEndDate,
        priority: 0
    };
}

/**
 * 將整個範本轉換為一系列子工作包
 * @param template 範本
 * @param options 轉換選項
 * @returns 子工作包陣列
 */
export function templateToSubWorkpackages(
    template: Template,
    options?: TemplateToSubWorkpackageOptions
): SubWorkpackage[] {
    return template.subWorkpackages.map(item =>
        templateItemToSubWorkpackage(item, options)
    );
}

/**
 * 從 LocalStorage 取得使用者選擇的範本
 * @returns 範本或 null
 */
export function getSelectedTemplateFromStorage(): Template | null {
    if (typeof window === 'undefined') return null;

    const stored = localStorage.getItem('selectedTemplate');
    if (!stored) return null;

    try {
        return JSON.parse(stored) as Template;
    } catch (e) {
        console.error('解析儲存的範本時發生錯誤', e);
        return null;
    }
}

/**
 * 清除 LocalStorage 中的範本選擇
 */
export function clearSelectedTemplate(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('selectedTemplate');
}
