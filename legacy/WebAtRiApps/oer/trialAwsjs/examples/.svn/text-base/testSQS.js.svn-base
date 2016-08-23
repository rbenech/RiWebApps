
var sqs = AWSManager.getInstance( "SQS" );

var test_queue = "testQueueName";

// create test queue
var attributes = {
  VisibilityTimeout:"10", // secs
  MaximumMessageSize:"10000",  // bytes
  MessageRetentionPeriod:"1000", // secs
  DelaySeconds:"5" // secs
};
var url = sqs.createQueue( test_queue, attributes );
println( url );

url = sqs.getQueueUrl( test_queue );
println( url );

var info = sqs.getQueueInfo( test_queue );
for( var prop in info ){
  println( "  "+prop+": "+info[prop] );
}

var my_info = { DelaySeconds:"5" };
sqs.setQueueInfo( test_queue, my_info );

var id = sqs.sendMessage( test_queue, "Hello World" );
println( "msg id:"+id );

var ret = sqs.receiveMessages( test_queue );
/* or
var visibility_timeout = 5;
var max_no_of_messages = 10;
var ret = sqs.receiveMessages( test_queue, visibility_timeout, max_no_of_messages );
*/
var messages = sqs.sendMessages( test_queue, [{body:"body1", id:"id1"},{body:"body2", id:"id2"}] );
println( JSON.stringify(messages) );

//sqs.deleteQueue( test_queue );
