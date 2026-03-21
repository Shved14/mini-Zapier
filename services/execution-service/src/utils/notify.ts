export async function createInAppNotification(notification: {
  userId: string;
  type: string;
  title: string;
  message: string;
  relatedId?: string;
  meta?: Record<string, any>;
}) {
  try {
    const url = `${process.env.NOTIFICATION_SERVICE_URL}/notifications/in-app`;
    if (!process.env.NOTIFICATION_SERVICE_URL) return null;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(notification),
    });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}
