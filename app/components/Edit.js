"use client";
import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { createEditor, Node, Text, Operation, Transforms, Editor, Path } from "slate";
import { Slate, Editable, withReact } from "slate-react";
import { withHistory } from "slate-history";
import { io } from "socket.io-client";

export default function Edit({inValue, hasLoaded}) {
  const socketRef = useRef(null);
  const isRemote = useRef(false);
  const name = useRef("").current;
  const color = useRef("").current;
  const [value, setValue] = useState(inValue);
  const [editorKey, setEditorKey] = useState(0);
  const [remoteCursors, setRemoteCursors] = useState({});
  const COLORS = ["#f87171", "#34d399", "#60a5fa", "#fbbf24"];
  const editorRef = useRef({})

  const editor = useMemo(() => 
    withHistory(
      withReact(
        withSocket(createEditor())
      )
    ), [editorKey]);

  console.log("update cursor position with path:", editor.selection?.anchor.path)
  console.log("updated cursor position at anchor position:", editor.selection?.anchor.offset)
  console.log("updated cursor position at focus position:", editor.selection?.focus.offset)
  console.log("new value is:", value)
  console.log("rendering...", inValue, hasLoaded)

  useEffect(() => {
    editorRef.current = editor.selection
    console.log("value changed:", editorRef.current)
  }, [editor.selection])

  useEffect(() => {
    if(editorKey==0) return
    const saveContent = async () => {
      const res = await fetch('/api/saveText', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: JSON.stringify(value) }), 
      });

      const data = await res.json();
      console.log("Saved:", data);
    };

    if (value) {
      saveContent();
    }
  }, [value]);

  useEffect(() => {
    if (hasLoaded) {
      setValue(inValue);
      setEditorKey(prev => prev + 1); 
    }
  }, [hasLoaded, inValue]);

  const waitForPathAndSelect = (editor, newPath, maxAttempts = 10) => {
    let attempts = 0;

    const trySelect = () => {
      if (Node.has(editor, newPath)) {
        Transforms.select(editor, {
          anchor: { path: newPath, offset: 0 },
          focus: { path: newPath, offset: 0 },
        });
      } else if (attempts < maxAttempts) {
        attempts++;
        setTimeout(trySelect, 10); 
      } else {
        console.warn("❌ Could not find path to select after split:", newPath);
      }
    };

    trySelect();
  };

  useEffect(() => {
    const socket = io("https://text-editor-backend-nmie.onrender.com/");
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("✅ Connected to server:", socket.id);
    });

    socket.on("welcome", (obj) => {
      console.log(obj.socketId)
      const id = obj.socketId.slice(0,5) 
      name = id
      color = COLORS[Math.floor(Math.random() * COLORS.length)]
    })

    socket.on("cursor-moved", async (obj) => {
      console.log("📩 Received from socket:", obj);
      isRemote.current = true;

      const { path, cursor, text, operation, node, position, selection, offset } = obj;
      if (operation === "add") {
        console.log("cursor while adding text is:", cursor)
        editor.selection = {
          anchor: { path, offset: cursor },
          focus: { path, offset: cursor },
        };
        editor.insertText(text);
      } else if (operation === "delete") {
        console.log("cursor while deleting text is:", cursor)
        editor.selection = {
          anchor: { path, offset: cursor },
          focus: { path, offset: cursor + text.length },
        };
        editor.deleteFragment();
      } else if (operation === "newNode") {
        Transforms.insertNodes(editor, node, { at: path })
        editor.selection = {
          anchor: { path, offset: 0 },
          focus: { path, offset: 0 },
        };
      } else if (operation === "splitNode") {
        try {
          const offset = selection.anchor.offset;
          console.log("About to split at path:", path, "offset:", offset);
          
          Transforms.splitNodes(editor, {
            at: { path, offset },
          });

          const parentPath = Path.parent(path);
          const parentNode =  Node.get(editor,parentPath)
          const newPath = Path.next(parentPath); 
          console.log("New sibling path:", newPath);
          if (Text.isText(node) && (offset === node.text.length || offset === 0)){
            const toInsert = offset === 0 ? parentPath : newPath
            const insertedNode = {
              type: parentNode.type,
              children: [{ text: "" }],
            };
            Transforms.insertNodes(editor, insertedNode, { at: toInsert });

            editor.selection = {
              anchor: { path: [...newPath, 0], offset: 0 },
              focus: { path: [...newPath, 0], offset: 0 },
            };

            console.log("✅ Inserted empty node manually at:", newPath);
            return; 
          }
          const newNode = Node.get(editor, newPath)
          console.log("✅ Split successful. New node:", newNode);

          waitForPathAndSelect(editor, newPath);

        } catch (err) {
          console.error("❌ Error applying splitNode remotely:", err);
        }
      } else if (operation === "removeNode") {
        Transforms.removeNodes(editor, { at: path })
      } else if (operation === "mergeNode") {
        Transforms.mergeNodes(editor, { at: path })
      }
      isRemote.current = false;
    });

    socket.on("cursor-update", ({ userId, selection, color, text, path, position, properties, newProperties, operation }) => {
      const obj = { userId, selection, color, path, position, properties, newProperties, operation };
      console.log("Received from socket:", obj);
      if (!selection || !selection.anchor) return;
      if(operation === "add") {
        const { path, offset} = selection.anchor
        offset = offset + text.length
        setRemoteCursors((prev) => ({
          ...prev,
          [userId]: { path, offset, color },
        }));
      } else if(operation === "delete") {
        const { path, offset} = selection.anchor
        offset = offset - 1
        setRemoteCursors((prev) => ({
          ...prev,
          [userId]: { path, offset, color },
        }));
      } else if(operation === "splitNode") {
        const offset = selection?.anchor?.offset
        console.log("new path and offset after splitting the text node is:", selection?.anchor?.path, selection?.anchor?.offset)
        const parentPath = Path.parent(path);
        const newPath = Path.next(parentPath); 
        console.log("new Path is:", newPath)
        console.log("offset after splitting node is: ", offset)
        setRemoteCursors((prev) => ({
          ...prev,
          [userId]: { path: [...newPath, 0], offset: 0, color },
        }));
      } else if(operation === "removeNode") {
        const newPath = [...path, 0]
        setRemoteCursors((prev) => ({
          ...prev,
          [userId]: { path: newPath, offset: 0, color },
        }));
      } else if(operation === "setSelection" && newProperties?.anchor?.offset === newProperties?.focus?.offset) {
        const newPath = newProperties?.anchor?.path;
        const newOffset = newProperties?.anchor?.offset;
        console.log("new Path is:", newPath, "and new offset is:", newOffset)
        setRemoteCursors((prev) => ({
          ...prev,
          [userId]: { path: newPath, offset: newOffset, color },
        }));
      }
    });

    return () => socket.disconnect();
  }, [editorKey]);

  const decorate = useCallback(([node, path]) => {
    const ranges = [];

    Object.entries(remoteCursors).forEach(([id, cursor]) => {
      if (Text.isText(node) && Path.equals(path, cursor.path)) {
        ranges.push({
          anchor: { path, offset: cursor.offset },
          focus: { path, offset: cursor.offset },
          name: id,
          color: cursor.color,
          isRemoteCursor: true,
        });
      }
    });

    return ranges;
  }, [remoteCursors]);

  const renderLeaf = useCallback(({ attributes, children, leaf }) => {
    if (leaf.isRemoteCursor) {
      console.log("name is",leaf.name)
      return (
        <span {...attributes} style={{ position: "relative" }}>
          <span
            style={{
              position: "absolute",
              backgroundColor: leaf.color,
              width: "2px",
              height: "1em",
              left: 0,
              top: 0,
              zIndex: 10,
            }}
          />
          <span style={{
            position: "absolute",
            top: "-1.2em",
            left: 0,
            fontSize: "0.75em",
            backgroundColor: leaf.color,
            color: "#fff",
            fontWeight: "bold",
            padding: "1px 4px",
            borderRadius: "4px",
            whiteSpace: "nowrap",
            boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
            zIndex: 20,
          }}>
            {leaf.name}
          </span>
          {children}
        </span>
      );
    }

    return <span {...attributes}>{children}</span>;
  }, []);

  const renderElement = useCallback((props) => {
    const { element, attributes, children } = props;
    switch (element.type) {
      case "heading":
        return <h2 className="text-2xl font-bold" {...attributes}>{children}</h2>;
      case "paragraph":
      default:
        return <p {...attributes}>{children}</p>;
    }
  }, []);

  function withSocket(editor) {
    const { apply } = editor;

    editor.apply = (op) => {
      if (!isRemote.current && socketRef.current) {
        const currentSelection = editor.selection;
        const offset = currentSelection?.anchor?.offset ?? 0;
        if (op.type === "insert_text" || op.type === "remove_text") {
          console.log("on local side:", op.offset)
          console.log("on local side while adding or deleting text cursor is at anchor:", editor.selection.anchor.offset)
          console.log("on local side while adding or deleting text cursor is at focus:", editor.selection.focus.offset)
          socketRef.current.emit("cursor-moved", {
            path: op.path,       
            cursor: op.offset,
            text: op.text,
            operation: op.type === "insert_text" ? "add" : "delete",
          });
        } else if (op.type === "insert_node") {
          socketRef.current.emit("cursor-moved", {
            path: op.path,
            node: op.node,
            operation: "newNode",
          })
        } else if (op.type === "split_node" && op.path.length > 1) {  
          console.log("on local side while splitting path is:", editor.selection.anchor.path, editor.selection.focus.path)
          console.log("on local side while splitting cursor is at anchor:", editor.selection.anchor.offset)
          console.log("on local side while splitting cursor is at focus:", editor.selection.focus.offset)
          const node = Node.get(editor, op.path)
          socketRef.current.emit("cursor-moved", {
            path: op.path,   
            selection: editor.selection,
            position: op.position, 
            node,
            properties: op.properties,
            operation: "splitNode",
          }); 
        } else if (op.type === "remove_node") {
          socketRef.current.emit("cursor-moved", {
            path: op.path,
            node: op.node,
            operation: "removeNode"
          })
        } else if (op.type === "merge_node" && op.path.length === 1) {
          socketRef.current.emit("cursor-moved", {
            path: op.path,
            position: op.position,
            properties: op.properties,
            operation: "mergeNode"
          })
        }
        if(editor.selection && name!='') {
          if (op.type === "insert_text" || op.type === "remove_text") {
            socketRef.current.emit("cursor-update", {
              userId: name,
              color,
              text: op.text,
              selection: editor.selection,
              operation: op.type === "insert_text" ? "add" : "delete",
            });
          } else if (op.type === "insert_node") {
            socketRef.current.emit("cursor-update", {
              userId: name,
              color,
              path: op.path,
              node: op.node,
              operation: "newNode",
            })
          } else if (op.type === "split_node" && op.path.length > 1) {  
            socketRef.current.emit("cursor-update", {
              userId: name,
              color,
              path: op.path,         
              selection: editor.selection,
              position: op.position,
              properties: op.properties,
              operation: "splitNode",
            }); 
          } else if (op.type === "remove_node") {
            socketRef.current.emit("cursor-update", {
              userId: name,
              color,
              selection: editor.selection, 
              path: op.path,
              node: op.node,      
              operation: "removeNode",
            })
          } else if (op.type === "merge_node") {
            socketRef.current.emit("cursor-update", {
              userId: name,
              color,
              selection: editor.selection,  
              path: op.path,
              position: op.position,
              properties: op.properties,           
              operation: "mergeNode",
            })
          } else if (op.type === "set_selection") {
            socketRef.current.emit("cursor-update", {
              userId: name,
              color,
              selection: editor.selection,
              properties: op.properties,
              newProperties: op.newProperties,
              operation: "setSelection",
            })
          }   
        }
      }
      apply(op);
    };

    return editor;
  }

  return (
    <div className="dark:bg-gray-900 dark:text-white w-[80vw] max-w-4xl h-[80vh] mx-auto border border-gray-300 shadow-lg rounded-xl bg-white overflow-hidden">
      <Slate editor={editor} initialValue={inValue} value={value} onChange={setValue} key={editorKey}>
        <Editable className="w-full h-full p-6 text-base leading-relaxed focus:outline-none focus:ring-0 overflow-auto prose prose-sm sm:prose lg:prose-lg dark:prose-invert scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100" renderElement={renderElement} renderLeaf={renderLeaf} decorate={decorate} placeholder="Start typing..." />
      </Slate>
    </div>
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
/*
const newPath = [...path];
        newPath[newPath.length - 1] = newPath[newPath.length - 1] + 1;

        editor.selection = {
          anchor: { path: newPath, offset: 0 },
          focus: { path: newPath, offset: 0 },
        };
*/
/*
const newPath = Path.next(path);     
            Transforms.insertNodes(
              editor,
              {
                type: "paragraph",
                children: [{ text: "" }],
              },
              { at: newPath }
            );      
*/
/*
try {
            const offset = selection.anchor.offset
            console.log("selection is:", selection)
            console.log("postion is:", position)
            console.log("Checking Node.has:", JSON.stringify(path), Node.has(editor, path));
            const [parentPath, childIndex] = [Path.parent(path), path[path.length - 1]];
            const parentNode = Node.get(editor, parentPath);
            console.log("parentPath:", parentPath, "parentNode:", parentNode,"children:", parentNode.children);
            if (!parentNode || !Array.isArray(parentNode.children)) return;
            console.log("hello1")
            console.log("About to split with path:", path);
            console.log("About to split with offset:", offset);
            console.log("Type of path:", typeof path, Array.isArray(path));
            console.log("Type of cursor:", typeof offset);
            Transforms.splitNodes(editor, {
              at: { path, offset },
            });
            console.log("hello2")
            const allChildren = parentNode.children;
            waitAndShow(editor, parentNode)
            const moveFromIndex = childIndex + 1;
            if (Array.isArray(allChildren)) {
              console.log("✅ allChildren is an array:", allChildren, allChildren.length);
            } else {
              console.error("❌ allChildren is not an array:", allChildren);
            }
            const nodesToMove = allChildren.slice(moveFromIndex);
            for (let i = allChildren.length - 1; i >= moveFromIndex; i--) {
              Transforms.removeNodes(editor, {
                at: parentPath.concat(i),
              });
            }
            const newBlock = {
              type: "paragraph",
              children: nodesToMove,
            };
            const newBlockPath = Path.next(parentPath);
            console.log("new Block path:", newBlockPath)
            Transforms.insertNodes(editor, newBlock, {
              at: newBlockPath,
            });
            waitForPathAndSelect(editor, newBlockPath);
          } catch (err) {
            console.error("❌ Error applying splitNode remotely:", err);
          }
*/



/*
async function waitForBlockAfter(editor, path, maxRetries = 10, delay = 30) {
    for (let i = 0; i < maxRetries; i++) {
      const after = Editor.after(editor, path, { unit: 'block' });
      if (after && Node.has(editor, after.path)) {
        return after.path;
      }
      await new Promise((r) => setTimeout(r, delay));
    }
    throw new Error("⏳ Timeout: New block node not found after split");
  }

  const waitForNodeAtPath = (editor, path, maxAttempts = 10, delay = 10) => {
    return new Promise((resolve, reject) => {
      let attempts = 0;

      const check = () => {
        if (Node.has(editor, path)) {
          const node = Node.get(editor, path);
          resolve(node);
        } else if (attempts < maxAttempts) {
          attempts++;
          setTimeout(check, delay);
        } else {
          reject(new Error("Node not found at path: " + path));
        }
      };

      check();
    });
  };
*/

// const editor = useRef(
  //   withHistory(
  //     withReact(
  //       withSocket(createEditor())
  //     )
  //   )
  // ).current;



