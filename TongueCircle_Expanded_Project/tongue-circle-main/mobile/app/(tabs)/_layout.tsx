import React from 'react';
import {Tabs} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {C} from '../../src/theme';
export default function TabsLayout(){return <Tabs initialRouteName="discover" screenOptions={{headerShown:false,tabBarActiveTintColor:C.purple,tabBarInactiveTintColor:'#A6A3B5',tabBarStyle:{height:86,paddingTop:10,paddingBottom:25,borderTopWidth:1,borderTopColor:C.line,backgroundColor:'#FFFFFF',elevation:18,shadowColor:'#29234D',shadowOpacity:.08,shadowRadius:12},tabBarLabelStyle:{fontSize:10,fontWeight:'800'},tabBarIconStyle:{marginBottom:2}}}>
<Tabs.Screen name="index" options={{href:null}}/>
<Tabs.Screen name="discover" options={{title:'Members',tabBarIcon:({color,size})=><Ionicons name="people" color={color} size={size}/>}}/>
<Tabs.Screen name="community" options={{title:'Community',tabBarIcon:({color,size})=><Ionicons name="planet" color={color} size={size}/>}}/>
<Tabs.Screen name="messages" options={{title:'Chats',tabBarIcon:({color,size})=><Ionicons name="chatbubble-ellipses" color={color} size={size}/>}}/>
<Tabs.Screen name="profile" options={{title:'Profile',tabBarIcon:({color,size})=><Ionicons name="person-circle" color={color} size={size}/>}}/>
</Tabs>}
