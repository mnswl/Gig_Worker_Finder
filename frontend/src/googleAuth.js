/* Google Identity utility: safely loads Google Identity Services script and prompts One Tap. */
export const promptGoogleLogin = (onSuccess, onError) => {
  const CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;
  if (!CLIENT_ID) {
    const err = new Error('Google Client ID (REACT_APP_GOOGLE_CLIENT_ID) is not set');
    console.error(err);
    if (onError) onError(err);
    return;
  }

  const doPrompt = () => {
    try {
      /* global google */
      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: ({ credential }) => onSuccess(credential),
      });
      window.google.accounts.id.prompt();
    } catch (e) {
      console.error('Failed to initialize Google Accounts', e);
      if (onError) onError(e);
    }
  };

  // If script already present, run immediately
  if (window.google && window.google.accounts) {
    doPrompt();
    return;
  }

  // Else try to load the script dynamically and then prompt
  const existing = document.getElementById('gsi-script');
  if (existing) {
    existing.addEventListener('load', doPrompt, { once: true });
    return;
  }
  const script = document.createElement('script');
  script.src = 'https://accounts.google.com/gsi/client';
  script.async = true;
  script.defer = true;
  script.id = 'gsi-script';
  script.onload = doPrompt;
  script.onerror = (e) => {
    console.error('Failed to load Google Identity script', e);
    if (onError) onError(e);
  };
  document.head.appendChild(script);
};
