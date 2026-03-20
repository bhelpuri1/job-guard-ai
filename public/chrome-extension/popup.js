document.addEventListener('DOMContentLoaded', () => {
  const scanBtn = document.getElementById('scanBtn');
  const loader = document.getElementById('loader');
  const errorDiv = document.getElementById('error');
  
  // IMPORTANT: Replace this with your deployed frontend URL
  const APP_URL = 'https://YOUR_APP_URL.run.app';

  scanBtn.addEventListener('click', async () => {
    scanBtn.disabled = true;
    loader.classList.add('show');
    errorDiv.classList.remove('show');

    try {
      // Get active tab content
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      const injectionResults = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => document.body.innerText
      });

      const pageText = injectionResults[0].result;
      
      // Limit text length to avoid URL too large
      const jobContent = pageText.substring(0, 4000);

      // Open the app in a new tab with the job content
      chrome.tabs.create({ 
        url: `${APP_URL}/?job=${encodeURIComponent(jobContent)}` 
      });

    } catch (err) {
      errorDiv.textContent = err.message || 'An error occurred.';
      errorDiv.classList.add('show');
    } finally {
      scanBtn.disabled = false;
      loader.classList.remove('show');
    }
  });
});
