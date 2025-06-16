import React, { useState } from 'react'
import { createContext, useContext } from "react";

const AuthContext =  createContext()


export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: {session} }) => setSession(session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  },[])

  return (
    <AuthContext.Provider value={session}>
        {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
    return useContext(AuthContext)
}
