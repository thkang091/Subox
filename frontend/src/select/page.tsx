"use client"

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button"; // if using Shadcn UI

export default function SelectPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 p-10">
      <h1 className="text-3xl font-bold mb-8">What would you like to post?</h1>
      <Button onClick={() => router.push("/moveout")}>
        Move Out Sale
      </Button>
      <Button onClick={() => router.push("/sublease")}>
        Sublease
      </Button>
    </div>
  );
}
