import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

/**
 * 活動日誌的篩選器元件
 */
export function LogFilter() {
  return (
    <div className='flex items-center space-x-4'>
      <Input placeholder='搜尋日誌...' className='max-w-sm' />
      <Select>
        <SelectTrigger className='w-[180px]'>
          <SelectValue placeholder='篩選類型' />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='all'>所有類型</SelectItem>
          <SelectItem value='error'>錯誤</SelectItem>
          <SelectItem value='update'>更新</SelectItem>
          <SelectItem value='create'>建立</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
