ECHO "Removing Moquette DB - Starting Fresh"
TIMEOUT 3
DEL "C:\Users\%username%\Dropbox\RiWebApps\rtalkDistribution\moquette\bin\moquette_store.*"

START /d "C:\Users\%username%\Dropbox\RiWebApps\rtalkDistribution\moquette\bin" moquette.bat
START /B "rtalk Distribution (Java)" /d "C:\Users\%username%\Dropbox\RiWebApps\rtalkDistribution" startWin64.bat

TITLE Watchify
watchify "C:\Users\%username%\Dropbox\RiWebApps\mqtt-test\startMQTT_rb.js" -o "C:\Users\%username%\Dropbox\RiWebApps\mqtt-test\dist\bundle.js"
