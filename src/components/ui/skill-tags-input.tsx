import React, { useState, KeyboardEvent, ChangeEvent } from 'react';
import { Input } from './input';
import { Badge } from './badge';
import { X } from 'lucide-react';

interface SkillTagsInputProps {
  value: string[];
  onChange: (skills: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function SkillTagsInput({ value, onChange, placeholder, disabled }: SkillTagsInputProps) {
  const [input, setInput] = useState('');

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;
    if ((e.key === 'Enter' || e.key === ',')) {
      e.preventDefault();
      const newTag = input.trim();
      if (newTag && !value.includes(newTag)) {
        onChange([...value, newTag]);
      }
      setInput('');
    } else if (e.key === 'Backspace' && !input && value.length > 0) {
      // 按 Backspace 且 input 為空時移除最後一個 tag
      onChange(value.slice(0, -1));
    }
  };

  const handleRemove = (tag: string) => {
    onChange(value.filter((t) => t !== tag));
  };

  return (
    <div className="flex flex-wrap items-center gap-2 border rounded-md px-2 py-1 bg-background focus-within:ring-2 ring-ring">
      {value.map((tag) => (
        <Badge key={tag} variant="secondary" className="flex items-center gap-1">
          {tag}
          <button
            type="button"
            className="ml-1 text-xs text-muted-foreground hover:text-destructive focus:outline-none"
            onClick={() => handleRemove(tag)}
            tabIndex={-1}
            aria-label="移除技能"
            disabled={disabled}
          >
            <X className="w-3 h-3" />
          </button>
        </Badge>
      ))}
      <Input
        className="flex-1 min-w-[80px] border-0 shadow-none focus:ring-0 focus-visible:ring-0 px-1 py-0 h-7"
        value={input}
        onChange={handleInputChange}
        onKeyDown={handleInputKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        type="text"
        aria-label="新增技能標籤"
      />
    </div>
  );
} 