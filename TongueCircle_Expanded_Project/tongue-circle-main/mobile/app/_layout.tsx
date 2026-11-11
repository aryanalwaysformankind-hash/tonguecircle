import 'react-native-url-polyfill/auto';
import React from 'react';
import {Stack} from 'expo-router';
import {StatusBar} from 'expo-status-bar';
import {AuthProvider} from '../src/auth';
import {C} from '../src/theme';
export default function RootLayout(){return <AuthProvider><StatusBar style="dark"/><Stack screenOptions={{headerShown:false,contentStyle:{backgroundColor:C.bg}}}><Stack.Screen name="index"/><Stack.Screen name="(tabs)"/><Stack.Screen name="chat/[id]"/></Stack></AuthProvider>}
