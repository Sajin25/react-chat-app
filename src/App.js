import { useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  deleteDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { 
  onAuthStateChanged, 
  signInWithPopup,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { db, auth, provider } from './firebase';
import './App.css';
import { Moon, Sun, Mail, Key, UserPlus, Zap, Trash2, Plus, X } from 'react-feather';

function App() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [rooms, setRooms] = useState(['general', 'random', 'help']);
  const [currentRoom, setCurrentRoom] = useState('general');
  const [user, setUser] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [authView, setAuthView] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newChannelName, setNewChannelName] = useState('');
  const [showChannelModal, setShowChannelModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedMode);
    document.body.className = savedMode ? 'dark-mode' : 'light-mode';
    setLoading(false);
  }, []);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    document.body.className = newMode ? 'dark-mode' : 'light-mode';
    localStorage.setItem('darkMode', newMode);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) setAuthView(null);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!currentRoom) return;
    
    const q = query(
      collection(db, 'messages'),
      where('room', '==', currentRoom)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }));
      setMessages(msgs.sort((a, b) => 
        a.createdAt?.seconds - b.createdAt?.seconds || 
        a.createdAt?.nanoseconds - b.createdAt?.nanoseconds
      ));
    });
    return () => unsubscribe();
  }, [currentRoom]);

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      alert(`Google login failed: ${error.message}`);
    }
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      alert(`Login failed: ${error.message}`);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (error) {
      alert(`Sign up failed: ${error.message}`);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      alert(`Logout failed: ${error.message}`);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return alert("Message cannot be empty");
    if (!user) return alert("Please sign in first");

    try {
      await addDoc(collection(db, 'messages'), {
        text: newMessage,
        room: currentRoom,
        createdAt: serverTimestamp(),
        uid: user.uid,
        displayName: user.displayName || user.email.split('@')[0],
        photoURL: user.photoURL || null
      });
      setNewMessage('');
    } catch (error) {
      alert(`Failed to send message: ${error.message}`);
    }
  };

  const deleteMessage = async (messageId) => {
    if (!window.confirm("Delete this message permanently?")) return;
    
    try {
      await deleteDoc(doc(db, 'messages', messageId));
    } catch (error) {
      alert(`Failed to delete message: ${error.message}`);
    }
  };

  const createChannel = () => {
    const channelName = newChannelName.trim();
    if (!channelName) return alert("Channel name required");
    if (rooms.includes(channelName)) return alert("Channel exists");
    if (channelName.length > 15) return alert("Max 15 characters");

    setRooms([...rooms, channelName]);
    setCurrentRoom(channelName);
    setNewChannelName('');
    setShowChannelModal(false);
  };

  if (loading) return <div className="loading-screen">Loading...</div>;

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-left">
          <div className="logo-container">
            <Zap className="logo-icon" />
            <h1>Fire Chat</h1>
          </div>
        </div>
        
        <div className="header-right">
          {user ? (
            <>
              <div className="user-info">
                <img 
                  src={user.photoURL || `https://ui-avatars.com/api/?name=${user.email[0]}`} 
                  alt="User" 
                  className="user-avatar" 
                />
                <span>{user.displayName || user.email.split('@')[0]}</span>
              </div>
              <button onClick={toggleDarkMode} className="theme-toggle">
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <button onClick={handleLogout} className="logout-button">
                Sign Out
              </button>
            </>
          ) : (
            <button onClick={toggleDarkMode} className="theme-toggle">
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          )}
        </div>
      </header>

      {!user && (
        <div className="auth-container">
          <div className="auth-card">
            <h2>{authView === 'login' ? 'Sign In' : 'Create Account'}</h2>
            
            <button onClick={handleGoogleLogin} className="google-auth-button">
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" 
                alt="Google" 
                className="google-icon"
              />
              Continue with Google
            </button>

            <div className="divider">
              <span>or</span>
            </div>

            <form onSubmit={authView === 'login' ? handleEmailLogin : handleSignUp}>
              <div className="input-group">
                <Mail className="input-icon" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  required
                />
              </div>
              
              <div className="input-group">
                <Key className="input-icon" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                  minLength={6}
                />
              </div>

              <button type="submit" className="auth-submit-button">
                {authView === 'login' ? 'Sign In' : 'Sign Up'}
              </button>
            </form>

            <div className="auth-switch">
              {authView === 'login' ? (
                <p>New here? <button onClick={() => setAuthView('signup')}>Create account</button></p>
              ) : (
                <p>Have an account? <button onClick={() => setAuthView('login')}>Sign in</button></p>
              )}
            </div>
          </div>
        </div>
      )}

      {user && (
        <div className="chat-interface">
          <div className="sidebar">
            <div className="sidebar-header">
              <h3>Channels</h3>
              <button 
                onClick={() => setShowChannelModal(true)}
                className="create-channel-button"
                title="Create new channel"
              >
                <Plus size={18} />
              </button>
            </div>
            
            <div className="room-list">
              {rooms.map((room) => (
                <button
                  key={room}
                  className={`room-button ${currentRoom === room ? 'active' : ''}`}
                  onClick={() => setCurrentRoom(room)}
                >
                  # {room}
                </button>
              ))}
            </div>
          </div>

          <div className="main-chat">
            <div className="messages-container">
              {messages.length === 0 ? (
                <div className="empty-state">
                  <Zap size={48} />
                  <p>No messages in #{currentRoom}</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={`message ${msg.uid === user.uid ? 'current-user' : ''}`}
                  >
                    <div className="message-header">
                      <img 
                        src={msg.photoURL || `https://ui-avatars.com/api/?name=${msg.displayName}`} 
                        alt={msg.displayName} 
                        className="message-avatar"
                      />
                      <div className="message-info">
                        <span className="message-sender">{msg.displayName}</span>
                        <span className="message-time">
                          {msg.createdAt?.toDate ? 
                            new Date(msg.createdAt.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 
                            'now'}
                        </span>
                      </div>
                      {msg.uid === user.uid && (
                        <button 
                          onClick={() => deleteMessage(msg.id)}
                          className="delete-message-button"
                          title="Delete message"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                    <p className="message-content">{msg.text}</p>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={sendMessage} className="message-input-container">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={`Message #${currentRoom}`}
                className="message-input"
              />
              <button type="submit" className="send-button">
                Send
              </button>
            </form>
          </div>
        </div>
      )}

      {showChannelModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Create Channel</h3>
              <button 
                onClick={() => setShowChannelModal(false)}
                className="modal-close-button"
              >
                <X size={20} />
              </button>
            </div>
            
            <input
              type="text"
              value={newChannelName}
              onChange={(e) => setNewChannelName(e.target.value)}
              placeholder="Channel name (max 15 chars)"
              className="modal-input"
              maxLength={15}
              autoFocus
            />
            
            <div className="modal-actions">
              <button 
                onClick={() => setShowChannelModal(false)}
                className="modal-button cancel"
              >
                Cancel
              </button>
              <button 
                onClick={createChannel}
                className="modal-button confirm"
                disabled={!newChannelName.trim()}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;