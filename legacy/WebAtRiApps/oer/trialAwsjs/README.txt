AWSJS: Tool for experimenting with Amazon Web Services (AWS) from Javascript.
SEEN AT:https://forums.aws.amazon.com/thread.jspa?threadID=78218
DOWNLOAD FROM: http://commondatastorage.googleapis.com/andreidata/AwsJs-0.1.zip

awsjs - JavaScript environment for Amazon Web Services
It is written in Java, uses Rhino as JavaScript compiler/interpreter and
needs Java runtime and supplied jar libraries to execute your scripts


awsjs - bash shell executable script, that you use to run your scripts
Script syntax is standard JavaScript with some predefined and supplied AWS objects
See examples dir to understand

To run scripts
Unpack zip file, as a result you'll see awsjs-{version} dir
cd to it

Create your script, (you may use myscript dir, but the script can be located anywhere)
You run you the script with this command: 
awsjs myscripts/myscript.js

Extra options
 -v to show extra logging

It is also possible to run inline javascript with -e option
awsjs -e 'println("Hello World");'

You can set AWSJS_HOME environment to point to your awsjs dir,
export AWSJS_HOME=/path/to/awsjs-{version}
this way awsjs script will look for the java jar files under AWSJS_HOME/lib/ 

AWS requires to provide credentials for authentication

You can set credentials in your script (see examples) or
You can put you credentials in a property file, in your home dir: 
~/.awsjs_credentials.properties

The file should have those entries
accessKey=yourAWSAccessKeyHere
secretKey=yourAWSSecretKeyHere

