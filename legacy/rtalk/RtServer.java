package ri.app.rtalk;

import java.awt.AWTEvent;
import java.awt.BorderLayout;
import java.awt.Component;
import java.awt.Container;
import java.awt.Dimension;
import java.awt.GridLayout;
import java.awt.Point;
import java.awt.Toolkit;
import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;
import java.awt.event.WindowEvent;
import java.io.BufferedReader;
import java.io.FileNotFoundException;
import java.io.InputStreamReader;
import java.net.URL;

import javax.swing.JCheckBoxMenuItem;
import javax.swing.JDialog;
import javax.swing.JFrame;
import javax.swing.JMenu;
import javax.swing.JMenuBar;
import javax.swing.JMenuItem;
import javax.swing.JPanel;
import javax.swing.JScrollPane;

import org.eclipse.jetty.server.Handler;
import org.eclipse.jetty.server.Server;
import org.eclipse.jetty.server.handler.ContextHandlerCollection;
import org.eclipse.jetty.servlet.ServletContextHandler;

import ri.app.web.StatusPanel;
import ri.core.guru.GuruAccess;
import ri.core.guru.GuruHelper;
import ri.core.guru.GuruMgr;
import ri.core.guru.sm.GuruSystemMessage;
import ri.core.guru.smrouter.SmRouter;
import ri.core.panel.AboutBox;
import ri.core.panel.Emit;
import ri.core.panel.MenuPromptDialog;
import ri.core.riri.RiriApp;
import ri.core.rtpanel.SmLauncher;
import ri.core.rtpanel.WhiteboardApp;
import ri.core.util.Csv;
import ri.core.util.RiLookAndFeel;
import ri.core.web.servlet.GuruConnection;
import ri.core.web.servlet.ServletGuruSm;
import ri.core.web.servlet.ServletRawSm;
import ri.core.web.servlet.ServletSm7;
import ri.tool.dbbridge.DatabaseSmBridge;
import ri.tool.guru.QuickQueryDialog;
import ri.tool.guru.oleo.Oleo;
import ri.tool.guru.stdfclean.StdfCleanup;
import ri.tool.misc.SimTestExec;
import ri.tool.smbridge.BridgePanel;
import ri.tool.smbridge.SmEmit;

/**RtServer
 * 
 * Command line for TestSm (mac os version): 
 *   TestSm /Library/Java/JavaVirtualMachines/1.7.0u-dev.jdk/Contents/Home/bin/java -agentpath:javaDebug.dylib -Xbootclasspath/a:TestSM.jar  ri/experiment2/TestSm rtDebug guruIp=192.168.56.15 rtBoot=GAKRE8CABJADXV00 rtLaunch=RtTestCases:benchmark1
 * 
 * Notes on building the Guru application:
 *   -If using RtalkBase.jar: since that jar file ends up with most of the classes needed from RiApps and RiApps7
 *   -If, instead, just including all the ri.core.rtalk files in RtServer, then just load all 
 *    in the bootClasspath (for now):
 *      java -Xbootclasspath/a:RtServer.jar;jetty-all-7.5.4.v20111024.jar;servlet-api-2.5-20081211.jar;json_simple-1.1.jar -agentlib:JvmtiDebug ri.app.web.RtServer -rtBoot GAKRE8CABJADXV00 
 * 
 *  This provides the following functions: 
 *          SM Router, SM Bridge, Textmode Bridge, Whiteboard Launcher, 
 *          Database-SM bridge, Local Guru Cache, Console Log, Rtalk, Web Server
 *  
 *  RiBridge
 *  |_SM Router
 *  |_Oleo (Remote Guru)
 *  |_SM Bridge
 *  |_TextMode Bridge
 *  |_Whiteboard Launcher
 *  |_Database-SM Bridge
 *  |_STDF Cleanup tool
 *  |_Local Guru Cache
 *  |_Console Log
 *  |_Rtalk (requires java 1.7+)
 *  |_Web server
 *    |_SM servlet (websocket or http)
 *    |_rawSM servlet (websocket only)
 *    |_GuruQuery servlet
 *    |_GuruFetch servlet
 *    |_GuruRiri servlet
 *    |_FileFetch servlet
 *    |_Echo servlet (websocket only)
 * 
 * ------------------------------------------------------------------------------------------
 * Documentation for the webserver portion:
 * Powered by Jetty. This provides servlets for interacting with Guru over http:
 *  This version (as opposed to GuruWebServer) allows use of HTML 5 including web sockets. 
 *  Requires Java 1.5+ and Jetty 7.5+.
 *  
 *   1. /guru/query?...
 *   2. /guru/riri?...
 *   3. /guru/sm?...
 *   4. Guru Fetch
 *   5. File Fetch
 * In addition, provides a GUI interface for controlling and monitoring the web server.
 *
 * Sample usage:
 * ------------------------------------------------------------------------
 *
 * SM:
 * http://localhost:7501/guru/sm?%1cSM%1dSMDST=00000000%1dSMSRC=%1dSRC=%1cSomeChannel%1cIt is%1dJust%1dSo%1dHappenin
 * http://localhost:7501/guru/sm?
 *
 * Query:
 * http://localhost:7501/guru/query?exec&ri.sys.Title=Digital%20Translate
 * http://localhost:7501/guru/query?KA&ri.sys.Name=SampleOer2
 * http://localhost:7501/guru/query?KV&ri.sys.Name=SampleOer&ri.sys.ObjClass,ri.sys.Title,ri.sys.Name
 * http://localhost:7501/guru/query?KR&ri.sys.Name=SampleOer&ri.sys.ObjClass,ri.sys.Title,ri.sys.Name
 * http://localhost:7501/guru/query?quit    //terminate web server
 * Options: OR=Object Retrieve, KQ=Keys Query, KV=KeyValues, KR=KeyRange, KA=Object Attributes
 *
 * RIRI:
 * http://localhost:7501/guru/riri?GR%1dSCOPE=LOCAL%1c%1dri.sys.ObjClass=WebPage%1dlast
 * http://localhost:7501/guru/riri?KA%1dSCOPE=LOCAL%1c%1dri.sys.ObjClass=WebPage%1dri.sys.Name=SampleOer%1dlast
 *
 * Guru Fetch:
 * http://localhost:7501/product/review/SampleFileToFetch.html
 *        ri.sys.FilePath^   ri.sys.Name^   ri.sys.FileExt^
 *
 * Javascript:
 * http://localhost:7501/product/GservTest1.html
 * http://localhost:7501/GservTest2.html
 *
 * File Fetch:
 * http://localhost:7501/riapps/web/oer/sample.html //note: any file in /RiApps.
 *
 * ------------------------------------------------------------------------
 * The following external jar files are required for this web server:
 *   o jetty-all-7.3.1.v20110307.jar: Jetty server
 *   o servlet-api-2.5-20081211 javax.servlet 2.5
 *   o commons-logging-1.1.1.jar: Apache Commons logging
 * Also: the servlets must be specifically included in the Jar file (since they go in by Reflection).
 *
 * ------------------------------------------------------------------------
 * JarMaker build settings:
 * Dest Dir: C:\Pgms\workspace\GuruApplication\GM3EKE2A_RtServer
 * Output Jar: RtServer.jar
 * Input classNames: ri.app.web.RtServer, ri.core.web.servlet.ServletGuruQuery, ri.core.web.servlet.ServletGuruRiri, ri.core.web.servlet.ServletGuruFetch, ri.core.web.servlet.ServletFileFetch, ri.core.web.servlet.ServletGuruSm7,  ri.core.web.servlet.ServletGuruRawSm, ri.core.web.servlet.ServletEcho 
 * Excludes: java.,javax.,sun.
 * Classpath: C:\pgms\workspace\RiApps;C:\pgms\workspace\Jars\commons-logging-1.1.1.jar;jetty-all-7.5.4.v20111024.jar;C:\pgms\workspace\Jars\servlet-api-2.5-20081211.jar;C:\pgms\workspace\Jars\json_simple-1.1.jar
 * Addtl app.zip Files: jetty-all-7.5.4.v20111024.jar, servlet-api-2.5-20081211.jar
 *
 * ------------------------------------------------------------------------
 * History:
 * -ver 9 OER 1/4/13: Updated SmLauncher for 'database'
 * -ver 8 OER 8/24/12: Fixed issues with PipeCLient auto reconnect
 * -ver 7 OER 8/20/12:Added auto-reconnect to pipeclient 
 * -ver 6 7/8/12 OER:
 *     o Disabled the web server functionality until such time as it may be needed.
 *     o updated the way Rtalk is instantiated and command line parameters are passed downto it.
 * -ver 5 7/6/12 OER:
 *     o Modified formatting of command line parameters. Was: "-param1 -param2 value...", Now: "param1 param2=value..."
 *     o No longer parsing Rtalk cmd line params at main(), now these are passed down to rtalk itself  
 * -ver 4 6/22/12 OER:
 *     o Removed GuruLook (standalone application now)
 * -ver 3 11/30/11 OER:
 *     o Synchronized with GuruWebServer and ensured they share the following (with websocket functionality
 *       turned off for GuruWebServer): SM Router, Oleo, SM Bridge, TextMode Bridge, Whiteboard Launcher, 
 *       Database-SM Bridge, Local Guru Cache, Console Log, Web server
 *     o added 'Status' view to show state of all above items
 * -ver 2 11/22/11 oer:
 *     o Added MenuTools: SmEmit, SmLauncher, WbApp, GuruLook, SimTestExec
 * -Created 9/3/2011, OER. Based on ri.app.web.GuruWebServer version 5.
 * ------------------------------------------------------------------------
 * */
public class RtServer extends JFrame implements RiriApp {

  private static final long serialVersionUID=1L;  //eliminates compiler warning

  private static final String _appVersionNo="9";
  private static boolean _webserverEnabled=true;  //if this is false then the web server functionality is disabled (can be enabled/disabled at the command line)
  //private static final String DEFAULT_CMDLINE_ARGS = "rtDebug guruIp=192.168.56.15 rtBoot=GAKRE8CABJADXV00 rtLoad=GAKRE8CABJADXV00 rtLaunch=RtTestCases:benchmark1";
  private static final String DEFAULT_CMDLINE_ARGS = "rtDebug rtBoot=GAKRE8CABJADXV00 rtLoad=GAKRE8CABJADXV00 rtLaunch=RtTestCases:benchmark1";
  private static String _title = "RT Server";     //description for user, title, about box etc. 
  private boolean _guiEnabled=true;               //default is to provide a web server gui display
  private String _guruIp = "localhost";           //ip address where Guru Web Server makes its guru queries 
  public int _guruPort = 50010;                   //port used to communicate to guru 
  private int _httpPort=7501;                     //port used to communicate over http
  private Server _server = null;
  private JPanel _pnlBridges = new JPanel(new GridLayout(0,1,0,0)); //This is the panel containing all the current BridgePanels
  private SmRouter _smRouter = null;              //view panel for SM Router activity
  
  //Settings related to Rtalk (non-null values override default settings):
  private RtalkForRtServer _rtalk = null;
  private boolean _disableLoadingOfRtalk=false;   //default is to load rtalk (in any case only loads if java runtime supports it)
  private Boolean _doRtalk = null;                //true if Rtalk is to be initialized (this gets set to false if the jvm does not provide the facilities for running rtalk) 
  private String _noRtalkReason = null;           //if non-null then this is a description of the reason for rtalk not being initialized
  private boolean _initialBrowserLaunch=false;    //set to false to disable initial browser launch
  
  private SmLauncher _smLauncher = null;
  private static boolean _verboseServlets=false;
  private JCheckBoxMenuItem _menuViewVerbose=new JCheckBoxMenuItem("Verbose", _verboseServlets); //verbose servlets
  private QuickQueryDialog _queryDialog = null;
  private StdfCleanup _stdfCleanupTool = null;

  //Non webserver related fields:
  private SmEmit _smEmit = null;
  private RtServer _me = this;                    //convenience thing
  private String[] _cmdLineArgs=null;             //this holds the command line args the program was started with (so can restart rtalk) 

  /*Constr*/
  public RtServer(String[] args, String title) throws Exception {
    super();
    _cmdLineArgs = args; //save for Rtalk restarts
    decodeCmdlineArgs(args);
    //System.out.println("Guruip="+_guruIp+", guruPort="+_guruPort+", httpPort="+_httpPort);
    if(_guiEnabled) RiLookAndFeel.init(args);

    _title = title;
    setTitle(_title);
    
    GuruMgr guru;
    guru = GuruAccess.hookupAndRegister(this, _title, false); //initial hook up to Guru
    String connectString = null;
    if(_guruIp!=null && !_guruIp.toLowerCase().startsWith("local")) {
      connectString = _guruIp;
      if(_guruPort!=50000 && _guruPort!=50010)
        connectString += ":"+_guruPort;
      guru=GuruAccess.instance(connectString);
      if(guru!=null)
        Emit.out("Connected to guru at: "+connectString);
      else 
        Emit.out("Unable to connect to guru at: "+connectString);
    }
    RtalkForRtServer.setConnectString(connectString);
    
    if(guru!=null) guru.setSuperUserMode(true); //bypasses normal guru permissions limitations
    okToRunRtalk(); //check environment to determine suitability for running Rtalk
    BridgePanel smBridge=null; //initial SM bridge
    
    if(_guiEnabled) {
      enableEvents(AWTEvent.WINDOW_EVENT_MASK);
      guiInit();
      if(connectString==null) //i.e. if just using local guru
        smBridge = doAddBridge("localhost", null, false);
      else
        smBridge = doAddBridge(connectString, null, false);
      Dimension scrnSz = Toolkit.getDefaultToolkit().getScreenSize();
      int wd = 800;
      int ht = 400;
      setSize(wd, ht);
      setLocation(scrnSz.width-wd-10, scrnSz.height-ht-100); //near the bottom right
      validate();
      setVisible(true);
      setExtendedState(JFrame.ICONIFIED); //start out iconified. Note for OS2: do this AFTER setVisible to be able to see iconified, do it BEFORE to see nothing
    }
    
    setupWebserver();
    
    //Start things up:
    
    _smRouter = new SmRouter(this, _title); //handles local routing of SM messages
    
    if(smBridge!=null)
      smBridge.doButn1Connect(); //connect up the bridge to localhost. This is at the end because it helps to delay this a bit, or else the Guru-bar button name can get messed up (you see the same name twice)
    
    _smLauncher = new SmLauncher(this,true); //just always have this running. It responds to channels "whiteboard", "database" (case insensitive)

    doServerStart(true); //get the server going
    
    doRestartRtalk(); //if conditions are ok for running rtalk then this initializes it

    if(_initialBrowserLaunch)
      doLaunch(); //initial web browser launch
  }

  /**Initialize gui related components*/
  private void guiInit() {
    setupMenuBar();
    getContentPane().setLayout(new BorderLayout());
    
    //TODO: Change from Emit text area to JEditorPane and have it respond to hyperlinks (see example below) Otherwise just put a button or something to do it.
    Component emitComponent = Emit.checkoutTextArea(true);
    if(emitComponent!=null) { //if something else didn't already take it, we have it
      getContentPane().add(emitComponent, BorderLayout.CENTER);
      Emit.captureConsoleOut(true); //let the Emit Window capture console output
    }
    getContentPane().add(new JScrollPane(_pnlBridges), BorderLayout.SOUTH);
  }

  /**Example: This provides hyperlink functionality to entries in a JEditorPane*/
//class Hyperactive implements HyperlinkListener {
//  public void hyperlinkUpdate(HyperlinkEvent e) {
//    if(e.getEventType() != HyperlinkEvent.EventType.ACTIVATED) return;
//    JEditorPane pane=(JEditorPane)e.getSource();
//    if(e instanceof HTMLFrameHyperlinkEvent) {
//      HTMLFrameHyperlinkEvent evt=(HTMLFrameHyperlinkEvent)e;
//      HTMLDocument doc=(HTMLDocument)pane.getDocument();
//      doc.processHTMLFrameHyperlinkEvent(evt);
//      return;
//    }
//    //i.e. e not instanceof HTMLFrameHyperlinkEvent:
//    try { pane.setPage(e.getURL()); }
//    catch(Throwable t) { t.printStackTrace(); }
//  }
//}

  /**Sets up the main window pull down menus*/
  private void setupMenuBar() {
    JMenuBar menuBar=new JMenuBar();
    JMenu menuFile=new JMenu("File");
    JMenu menuView=new JMenu("View");
    JMenu menuAction=new JMenu("Action");
    JMenu menuTools=new JMenu("Tools");
    JMenu menuHelp=new JMenu("Help");

    JMenuItem menuFileExit=new JMenuItem("Exit");
    JMenuItem menuViewStatus=new JMenuItem("Status");
    JMenuItem menuViewSmRouter=new JMenuItem("SM Router");
    JMenuItem menuViewConsole=new JMenuItem("Console");
    JMenuItem menuActionLaunch=new JMenuItem("Launch");
    JMenuItem menuActionStartWebserver=new JMenuItem("Start (Restart) Webserver");
    JMenuItem menuActionStopWebserver=new JMenuItem("Stop Webserver");
    JMenuItem menuActionRestartRtalk=new JMenuItem("Restart Rtalk");
    JMenuItem menuActionAddSmBridge=new JMenuItem("Add an SM Bridge");
    JMenuItem menuActionRemoveSmBridge=new JMenuItem("Remove an SM Bridge");
    JMenuItem menuToolsOleo=new JMenuItem("Oleo (Remote Guru)");
    JMenuItem menuToolsDbBridge=new JMenuItem("dbase-sm bridge");
    JMenuItem menuToolsSmLauncher=new JMenuItem("SM Launcher");
    JMenuItem menuToolsWhitebdApp=new JMenuItem("Whiteboard App");
    JMenuItem menuToolsSmEmit=new JMenuItem("SM Emit");
    JMenuItem menuToolsSimTestExec=new JMenuItem("Simulated TestExec");
    JMenuItem menuToolsStdfCleanup=new JMenuItem("STDF Cleanup Tool");
    JMenuItem menuToolsQuickQuery=new JMenuItem("Quick Query");
    JMenuItem menuHelpAbout=new JMenuItem("About");

    setJMenuBar(menuBar);
    menuBar.add(menuFile);
    menuBar.add(menuView);
    menuBar.add(menuAction);
    menuBar.add(menuTools);
    menuBar.add(menuHelp);

    menuFile.add(menuFileExit);
    menuView.add(menuViewStatus);
    menuView.add(menuViewSmRouter);
    menuView.add(menuViewConsole);
    menuView.add(_menuViewVerbose);
    if(_webserverEnabled) { //if the web server functionality is enabled
      menuAction.add(menuActionLaunch);
      menuAction.add(menuActionStartWebserver);
      menuAction.add(menuActionStopWebserver);
    }
    menuAction.add(menuActionRestartRtalk);
    menuAction.add(menuActionAddSmBridge);
    menuAction.add(menuActionRemoveSmBridge);
    menuTools.add(menuToolsOleo);
    menuTools.add(menuToolsDbBridge);
    menuTools.add(menuToolsSmLauncher);
    menuTools.addSeparator();
    menuTools.add(menuToolsWhitebdApp);
    menuTools.add(menuToolsSmEmit);
    menuTools.add(menuToolsSimTestExec);
    menuTools.add(menuToolsStdfCleanup);
    menuTools.add(menuToolsQuickQuery);
    menuHelp.add(menuHelpAbout);
    
    if(!okToRunRtalk())
      menuActionRestartRtalk.setEnabled(false);

    menuFileExit.addActionListener(new ActionListener() {
      public void actionPerformed(ActionEvent e) { doExit(); }
    });
    menuViewStatus.addActionListener(new ActionListener() {
      public void actionPerformed(ActionEvent e) { doShowStatusDialog(); }
    });
    menuViewSmRouter.addActionListener(new ActionListener() {
      public void actionPerformed(ActionEvent e) { _smRouter.setVisible(true); }
    });
    menuViewConsole.addActionListener(new ActionListener() {
      public void actionPerformed(ActionEvent e) { RtServerConsole.instance().setVisible(true); }
    });
    _menuViewVerbose.addActionListener(new ActionListener() {
      public void actionPerformed(ActionEvent e) { _verboseServlets=_menuViewVerbose.isSelected(); }
    });
    
    menuActionLaunch.addActionListener(new ActionListener() {
      public void actionPerformed(ActionEvent e) { doLaunch(); }
    });
    menuActionStartWebserver.addActionListener(new ActionListener() {
      public void actionPerformed(ActionEvent e) { doServerStart(true); }
    });
    menuActionStopWebserver.addActionListener(new ActionListener() {
      public void actionPerformed(ActionEvent e) { doServerStop(true); }
    });
    menuActionRestartRtalk.addActionListener(new ActionListener() {
      public void actionPerformed(ActionEvent e) { doRestartRtalk(); }
    });

    menuActionAddSmBridge.addActionListener(new ActionListener() {
      public void actionPerformed(ActionEvent e) { doAddBridge("localhost", null, true); }
    });
    menuActionRemoveSmBridge.addActionListener(new ActionListener() {
      public void actionPerformed(ActionEvent e) { doRemoveBridge(); }
    });

    menuToolsSmEmit.addActionListener(new ActionListener() { //SM Emit tool
      public void actionPerformed(ActionEvent e) {
        if(_smEmit==null) _smEmit = new SmEmit(true);
        _smEmit.setVisible(true);
      }
    });
    menuToolsSmLauncher.addActionListener(new ActionListener() { //RT Launcher (SM based RT application launcher)
      public void actionPerformed(ActionEvent e) {
        if(_smLauncher==null) _smLauncher = new SmLauncher(this,true);
        _smLauncher.setVisible(true);
      }
    });
    menuToolsOleo.addActionListener(new ActionListener() { //Oleo (remote guru)
      public void actionPerformed(ActionEvent e) { new Oleo(this).setVisible(true); }
    });
    menuToolsWhitebdApp.addActionListener(new ActionListener() { //Rtalk Application
      public void actionPerformed(ActionEvent e) { new WhiteboardApp(false, null, null, false); }
    });
    menuToolsDbBridge.addActionListener(new ActionListener() {
      public void actionPerformed(ActionEvent e) { new DatabaseSmBridge(this); }
    });
    menuToolsSimTestExec.addActionListener(new ActionListener() {  //Sim. Testexec (for debug)
      public void actionPerformed(ActionEvent e) { new SimTestExec(this); }
    });
    menuToolsStdfCleanup.addActionListener(new ActionListener() {  //STDF Cleanup Tool
      public void actionPerformed(ActionEvent e) { 
        if(_stdfCleanupTool==null) _stdfCleanupTool = new StdfCleanup(this);
        else _stdfCleanupTool.setVisible(true);
      }
    });
    menuToolsQuickQuery.addActionListener(new ActionListener() {  //Quick Query for Guru
      public void actionPerformed(ActionEvent e) { 
        if(_queryDialog==null) _queryDialog = new QuickQueryDialog(_me);
        _queryDialog.setVisible(true);
      }
    });
    
    menuHelpAbout.addActionListener(new ActionListener() {
      public void actionPerformed(ActionEvent e) { doHelpAbout(); }
    });
  }

  private void doShowStatusDialog() {
    JDialog d = new JDialog(this, "Status", false);
    Container cp = d.getContentPane();
    cp.setLayout(new BorderLayout());
    cp.add(new StatusPanel(true, okToRunRtalk(), _webserverEnabled), BorderLayout.CENTER);
    d.pack();
    d.setLocationRelativeTo(this);
    d.setVisible(true);
  }
  
  /**Add a another SM bridge to the list. 
   * Returns the created bridge. 
   * Does not do any 'connect'*/
  private BridgePanel doAddBridge(String ip1, String ip2, boolean doPack) {
    BridgePanel bp = new BridgePanel(null, ip1, true, false, null, ip2, true, false);
    _pnlBridges.add(bp);
    if(doPack)
      specialPack();
    return bp;
  }
  
  /**Disconnect and remove an SM bridge from the list*/
  private void doRemoveBridge() {
    int cnt = _pnlBridges.getComponentCount();
    if(cnt==0) return; //nothing to do
    Object choice=null;
    if(cnt==1) choice="1"; //if there is only one entry then already know which one to delete
    else if(cnt>1) {
      String[] values = new String[cnt];
      for(int i=0; i<cnt; i++) values[i] = Integer.toString(i+1);
      MenuPromptDialog d = new MenuPromptDialog(this, "Remove Which Bridge?", values, -1, true);
      d.setVisible(true);
      choice = d.getSelectedValue();
    }

    if(choice==null) return; //operation cancelled
    try {
      int which = Integer.parseInt(choice.toString())-1;
      if(which >=0) _pnlBridges.remove(which);
      _pnlBridges.invalidate();
      specialPack();
    }
    catch(Exception e) { Emit.out("*Nothing removed because "+e); } //debug
  }
  
  /**This is a 'pack()' that tries to keep the bottom of the Window in the same spot and all of window visible
   * Also, width is preserved.*/
  private void specialPack() {
    Dimension oldSz = getSize(); //save current position and size
    Point oldLoc = getLocation();
    pack();
    Dimension scnSz = Toolkit.getDefaultToolkit().getScreenSize();
    Dimension newSz = getSize();
    newSz.width = oldSz.width; //preserve the old width (for now) 

    int newY = oldLoc.y-(newSz.height-oldSz.height);
    if(newY<10) newY=10;
    
    int newX = oldLoc.x;
    if( (newX+newSz.width) > scnSz.width-10) newX = scnSz.width-newSz.width-10;
    if(newX < 10) newX=10;

    setSize(newSz);
    setLocation(newX, newY); //subtract new size from oldSize, adjust vpos by that amount
  }

  /**Determines whether the currently executing Java has the facilities to run Rtalk*/ 
  private boolean okToRunRtalk() {
    if(_doRtalk==null) { //initialize values first time thru
      if(_disableLoadingOfRtalk) {
        _doRtalk = Boolean.FALSE;
        _noRtalkReason = "Note: Rtalk is disabled.";
      }
      else {
        int verno = getJdkVersion(); 
        if(verno >= 7) //ok to run rtalk
          _doRtalk = Boolean.TRUE;
        else {             //can't use rtalk on java 1.6 on down
          _doRtalk = Boolean.FALSE;
          if(verno==0)
            _noRtalkReason = "Rtalk not available because: Unable to determine current JDK runtime version (Rtalk requires JDK 7 or higher).";
          else
            _noRtalkReason = "Rtalk not available because:  Currently running JDK "+verno+". Rtalk requires JDK 7 or higher.";
        }
      }
    }
    return _doRtalk.booleanValue();
  }

  /**If conditions are ok for running rtalk then this initializes (or re-initializes) it*/
  private void doRestartRtalk() {
    if(okToRunRtalk()) {
      if(_rtalk!=null) //if has been previously initialized then need to shut down the old one
        _rtalk.shutdown();
      _rtalk = new RtalkForRtServer(_cmdLineArgs);
    }
    else Emit.out(_noRtalkReason);
  }
  
  /**Returns the main jdk version number. Examples: JDK 1.4 ==> 4, 1.7 ==> 7 etc.
   * If unable to determine jdk version number then just returns 0.*/
  private int getJdkVersion() {
    String ver = System.getProperty("java.runtime.version"); //i.e. "1.6.0_24-b07"
    if(ver==null) System.getProperty("java.version"); //just in case
    if(ver==null) return 0; //give up, unknown version number
    
    try {
      int p1 = ver.indexOf('.');
      int p2 = ver.indexOf('.', p1+1);
      p1++; //point to one past the initial decimal
      if(p2<0) p2 = ver.indexOf('_', p1); //just in case
      if(p2<0) p2 = p1+1; //just in case
      return Integer.parseInt(ver.substring(p1, p2));
    }
    catch(Exception e) { return 0; } //unknown version number
  }
  
  /**Sets up the web server with the required servlets*/
  private void setupWebserver() throws Exception {
    if(!_webserverEnabled) return; //if the web server functionality is disabled
    
    _server = new Server(_httpPort);
    GuruConnection.useGuruIpAndPort(_guruIp, _guruPort); //set the ip and port that all servlets will use to access Guru 

    //Map servlet classes to URI's:
    ServletContextHandler cth1 = new ServletContextHandler(ServletContextHandler.SESSIONS);
    cth1.setContextPath("/guru");
    cth1.setDisplayName("guru servlet");
    cth1.addServlet(ri.core.web.servlet.ServletGuruQuery7.class, "/query/*"); //guru/query servlet
    //cth1.addServlet(ri.core.web.servlet.ServletGuruRiri7.class, "/riri/*");  //guru/riri servlet
    cth1.addServlet(ri.core.web.servlet.ServletSm7.class,       "/sm/*");    //guru/sm7 (websocket) servlet
    cth1.addServlet(ri.core.web.servlet.ServletRawSm.class,     "/rawsm/*"); //guru/rawsm (websocket) servlet
    cth1.addServlet(ri.core.web.servlet.ServletEcho.class,      "/echo/*");  //echo websocket servlet (debug*)

    //Use FileFetch servlet for file system location, e.g., C:\RiApps, D:\RiApps:
    ServletContextHandler cth2 = new ServletContextHandler(ServletContextHandler.SESSIONS);
    cth2.setContextPath("/riapps"); //define web application for context path
    //cth2.setResourceBase(getRiAppsDir()); <--make this work correctly so can elim the RiUriTypeFileFetch7.setFileBase kludge
    cth2.addServlet(ri.core.web.servlet.ServletFileFetch7.class, "/*"); //file fetch servlet

    //Use GuruFetch servlet for context path "/*":
    ServletContextHandler cth3 = new ServletContextHandler(ServletContextHandler.SESSIONS);
    cth3.setContextPath("/"); //define web application for context path
    cth3.addServlet(ri.core.web.servlet.ServletGuruFetch7.class, "/*"); //guru fetch servlet

    ContextHandlerCollection contextCollection = new ContextHandlerCollection();
    contextCollection.setHandlers(new Handler[] {cth1, cth2, cth3});
    _server.setHandler(contextCollection);
  }

  /**Start the web server*/
  private void doServerStart(boolean verbose) {
    if(!_webserverEnabled) return; //if the web server functionality is disabled

    if(verbose) {
      try { Emit.out("Jetty version: "+_server.getClass().getPackage().getImplementationVersion()); }
      catch(Exception e) {
        Emit.out("Jetty version: <unknown> because "+e);
      }
    }
    if(_server.isStarted()) {
      if(verbose) Emit.out("Stopping Currently running server...");
      try { _server.stop(); } catch(Exception e) {}
    }
    if(verbose) Emit.out("Starting Server...");
    try { 
      _server.start(); 
      if(verbose) Emit.out("Server Started");
      Emit.out("--- "+_title+" Server listening on port "+_httpPort+"\n");
    } 
    catch(Exception e) {
      Emit.out("\n--- Error starting server: "+e+"\n");
    }

    ServletGuruSm.reInitialize();
    try { //Do an initial SM query, just to get the SM servlet started up
      URL url = new URL("http://"+_guruIp+":"+_httpPort+"/guru/sm?");
      BufferedReader in=new BufferedReader(new InputStreamReader(url.openStream()));
      while(in.readLine()!=null) ; //loop until all is read.
      in.close();
    }
    catch(FileNotFoundException e) { Emit.out("> No SM connection"); }
    catch(Exception e) { Emit.out("Initial SM setup failed because: "+e); }
    
    ServletSm7.reInitialize();
    try { //Do an initial SM query, just to get the SM servlet started up
      URL url = new URL("http://"+_guruIp+":"+_httpPort+"/guru/sm?");
      BufferedReader in=new BufferedReader(new InputStreamReader(url.openStream()));
      while(in.readLine()!=null) ; //loop until all is read.
      in.close();
    }
    catch(FileNotFoundException e) { Emit.out("> No SM connection"); }
    catch(Exception e) { Emit.out("Initial SM setup failed because: "+e); }
    
    ServletRawSm.reInitialize(); //currently not needed
    try { //Do an initial rawSM query, just to get the SM servlet started up
      URL url = new URL("http://"+_guruIp+":"+_httpPort+"/guru/rawsm?"); //note: functionality in rawsm for this is currently not implemented
      BufferedReader in=new BufferedReader(new InputStreamReader(url.openStream()));
      while(in.readLine()!=null) ; //loop until all is read.
      in.close();
    }
    catch(FileNotFoundException e) { Emit.out("> No rawSM connection"); }
    catch(Exception e) { Emit.out("Initial rawSM setup failed because: "+e); }
  }

  /**Stop the web server*/
  private void doServerStop(boolean verbose) {
    if(!_webserverEnabled) return; //if the web server functionality is disabled
    
    if(verbose) Emit.out("Stopping Server...");
    try { _server.stop(); } catch(Exception e) {}
    if(verbose) Emit.out("Server Stopped");
    GuruConnection.clear();
  }
  
  /**Launch a web browser with Launch apps url*/  
  private void doLaunch() {
    if(!_webserverEnabled) return; //if the web server functionality is disabled
    
    String thisIp = "localhost"; //###determine this, don't use localhost
    String url = "http://"+thisIp+':'+_httpPort+"/index.html";
    try { 
      java.awt.Desktop.getDesktop().browse(java.net.URI.create(url)); //this way only works for java 1.6+ 
      //BrowserLauncher.openURL(url); //manual way to launch a browser
    } 
    catch(Exception e) { Emit.out("Unable to launch browser because: "+e); }
  }
  
  /**Used by servlets to determine whether to be verbose*/
  public static boolean isVerboseServlets() { return _verboseServlets; }

  /**File | Exit action performed*/
  private void doExit() {
    ririExitApplication();
    _smRouter.closeDown();
    if(_webserverEnabled) { //if the web server functionality is enabled
      doServerStop(false);
      System.out.println("Webserver terminated...");
    }
    System.exit(0);
  }

  /**Override in subclasses to indicate application version number*/
  private String getAppVersionNumber() { return _appVersionNo; }

  /**Displays the Help | About Dialog*/
  private void doHelpAbout() {
    String[] info = new String[] {
        _title,
        "Version: " + getAppVersionNumber(),
        "Copyright Roos Instruments (c) "+AboutBox.getYearStringFor(2011),
    };
    //String[] usage = Csv.toArray(getUsageString(), '\n');
    String[] usage = new String[0]; //disable display of usage string

    String[] about = new String[info.length+usage.length];
    int i=0;
    for(int j=0; j<info.length; i++, j++) about[i] = info[j];
    for(int j=0; j<usage.length; i++, j++) about[i] = usage[j];
    new AboutBox(this, about, null);
  }

  // ------------------------
  // RiriApp related methods
  // -------------------------

  /**Instructs a RiriApp to Exit
   * Note: Required for interface RiriApp*/
  public void ririExitApplication() {
    try { GuruAccess.instance().unregisterRiriApp(this); }
    catch (Exception e) {}
  }

  /**Informs a RiriApp that the user has changed
   * Note: Required for interface RiriApp*/
  public void ririUserChanged(String cid) {}

  /**Instructs a RiriApp to go to the top of the Zorder
   * Note: Required for interface RiriApp*/
  public void ririZorderTop() {
    GuruHelper.doZorderTopFor(this);
  }

  /**System message (SM) from Guru
   * Note: Required for interface RiriApp*/
  public void receiveGuruSystemMessage(GuruSystemMessage sm) {
    //Emit.out("WebServer got SM: ["+sm+"]");
    if(sm==null) return; //just in case
    String channel = sm.getChannelAsString();
    if(channel!=null && channel.equalsIgnoreCase("console")) {
      RtServerConsole.instance(this).log(sm);
    }
  }

  /**Overridden so can exit on System Close*/
  protected void processWindowEvent(WindowEvent e) {
    super.processWindowEvent(e);
    if (e.getID() == WindowEvent.WINDOW_CLOSING) doExit();
  }

  // -----------------------------------
  // Methods required for SmEmitParent:
  // -----------------------------------

  /**Returns current list of connection names
   * Required for interface SmEmitParent_*/
//  public String[] getConnectionNames() {
//    int cnt = _pnlBridges.getComponentCount();
//    ArrayList list = new ArrayList();
//    for(int i=0; i<cnt; i++) {
//      Component co = _pnlBridges.getComponent(i);
//      if(co instanceof BridgePanel) {
//        BridgePanel bp = (BridgePanel)co;
//        list.add(bp.getName(0));
//        list.add(bp.getName(1));
//      }
//    }
//    cnt = list.size();
//    String[] sa = new String[cnt];
//    for(int i=0; i<cnt; i++)
//      sa[i] = list.get(i).toString();
//    return sa;
//  }
//
//  /**Returns specified sm connection.
//   * Required for interface SmEmitParent_*/
//  public Connection_ getConnection(String name) {
//    if(name==null) return null; //just in case
//    int cnt = _pnlBridges.getComponentCount();
//    for(int i=0; i<cnt; i++) {
//      Component co = _pnlBridges.getComponent(i);
//      if(co instanceof BridgePanel) {
//        BridgePanel bp = (BridgePanel)co;
//        if(name.equals(bp.getName(0))) return bp.getConnection(0);
//        if(name.equals(bp.getName(1))) return bp.getConnection(1);
//      }
//    }
//    return null; //no match
//  }

  // -----------------------------------
  
  /**help on command line args*/
  private String getUsageString() {
    return
        "\n"+
        "Command line parameters: RtServer guruIp=ipAddress:port httpPort=portNo\n" +
        "    webserver=true gui=false browser=false rtalk=false rtBoot=revisionId\n"+
        "    rtLoad=revisionId rtLaunch=package:method rtDebug help\n"+
        "\n"+
        "-guruIp=ipAddress:port: Specifies which Guru use (default is localhost)\n" +
        "    Default port assumed if not specified.\n"+
        "    Examples: guru.roos.com, localhost, 192.168.1.143:50000, useSLP('criteria').\n"+
        "-httpPort=portNo: port number to communicate with web browser (default is "+_httpPort+")\n"+
        "-webserver=false: enables/disables the web server feature.\n"+
        "-gui=false: turn off the web server gui display (i.e. run headless).\n"+
        "-browser=false: Do not launch a web browser on startup\n"+
        "-rtalk=false: Disable Rtalk.\n"+
        "-rtBoot=revisionId: boots rtalk using the given ri.sys.RevisionId.\n"+
        "-rtLoad=revisionId: defines the ri.sys.Revision to be loaded by rtalk on startup.\n"+
        "-rtLaunch=methodName: initial method to be called on rtalk startup.\n"+
        "-rtDebug: enables rtalk debug mode.\n"+
        "Notes:\n"+
        "  Commands are case insensitive.\n"+
        "  Option: guruIp useSLP('criteria') not yet implemeted.\n";
  }
  
  /*i.e. "guruip=192.168.1.143:50000 httpPort=7501 gui=false help"*/
  private void decodeCmdlineArgs(String[] args) {
    int len = args==null ? 0 : args.length;
    for(int i=0; i<len; i++) {
      try {
        String cmd, val="", arg=args[i]; //extract "cmd" or "cmd=val" from each command line parameter
        int pos=arg.indexOf('=');
        if(pos<0) cmd = arg.trim(); //no equals means it's all cmd
        else { //get the cmd and value portions
          cmd = arg.substring(0, pos).trim();
          if(pos < (arg.length()-1)) //ie: unless equals sign is the last char
            val = arg.substring(pos+1).trim();
        }
        
        if(cmd.equalsIgnoreCase("guruip")) { //user defined guru IP address
          String guruIpAndPort = val;
          int p = guruIpAndPort.indexOf(':');
          _guruPort=-1;
          _guruIp=null;
          if(p>=0) {
            _guruIp = guruIpAndPort.substring(0, p);
            try { _guruPort = Integer.parseInt(guruIpAndPort.substring(p+1)); }
            catch(Exception e) {}
          }
          else _guruIp = guruIpAndPort;
          if(_guruIp==null || _guruIp.length()==0) _guruIp="localhost";
          if(_guruPort<0) { //i.e. if none specified
            if(_guruIp.equalsIgnoreCase("localhost"))
              _guruPort=50010;
            else _guruPort = 50000;
          }
        }
        else if(cmd.equalsIgnoreCase("httpport")) {
          try { _httpPort = Integer.parseInt(val); }
          catch(Exception e) {} //on error, leave the original setting
        }
        else if(cmd.equalsIgnoreCase("webserver")) { //enable/disable the web server feature
          if(val.equalsIgnoreCase("false"))
            _webserverEnabled=false;
          else _webserverEnabled=true;
        }
        else if(cmd.equalsIgnoreCase("gui")) { //disable web server gui display
          if(val.equalsIgnoreCase("false"))
            _guiEnabled=false;
          else _guiEnabled=true;
        }
        else if(cmd.equalsIgnoreCase("browser")) { //disable initial launch of web browser 
          if(val.equalsIgnoreCase("false"))
            _initialBrowserLaunch=false;
          else _initialBrowserLaunch=true;
        }
        else if(cmd.equalsIgnoreCase("rtalk")) { //disable loading of Rtalk 
          if(val.equalsIgnoreCase("false"))
            _disableLoadingOfRtalk=true;
          else _disableLoadingOfRtalk=false;
        }
        else if(cmd.equalsIgnoreCase("help") || cmd.equals("?")) { 
          System.out.println(getUsageString()); 
          System.exit(0); 
        }
      }
      catch(Exception e) {
        System.out.println("Problem with command line parameter #"+(i+1)+"["+args[i]+"]: "+e.getMessage());
      }
    }
  }

  /**Main*/
  public static void main(String[] args) {
    if(args.length==0) args = Csv.toArray(DEFAULT_CMDLINE_ARGS, ' ');
    RiLookAndFeel.init(args);
    RtServer webServer=null;
    try { webServer = new RtServer(args, _title); }
    catch(Throwable t) {
      t.printStackTrace();
      if(webServer!=null)
        webServer.doServerStop(false); //shutdown
    }
  }

}
