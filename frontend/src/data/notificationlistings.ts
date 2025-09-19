import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { useAuth } from "@/app/contexts/AuthInfo";

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (!user?.uid) return;

    const q = query(
      collection(db, "notifications"),
      where("recipientId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const allNotifications = new Map();

        querySnapshot.docs.forEach((doc) => {
          const notifData = {
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
          };
          allNotifications.set(doc.id, notifData);
        });

        const notificationsArray = Array.from(allNotifications.values()).sort(
          (a: any, b: any) => {
            if (!a.createdAt || !b.createdAt) return 0;
            return b.createdAt - a.createdAt;
          }
        );

        setNotifications(notificationsArray);
        setLoading(false);
      },
      (error) => {
        console.error("Error loading notifications:", error);
        setError("Failed to load notifications: " + error.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  return { notifications, loading, error };
}
