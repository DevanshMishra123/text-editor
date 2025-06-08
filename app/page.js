"use client"
import dynamic from "next/dynamic";

const Edit = dynamic(() => import("./components/Edit"), { ssr: false });

export default function Page() {
  return (
    <div className="flex">
      <Edit />
    </div>
  );
}
