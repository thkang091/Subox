import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "@/lib/firebase";

export const updateUserHistoryAndBadges = async ({
  userId,
  newRating,
  newRateAvg,
  actionType,
  productId,
  subleaseId,
  rate,
  rateAvg
} : {
  userId: string;
  newRating?: number;
  newRateAvg?: number;
  rate?: number[];
  rateAvg?: number[];
  actionType: "purchased" | "sold" | "rented" | "subleased" | "rated" | "reviewed";
  productId?: string;
  subleaseId?: string;
}) => {
  const userRef = doc(db, "users", userId);

  const updates = {};

  // History Updates
  if (actionType && productId) {
    updates[`history.${actionType}`] = arrayUnion(productId);
  }
  else if (actionType && subleaseId) {
    updates[`history.${actionType}`] = arrayUnion(subleaseId);
  }

  // Rating updates
  if (typeof newRating === "number" && typeof newRateAvg === "number") {
    updates["history.rated"] = arrayUnion(newRating);
    updates["history.averageRate"] = arrayUnion(newRateAvg);

    const rateError = calculateRateError(rate, rateAvg);
    updates["history.rateError"] = rateError;

    if (rateError <= 1) {
      updates["badges.bestRater"] = true;
    }
  }

  await updateDoc(userRef, updates);
};

function calculateRateError(rated: number[], average: number[]) {
  const differences = rated.map((r, i) => Math.abs(r - average[i]));
  const totalError = differences.reduce((a, b) => a + b, 0);
  return Math.round(totalError / rated.length);
}