
importPackage( com.andreig.aws_script.objects );

var use_binary_protocol = false;
var memc = new Memcached( "127.0.0.1:11211", use_binary_protocol );

var time = 5;//secs
var ok = memc.set( "key", time, "value" );
var o = memc.get( "key" );
println( "object:"+o );

memc.stop();
