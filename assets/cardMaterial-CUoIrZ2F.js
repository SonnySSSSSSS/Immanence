import{Bt as e,Mt as t,St as n}from"./index-Dv68Cv-1.js";function r(e){return typeof e==`string`&&e.trim()||null}function i(){return{entries:[]}}const a=e(t((e,t)=>({ownerUserId:null,activeUserId:null,...i(),setActiveUserId:t=>{let n=r(t);e(e=>n?e.ownerUserId===n?{activeUserId:n}:{...i(),ownerUserId:n,activeUserId:n}:{activeUserId:null})},resetForIdentityBoundary:(t=null)=>{let n=r(t);e({...i(),ownerUserId:n,activeUserId:n})},createEntry:({circuitId:t,circuitName:r,completedCircuitId:i,exercises:a,sessionMode:o,totalDuration:s,lunarPhase:c=null,timeOfDay:l})=>{let u=Date.now(),d=n(),f={id:crypto?.randomUUID?.()||`cjentry_${u}`,circuitId:t,circuitName:r,completedCircuitId:i,dateKey:d,timestamp:new Date().toISOString(),exercises:a.map(e=>({exerciseId:e.exerciseId,exerciseName:e.exerciseName,plannedDuration:e.plannedDuration,actualDuration:e.actualDuration,attentionQuality:null,notes:e.notes||null,challenges:[]})),overallAssessment:{attentionQuality:null,resistanceFlag:!1,challenges:[],generalNotes:``},sessionMode:o,lunarPhase:c,timeOfDay:l,totalDuration:s,createdAt:u,editedAt:null};return e(e=>({entries:[...e.entries,f]})),f},updateExerciseAssessment:(t,n,r)=>{e(e=>({entries:e.entries.map(e=>e.id===t?{...e,exercises:e.exercises.map((e,t)=>t===n?{...e,...r}:e)}:e)}))},updateOverallAssessment:(t,n)=>{e(e=>({entries:e.entries.map(e=>e.id===t?{...e,overallAssessment:{...e.overallAssessment,...n},editedAt:Date.now()}:e)}))},getEntry:e=>t().entries.find(t=>t.id===e),getEntriesForDate:e=>t().entries.filter(t=>t.dateKey===e),getCircuitHistory:e=>t().entries.filter(t=>t.circuitId===e),getAllEntries:()=>t().entries,deleteEntry:t=>{e(e=>({entries:e.entries.filter(e=>e.id!==t)}))},editEntry:(t,n)=>{e(e=>({entries:e.entries.map(e=>e.id===t?{...e,...n,editedAt:Date.now()}:e)}))},exportAsJSON:(e=null)=>{let n=t(),r=e?n.entries.filter(t=>e.includes(t.id)):n.entries;return JSON.stringify(r,null,2)},exportAsCSV:(e=null)=>{let n=t(),r=e?n.entries.filter(t=>e.includes(t.id)):n.entries;return[[`Date`,`Circuit Name`,`Exercise Name`,`Planned Duration`,`Actual Duration`,`Attention Quality`,`Challenges`,`Notes`].join(`,`),...r.flatMap(e=>e.exercises.map(t=>[e.dateKey,`"${e.circuitName}"`,`"${t.exerciseName}"`,t.plannedDuration,t.actualDuration,t.attentionQuality||``,`"${(t.challenges||[]).join(`; `)}"`,`"${(t.notes||``).replace(/"/g,`""`)}"`].join(`,`)))].join(`
`)}}),{name:`circuit-journal-store`,version:2,partialize:e=>({ownerUserId:r(e.ownerUserId),entries:Array.isArray(e.entries)?e.entries:[]}),migrate:e=>{let t=e||{};return{...i(),...t,ownerUserId:r(t.ownerUserId),entries:Array.isArray(t.entries)?t.entries:[]}},merge:(e,t)=>({...t,...i(),...e||{},ownerUserId:r(e?.ownerUserId),activeUserId:null,entries:Array.isArray(e?.entries)?e.entries:[]})})),o={background:`rgba(10, 10, 18, 0.7)`,backdropFilter:`blur(32px)`,WebkitBackdropFilter:`blur(32px)`,border:`1px solid rgba(255, 255, 255, 0.15)`,borderRadius:`12px`,boxShadow:`
    0 8px 32px rgba(0, 0, 0, 0.8),
    0 2px 8px rgba(0, 0, 0, 0.6),
    inset 0 1px 0 rgba(255, 255, 255, 0.12),
    inset -1px -1px 0 rgba(255, 255, 255, 0.04)
  `};({...o});const s={position:`absolute`,inset:0,pointerEvents:`none`,opacity:.03,background:`
    url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")
  `,mixBlendMode:`overlay`,borderRadius:`inherit`},c={position:`absolute`,inset:0,pointerEvents:`none`,background:`
    linear-gradient(135deg, 
      rgba(255, 255, 255, 0.02) 0%, 
      transparent 40%, 
      transparent 60%, 
      rgba(255, 255, 255, 0.01) 100%
    )
  `,borderRadius:`inherit`},l={position:`absolute`,inset:0,pointerEvents:`none`,background:`radial-gradient(
    ellipse 90% 40% at 50% 0%,
    var(--accent-glow)18 0%,
    var(--accent-glow)08 35%,
    transparent 70%
  )`,borderRadius:`inherit`},u={background:`rgba(255, 255, 255, 0.85)`,backdropFilter:`blur(20px)`,WebkitBackdropFilter:`blur(20px)`,border:`1px solid var(--light-border, rgba(60, 50, 35, 0.15))`,boxShadow:`
    0 4px 16px rgba(60, 50, 35, 0.08),
    0 1px 3px rgba(60, 50, 35, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.8),
    inset 0 -1px 0 rgba(60, 50, 35, 0.05)
  `},d={position:`absolute`,inset:0,pointerEvents:`none`,background:`radial-gradient(
    ellipse 90% 40% at 50% 0%,
    var(--accent-glow)12 0%,
    rgba(255, 255, 255, 0.2) 20%,
    transparent 70%
  )`,borderRadius:`inherit`};function f(e){return e?u:o}function p(e){return e?d:l}export{o as a,s as i,p as n,c as o,l as r,a as s,f as t};