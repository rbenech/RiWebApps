
var s3 = AWSManager.getInstance( "S3" );

var test_bucket = "mytestbucket"+(Math.random()*1000);

if( !s3.bucketExists(test_bucket) ){
  var bucket = s3.createBucket( test_bucket );
  bucketInfo( bucket );
}
s3.setBucketPublicRead( test_bucket );
// or
s3.setBucketPublicReadWrite( test_bucket );

var list = s3.listObjects( test_bucket );
println( list );

// create s3 object from string
s3.putString( test_bucket, "folder/foo.txt", "foo" );
var url = s3.generatePutUrl( test_bucket, "folder/foo.txt", 1000/* secs to expire */ );
println( url );

// upload file
var file_name = "foo.mp3";
s3.putFile( test_bucket, "there.mp3", file_name );
var url = s3.generateGetUrl( test_bucket, file_name, 1000/* secs to expire */ );
println( url );

var newobj = s3.copyObject( test_bucket, "folder/foo.txt", test_bucket, "moo.txt" );
println( newobj );
s3.setObjectPublicReadWrite( test_bucket, "folder/foo.txt" );
// or
s3.setObjectPublicRead( test_bucket, "moo.txt" );
s3.deleteObject( test_bucket, "moo.txt" );

var acl = s3.getBucketAcl( test_bucket );
println( acl );

var acl = s3.getObjectAcl( test_bucket, "folder/foo.txt" );
println( acl );

var list = s3.listObjects( test_bucket );
println( list );

var buckets = s3.listBuckets();

for( var i=0; i<buckets.length; i++ ){
  bucketInfo( buckets[i] );
}

s3.deleteBucket( test_bucket );

// --------------------------------
function bucketInfo( bucket ){
  println( "Bucket name:", bucket.name );
  println( "Create date:", bucket.creationDate );
  println( "Owner id:", bucket.ownerId );
  println( "Owner name:", bucket.ownerName );
  println( "-------------------------------------\n" );
}

