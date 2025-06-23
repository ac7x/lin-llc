import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { LogFilter } from './LogFilter';

/**
 * 顯示活動日誌的元件
 */
export function ActivityLog() {
  return (
    <Card>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <div>
            <CardTitle>活動日誌</CardTitle>
            <CardDescription>最近的系統活動紀錄</CardDescription>
          </div>
          <LogFilter />
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>使用者</TableHead>
              <TableHead>操作</TableHead>
              <TableHead>時間</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={3} className='text-center text-muted-foreground'>
                尚無活動紀錄
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
