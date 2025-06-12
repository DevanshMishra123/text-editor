"use client"
import dynamic from "next/dynamic";

const Edit = dynamic(() => import("./components/Edit"), { ssr: false });

export default function Page() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-cover bg-center bg-no-repeat relative" style={{ backgroundImage: `url('/your-background.jpg')` }}>
      <div className="absolute inset-0 bg-white/70 backdrop-blur-md rounded-2xl shadow-lg p-8">
        <Edit />
      </div>
    </div>
  );
}
