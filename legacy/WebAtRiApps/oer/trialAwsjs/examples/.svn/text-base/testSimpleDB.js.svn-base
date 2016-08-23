
/*
var accessKey = "access";
var secretKey = "secret";

AWSManager.setCredentials( accessKey, secretKey );
*/

var db = AWSManager.getInstance( "SimpleDB" );

var test_domain = "testAWSdomain";

// create test domain
db.createDomain( test_domain );
println( "test domain exists:"+db.domainExists(test_domain) );

// just remember SimpleDB all atributes must be string, 
// but js converts everything to string for you
var item_name = "test_item";
var item_data = {
  "key1":"value1",
  "key2":"value2",
  "numkey":100
};
// add item
println( "putting item:"+JSON.stringify(item_data) );
db.putItem( test_domain, item_name, item_data );

// sleep to make sure it propagates
sleep( 2000 );// 2 secs

println( "item exists:"+db.itemExists(test_domain, item_name) );

// get item back
var item_ret = db.getItem( test_domain, item_name );
println( "getting item:"+JSON.stringify(item_ret) );

println( "delete attributes" );
db.deleteAttributes( test_domain, item_name, ["key1", "numkey"] );

// sleep to make sure it propagates
sleep( 2000 );// 2 secs

// get item back
var item_ret = db.getItem( test_domain, item_name );
println( "getting item:"+JSON.stringify(item_ret) );

// delete item
println( "delete item:"+item_name );
db.deleteItem( test_domain, item_name );
// sleep to make sure it propagates
sleep( 1000 );// 1 secs
println( "item exists:"+db.itemExists(test_domain, item_name) );

// batch put items
var items = [
  { 
    _itemName:"item1",
    key1:"value1"
  },
  {
    _itemName:"item2",
    key2:"value2"
  },
  {
    _itemName:"item3",
    key3:"value3"
  }
];
db.batchPutItems( test_domain, items );
sleep( 2000 );// 2 secs

item_ret = db.getItem( test_domain, "item1" );
println( "getting item1:"+JSON.stringify(item_ret) );
item_ret = db.getItem( test_domain, "item2" );
println( "getting item2:"+JSON.stringify(item_ret) );

// select
var iterator = db.select( "select * from "+test_domain );
while( iterator.hasMore() ){
  item_ret = iterator.nextItem();
  println( "next item:"+JSON.stringify(item_ret) );
}

// domain info
println( "domain info:"+JSON.stringify(db.domainInfo(test_domain)) );

// delete test domain
db.deleteDomain( test_domain );
println( "test domain exists:"+db.domainExists(test_domain) );
