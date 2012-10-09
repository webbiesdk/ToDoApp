I recommended to replace " <html manifest="offline.manifest"> " with " <html>" in index.html when testing. Because storing the app permanently in the browser cache can make it difficult to debug. 

To install, replace the dummy text with you data in these locations:

1. backend.php, replace the MySQL login data to your setup.

(The next 2 is if you want push sync with Pusher.com to work). 

2. functions.php, uncomment the last 2 lines in the function "pusher_sync" and replace app_id, key and secret with your data from you pusher account.
3. js/script.js, uncomment lines 718 to 746 by removing "/*" and "*/", and replace with your data the places it says 'Your pusher key thing' and 'Channel'.