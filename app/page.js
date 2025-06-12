"use client"
import dynamic from "next/dynamic";

const Edit = dynamic(() => import("./components/Edit"), { ssr: false });

export default function Page() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-cover bg-center bg-no-repeat relative" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1655866890113-1ee58e8dbf04?q=80&w=735&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')` }}>
      <div className="absolute inset-0 bg-white/70 backdrop-blur-md rounded-2xl shadow-lg p-8">
        <Edit />
      </div>
    </div>
  );
}
