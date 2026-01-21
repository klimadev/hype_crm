import { NextRequest, NextResponse } from 'next/server';
import { query, getOne } from '@/lib/db';
import { ReminderLog, ReminderStats } from '@/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productId = parseInt(id);

    const pendingCount = await getOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM reminder_logs WHERE product_id = ? AND status = 'pending'`,
      [productId]
    );

    const today = new Date().toISOString().split('T')[0];
    const sentToday = await getOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM reminder_logs WHERE product_id = ? AND status = 'sent' AND date(datetime(sent_at, 'unixepoch')) = ?`,
      [productId, today]
    );

    const nextReminder = await query<{
      lead_name: string;
      product_name: string;
      scheduled_at: number;
      message_preview: string;
    }>(`
      SELECT 
        l.name as lead_name,
        p.name as product_name,
        rl.scheduled_at,
        rl.message_preview
      FROM reminder_logs rl
      INNER JOIN leads l ON rl.lead_id = l.id
      INNER JOIN products p ON rl.product_id = p.id
      WHERE rl.product_id = ? AND rl.status = 'pending'
      ORDER BY rl.scheduled_at ASC
      LIMIT 1
    `, [productId]);

    let timeRemaining = null;
    if (nextReminder.length > 0 && nextReminder[0].scheduled_at) {
      let scheduled: Date;
      if (typeof nextReminder[0].scheduled_at === 'number') {
        scheduled = new Date(nextReminder[0].scheduled_at * 1000);
      } else {
        scheduled = new Date(nextReminder[0].scheduled_at);
      }
      const now = new Date();
      const diffMs = scheduled.getTime() - now.getTime();
      
      if (diffMs > 0) {
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        timeRemaining = `${hours}h ${minutes}m`;
      } else {
        timeRemaining = 'Atrasado';
      }
    }

    const stats: ReminderStats = {
      pending: pendingCount?.count || 0,
      sent_today: sentToday?.count || 0,
      next_reminder: nextReminder.length > 0 ? {
        lead_name: nextReminder[0].lead_name,
        product_name: nextReminder[0].product_name,
        time_remaining: timeRemaining || 'N/A',
        message_preview: nextReminder[0].message_preview || '',
      } : null,
    };

    const recentLogs = await query<ReminderLog>(`
      SELECT 
        rl.*,
        l.name as lead_name,
        p.name as product_name
      FROM reminder_logs rl
      INNER JOIN leads l ON rl.lead_id = l.id
      INNER JOIN products p ON rl.product_id = p.id
      WHERE rl.product_id = ?
      ORDER BY rl.created_at DESC
      LIMIT 20
    `, [productId]);

    return NextResponse.json({
      stats,
      recent_logs: recentLogs,
    });
  } catch (error) {
    console.error('Error fetching reminder status:', error);
    return NextResponse.json({ error: 'Failed to fetch reminder status' }, { status: 500 });
  }
}
