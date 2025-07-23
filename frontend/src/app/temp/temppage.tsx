const NotificationsButton = ({ notifications }: { notifications: Notification[] }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const router = useRouter();

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowNotifications(!showNotifications)}
        className="p-2 bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors relative"
      >
        <Bell className="w-5 h-5 text-white" />
        {notifications.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
            {notifications.length}
          </span>
        )}
      </motion.button>

      <AnimatePresence>
        {showNotifications && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
          >
            <div className="p-4">
              <h3 className="font-semibold text-orange-600 mb-3">Notifications</h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {notifications.map(notif => (
                  <button
                    key={notif.id}
                    onClick={() => router.push(`browse/notificationDetail/${notif.id}`)}
                    className="w-full flex items-start space-x-3 p-2 rounded-lg hover:bg-orange-50 text-left"
                  >
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{notif.message}</p>
                      <p className="text-xs text-gray-500">{notif.time}</p>
                    </div>
                  </button>
                ))}
              </div>

              <button
                onClick={() => router.push(`browse/notification/`)}
                className="mt-3 text-sm text-orange-600 hover:underline"
              >
                See all notifications
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

<MessagesSquare size={20} className = "w-5 h-5 text-gray-600"/>

{/* Profile */}
<div className="relative">
<motion.button
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    onClick={() => setShowProfile(!showProfile)}
    className="p-2 bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors"
>
    <User className="w-5 h-5 text-white" />
</motion.button>

<AnimatePresence>
    {showProfile && (
    <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
    >
        <div className="p-4 space-y-2">
        <button onClick={() => handleTabClick("purchased")} className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-orange-50 transition-colors">What I Purchased</button>
        <button onClick={() => handleTabClick("returned")} className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-orange-50 transition-colors">What I Returned</button>
        <button onClick={() => handleTabClick("cancelled")} className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-orange-50 transition-colors">What I Cancelled</button>
        <button onClick={() => handleTabClick("sold")} className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-orange-50 transition-colors">What I Sold</button>
        <button onClick={() => handleTabClick("sublease")} className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-orange-50 transition-colors">Sublease</button>
        <button onClick={() => handleTabClick("reviews")} className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-orange-50 transition-colors">Reviews</button>
        <hr className="my-2" />
        <button onClick={() => handleTabClick("history")} className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-orange-50 transition-colors">History</button>
        </div>
    </motion.div>
    )}
</AnimatePresence>
</div>

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        setUserId(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleTabClick = (tab) => {
    router.push(`browse/profile/${userId}?tab=${tab}/`);
    setShowProfile(false); // close dropdown
  };

{/* menu */}
<div className="relative">
<motion.button
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    onClick={() => setShowMenu(!showMenu)}
    className="p-2 bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors"
>
    <Menu className="w-5 h-5 text-white" />
</motion.button>

<AnimatePresence>
    {showMenu && (
    <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
    >
        <div className="p-4 space-y-2">
        <p className="text-medium font-semibold max-w-2xl mb-4 text-orange-700">
        Move Out Sale
        </p>
        <button 
            onClick={() => {
            router.push('../browse');
            setShowMenu(false);
            }} 
            className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-orange-50 transition-colors"
        >
            Browse Items
        </button>                        
        <button 
            onClick={() => {
            router.push('/sale/create');
            setShowMenu(false);
            }} 
            className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-orange-50 transition-colors"
        >
            Sell Items
        </button> 
        <button 
            onClick={() => {
            router.push('/sale/create');
            setShowMenu(false);
            }} 
            className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-orange-50 transition-colors"
        >
            My Items
        </button>   
        
        <p className="text-medium font-semibold max-w-2xl mb-4 text-orange-700">
            Sublease
        </p>
        <button 
            onClick={() => {
            router.push('../search');
            setShowMenu(false);
            }} 
            className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-orange-50 transition-colors"
        >
            Find Sublease
        </button>   
        <button 
            onClick={() => {
            router.push('../search');
            setShowMenu(false);
            }} 
            className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-orange-50 transition-colors"
        >
            Post Sublease
        </button>   
        <button 
            onClick={() => {
            router.push('../search');
            setShowMenu(false);
            }} 
            className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-orange-50 transition-colors"
        >
            My Sublease Listing
        </button>
        <hr className="my-2" />
        <button 
            onClick={() => {
            router.push('../sale/browse');
            setShowMenu(false);
            }} 
            className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-orange-50 transition-colors"
        >
            Messages
        </button>   
        <button 
            onClick={() => {
            router.push('../help');
            setShowMenu(false);
            }} 
            className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-orange-50 transition-colors"
        >
            Help & Support
        </button>

        {/* need change (when user didn't log in -> show log in button) */}
        <hr className="my-2" />
            {/* log in/ out */}
            {isLoggedIn ? (
            <button className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-orange-50 transition-colors">
                Logout
            </button>
            ) : (
            <button className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-orange-50 transition-colors">
                Login
            </button>
            )}
        </div>
    </motion.div>
    )}
</AnimatePresence>
</div>
   
<motion.div 
    className="flex items-center space-x-4 relative"
    whileHover={{ scale: 1.05 }}
>
{/* Main Subox Logo */}
<motion.div className="relative">
{/* House Icon */}
<motion.svg 
    className="w-12 h-12" 
    viewBox="0 0 100 100" 
    fill="none"
    whileHover={{ rotate: [0, -5, 5, 0] }}
    transition={{ duration: 0.5 }}
>
    {/* House Base */}
    <motion.path
    d="M20 45L50 20L80 45V75C80 78 77 80 75 80H25C22 80 20 78 20 75V45Z"
    fill="#E97451"
    animate={{ 
        fill: ["#E97451", "#F59E0B", "#E97451"],
        scale: [1, 1.02, 1]
    }}
    transition={{ duration: 3, repeat: Infinity }}
    />
    {/* House Roof */}
    <motion.path
    d="M15 50L50 20L85 50L50 15L15 50Z"
    fill="#D97706"
    animate={{ rotate: [0, 1, 0] }}
    transition={{ duration: 4, repeat: Infinity }}
    />
    {/* Window */}
    <motion.rect
    x="40"
    y="50"
    width="20"
    height="15"
    fill="white"
    animate={{ 
        opacity: [1, 0.8, 1],
        scale: [1, 1.1, 1]
    }}
    transition={{ duration: 2, repeat: Infinity }}
    />
    {/* Door */}
    <motion.rect
    x="45"
    y="65"
    width="10"
    height="15"
    fill="white"
    animate={{ scaleY: [1, 1.05, 1] }}
    transition={{ duration: 2.5, repeat: Infinity }}
    />
</motion.svg>

{/* Tag Icon */}
<motion.svg 
    className="w-8 h-8 absolute -top-2 -right-2" 
    viewBox="0 0 60 60" 
    fill="none"
    whileHover={{ rotate: 360 }}
    transition={{ duration: 0.8 }}
>
    <motion.path
    d="M5 25L25 5H50V25L30 45L5 25Z"
    fill="#E97451"
    animate={{ 
        rotate: [0, 5, -5, 0],
        scale: [1, 1.1, 1]
    }}
    transition={{ duration: 3, repeat: Infinity }}
    />
    <motion.circle
    cx="38"
    cy="17"
    r="4"
    fill="white"
    animate={{ 
        scale: [1, 1.3, 1],
        opacity: [1, 0.7, 1]
    }}
    transition={{ duration: 1.5, repeat: Infinity }}
    />
</motion.svg>
</motion.div>

{/* Subox Text */}
<motion.div className="flex flex-col -mx-4">
<motion.span 
    className="text-3xl font-bold text-gray-900"
    animate={{
    background: [
        "linear-gradient(45deg, #1F2937, #374151)",
        "linear-gradient(45deg, #E97451, #F59E0B)",
        "linear-gradient(45deg, #1F2937, #374151)"
    ],
    backgroundClip: "text",
    WebkitBackgroundClip: "text",
    color: "transparent"
    }}
    transition={{ duration: 4, repeat: Infinity }}
>
    Subox
</motion.span>
<motion.span 
    className="text-xs text-gray-500 font-medium tracking-wider"
    animate={{ opacity: [0.7, 1, 0.7] }}
    transition={{ duration: 2, repeat: Infinity }}
>
    SUBLETS & MOVING SALES
</motion.span>
</motion.div>
</motion.div>