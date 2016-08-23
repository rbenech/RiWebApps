package ri.app.rtalk;

import java.awt.AWTEvent;
import java.awt.BorderLayout;
import java.awt.Component;
import java.awt.event.MouseAdapter;
import java.awt.event.MouseEvent;
import java.awt.event.WindowEvent;
import java.text.SimpleDateFormat;
import java.util.Date;

import javax.swing.JFrame;
import javax.swing.JScrollPane;
import javax.swing.JTextArea;
import javax.swing.ScrollPaneConstants;
import javax.swing.SwingUtilities;

import ri.core.guru.sm.GuruSystemMessage;
import ri.core.panel.ActionList;
import ri.core.panel.ActionListListener;
import ri.core.panel.EmitDocListener;
import ri.core.util.ClipboardUtil;

/**This is used by RtServer as a display for SM generated 'console' output.
 * Meaning Guru System Messages (SMs) that are targeted towards the "console" sm channel
 * */
public class RtServerConsole extends JFrame {
  
  private static RtServerConsole _instance=null;
  
  //These are used to control the amount of content held by _tarea at any one time:
  private static int _idealSize = 100000;  //after a cleanup, this is how much _tarea will be holding
  private static int _maxExcess = 200000;  //how much excess bytes (over the 'ideal') before _tarea gets 'cleaned up'
  private static SimpleDateFormat _timestampFormat = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");

  private JTextArea _tarea = null;
  private boolean _timestampsEnabled = false;
  private JScrollPane _scrollpane = null;
  private boolean _isVisible=false; //locally cached value used to ensure window is visible without having to call on Swing every single time
  
  /**Private Constr.  Use singleton accessor 'instance()' to create and obtain console*/
  private RtServerConsole(Component parent) {
    enableEvents(AWTEvent.WINDOW_EVENT_MASK);
    guiInit();
    setSize(500,400);
    validate();
    if(parent!=null)
      setLocationRelativeTo(parent); //position the console window
    else 
      setLocation(300,300); //just place it somewhere on the screen
    setVisible(true);
  }
  
  /**Singleton accessor. 
   * Note: 'parent' is only used on initial creation for positioning of the console window
   * */
  public static RtServerConsole instance(Component parent) {
    if(_instance==null)
      _instance = new RtServerConsole(parent);
    _instance.bringToFront();
    return _instance;
  }
  
  /**Singleton accessor.*/
  public static RtServerConsole instance() { return instance(null); }
  
  private void guiInit() {
    setTitle("RtServer Console Output");
    
    _tarea = new JTextArea();
    _tarea.setLineWrap(false);
    _tarea.setWrapStyleWord(true);
    _tarea.setAutoscrolls(false);
    _scrollpane = new JScrollPane(_tarea);
    _scrollpane.setHorizontalScrollBarPolicy(ScrollPaneConstants.HORIZONTAL_SCROLLBAR_ALWAYS);
    _tarea.getDocument().addDocumentListener(new EmitDocListener(_scrollpane)); //causes any newly appended text to be scrolled into view. Note EmitDocListener is found in ri.core.panel and is a part of the 'Emit' window functionality
    
    getContentPane().setLayout(new BorderLayout());
    getContentPane().add(_tarea, BorderLayout.CENTER);
  
    _tarea.addMouseListener(new MouseAdapter() { //right mouse click options for "Clear", "Copy", "Paste", "Timesstamps"  
      public void mouseClicked(MouseEvent e) {
        int mod = e.getModifiers();
        if((mod & MouseEvent.BUTTON3_MASK) != 0) {
          ActionListListener actn = new ActionListListener() {
            String[] _actions = new String[] { "Clear", "Copy", "Paste", "Timestamps" };
            public Object[] getActions() { return _actions; }

            public void doAction(int index, MouseEvent e) {
              String s;
              switch(index) {
                case 0: //Clear
                  _tarea.setText(""); 
                  break; 
                case 1: //Copy
                  s = _tarea.getSelectedText(); //get selected
                  if(s == null || s.length() == 0) s = _tarea.getText(); //get it all
                  ClipboardUtil.putToClipboard(s);
                  break;
                case 2: //Paste
                  s = ClipboardUtil.getClipboardAsString(null);
                  if(s != null) _tarea.insert(s, _tarea.getCaretPosition());
                  break;
                case 3: //toggle timestamps
                  _timestampsEnabled = !_timestampsEnabled;
                  log("Timestamps "+(_timestampsEnabled ? "Enabled" : "Disabled"));
                  break;
              }
            }
          };
          new ActionList(_tarea, e, actn).setVisible(true);
        }
      }
    });
  }
  
  
  public void bringToFront() {
    for (int i=0; i < 2000; i++) //TODO: check to see if still have to do the 2000 times thing 
      requestFocus(); 
    toFront();
    setState(JFrame.NORMAL);
  }
  
  /**Logs the given Guru System Message (SM) to the console*/
  public void log(GuruSystemMessage sm) {
    log(sm.getMessagesAsString()); //TODO: parse the sm and log it properly
  }
  
  /**Logs the given String console*/
  public void log(String msg) {
    StringBuffer sb = new StringBuffer();
    if(_timestampsEnabled) 
      sb.append(getTimestamp()).append(" ");
    sb.append(msg);
    sb.append("\n"); //log each message with a C/R
    final String outMsg = sb.toString();
    
    SwingUtilities.invokeLater(new Runnable() { //required so that EmitDocListener doesn't cause a hang when it auto-scrolls
      public void run() {
        if(!_isVisible) setVisible(true);
        _tarea.append(outMsg);

        //keep content of text area from exceeding the max length. Trim it down to 'ideal':
        int excess = _tarea.getDocument().getLength() - _idealSize;
        if(excess >= _maxExcess)
          _tarea.replaceRange("", 0, excess);
      }
    });
  }
  
  /**If set to true, a timestamp precedes each emitted string Default is timestamps=false*/
  public void enableTimestamps(boolean b) {
    _timestampsEnabled = b;
  }

  private static final String getTimestamp() {
    return _timestampFormat.format(new Date());
  }

  /**@Override*/
  public void setVisible(boolean b) {
    _isVisible = b; //locally cache this value (for speed)
    super.setVisible(b);
  }

  /**Overridden to simply hide window when closed*/
  protected void processWindowEvent(WindowEvent e) {
    super.processWindowEvent(e);
    if (e.getID() == WindowEvent.WINDOW_CLOSING)
      setVisible(false); //hide the window
  }

}
