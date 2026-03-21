interface CreateInAppNotification {
  userId: string;
  type: string;
  title: string;
  message: string;
  relatedId?: string;
  meta?: Record<string, any>;
}

export async function lookupUserByEmail(email: string): Promise<{ id: string; email: string; name?: string } | null> {
  try {
    const url = `${process.env.AUTH_SERVICE_URL}/auth/users/by-email/${encodeURIComponent(email)}`;
    const response = await fetch(url);
    if (!response.ok) return null;
    return (await response.json()) as { id: string; email: string; name?: string };
  } catch {
    return null;
  }
}

export async function createInAppNotification(notification: CreateInAppNotification) {
  try {
    const url = `${process.env.NOTIFICATION_SERVICE_URL}/notifications/in-app`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(notification),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('Failed to create notification:', response.status, text);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
}
