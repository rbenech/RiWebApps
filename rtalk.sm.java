package rtalk.sm;

import java.io.UnsupportedEncodingException;
import java.nio.ByteBuffer;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Iterator;

public class RiCborBuffer {

  private byte[] buf;
  private int curpos=0;
  private long twoTo32 = 4254967296L; //65536 * 65536;		//Java doesn't like literal 4254967296

  /** Constr */
  public RiCborBuffer() { buf=new byte[4000]; }

  /**Constr*/
  public RiCborBuffer(int capacity) { buf=new byte[capacity]; }

  /**Constr*/
  public RiCborBuffer(byte[] initialEntries) { buf=initialEntries; }
  
  /// helper static methods to convert java objects to CBOR encoded byte[]
  
  /**
   * converts a java string to a utf8 ASCCI limited as CBOR String
   * @param value
   * @return
   */
  public static byte[] convertCBOR(String value){
	  RiCborBuffer buffer = new RiCborBuffer();
	  buffer.writeCborString(GuruUtilities.asBytes(value));
	  return buffer.toBytes();
  }
  
  /**
   * converts a CBOR byte[] to a java string
   * @param value
   * @return
   */
  public static String stringFromCBOR(byte[] value){
	  RiCborBuffer buffer = new RiCborBuffer(value);
	  return buffer.nextCborString();
  }

  
  /**
   * converts a java byte[] to a CBOR byte[]
   * @param value
   * @return
   */
  public static byte[] convertCBOR(byte[] value){
	  RiCborBuffer buffer = new RiCborBuffer();
	  buffer.writeCborBytes(value);
	  return buffer.toBytes();
  }
  
  /**
   * converts a CBOR byte[] to a java byte[]
   * @param value
   * @return
   */
  public static byte[] bytesFromCBOR(byte[] value){
	  RiCborBuffer buffer = new RiCborBuffer(value);
	  return buffer.nextCborBytes();
  }
  
  /**
   * converts a java SMOrderedMap to a CBOR byte[]
   * @param value
   * @return
   */
  public static byte[] convertCBOR(SmOrderedMap value){
	  RiCborBuffer buffer = new RiCborBuffer();
	  buffer.writeCborOrderedMap(value);
	  return buffer.toBytes();
  }
  
  /**
   * converts a CBOR byte[] to a java SmOrderedMap
   * @param value
   * @return
   */
  public static SmOrderedMap smMapFromCBOR(byte[] value){
	  RiCborBuffer buffer = new RiCborBuffer(value);
	  return buffer.nextCborOrderedMap();
  }
  
  /**
   * converts a CBOR byte[] to a java HashMap<String,String>
   * @param value
   * @return
   */
  public static HashMap<String,String> hashMapFromCBOR(byte[] value){
	  RiCborBuffer buffer = new RiCborBuffer(value);
	  return buffer.nextCborMap();
  }
  
  /**
   * converts a java HashMap to a CBOR byte[]
   * @param value
   * @return
   */
  public static byte[] convertCBOR(HashMap<String,String> value){
	  RiCborBuffer buffer = new RiCborBuffer();
	  buffer.writeCborHashMap(value);
	  return buffer.toBytes();
  }
  
  
  
  // instance support

  /**Append to this buffer*/
  public void append(byte[] data) {
    int len=data == null ? 0 : data.length;
    append(data, 0, len);
  }

  /**Append to this buffer*/
  public void append(byte[] data, int loc, int cnt) {
    if((curpos + cnt) >= buf.length) {
      int newSize=buf.length * 2; //assumption, grow by factor of two, at least
      int needed=curpos + cnt;    //min size needed for the new data
      if(needed > newSize) newSize=(needed * 3) / 2;
      growTo(newSize);
    }
	for(int i=loc; i < (loc+cnt); i++)	//changed 2/24/2016
      buf[curpos++]=data[i];
  }
  
  public void appendHex(String s) {
  int len = s.length();
  for (int i = 0; i < len; i += 2)
    append((byte) Integer.valueOf(s.substring(i, i + 2), 16).intValue());
  }

  /**Append to this buffer*/
  public void append(byte b) {
    int curSize=buf.length;
    if((curpos + 1) >= curSize) growTo(curSize * 2); //double each time
    buf[curpos++]=b;
  }
  
  /** Clears out the contents of the buffer */
  public void clear() { curpos=0; }

  /**Returns the current capacity of this buffer,
   * ie: how many entries it can hold without 'growing'*/
  public int capacity() { return buf.length; }

  /**Returns element at location i
   * Note: Throws ArrayIndexOutOfBounds on attempt to fetch illegal index*/
  public byte get(int loc) { return buf[loc]; }

  /**Get a subrange of entries, places it in 'dst' at 'dstBegin'
   *      inclusive of srcBegin, exclusive of srcEnd
   *      Won't overfill dst array.
   */
  public void getBytes(int srcBegin, int srcEnd, byte[] dst, int dstBegin) {
    int len=srcEnd - srcBegin;
    int dstLen=dst.length - dstBegin;
    if(dstLen < len) len=dstLen; //Just in case dst is too small
    int i=srcBegin;
    int j=dstBegin;
    int end=srcBegin + len;
    try{
    while(i < end) dst[j++]=buf[i++];
    }catch(Exception ex){
    	System.out.println(ex);
    }
  }

  /** Grows to at least length minSize */
  synchronized private void growTo(int minSize) {
    int newLen=buf.length * 2;
    if(newLen < minSize) newLen=minSize;
    byte[] newBuf=new byte[newLen];
    int length=buf.length;
    for(int i=0; i < length; i++) newBuf[i]=buf[i];
    buf=newBuf;
  }

  /**Set buffer location to specified (byte) value*/
  public void set(int loc, int val) {
    if(loc >= curpos) growTo(loc + 10);
    buf[loc]=(byte)(val & 0xff);
  }
  
  /**
   * set the cursor to the start poisition
   */
  public void rewind(){
	  curpos = 0;
  }
  
  public void setCursorTo(int pos){
	  curpos = pos;
  }
  
  public int getCursonPosition(){
	  return curpos;
  }

  /**Returns current number of entries in this buffer*/
  public int size() { return curpos; }

  /**Sets size to specified value.  If val, compared to current size, is:
   *   -Less: Truncates the buffer down to the specified size.
   *          (Note: does not reduce size of buffer)
   *   -Greater: Zeroes elements between current size and new one. Grows capacity as required.
   */
  public void size(int val) {
    if(val < 0) return;
    if(val < curpos) curpos=val; //truncate size
    if(capacity() < val) growTo(val);
    while(curpos < val) buf[curpos++]=0;
  }

  /**Returns this buffer as a byte array*/
  public byte[] toBytes() {
    if(curpos == buf.length) return buf;
    byte[] ba=new byte[curpos];
    for(int i=0; i < curpos; i++) ba[i]=buf[i];
    return ba;
  }

  /**Override: Returns this buffer as a String*/
  public String toString() { return new String(buf, 0, curpos); }
  
  /**
   * Add cr/lf
   * 
   */
  public void eol(){
    append((byte)0xd);
    append((byte)0xa);
  }
  /**
   * Add riri sep ^ + ~ `
   * 
   */
  public void sep(Character c){
    if( c == '^') append((byte)0x1c);
    if( c == '+') append((byte)0x1d);
    if( c == '~') append((byte)0x1e);
    if( c == '`') append((byte)0x1f);
    if( c == '=') append((byte) 61);
  }
  /**
   * Convert string to bytes and append
   * @param text
   */
  public void append(String text){
    try {
      append(text.getBytes("ISO-8859-1"));
    }
    catch (UnsupportedEncodingException e) {
    }
  }
  public void appendLine(String text){
    append(text);
    eol();
  }
  /**
   * Append a string mapping riri seps to bytes ^ + ~ `
   * @param string
   */
  public void appendSm(String string){
    // replaces ^ + ~ ' with1C 1D 1E 1F
    byte[] buffer = null;
    try {
      buffer=string.getBytes("ISO-8859-1");
    }
    catch (UnsupportedEncodingException e) {
    }
    for(int i = 0; i < buffer.length; i++ ){
        switch(buffer[i]) {
          case 94: 	append((byte)0x1c); break; //level 1
          case 43: 	append((byte)0x1d); break; //level 2
          case 126: append((byte)0x1e); break; //level 3
          case 96: 	append((byte)0x1f); break; //level 4
          default:  append(buffer[i]);    break; //normal case
        }
    }
  }
  /**Returns true if no more to process*/
  public boolean atEnd() {
	if(buf.length == 0) return true;
    return curpos >= buf.length;
  }
  
  public  byte nextByte(){
    // get the byte at the cursor and advance it
    byte rtn = get(curpos);
    curpos++;
    return rtn;
  }
  
  public  byte peekByte(){
    // get the byte at the cursor
    byte rtn = get(curpos);
    return rtn;
  }
  
  public  void  putByte(byte val){
    // put the byte at the cursor
    buf[curpos] = val;
    curpos++;
  }
  
  // CBOR support
  /**skips until it finds a tag
   * only works for tag,byte[],tag,byte[]....
   * need to extend to support skipping arrays and maps
   * 
   */
  // TODO extend to skipping other types
  public int nextCborTag() {
	  while(!atEnd()){
		  byte tag = peekByte();
		  int size = nextCborSize();
		  if((tag & (byte)0xe0) == (byte)0xc0)return size;
		  if((tag & (byte)0xe0) == (byte)0x40) curpos = curpos + size; // skip byte[]
		  if((tag & (byte)0xe0) == (byte)0x60) curpos = curpos + size; // skip char[] assumes ASCII
	  }	
    return 0;
  }

  /** Computes the CBOR size of the next element
   * limited to 31 bits, positive int
   * */
  public int nextCborSize() {
    int  tag = (int)nextByte() & 0x1f; 
    if( tag < 24) return (int)tag;
    int cnt = 0;
    if(tag == 24) cnt = 1;
    if(tag == 25) cnt = 2;
    if(tag == 26) cnt = 4;
    if(tag == 27) cnt = 8;
	int tmp = 0;
	for( int i = 0; i < cnt; i++){
		tmp = tmp << 8;
		tmp = tmp + ((int)nextByte() & 0xff);
	}
    return tmp;
  }
  
  
  
/**
 * given the first byte in a CBOR encoded byte[] returns the number
 * of bytes including the tag
 * @param val
 * @return
 */
  private int numberOfSizeBytes(byte val){
	    int  tag = val & 0x1f; 
	    if( tag < 24) return 1;
	    if(tag == 24) return 2;
	    if(tag == 25) return 3;
	    if(tag == 26) return 5;
	    return 9;
  }
  
  /** Computes the CBOR size of the next element (this == value for int data items)
   * limited to 31 bits, positive int
   * */
  public int peekCborSize() {
    int  tag = (int)get(curpos) & 0x1f; 
    if( tag < 24) return (int)tag;		//should this return a long?
    int cnt = 0;
    if(tag == 24) cnt = 1;
    if(tag == 25) cnt = 2;
    if(tag == 26) cnt = 4;
    if(tag == 27) cnt = 8;
	int tmp = 0;
	for( int i = 0; i < cnt; i++){
		tmp = tmp << 8;
		tmp = tmp + ((int)get(curpos + 1 + i) & 0xff);
	}
    return tmp;
  }
  /** Computes the CBOR size of the next element (this == value for int data items)
   * limited to 31 bits, positive int
   * (DWH extended to 63 bits)
   * */
  public long nextCborSizeLong() {
    int  tag = (int)nextByte() & 0x1f; 
    if( tag < 24) return (int)tag;		//should this return a long?
    int cnt = 0;
    if(tag == 24) cnt = 1;
    if(tag == 25) cnt = 2;
    if(tag == 26) cnt = 4;
    if(tag == 27) cnt = 8;
	long tmp = 0;
	for( int i = 0; i < cnt; i++){
		tmp = tmp << 8;
		tmp = tmp + ((int)nextByte() & 0xff);
	}
    return tmp;
  }
  
  public boolean nextCborBoolean(){
	  int  tag = (int)nextByte() & 0xff;
	  if( tag == 0xf4) return false;
	  return true;
  }
  
  /**
   * writes the size but only up to 31 bits (positive int)
   * @param type
   * @param size
   */
  public void writeCborSize(int type, int size){
	   if(size < 24){
		     append((byte) (type + size));
		     return;
	   }
		if(size < 256){
			append((byte) (type + 24));
			append((byte) size);
		     return;
		}
		if(size < 65536){
			append((byte) (type + 25));
			append((byte) (size >> 8));
			append((byte) (size & 0xff));
		     return;
		   }
		append((byte) (type + 26));
		append((byte) (size >> 24));
		append((byte) (size >> 16));
		append((byte) (size >> 8));
		append((byte) (size & 0xff));
	     return;
  }
  
  /**
   * writes the size but only up to 31 bits (positive int)
   * DWH - extended to allow up to 63 bits (positive int)
   * @param type
   * @param size
   */
  public void writeCborSize(int type, long size){
	   if(size < 24){
		   append((byte) (type + size));
		     return;
	   }
		if(size < 256){
			append((byte) (type + 24));
			append((byte) size);
		     return;
		}
		if(size < 65536){
			append((byte) (type + 25));
			append((byte) (size >> 8));
			append((byte) (size & 0xff));
		     return;
		 } if(size < twoTo32) {
			 append((byte) (type + 26));
			 append((byte) (size >> 24));
			 append((byte) (size >> 16));
			 append((byte) (size >> 8));
			 append((byte) (size & 0xff));
		     return;	 
		 }
		 append((byte) (type + 27));
		 append((byte) (size >> 56));
		 append((byte) (size >> 48));
		 append((byte) (size >> 40));
		 append((byte) (size >> 32));
		 append((byte) (size >> 24));
		 append((byte) (size >> 16));
		 append((byte) (size >> 8));
		 append((byte) (size & 0xff));
	     return;
  }
  
  /** peeks the next byte and returns a string for the type
   * */
  public String nextCborType() {
	if(atEnd()) return "end";
    byte tag = peekByte();
    if((tag & (byte)0xe0) == (byte)0x40) return "Bytes";
    if((tag & (byte)0xe0) == (byte)0x60) return "String";
    if((tag & (byte)0xe0) == (byte)0x00) return "Integer";
    if((tag & (byte)0xe0) == (byte)0x20) return "Integer";
    if((tag & (byte)0xe0) == (byte)0xe0) return "Float";
    if(tag == (byte)0x9f){  // indefinite Array
    	if(get(curpos + 1) == (byte)0xf3){  // omap tag
    		return "Omap";
    	}else{
    		return "Array";
    	}
    }
    if((tag & (byte)0xe0) == (byte)0x80){
    	if(((tag & (byte)0x1f) == 0x0) && ((numberOfSizeBytes(tag)) == 1)) return "Array";
    	if(get(curpos + numberOfSizeBytes(tag)) == (byte)0xf3){  // omap tag
    		return "Omap";
    	}else{
    		return "Array";
    	}
    }
    if((tag & (byte)0xe0) == (byte)0xa0) return "Map";
    if((tag & (byte)0xe0) == (byte)0xbf) return "indifinite Map";
    if((tag & (byte)0xe0) == (byte)0xc0) return "Tag";
    if(tag == (byte)0xf6) return "Null";  
    if(tag == (byte)0xf5) return "Boolean"; // true
    if(tag == (byte)0xf4) return "Boolean"; // false
    return "unknown";
  }
  
  /**Expects next value to be a string or a byte[] and returns its value
   * as a java byte[],  rtns null if not there
   * throws an exception if not a valid encoding*/
  public byte[] nextCborByteString() {
	if(curpos >= buf.length) return null;
    byte tag = (byte) ((byte)0xe0 & peekByte()) ;
    if(!((tag == (byte) 0x60) || (tag == (byte) 0x40))) {
    	return null; // string or byte
    }
    if(tag == (byte) 0x60){
    	return GuruUtilities.asBytes(nextCborString());
    }else{
    	return nextCborBytes();
    }
  }
  
  /**Expects next value to be a string or a bytes[] which is ASCII 
   * and returns a java string.  Returns null if not a string
   * if its a null drops the null
   * throws an exception if encoding issue*/
  public String nextCborString() {
	if(curpos >= buf.length) return null;
    byte tag = (byte) peekByte();
    if ((tag == (byte)0xf6) || (tag == (byte)0xf3)){
    	curpos = curpos + 1;
    	return null;
    }
    tag = (byte) ((byte)0xe0 & tag) ;    
    if(!((tag == (byte)0x60) || (tag == (byte)0x40))) {
    	return null; // string or byte
    }
    int size = nextCborSize();
    byte[] rtn = new byte[size];
    getBytes(curpos, curpos + size, rtn, 0);
    curpos = curpos + size;
    try {
      return new String(rtn, "ISO-8859-1");
    }
    catch (UnsupportedEncodingException e) {
    }
    return "";
  }
  
  /**
   * if the next CBOR is a byte[] or string convert to a java byte[]
   * returns null if not a byte[]
   * @return
   */
  public byte[] nextCborBytes() {
    byte tag = (byte) (0xe0 & peekByte()) ;
    if(!(tag == (byte) 0x40)) {
    	return null; // not byte[]
    }
    int size = nextCborSize();
    byte[] rtn = new byte[size];
    getBytes(curpos, curpos + size, rtn, 0);
    curpos = curpos + size;
	return rtn;
  }
  
  /**
   * return the CBOR byte[] for the next item, includes encoding
   * supports string byte[] float, integer, map, array
   * @return
   */
  public byte[] nextCborItem() {
	if(curpos >= buf.length) return null;
    byte tag = peekByte();
    if((tag & (byte)0xe0) == (byte)0x40){//byte[]
    	int size = numberOfSizeBytes(tag) + peekCborSize();
    	byte[] rtn = new byte[size];
    	getBytes(curpos, curpos + size, rtn, 0);
    	curpos = curpos + size;
    	return rtn;
    }
    if((tag & (byte)0xe0) == (byte)0x60){//String
    	int size = numberOfSizeBytes(tag) + peekCborSize();
    	byte[] rtn = new byte[size];
    	getBytes(curpos, curpos + size, rtn, 0);
    	curpos = curpos + size;
    	return rtn;
    }
    if((tag & (byte)0xe0) == (byte)0x00){//positive integer
    	int size = numberOfSizeBytes(tag);
    	byte[] rtn = new byte[size];
    	getBytes(curpos, curpos + size, rtn, 0);
    	curpos = curpos + size;
    	return rtn;
    }
    if((tag & (byte)0xe0) == (byte)0x20){//negative integer
    	int size = numberOfSizeBytes(tag);
    	byte[] rtn = new byte[size];
    	getBytes(curpos, curpos + size, rtn, 0);
    	curpos = curpos + size;
    	return rtn;
    }
    if((tag & (byte)0xe0) == (byte)0xe0){//Float
	   	 if((tag & (byte)0xff) == ((byte)0xe0 + 27)) {	//double precision float
			 ++curpos;
			 byte[] rtn = new byte[8];
			 getBytes(curpos,curpos+9, rtn, 0);
			 curpos += 9;
			 return rtn;
		 }	 
		 if((tag & (byte)0xff) == ((byte)0xe0 + 26)) {	//single precision float
			 byte[] rtn = new byte[4];
			 getBytes(curpos,curpos+5, rtn, 0);
			 curpos += 5;
			 return rtn;
		 }
    }
    if((tag & (byte)0xe0) == (byte)0x80){//array of primitives byte[], string, int, float
    	int start = curpos;
    	int size = nextCborSize(); // number of items and skip to start of elements
    	//TODO generates alot garbage
    	for( int i = 0; i < size; i++){
    		nextCborItem();
    	}
    	byte[] rtn = new byte[curpos - start];
    	getBytes(start,curpos, rtn, 0);		
    	return rtn;
    }    
    if(tag == (byte)0x9f){//unbounded array of primitives byte[], string, int, float
    	int start = curpos;
    	nextCborItemList();
    	byte[] rtn = new byte[curpos - start];
    	getBytes(start,curpos, rtn, 0);		
    	return rtn;
    }
    if((tag & (byte)0xe0) == (byte)0xa0){//map
    	int start = curpos;
    	int size = nextCborSize(); // number of items and skip to start of elements
    	//TODO generates alot garbage
    	for( int i = 0; i < size; i++){ // pairs of CBOR
    		nextCborItem();
    		nextCborItem();
    	}
    	byte[] rtn = new byte[curpos - start];
    	getBytes(start,curpos, rtn, 0);		
    	return rtn;
    }
    if((tag & (byte)0xe0) == (byte)0xc0){//tag
    	int size = numberOfSizeBytes(tag);
    	byte[] rtn = new byte[size];
    	getBytes(curpos, curpos + size, rtn, 0);
    	curpos = curpos + size;
    	return rtn;
    }
    
    return null;
  }
  
  /** SmOrderedMaps are String, byte[] 
   *  will process a CBOR map or an OrderedMap (Array with special first item)
   */
  public SmOrderedMap nextCborOrderedMap(){
	  //TODO test
	  SmOrderedMap rtn = null;
	  if(nextCborType().equalsIgnoreCase("Omap")){
		  if(atEnd()) return rtn;  // nothing to process
		  rtn = new SmOrderedMap(true); // allows duplicate keys
		  if(peekByte() == (byte)0x9f){
			  curpos++;
			  boolean first = true;
			while(peekByte() != (byte)0xff){
				String key = nextCborString();
				  if(first && key == null){
					  rtn.setTag(nextCborString());
					  first = false;
				  }else{
					  rtn.putCBOR(key, nextCborItem());			  
				  }
			}
			curpos = curpos + 1;// drop the ff
		  }else{
			  int size = nextCborSize() / 2;
			  for( int i = 0; i < size; i++){
				  String key = nextCborString();
				  if(i == 0 & key == null){
					  rtn.setTag(nextCborString());
				  }else{
					  rtn.putCBOR(key, nextCborItem());			  
				  }
			  }
		  }
		  return rtn;
	  }
	  if(nextCborType().equalsIgnoreCase("Map")){
		  if(atEnd()) return rtn;  // nothing to process
		  rtn = new SmOrderedMap(false); // no duplicate keys
		  if(peekByte() == (byte)0xbf){
			  curpos++;
			  boolean first = true;
			while(peekByte() != (byte)0xff){
				String key = nextCborString();
				  if(first && key == null){
					  rtn.setTag(nextCborString());
					  first = false;
				  }else{
					  rtn.putCBOR(key, nextCborItem());			  
				  }
			}
			curpos = curpos + 1;// drop the ff
		  }else{
			  int size = nextCborSize();
			  for( int i = 0; i < size; i++){
				  String key = nextCborString();
				  if(i == 0 & key == null){
					  rtn.setTag(nextCborString());
				  }else{
					  rtn.putCBOR(key, nextCborItem());			  
				  }
			  }
		  }
		  return rtn;
	  }
	  return rtn;
  }
  
  /**
   * assumes that its an array of byte[] or strings limited to ASCII
   * must be a fixed size array
   * @return
   */
  public byte[][] nextCborArrayBytes(){
	  int size = nextCborSize();
	  byte[][] rtn = new byte[size][];
	  for( int i = 0; i < size; i++){
		  rtn[i] = nextCborByteString();
	  }
	  return rtn;
  }
	/**Next object is a CBOR map of Strings
	 * 
	 * @return
	 */
  public HashMap<String,String> nextCborMap(){
	  //TODO test
	  if(!nextCborType().equalsIgnoreCase("Map")) return null;
	  HashMap<String,String> rtn = new HashMap<String,String>();
	  if(atEnd()) return rtn;  // nothing to process
	  if(peekByte() == (byte)0xbf){
		  curpos++;
		while(peekByte() != (byte)0xff){
			rtn.put(nextCborString(), nextCborString());
		}
		curpos = curpos + 1;// drop the ff
	  }else{
		  int size = nextCborSize();  // get the number of elements
		  for( int i = 0; i < size; i++){
			  rtn.put(nextCborString(), nextCborString());
			  }
	  }
	  return rtn;
  }
  
  
  /**returns an list of java strings
   * 
   * @return
   */
  public ArrayList<String> nextCborStringList(){
	  //TODO test
	  if(!nextCborType().equalsIgnoreCase("Array")) return null;
	  ArrayList<String> rtn = new ArrayList<String>();
	  if(atEnd()) return rtn;  // nothing to process
	  if(peekByte() == (byte)0x9f){
		  curpos++;
		while(peekByte() != (byte)0xff){
			rtn.add(nextCborString());
		}
		curpos = curpos + 1;// drop the ff
	  }else{
		  int size = nextCborSize();  // get the number of elements
		  for( int i = 0; i < size; i++){
			  rtn.add(nextCborString());		  
		  }
	  }
	  return rtn;
  }
  
  /**
   * return array list of CBOR encoded byte[] for each element
   * type must be an array, supports indefinite length
   * @return
   */
  public ArrayList<byte[]> nextCborItemList(){
	  if(!nextCborType().equalsIgnoreCase("Array")) return null;
	  ArrayList<byte[]> rtn = new ArrayList<byte[]>();
	  if(atEnd()) return rtn;  // nothing to process
	  if(peekByte() == (byte)0x9f){
		  curpos++;
		while(peekByte() != (byte)0xff){
			rtn.add(nextCborItem());
		}
		curpos = curpos + 1;// drop the ff
	  }else{
		  int size = nextCborSize();  // get the number of elements
		  for( int i = 0; i < size; i++){
			  rtn.add(nextCborItem());		  
		  }
	  }
	  return rtn;
  }
  
  
  public byte[] peekFirstCborBytes() {
	if(curpos <= 0) return null;
	int lastCurpos = curpos;
	curpos = 0;
    byte tag = peekByte();
    if((tag & (byte)0xe0) != (byte)0x40){
    	curpos = lastCurpos;
    	return null;
    }
    int size = nextCborSize();
    byte[] rtn = new byte[size];
    getBytes(curpos, curpos + size, rtn, 0);
    curpos = lastCurpos;
    return rtn;
  }
 
  /**
   * Assumes the  next item is a CBOR map<string,string>,  takes the pairs
   * of key, value and inserts into the provided map
   * @param map
   */
 public void fillCborMap(HashMap<String,String> map){
   // starting at the current location which defines a map
   // get key values and insert into the hashMap
   int size = nextCborSize(); // number of map elements
   for( int i = 0; i < size; i++){
     String key = nextCborString();
     String value = nextCborString();
     map.put(key,value);
   }
 }
 /**
  * Converts java string to an ASCII byte limited utf-8
  * @param value
  */
 public void writeCborString(String value){
   int size = value.length();
   writeCborSize(0x60, size);
   append(value);
 }
 
 
 /**
  * Converts java byte[] to an ASCII byte limited utf-8
  * @param value
  */
 public void writeCborString(byte[] value){
   int size = value.length;
   writeCborSize(0x60, size);
   append(value);
 }
 
 
 public void writeCborBytes(byte[] value){
   int size = value.length;
   writeCborSize(0x40, size);
   append(value);
 }
 
 public void writeCborTag(int tag){
	 writeCborSize(0xc0, tag);
 }
 
 public void writeCborArraySize(int size){
	 writeCborSize(0x80, size);
 }
 
 /**
  * starts an unbounded array
  */
 public void writeCborArrayStart(){
	 append((byte)0x9f);
 }
 
 /**
  * write the end byte for an unbounded array
  */
 public void writeCborArrayEnd(){
	 append((byte)0xff);
 }
 
 /**
  * write a true or false
  * @param bool
  */
 public void writeCborBoolean(boolean bool){
	 if(bool){
		 append((byte)0xf5);
	 }else{
		 append((byte)0xf4);	 
	 }
 }
 public void writeCborNull(){
	 append((byte)0xf6);
 }
 
 public void writeCborMapSize(int size){
	 writeCborSize(0xa0, size);
 }
 
 /**
  * write a array of byte[]
  * @param value
  */
 public void writeCborArray(ArrayList<byte[]> value){
	   int size = value.size();
	   writeCborArraySize(size);
	   Iterator<byte[]> iter=value.iterator();
	   while (iter.hasNext()) {
	     writeCborBytes(iter.next());	   
	   }
	 } /**
  * write a array of String
  * @param value
  */
 public void writeCborStringList(ArrayList<String> value){
	   int size = value.size();
	   writeCborArraySize(size);
	   Iterator<String> iter=value.iterator();
	   while (iter.hasNext()) {
	     writeCborString(iter.next());	   
	   }
	 }
 
 /**
  * write a hash map of <String, String> as CBOR strings
  * @param map
  */
 public void writeCborHashMap(HashMap<String,String> map){
   int size = map.size();
   writeCborMapSize(size);
   Iterator<String> iter=map.keySet().iterator();
   while (iter.hasNext()) {
     String key=(String)iter.next(); //guru key name
     String val=(String)map.get(key); //value for key
     writeCborString(key);
     if(val == null){
    	 writeCborBytes(new byte[0]);
     }else{
    	 writeCborBytes(GuruUtilities.asBytes(val));	   
     }
   }
   if(buf[curpos - 1] == 0) {
	   System.out.println("bad hash map write cbor");
   }
 }
 
 /** SmOrderedMaps are String, CBOR encoded byte[]
  *  keys can be null in which case we use a CBOR null
  *  value can be null is which case we use a zero length byte[]
  *  values are byte[]
  *  tag is optional
  *  Written as a CBOR array of key,value pairs
  * 
  */
 public void writeCborOrderedMap(SmOrderedMap map){
	   int size = map.size();
	   writeCborArraySize((size + 1) * 2);
	   append((byte)0xf3);  // omap  marker
	   if(map.getTag() != null){
		   writeCborString(map.getTag());			// tag
	   }else{
		   writeCborBytes(new byte[0]);		   
	   }
	   for( int i = 0; i < map.size(); i++){
		 String key = map.getKeyAtAsString(i);
	     byte[] val=(byte[])map.getCBOR(i);
	     writeCborString(key);	   
	     if(val == null){
	    	 writeCborBytes(new byte[0]);
	     }else{
	    	 append(val);	   
	     }
	   }
	 }
 
 public void writeCborObject(Object val){
	 Class clazz = val.getClass();
	 if(clazz == String.class)       writeCborString((String)val);   
	 else if(clazz == Long.class)    writeCborNum((Long)val);   
	 else if(clazz == Integer.class) writeCborNum(((Integer)val).longValue());   
	 else if(clazz == Double.class)  writeCborDouble((Double)val);   
	 else if(clazz == Float.class)   writeCborDouble((Double)val);   
	 else if(val instanceof byte[])  writeCborBytes((byte[])val);
 }
 
 public Object nextCborObject(){
	 String type = nextCborType();
	 if(type.equals("String")) return nextCborString();
	 if(type.equals("Bytes")) return nextCborBytes();
	 if(type.equals("Integer")) return nextCborLong();
	 if(type.equals("Float")) return nextCborDouble();
	 if(type.equals("Map")) return nextCborMap();
	 if(type.equals("Boolean")) return nextCborBoolean();
	 if(type.equals("Omap")) return nextCborOrderedMap();
	 if(type.equals("Null")) return null;
	 return null;
 }
 
 //Methods added to GuruByteBuffer by DWH
 
 /**
  * Write a integer number as a CBOR data item
  * Deals with positive and negative numbers up to 64 bits
  *  using minimum space required based on value of number
  * @param value
  * The number (byte, short, int, or long) to be encoded
  */
 public void writeCborNum(long value) {
	 if(value < 0) {
		 value = -value - 1;	//unsigned value to be stored in buffer
		 writeCborSize(0x20, value);
	 } else {
		 writeCborSize(0x00, value);
	 }
 }
 
 /**
  * Write float value as CBOR data item
  * @param fval
  */
 public void writeCborFloat(float fval) {
	 append((byte) ((byte)0xe0 + 26));	//single precision float
	 byte[] b = ByteBuffer.allocate(4).putFloat(fval).array();
	 append(b,0,4);	 
 }
 /**
  * Write double value as CBOR data item
  * @param dval
  */
 public void writeCborDouble(double dval) {
	 append((byte) ((byte)0xe0 + 27));	//doubl precision float
	 byte[] b = ByteBuffer.allocate(8).putDouble(dval).array();
	 append(b,0,8);	 
 }
 
 /**
  * append bytes to message - added 2/24/2016
  * @param value
  * byte[] array containing data to be appended to message
  * @param loc
  * Offset to first byte in value array to be written
  * @param cnt
  * Number of bytes to be appended to message from value array
  */
 public void writeCborBytes(byte[] value, int loc, int cnt){
	   long size = cnt;
	   writeCborSize(0x40, size);
	   append(value, loc, cnt);
	 }
  
 /**
  * Get the next cbor data item which is assumed to be a positive or negative integer
  * @return
  * Returns value which may be positive or negative
  */
 public long nextCborLong() {
		if(curpos >= buf.length) return 0;		//this is really an error
	    byte tag = peekByte();
	    if((tag & (byte)0xe0) == 0x00)
	    	return nextCborSizeLong();
	    if((tag & (byte)0xe0) == 0x20)		//negative number
	    	return -nextCborSizeLong() -1;
	    return(0);		//this is really an error - i.e., item isn't a positive or negative unsigned value
 }
 
 /**
  * Get the next cbor data item which is assumed to be a positive or negative integer
  * Only use this method if you know the number is no more than 4 bytes
  * @return
  * Returns value which may be positive or negative
  */
 public int nextCborInt() {
		if(curpos >= buf.length) return 0;		//this is really an error
	    byte tag = peekByte();
	    if((tag & (byte)0xe0) == 0x00)
	    	return (int) nextCborSizeLong();
	    if((tag & (byte)0xe0) == 0x20) {		//negative number
	    	long val = -nextCborSizeLong() -1;
	    	return (int) val;
	    }
	    return(0);		//this is really an error - i.e., item isn't a positive or negative unsigned value
 }
 
 /**
  * Get the next cbor data item which is assumed to be a half precision, single precision or double precision float
  *   Will return half and single precisions as well as double precision floats as double precision
  * @return
  * Returns double precision value for CBOR half, single or double precision float
  */
 public double nextCborDouble() {
	 double dval;
	 if(curpos >= buf.length) return 0;	//really an error
	 byte tag = peekByte();
	 if((tag & (byte)0xff) == ((byte)0xe0 + 27)) {	//double precision float
		 ++curpos;
		 byte[] b = new byte[8];
		 getBytes(curpos,curpos+8, b, 0);
		 curpos += 8;
		 dval = ByteBuffer.wrap(b).getDouble();
		 return dval;
	 }
	 
	 if((tag & (byte)0xff) == ((byte)0xe0 + 26)) {	//single precision float
		 ++curpos;
		 byte[] b = new byte[4];
		 getBytes(curpos,curpos+4, b, 0);
		 curpos += 4;
		 dval = ByteBuffer.wrap(b).getFloat();
		 return dval;
	 }
	 if((tag & (byte)0xff) == ((byte)0xe0 + 25)) {	//half precision float
		 System.err.println("guruByteBuffer: nextCborDouble: msg contains half-precision float:ignore it");
	 }
	 return 0;			//really an error
}
 
 /**
  * Get the next cbor data item which is assumed to be a single precision float
  *   Only use this if value is known to be single precision; otherwise use nextCborDouble()
  * @return
  * Returns value if it is a single precision float item
  */
 public float nextCborFloat() {
	 if(curpos >= buf.length) return 0;	//really an error
	 byte tag = peekByte();
	 if((tag & (byte)0xff) != ((byte)0xe0 + 26))	//single precision float
		 return 0;						//really an error
	 ++curpos;
	 byte[] b = new byte[4];
	 getBytes(curpos,curpos+4, b, 0);
	 curpos += 4;
	 float fval = ByteBuffer.wrap(b).getFloat();
	 return fval;
 }
 
 /**
  * provides a string to use for logging
  */
 public String printFirstCbor(){
	String rtn = "";
	if(atEnd()) return " empty ";
	if(curpos >= buf.length) return " past end ";	//really an error
	int lastCurpos = curpos;
	curpos = 0;
	String type = nextCborType();
	if( type.equals("Bytes")){
		rtn = (GuruUtilities.asString(nextCborBytes()));
	}
	if( type.equals("String")){
		rtn = ((nextCborString()));
	}
	if( type.equals("Map")){
		//rtn = RiriUtilities.printWithSeps(RiriUtilities.asRiriBytes(this.nextCborOrderedMap()));

	}
	curpos = lastCurpos;
	return rtn;
}
 
 public static void main(String[] args){
	 System.out.println( (byte) 0x9f);
	 RiCborBuffer buf = new RiCborBuffer();
	 buf.writeCborSize(0x40, 70000000);
	 buf.writeCborObject(3446);
	 buf.rewind();
	 System.out.println(buf.nextCborSize() + " should equal 70000000");
	 System.out.println(buf.nextCborLong() + " should equal 3446");
	 RiCborBuffer logBuf = new RiCborBuffer();
	 logBuf.writeCborString("foo_bar");
	 System.out.println("Testing Hash Map");
	 HashMap<String,String> meta = new HashMap<String,String>();
	 meta.put("type", "start test part");
	 meta.put("type2", "stop test part");
	 logBuf.writeCborHashMap(meta);
	 logBuf.rewind();

	 System.out.println(logBuf.nextCborType());	 
	 System.out.println(logBuf.nextCborString());
	 System.out.println(logBuf.nextCborType());	
	  int size = logBuf.nextCborSize();
	  for( int i = 0; i < size; i++){
		  System.out.println("  "+logBuf.nextCborString() + " = "+logBuf.nextCborString());
	  }
	  // test the ordered map
	 logBuf.rewind();
	 System.out.println("Testing SmOrderedMap");
	 SmOrderedMap smom = new SmOrderedMap(true);
	 smom.setTag("test");
	 smom.put("type", "start test part");
	 smom.put("type", "stop test part");
	 logBuf.writeCborOrderedMap(smom);
	 logBuf.rewind();
	 System.out.println("type check omap = " + logBuf.nextCborType());
	 smom = logBuf.nextCborOrderedMap();
	 for( int i = 0; i < smom.size(); i++){
		 System.out.println(smom.getKeyAtAsString(i) + " = " +smom.getValueAtAsString(i));
	 }
	 
	  // test the unbounded ordered map
	 logBuf.rewind();
	 System.out.println("Testing infinite SmOrderedMap");
	 logBuf.writeCborArrayStart();
	 logBuf.append((byte)0xf3);   //tag key
	 logBuf.writeCborString("tag");
	 logBuf.writeCborString("key2");
	 logBuf.writeCborString("val2");
	 logBuf.writeCborString("key3");
	 logBuf.writeCborString("val3");
	 logBuf.writeCborArrayEnd();
	 logBuf.rewind();
	 System.out.println("type check omap = " + logBuf.nextCborType());
	 smom = logBuf.nextCborOrderedMap();
	 for( int i = 0; i < smom.size(); i++){
		 System.out.println(smom.getKeyAtAsString(i) + " = " +smom.getValueAtAsString(i));
	 }
	 
	  // test the unbounded array of CBOR items
	 logBuf.rewind();
	 System.out.println("Testing infinite Array<byte[]>");
	 logBuf.writeCborArrayStart();
	 logBuf.writeCborBytes(GuruUtilities.asBytes("array1"));
	 logBuf.writeCborBytes(GuruUtilities.asBytes("array2"));
	 logBuf.writeCborArrayEnd();
	 logBuf.writeCborString("end test");
	 logBuf.rewind();
	 ArrayList<byte[]> bl = logBuf.nextCborItemList();
	 bl.forEach(a -> System.out.println(GuruUtilities.asString(bytesFromCBOR(a))));
	 System.out.println(logBuf.nextCborString());

	 
	 System.out.println("Testing riri input to SmOrderedMap");
	 logBuf.rewind();
	 smom = (RiriUtilities.ririStringToOmaps("^foo+runLocal=true+channel=rtalk+className=rtalk.SmPortalForRtalk").get(0));
		
	 logBuf.writeCborOrderedMap(smom);
	 logBuf.rewind();
	 System.out.println("type check omap = " + logBuf.nextCborType());
	 smom = logBuf.nextCborOrderedMap();
	 for( int i = 0; i < smom.size(); i++){
		 System.out.println(smom.getKeyAtAsString(i) + " = " +smom.getValueAtAsString(i));
	 }
	 //test array list
	 logBuf.rewind();
	 System.out.println("Testing Array[2]");
	 logBuf.writeCborArraySize(2);
	 logBuf.writeCborString("array1");
	 logBuf.writeCborString("array2");
	 logBuf.rewind();
	 ArrayList<String> sl = logBuf.nextCborStringList();
	 System.out.println(sl);
	 
	 //test sm ordered map 
	 smom = (RiriUtilities.ririStringToOmaps("+runLocal=true+foo=~rtalk~bar~234").get(0));
	 sl = new ArrayList<String>();
	 sl.add("element1");
	 sl.add("element2");
	 smom.putStringArray("array", sl);
	 System.out.println("Testing getStringArray");
	 ArrayList<String> out = new ArrayList<String>(Arrays.asList(smom.getStringArray("foo")));
	 out.forEach(a -> System.out.println(a));
	 ArrayList<String> out1 = new ArrayList<String>(Arrays.asList(smom.getStringArray("array")));
	 out1.forEach(a -> System.out.println(a));

 }
}