"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { createEditor, Node, Text, Operation } from "slate";
import { Slate, Editable, withReact } from "slate-react";
import { withHistory } from "slate-history";
import { io } from "socket.io-client";

const initialValue = [
  {
    type: "heading",
    children: [{ text: "This is a heading" }],
  },
  {
    type: "paragraph",
    children: [{ text: "And this is a paragraph." }],
  },
];

export default function Editor() {
  const socketRef = useRef(null);
  const isRemote = useRef(false);
  const [value, setValue] = useState(initialValue);

  const editor = useRef(
    withHistory(
      withReact(
        withSocket(createEditor())
      )
    )
  ).current;

  useEffect(() => {
    const socket = io("https://text-editor-backend-nmie.onrender.com/");
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("✅ Connected to server:", socket.id);
    });

    socket.on("cursor-moved", (obj) => {
      console.log("📩 Received from socket:", obj);
      isRemote.current = true;

      const { path, cursor, text, operation } = obj;
      if (operation === "add") {
        editor.selection = {
          anchor: { path, offset: cursor },
          focus: { path, offset: cursor },
        };
        editor.insertText(text);
      } else if (operation === "delete") {
        editor.selection = {
          anchor: { path, offset: cursor },
          focus: { path, offset: cursor + text.length },
        };
        editor.deleteFragment();
      }

      isRemote.current = false;
    });

    return () => socket.disconnect();
  }, []);

  const renderElement = useCallback((props) => {
    const { element, attributes, children } = props;
    switch (element.type) {
      case "heading":
        return <h2 {...attributes}>{children}</h2>;
      case "paragraph":
      default:
        return <p {...attributes}>{children}</p>;
    }
  }, []);

  function withSocket(editor) {
    const { apply } = editor;

    editor.apply = (op) => {
      if (!isRemote.current && socketRef.current) {
        if (op.type === "insert_text" || op.type === "remove_text") {
          socketRef.current.emit("cursor-moved", {
            path: op.path,       
            cursor: op.offset,
            text: op.text,
            operation: op.type === "insert_text" ? "add" : "delete",
          });
        }
      }
      apply(op);
    };

    return editor;
  }

  return (
    <Slate editor={editor} initialValue={initialValue} value={value} onChange={setValue}>
      <Editable renderElement={renderElement} placeholder="Start typing..." />
    </Slate>
  );
}

/*
"use client";
import React from 'react'
import Image from "next/image";
import { useState, useRef, useEffect, useReducer, useCallback } from "react";
import { io } from "socket.io-client";
import { createEditor, Transforms, Node } from 'slate'
import { Slate, Editable, withReact, ReactEditor } from 'slate-react'
import { withHistory } from 'slate-history'

const initialValue = [
  {
    type: "paragraph",
    children: [{ text: "Hello Slate!" }],
  },
];

export default function Editor() {
  const [editor] = useState(() => withHistory(withReact(createEditor())))
  const [value, setValue] = useState(initialValue);
  const [cursor, setCursor] = useState(0);
  const cursorRef = useRef(0);
  const valueRef = useRef(initialValue)
  const socketRef = useRef(null);
  const isRemoteChange = useRef(false);
  const prevTextRef = useRef(Node.string({ children: value }));
  console.log(cursor);

  useEffect(() => {
    console.log("DEBUG: value", value);
    if (!Array.isArray(value)) {
        console.error("❌ value is not an array", value);
    }
    valueRef.current = value
  },[value])

  function deserializePlainText(text) {
    if (!text) {
        return [
        {
            type: 'paragraph',
            children: [{ text: '' }],
        },
        ];
    }
    return text.split('\n').map(line => ({
      type: 'paragraph',
      children: [{ text: line }],
    }));
  }

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
      const newText = deserializePlainText(fullText)
      setValue(newText)
    });

    socket.on("cursor-moved", (obj) => {
      console.log("Received cursor-moved:", obj);
      const text = Node.string({children: valueRef.current})

      ReactEditor.focus(editor);
      isRemoteChange.current = true

      if (obj.operation === "add") {
        Transforms.select(editor, {
        anchor: { path: [0, 0], offset: obj.cursor },
        focus: { path: [0, 0], offset: obj.cursor },
        });
        Transforms.insertText(editor, obj.text);
      } else if (obj.operation === "delete") {
        Transforms.select(editor, {
        anchor: { path: [0, 0], offset: obj.cursor },
        focus: { path: [0, 0], offset: obj.cursor + obj.text.length },
        });
        Transforms.delete(editor);
      }
      prevTextRef.current = text;
      setTimeout(() => { isRemoteChange.current = false }, 0)
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const renderElement = useCallback(props => {
    switch (props.element.type) {
      case 'heading':
        return <h1 {...props.attributes}>{props.children}</h1>;
      case 'code':
        return <pre {...props.attributes}><code>{props.children}</code></pre>;
      default:
        return <p {...props.attributes}>{props.children}</p>;
    }
  }, []);

  const handleChange = (newValue) => {
    setValue(newValue);
    const newText = Node.string({ children: newValue });
    const oldText = prevTextRef.current;
    const { selection } = editor;
    const pos = selection && selection.anchor ? selection.anchor.offset : 0;
    const diffLength = newText.length - oldText.length;

    if (isRemoteChange.current) {
      prevTextRef.current = newText;
      cursorRef.current = pos;
      return;
    }

    if (diffLength > 0) {
      const addedText = newText.slice(pos - diffLength, pos);
      socketRef.current?.emit("cursor-moved", {
        cursor: pos - diffLength,
        text: addedText,
        operation: "add",
      });
    } else if (diffLength < 0) {
      socketRef.current?.emit("cursor-moved", {
        cursor: pos,
        text: oldText.slice(pos, pos - diffLength),
        operation: "delete",
      });
    }

    prevTextRef.current = newText;
    cursorRef.current = pos;
  };

  const handleClick = () => {
    const { selection } = editor;
    const pos = selection && selection.anchor ? selection.anchor.offset : 0;
    setCursor(pos)
  };

  if (!Array.isArray(value)) {
    return <p>Loading editor...</p>; 
  }

  return (  
    value && (<Slate editor={editor} initialValue={initialValue} value={value} onChange={handleChange}>
        <Editable renderElement={renderElement} onClick={handleClick} placeholder="Enter some text..." />
    </Slate>)
  );
}
*/
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
/*
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
*/
/*
const handleClick = () => {
    const pos = textAreaRef.current.selectionStart;
    console.log(pos);
    setCursor(pos);
  };
*/
/*
<textarea ref={textAreaRef} onChange={handleChange} onClick={handleClick} className="border border-b-black w-[75vw] h-[85vh] p-12" name="editor"/>
*/
/*
socket.on("cursor-moved", (obj) => {
      const text = textAreaRef.current.value

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
*/
/*
if (obj.operation === "add") {
        const newValue = text.slice(0, obj.cursor) + obj.text + text.slice(obj.cursor);
        const newSlateValue = deserializePlainText(newValue); 
        console.log("deserialized text is:", newSlateValue)
        setValue(newSlateValue);
        const newOffset = obj.cursor + obj.text.length;

        Transforms.select(editor, {
          anchor: { path: [0, 0], offset: newOffset },
          focus: { path: [0, 0], offset: newOffset },
        });

      } else if (obj.operation === "delete") {
        const newValue = text.slice(0, obj.cursor) + text.slice(obj.cursor + obj.text.length);
        const newSlateValue = deserializePlainText(newValue); 
        console.log("deserialized text is:", newSlateValue)
        setValue(newSlateValue);

        Transforms.select(editor, {
          anchor: { path: [0, 0], offset: obj.cursor },
          focus: { path: [0, 0], offset: obj.cursor },
        });
      }  
*/
