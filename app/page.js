"use client";
import Image from "next/image";
import { useState, useRef, useEffect, useReducer } from "react";
import { io } from "socket.io-client";

export default function Home() {
  const textAreaRef = useRef(null);
  const [cursor, setCursor] = useState(0);
  const cursorRef = useRef(0);
  const socketRef = useRef(null);
  const prevTextRef = useRef("");
  console.log(cursor);

  useEffect(() => {
    const socket = io("https://text-editor-backend-nmie.onrender.com/");
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Connected to server:", socket.id);
    });

    socket.on("connect_error", (err) => {
      console.error("Connection error:", err.message);
    });

    socket.on("init", (fullText) => {
      if (textAreaRef.current) {
        textAreaRef.current.value = fullText;
        prevTextRef.current = fullText;
      }
    });

    socket.on("cursor-moved", (obj) => {
      const text = textAreaRef.current.value;

      if (obj.operation === "add") {
        textAreaRef.current.value = text.slice(0, obj.cursor) + obj.text + text.slice(obj.cursor);
        const newPos = obj.cursor + obj.text.length;
        textAreaRef.current.selectionStart = newPos;
        textAreaRef.current.selectionEnd = newPos;
      } else if (obj.operation === "delete") {
        textAreaRef.current.value = text.slice(0, obj.cursor) + text.slice(obj.cursor + obj.text.length);
        textAreaRef.current.selectionStart = obj.cursor;
        textAreaRef.current.selectionEnd = obj.cursor;
      }

      prevTextRef.current = textAreaRef.current.value;
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleChange = (e) => {
      const newText = e.target.value;
      const oldText = prevTextRef.current;
      const pos = e.target.selectionStart;
      console.log("from my side",textAreaRef.current.selectionStart)
      const diffLength = newText.length - oldText.length;

      if (diffLength > 0) {
        const addedText = newText.slice(pos - diffLength, pos);
        socketRef.current.emit("cursor-moved", {
          cursor: pos - diffLength,
          text: addedText,
          operation: "add",
        });
      } else if (diffLength < 0) {
        socketRef.current.emit("cursor-moved", {
          cursor: pos,
          text: oldText.slice(pos, pos - diffLength),
          operation: "delete",
        });
      }
      prevTextRef.current = newText;
      cursorRef.current = pos;
  };

  const handleClick = () => {
    const pos = textAreaRef.current.selectionStart;
    console.log(pos);
    setCursor(pos);
  };

  return (
    <div className="flex">
      <textarea ref={textAreaRef} onChange={handleChange} onClick={handleClick} className="border border-b-black w-[75vw] h-[85vh] p-12" name="editor"/>
    </div>
  );
}
/*
textAreaRef.current.value = e.target.value
    const pos = textAreaRef.current.selectionStart;
    console.log(pos)
    if(cursorRef.current<pos)
      socketRef.current.emit('cursor-moved', {cursor: pos, text: textAreaRef.current.value[cursorRef.current], operation: "add"})
    else
      socketRef.current.emit('cursor-moved', {cursor: pos, text: textAreaRef.current.value[cursorRef.current], operation: "delete"})
    cursorRef.current = pos
*/
