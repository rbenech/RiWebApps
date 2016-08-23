package ri.app.rtalk;

import ri.core.container.KeyValMap;
import ri.core.container.QuickList;
import ri.core.guru.GuruAccess;
import ri.core.guru.GuruException;
import ri.core.guru.GuruMgr;
import ri.core.guru.GuruMgrListener;
import ri.core.guru.Query;
import ri.core.guru.sm.GuruSystemMessage;
import ri.core.panel.Emit;
import ri.core.riri.RiriApp;
import ri.core.rtalk.RtCallSite;
import ri.core.rtalk.RtPackageLoader;

/**This is a utility class that initializes and provides Rtalk for the Web Server.
 * 
 *  'Rtalk Java' RiShortcut (RevisionOf=GAKRE8CAB39TNC00):
 *  -------------------------------------------
 *  RID              Descrip.
 *  G78T5XCA9GFK3T00 Base Code
 *  GAKRE8CAB39MCI00 Base Extensions
 *  GAKRE8CAB3TUM000 Compiler
 *  G9TQQ5YAB3MUO200 RiData support
 *  
 *  'Rtalk Cassini Boot' RiShortcut (RevisionOf=GAKRE8CABJADXV00):
 *  ---------------------------------------------------
 *  RID              Descrip.
 *  G78T5XCA9GFK3T00 Base Code
 *  GAKRE8CAB39MCI00 Base Extensions
 *  GAKRE8CAB3TUM000 Compiler
 *  G9TQQ5YAB3MUO200 Math
 *  GAKRE8CABIANUW00 Buttons and Panels
 *  GAKRE8CABIAOWD00 RTALK Cassini Base
 *  GAKRE8CABIAOZV00 Test System support
 *  GAKRE8CABIAP6G00 Testplan Compiler
 *  GAKRE8CABIMHAI00 Instruments and test hardware
 *
 * Note: implements RiriApp so can participate in GuruSystemMessage (SM) traffic. 
 *       Implements GuruMgrListener so can reset on Guru reconnect
 *       
 * History:
 * 4-5-12 OER:
 *   Created
 */
public class RtalkForRtServer implements RiriApp, GuruMgrListener {
  
  private RtPackageLoader _rtPackageLoader=null;
  private static String _connectString=null; //used to connect to non local guru

  /**Constr*/
  public RtalkForRtServer(final String[] cmdlineArgs) {
    GuruMgr guru=null;
    if(_connectString!=null) {
      try { guru = GuruAccess.instance(_connectString); }
      catch(Exception e) { Emit.out("Rtalk unable to connect to Guru at "+_connectString); }
    }
    else 
      guru = GuruAccess.instance();
    
    if(guru==null) {
      Emit.out("Error setting up Rtalk: no guru connection.");
      return; //nothing to do
    }
    try {
      guru.addGuruMgrListener(this); //listener for low level reconnects
      initialGuruSetup(guru); //initial guru configuration
//      guru.enableSM(true);
//      guru.registerRiriApp(this, "Rtalk (rtserver)", false); //registers self as receiver of 255 messages
//      guru.setSuperUserMode(true); //is this ok to do for this app?
//      GuruAccess.setInactivityTimeout(guru, 0);
      new Thread() { //load initialize Rtalk in a separate thread 
        public void run() { doInitRtalk(cmdlineArgs); } 
      }.start(); 
    }
    catch (Exception e) { Emit.out("Error setting up: " + e); }
  }
  
  public static void setConnectString(String connectString) {
    _connectString=connectString;
  }

  /**Called initially to set up Guru as well as subsequently 
   * when the connection to Guru loses its state configuration 
   * (i.e. guru goes away and comes back)*/
  private void initialGuruSetup(GuruMgr guru) {
    if(guru!=null) {
      guru.setSuperUserMode(true);
      GuruAccess.setInactivityTimeout(guru, 0);
      guru.registerRiriApp(this, "Rtalk (rtserver)", false); //registers self as receiver of 255 messages (does this get issues every time there is a low level reconnect?)
      try { guru.enableSM(true); } catch(Exception e) {}
    }
  }
  
  /**This is called when a GuruMgr is closed
   * Note: Required for implementors of GuruMgrListener*/
  public void guruMgrClosed(GuruMgr guru) {
    System.out.println("Rtserver:: Guru closed."); //debug
    _rtPackageLoader.shutdown(); //is this useful to do?
  }

  /**Called when there is a Guru reconnect.
   * This restores Guru settings lost because of the reconnect: enable SM etc.
   * note: required for interface GuruMgrListener
   * */
  public void guruMgrReconnected(GuruMgr guru) {
    initialGuruSetup(guru); //restore guru configuration settings
  }

 
  /**Initialize Rtalk*/
  private void doInitRtalk(String[] cmdlineArgs) {
    Emit.out("Rtalk initializing...");
    //GuruHelper.doBackgroundLoading(true); //setting this to true allows background updating of Guru files. In which case, the fetched version is the current one in local guru, while triggering a  background global search to update the file for next time. 

    try {
      if(_rtPackageLoader==null) //QUES: is it better to make a new one each time or to reuse the one?
        _rtPackageLoader = new RtPackageLoader();
      else 
        _rtPackageLoader.shutdown();

      long t0 = System.currentTimeMillis();
      RtPackageLoader loader = new RtPackageLoader();
      Query startQuery = _rtPackageLoader.startup(loader, cmdlineArgs);
      long t1 = System.currentTimeMillis();
      Emit.out("Rtalk loaded. (load time="+((t1-t0)/1000.0)+" sec)");
      loader.launch(cmdlineArgs); //pass the args down to Rtalk as well
      long t2 = System.currentTimeMillis();
      Emit.out("Rtalk ready. (launch time="+((t2-t1)/1000.0)+" sec");

      //Get a little info on what is being loaded, for reporting purposes:
      String title=null;
      String objClass=null;
      try {
         KeyValMap m = GuruAccess.instance().keyValuesQuery(startQuery, new QuickList("ri.sys.Title,ri.sys.ObjClass")).getMap(0);
         title = m.getValFor("ri.sys.Title");
         objClass = m.getValFor("ri.sys.ObjClass");
      }
      catch(Exception e) {}
      if(objClass==null) objClass="";
      if(title==null) title="";
      
      String msg = "Done loading "+objClass+" "+ "Title="+title + ", ("+startQuery.toCsvString(true)+")";
      Emit.out(msg);
    }
    catch(GuruException e) {
      String msg ="Rtalk unable to load from guru because: ";
      if(e.getGuruErrorCode()==102) msg +="object not found"; //object not found
      else msg += e;
      Emit.out(msg);
    }
    catch(Exception e) {
      String msg ="Rtalk unable to load from guru because: "+e;
      Emit.out(msg);
      e.printStackTrace();
    }
  }
  
  /**This is used to shutdown rtalk*/
  public void shutdown() {
    ririExitApplication(); //remove connection from guru
    if(_rtPackageLoader!=null) 
      _rtPackageLoader.shutdown();
  }

  /**Instructs a RiriApp to Exit.
   * Required for interface RiriApp*/
  public void ririExitApplication() {
    try { GuruAccess.instance().unregisterRiriApp(this); } catch (Exception e) {}
  }

  /**Informs a RiriApp that the user has changed.
   * Required for interface RiriApp*/
  public void ririUserChanged(String cid) {}

  /**Instructs a RiriApp to go to the top of the Zorder.
   * Required for interface RiriApp*/
  public void ririZorderTop() {}

  /**System message (SM) from Guru
   * Note: Required for interface RiriApp*/
   public void receiveGuruSystemMessage(final GuruSystemMessage sm) {
     if(sm==null) return; //just in case
     new Thread() { 
       public void run() { RtCallSite.sendSmToRtalk(sm.getAsRiriBytes()); } 
     }.start();
   }
}
