import React, { useState, useEffect, createContext, useContext } from 'react'
import supabase from '@/utils/supabase/client';

const AuthContext =  createContext()


export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: {session} }) => setSession(session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
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
