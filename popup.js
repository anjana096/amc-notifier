document.addEventListener("DOMContentLoaded", async function () {
  const loginForm = document.getElementById("loginForm");
  const statusDiv = document.getElementById("status");
  const notificationStatusDiv = document.getElementById("notificationStatus");

  const accessToken = await getStoredAccessToken();

  if (accessToken) {
    // User is already logged in
    loginForm.style.display = "none";
    statusDiv.textContent = "Logged in successfully ";
    notificationStatusDiv.textContent = "Checking for notifications...";

    // Start notification polling in the background script
    chrome.runtime.sendMessage({
      action: "startNotificationPolling",
      accessToken: accessToken,
    });
  } else {
    // User is not logged in
    statusDiv.style.display = "none";
    notificationStatusDiv.style.display = "none";
  }

  loginForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const email = loginForm.email.value;
    const password = loginForm.password.value;

    try {
      const newAccessToken = await getAccessToken(email, password);
      await storeAccessToken(newAccessToken);

      loginForm.style.display = "none";
      statusDiv.style.display = "block"; // Show the status div
      statusDiv.textContent = "Logged in suucessfully";
      notificationStatusDiv.style.display = "block"; // Show the notification status div
      notificationStatusDiv.textContent = "Checking for notifications...";

      // Start notification polling in the background script
      chrome.runtime.sendMessage({
        action: "startNotificationPolling",
        accessToken: newAccessToken,
      });
    } catch (error) {
      statusDiv.textContent = "Login failed. Please check your credentials.";
      console.error(error);
    }
  });

  async function getStoredAccessToken() {
    return new Promise((resolve) => {
      chrome.storage.local.get(["accessToken"], (result) => {
        resolve(result.accessToken);
      });
    });
  }

  async function storeAccessToken(accessToken) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ accessToken: accessToken }, () => {
        resolve();
      });
    });
  }

  async function getAccessToken(email, password) {
    const response = await fetch("http://0.0.0.0:8055/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email,
        password: password,
      }),
    });

    const data = await response.json();
    return data.data.access_token;
  }
});
