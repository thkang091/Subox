'use client'

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ArrowRight, List } from "lucide-react";

interface Notification {
  title: string;
  message: string;
  time: any;
}

const NotificationDetailPage = () => {
  const router = useRouter();
  const { id } = useParams();
  const [notification, setNotification] = useState<Notification | null>(null);
  const [notificationIds, setNotificationIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch list of all notification IDs once
    const fetchNotificationIds = async () => {
      const querySnapshot = await getDocs(collection(db, "notifications"));
      const ids = querySnapshot.docs.map((doc) => doc.id);
      setNotificationIds(ids);
    };
    fetchNotificationIds();
  }, []);

  useEffect(() => {
    const fetchNotification = async () => {
      try {
        const docRef = doc(db, "notifications", id as string);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setNotification(docSnap.data() as Notification);
        } else {
          setError("Notification not found.");
        }
      } catch (err) {
        console.error("Error fetching notification:", err);
        setError("Failed to load notification.");
      }
    };

    if (id) fetchNotification();
  }, [id]);

  if (error) return <div className="p-4 text-red-600">{error}</div>;
  if (!notification) return <div className="p-4">Loading...</div>;

  const formattedTime =
    typeof notification.time === "string"
      ? notification.time
      : notification.time?.toDate?.().toLocaleString?.() || "Unknown time";

  const goToNextNotification = () => {
    const currentIndex = notificationIds.indexOf(id as string);
    if (currentIndex >= 0 && currentIndex < notificationIds.length - 1) {
      const nextId = notificationIds[currentIndex + 1];
      router.push(`browse/notificationDetail/${nextId}`);
    }
  };

  const goToAllNotifications = () => {
    router.push('browse/notification');
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">{notification.title || "Notification"}</h1>
        <div className="flex gap-2">
          <button
            onClick={goToAllNotifications}
            className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
          >
            <List className="w-4 h-4" /> All Notifications
          </button>
          <button
            onClick={goToNextNotification}
            disabled={
              notificationIds.indexOf(id as string) === -1 ||
              notificationIds.indexOf(id as string) === notificationIds.length - 1
            }
            className="p-2 rounded-md bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
            title="Next Notification"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <p className="text-gray-800">{notification.message}</p>
      <p className="text-sm text-gray-500">{formattedTime}</p>
    </div>
  );
};

export default NotificationDetailPage;
