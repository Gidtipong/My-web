export interface NotificationPayload {
  title: string;
  message: string;
  items?: string[];
  level?: "info" | "warning" | "critical";
  url?: string;
}

export interface NotificationService {
  send(payload: NotificationPayload): Promise<{ success: boolean; error?: string }>;
}

class TelegramNotifier implements NotificationService {
  async send(payload: NotificationPayload): Promise<{ success: boolean; error?: string }> {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
      console.warn(
        "[Notify] Telegram credentials not configured. Logging notification to console instead:\n",
        `[${payload.level || "INFO"}] ${payload.title}\n${payload.message}\n` +
          (payload.items ? payload.items.join("\n") : "")
      );
      return { success: true };
    }

    try {
      const icon =
        payload.level === "critical"
          ? "🚨"
          : payload.level === "warning"
          ? "⚠️"
          : "ℹ️";

      let text = `<b>${icon} NetTask: ${payload.title}</b>\n\n${payload.message}`;

      if (payload.items && payload.items.length > 0) {
        text += "\n\n" + payload.items.map((it) => `• ${it}`).join("\n");
      }

      if (payload.url) {
        text += `\n\n<a href="${payload.url}">View in NetTask</a>`;
      }

      const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: "HTML",
          disable_web_page_preview: true,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error("[Notify] Telegram API error:", errText);
        return { success: false, error: errText };
      }

      return { success: true };
    } catch (error: any) {
      console.error("[Notify] Failed to send Telegram notification:", error);
      return { success: false, error: error.message };
    }
  }
}

// Global Notifier instance (can be switched or chained to Discord/Resend)
export const notifier: NotificationService = new TelegramNotifier();

export async function sendDailyDigest(data: {
  overdueTasks: Array<{ title: string; priority: string; dueDate: Date | null }>;
  todayTasks: Array<{ title: string; priority: string }>;
  expiringDevices: Array<{ hostname: string; model: string; daysLeft: number }>;
}) {
  const items: string[] = [];

  if (data.overdueTasks.length > 0) {
    items.push(`<b>🔴 Overdue Tasks (${data.overdueTasks.length}):</b>`);
    data.overdueTasks.forEach((t) => {
      items.push(`  - [${t.priority}] ${t.title}`);
    });
  }

  if (data.todayTasks.length > 0) {
    items.push(`<b>📅 Due Today (${data.todayTasks.length}):</b>`);
    data.todayTasks.forEach((t) => {
      items.push(`  - [${t.priority}] ${t.title}`);
    });
  }

  if (data.expiringDevices.length > 0) {
    items.push(`<b>⚠️ Licenses/Warranties Expiring Soon (${data.expiringDevices.length}):</b>`);
    data.expiringDevices.forEach((d) => {
      items.push(`  - ${d.hostname} (${d.model}) in ${d.daysLeft} days`);
    });
  }

  if (items.length === 0) {
    items.push("✅ All tasks are up to date. No immediate network expirations.");
  }

  return notifier.send({
    title: "Daily Morning Digest (08:00 BKK)",
    message: "Here is your morning network operations briefing:",
    items,
    level: data.overdueTasks.length > 0 ? "critical" : data.expiringDevices.length > 0 ? "warning" : "info",
  });
}
