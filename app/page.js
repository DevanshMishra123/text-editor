"use client"
import dynamic from "next/dynamic";

const Editor = dynamic(() => import("./components/Editor"), { ssr: false });

export default function Page() {
  return (
    <div className="flex">
      <Editor />
    </div>
  );
}
