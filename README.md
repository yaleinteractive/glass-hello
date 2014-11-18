  1. In your Cloud9 workspace, open config.son.
  2. Update the “host” to
https://glass-hello-danmichaelson.c9.io
but replace glass-hello with your Cloud9 project name (usually your GitHub repo name), and danmichaelson with your Cloud9 user name (usually your GitHub username). Note that underscores in Cloud9 project names / GitHub repo names, are problematic.
  3. Update the “displayName” to the name of your project.
  4. Update the “id” to the name of your project in all lowercase with no punctuation.
  5. Optionally update the “contactIcon” to the URL of an image (the user sees this when she shares to your project).
  6. Go to https://console.developers.google.com/project
  7. Log in as your own Gmail address
  8. Create a project. Name it the title of your class project.
  9. On the left, go to APIs & auth → APIs
  10. Under Browse APIs, filter to “mirror”
  11. Click Google Mirror API
  12. Turn it On
  13. On the left, go to APIs & auth → Credentials
  14. Click Create new Client ID
  15. Select Web application and click Configure consent screen
  16. Select your email address, enter our project title under Product Name, and click Save
  17. Back under Create Client ID: Under Authorized JavaScript origins, add two lines:
i. The “host” from step 2.
ii. https://mirror-api-playground.appspot.com
  18. Under Authorized Redirect URIs, make sure that the following was automatically added:
https://glass-hello-danmichaelson.c9.io/oauth2callback
(but replace glass-hello-danmichaelson.c9.io with your host info)
If not, carefully add it yourself.
  19. Click Create Client ID
  20. On the next screen, Copy the Client ID and paste it into the appropriate field in config.json in your Cloud9 workspace.
  21. Do the same for Client Secret.
  22. In Cloud9, open server.js and click Run
  23. Select the URL that appears in the output panel (e.g. https://glass-hello-danmichaelson.c9.io). Press Cmd-C to copy, and paste it into a new browser tab. (Clicking to open within Cloud9 won’t work in this case.)
  24. Click the “Get it on Glass” button that appears in the browser.
  25. In this case you must authenticate using the Google account “yaleinteractive@gmail.com”, password “mobilecomputing”. This installs your app on our Glass.
  26. Close the browser tab with “Application successfully authorized!”
