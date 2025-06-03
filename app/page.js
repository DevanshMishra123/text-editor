"use client"
import Image from "next/image";
import { useState, useRef, useEffect, useReducer } from "react";
import { io } from "socket.io-client";

export default function Home() {
  const textAreaRef = useRef(null)
  const [cursor, setCursor] = useState(0)
  const cursorRef = useRef(0)
  const socketRef = useRef(null)
  console.log(cursor)

  useEffect(() => {
    const socket = io('https://text-editor-backend-nmie.onrender.com/');
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to server:', socket.id);
    });

    socket.on('connect_error', (err) => {
      console.error('Connection error:', err.message);
    });
    socketRef.current.on('cursor-moved',(obj)=>{
      if(obj.operation==="add")
        textAreaRef.current.value = textAreaRef.current.value.slice(0, obj.cursor) + obj.text + textAreaRef.current.value.slice(obj.cursor)
      else
        textAreaRef.current.value = textAreaRef.current.value.slice(0, obj.cursor) + textAreaRef.current.value.slice(obj.cursor + 1);
    })

    return () => {
      socket.disconnect();
    };
  },[])

  const handleChange = (e) => {
    textAreaRef.current.value = e.target.value
    const pos = textAreaRef.current.selectionStart;
    console.log(pos)
    if(cursorRef.current<pos)
      socketRef.current.emit('cursor-moved', {cursor: pos, text: textAreaRef.current.value[cursorRef.current], operation: "add"})
    else
      socketRef.current.emit('cursor-moved', {cursor: pos, text: textAreaRef.current.value[cursorRef.current], operation: "delete"})
    cursorRef.current = pos
  }

  const handleClick = () => {
    const pos = textAreaRef.current.selectionStart;
    console.log(pos)
    setCursor(pos)
  }
  
  return (
    <div className="flex">
      <textarea ref={textAreaRef} onChange={handleChange} onClick={handleClick} className="border border-b-black w-[75vw] h-[85vh] p-12" name="editor"/>
    </div>
  );
}
