'use client'

import { useEffect, useState } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";

const NotificationListPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const q = query(collection(db, "notifications"), orderBy("time", "desc"));
        const snapshot = await getDocs(q);
        const items = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            time: data.time?.toDate?.().toLocaleString() || data.time || '',
          };
        });
        setNotifications(items);
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Notifications</h1>

      {loading ? (
        <p className="text-gray-500">Loading notifications...</p>
      ) : notifications.length === 0 ? (
        <p className="text-gray-500">No notifications yet.</p>
      ) : (
        <div className="divide-y divide-gray-200 border border-gray-200 rounded-lg shadow-sm">
          {notifications.map(n => (
            <button
              key={n.id}
              onClick={() => router.push(`/browse/notificationDetail/${n.id}`)}
              className="w-full text-left px-5 py-4 flex items-start gap-4 hover:bg-gray-50 transition"
            >
              <div className="mt-1">
                <Bell className="w-6 h-6 text-orange-500" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h3 className="font-medium text-gray-900">{n.title || "No Title"}</h3>
                  <span className="text-xs text-gray-500">{n.time}</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{n.message}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationListPage;
