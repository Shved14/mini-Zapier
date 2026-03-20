interface CreateInAppNotification {
  userId: string;
  type: string;
  title: string;
  message: string;
  relatedId?: string;
}

export async function createInAppNotification(notification: CreateInAppNotification) {
  try {
    const url = `${process.env.NOTIFICATION_SERVICE_URL}/notifications/in-app`;
    console.log('Creating notification at:', url, 'with data:', notification);
    const response = await fetch(url, {
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
