interface CreateInAppNotification {
  userId: string;
  type: string;
  title: string;
  message: string;
  relatedId?: string;
}

export async function createInAppNotification(notification: CreateInAppNotification) {
  try {
    const response = await fetch(`${process.env.NOTIFICATION_SERVICE_URL}/api/notifications/in-app`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(notification),
    });

    if (!response.ok) {
      console.error('Failed to create notification:', response.statusText);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
}
