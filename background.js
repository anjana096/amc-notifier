let pollingInterval;
let lastNotificationId = null;

chrome.runtime.onInstalled.addListener(() => {
  // Set up a recurring alarm to reload the extension every 1 hour
  chrome.alarms.create("reloadExtension", { periodInMinutes: 60 });
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "reloadExtension") {
    chrome.runtime.reload();
  }
});

chrome.runtime.onInstalled.addListener(() => {
  // Start the notification polling loop
  startNotificationPolling();
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "startNotificationPolling") {
    startNotificationPolling(message.accessToken);
  }
});

function startNotificationPolling(accessToken) {
  // Clear any existing polling interval
  clearInterval(pollingInterval);

  // Set up a new polling interval
  pollingInterval = setInterval(async () => {
    try {
      await checkNotifications(accessToken);
    } catch (error) {
      console.error(error);
    }
  }, 10000); // Poll every 10 seconds
}

async function checkNotifications(accessToken) {
  // Use access_token for GET request to fetch notifications
  const notificationsResponse = await fetch(
    "http://0.0.0.0:8055/notifications?filter[_and][0][recipient][_eq]=821493c8-99e9-4626-87c8-cca92c667d2d&filter[_and][1][status][_eq]=inbox&fields[]=id&fields[]=subject&fields[]=collection&fields[]=item&fields[]=timestamp&sort[]=-timestamp&limit=1",
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
  const notificationsData = await notificationsResponse.json();

  if (
    notificationsData &&
    notificationsData.data &&
    notificationsData.data.length > 0
  ) {
    // Extract id and subject from response
    const id = notificationsData.data[0].id;
    const subject = notificationsData.data[0].subject;

    // Check if the subject is "You_have_new_walkin_user"
    if (subject === "You_have_new_walkin_user" && id !== lastNotificationId) {
      // Update the lastNotificationId
      lastNotificationId = id;

      // Show a popup notification
      chrome.notifications.create({
        type: "basic",
        iconUrl: "logo.png",
        title: "New Walk-In User",
        message: "You have a new walk-in user!",
        requireInteraction: true, // Make the notification persistent until closed
      });
    }
  }
}
