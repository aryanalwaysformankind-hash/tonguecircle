import React from 'react';
import { ClerkProvider, useAuth, useUser } from '@clerk/clerk-expo';
import * as SecureStore from 'expo-secure-store';
const tokenCache={async getToken(key:string){try{return await SecureStore.getItemAsync(key)}catch{return null}},async saveToken(key:string,value:string){try{await SecureStore.setItemAsync(key,value)}catch{}},async clearToken(key:string){try{await SecureStore.deleteItemAsync(key)}catch{}}};
export function AuthProvider({children}:{children:React.ReactNode}){const key=process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY||'';return <ClerkProvider publishableKey={key} tokenCache={tokenCache}>{children}</ClerkProvider>}
export {useAuth,useUser};
