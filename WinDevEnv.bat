start /d "C:\Users\%username%\Dropbox\RiWebApps\rtalkDistribution\moquette\bin" moquette.bat
start /d "C:\Users\%username%\Dropbox\RiWebApps\rtalkDistribution" startWin64.bat
watchify "C:\Users\%username%\Dropbox\RiWebApps\mqtt-test\startMQTT_rb.js" -o "C:\Users\%username%\Dropbox\RiWebApps\mqtt-test\dist\bundle.js"