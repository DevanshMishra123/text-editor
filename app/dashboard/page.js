"use client"
import supabase from "@/utils/supabase/client";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import dynamic from "next/dynamic";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "../ContextProvider";
import "../globals.css";

const Edit = dynamic(() => import("../components/Edit"), { ssr: false });

const initialValue = [
  {
    type: "heading",
    children: [{text: " "}],
  },
  {
    type: "paragraph",
    children: [{text: " "}],
  },
]

export default function Dashboard() {
  const { session } = useAuth()
  const [hasLoaded, setHasLoaded] = useState(false);
  const [inValue, setInValue] = useState(initialValue)
  const [docName, setDocName] = useState("")
  const [docs, setDocs] = useState(["text-content"])
  const [doc, setDoc] = useState("text-content")
  const [hasName, setHasName] = useState(true)
  const [createDoc, setCreateDoc] = useState(false)
  const boxRef = useRef()
  console.log("session is:", session)
 
  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if(error)
      console.log("Error signing out", error.message)
    else {
      console.log("logged out successfully")
      window.location.href = '/'
    }
  }

  useEffect(() => {
    if(inValue!= initialValue)
      setHasLoaded(true)
  },[inValue])

  useEffect(() => {
    const getData = async () => {
      const res = await fetch(`/api/getText/${doc}`)
      const { error, message, data } = await res.json()
      if(!error) {
        console.log(message, "Text content is:", data.content)
        let content = data.content;
        if (typeof data.content === "string") {
          console.log("type is:", typeof data.content)
          content = JSON.parse(data.content);
        }
        setInValue(content)
      }
      else 
        console.log("Error occured while fetching the data", error)
    }
    getData()
  },[])

  const newDoc = () => {
    if(docName==""){
      setHasName(false)
      return
    }
    setHasName(true)
    const arr = [...docs]
    arr.push(docName)
    setDocs(arr)
    setDoc(docName)
    setDocName("")
  }

  if(!session)
    return <p>Unauthorised</p>

  return (
    <div className="flex flex-col min-h-screen justify-between bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1544894079-e81a9eb1da8b?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')` }}>
      <button className="flex items-center gap-2 px-4 py-2 text-white w-8" onClick={signOut}>
        <FontAwesomeIcon icon={faSignOutAlt} />
        Logout
      </button>
      <div className="flex justify-between items-center">
        <div className="w-1/4 relative self-start custom-scrollbar flex flex-col gap-4 p-5">
          <div className={`absolute rounded top-8 right-0 w-52 h-32 p-4 flex flex-col gap-2 justify-center bg-white transform transition-transform duration-300 ${createDoc ? 'scale-100' : 'scale-0'}`}>
            <input value={docName} onChange={(e) => setDocName(e.target.value)} type="text" className="bg-gray-300 rounded"/>
            {!hasName && <p className="text-red-500 text-center">name is required</p>}
            <button onClick={newDoc} className="rounded hover:scale-50 transition duration-100 bg-black text-white">Create</button>
          </div>
          <div className="flex text-white justify-between">
            <h1>Documents</h1>
            <button onClick={() => setCreateDoc(prev => !prev) }>
              <FontAwesomeIcon icon={faPlus} />
            </button>
          </div>
          <div>
            {docs.map((element,index) => <div key={index} onClick={() => setDoc(element)} className="rounded bg-emerald-400 hover:bg-emerald-500 transition duration-100 text-white mt-4 mb-4 p-4">{element}</div>)}
          </div>
        </div>
        <div className="bg-white/40 backdrop-blur-sm shadow-lg p-8">
          <Edit inValue={inValue} hasLoaded={hasLoaded} />
        </div>
      </div>     
    </div>
  );
}
