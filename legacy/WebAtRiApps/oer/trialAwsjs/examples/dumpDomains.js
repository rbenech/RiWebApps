
var db = AWSManager.getInstance( "SimpleDB" );


var domains = db.listDomains();
println( "Domains: "+domains );

for( var i=0; i<domains.length; i++ ){
  println( "\n------------------------------------------------" );
  println( "domain:"+domains[i]+"\n" );
  sel( domains[i] );
}

// -------------------------------------
function sel( name ){
  var iterator = db.select( "select * from "+name );
  while( iterator.hasMore() ){
    item_ret = iterator.nextItem();
    var item = item_ret._itemName;
    delete item_ret._itemName;
    //println( "    '"+item+"'{\n"+JSON.stringify(item_ret)+"    }\n" );
    println( "    '"+item+"'{" );
    print_obj( item_ret );
    println( "    }" );
  }
}

function print_obj( o ){
  for( var key in o ){
    println( "      "+key+": "+o[key] );
  }
}
