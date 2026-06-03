import { useEffect, useState } from 'react';
export function useTheme(){ const [theme,setTheme]=useState(()=>localStorage.getItem('ct-theme') || 'dark'); useEffect(()=>{document.documentElement.setAttribute('data-theme',theme); localStorage.setItem('ct-theme',theme)},[theme]); return {theme,setTheme,toggle:()=>setTheme(t=>t==='dark'?'light':'dark')}; }
