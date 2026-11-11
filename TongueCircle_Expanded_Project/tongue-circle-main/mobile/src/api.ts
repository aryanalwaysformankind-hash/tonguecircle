const BASE = (process.env.EXPO_PUBLIC_API_URL || '').replace(/\/$/, '');
export async function api<T>(path:string, token:string, init:RequestInit={}):Promise<T>{
  if(!BASE) throw new Error('Set EXPO_PUBLIC_API_URL in mobile/.env');
  const response = await fetch(`${BASE}${path}`, { ...init, headers:{'Content-Type':'application/json', Authorization:`Bearer ${token}`, ...(init.headers||{})} });
  if(!response.ok){ let message=`Request failed (${response.status})`; try { const body=await response.json(); message=body.detail||message; } catch {} throw new Error(message); }
  if(response.status===204) return undefined as T;
  return response.json();
}
export const get=<T,>(path:string,token:string)=>api<T>(path,token);
export const post=<T,>(path:string,token:string,body:unknown)=>api<T>(path,token,{method:'POST',body:JSON.stringify(body)});
export const put=<T,>(path:string,token:string,body:unknown)=>api<T>(path,token,{method:'PUT',body:JSON.stringify(body)});
export type Profile={user_id:string;display_name:string;bio:string;main_photo:string;city:string;country:string;known_languages:{language:string;level:'native'|'fluent'}[];learning_languages:string[];birth_date?:string|null;sex?:'male'|'female'|null};
export type Person=Profile & {match_score:number;match_reasons:string[]};
export type Conversation={id:string;other_user_id:string;other_display_name:string;other_main_photo:string;last_message:string;updated_at:string;unread_count:number};
export type Message={id:string;conversation_id:string;sender_user_id:string;recipient_user_id:string;text:string;message_type:'text'|'audio';created_at:string;read:boolean};
