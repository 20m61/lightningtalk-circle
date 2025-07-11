import{j as e,d as w,r as u}from"./auth-Cj71Dr4d.js";const j=({children:t,variant:r="primary",size:l="md",fullWidth:d=!1,disabled:c=!1,loading:s=!1,onClick:o,type:m="button",className:x="",icon:a,iconPosition:n="left",...i})=>{const h=`
    inline-flex items-center justify-center font-medium
    transition-all duration-200 rounded-lg
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
  `,y={primary:`
      bg-gradient-to-r from-primary-500 to-primary-600 
      text-white shadow-lg shadow-primary-500/25
      hover:from-primary-600 hover:to-primary-700 
      hover:shadow-xl hover:shadow-primary-500/30
      focus:ring-primary-500
    `,secondary:`
      bg-gradient-to-r from-secondary-500 to-secondary-600 
      text-white shadow-lg shadow-secondary-500/25
      hover:from-secondary-600 hover:to-secondary-700 
      hover:shadow-xl hover:shadow-secondary-500/30
      focus:ring-secondary-500
    `,outline:`
      border-2 border-primary-500 text-primary-600
      hover:bg-primary-50 hover:border-primary-600
      focus:ring-primary-500
    `,ghost:`
      text-gray-700 hover:bg-gray-100 
      hover:text-gray-900 focus:ring-gray-500
    `,danger:`
      bg-red-600 text-white shadow-lg shadow-red-500/25
      hover:bg-red-700 hover:shadow-xl hover:shadow-red-500/30
      focus:ring-red-500
    `},f={sm:"px-3 py-1.5 text-sm",md:"px-4 py-2 text-base",lg:"px-6 py-3 text-lg",xl:"px-8 py-4 text-xl"},p=d?"w-full":"",g=()=>e.jsxs("svg",{className:"animate-spin h-4 w-4",xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",children:[e.jsx("circle",{className:"opacity-25",cx:"12",cy:"12",r:"10",stroke:"currentColor",strokeWidth:"4"}),e.jsx("path",{className:"opacity-75",fill:"currentColor",d:"M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"})]});return e.jsxs("button",{type:m,onClick:o,disabled:c||s,className:`
        ${h}
        ${y[r]}
        ${f[l]}
        ${p}
        ${x}
      `,...i,children:[s&&e.jsx(g,{}),!s&&a&&n==="left"&&e.jsx("span",{className:"mr-2",children:a}),e.jsx("span",{children:t}),!s&&a&&n==="right"&&e.jsx("span",{className:"ml-2",children:a})]})};var v=w();const N=({isOpen:t,onClose:r,title:l,children:d,size:c="md",showCloseButton:s=!0,closeOnEscape:o=!0,closeOnOutsideClick:m=!0,className:x=""})=>{const a=u.useRef(null);if(u.useEffect(()=>{const i=h=>{o&&h.key==="Escape"&&r()};return t&&(document.addEventListener("keydown",i),document.body.style.overflow="hidden"),()=>{document.removeEventListener("keydown",i),document.body.style.overflow=""}},[t,r,o]),!t)return null;const n={sm:"max-w-md",md:"max-w-lg",lg:"max-w-2xl",xl:"max-w-4xl",full:"max-w-full mx-4"};return v.createPortal(e.jsx("div",{className:"fixed inset-0 z-50 overflow-y-auto","aria-labelledby":"modal-title",role:"dialog","aria-modal":"true",children:e.jsxs("div",{className:"flex min-h-screen items-center justify-center p-4",children:[e.jsx("div",{className:"fixed inset-0 bg-gray-900/75 backdrop-blur-sm transition-opacity animate-fade-in","aria-hidden":"true",onClick:m?r:void 0}),e.jsxs("div",{ref:a,className:`
            relative transform overflow-hidden rounded-2xl 
            bg-white shadow-2xl transition-all animate-slide-up
            ${n[c]} w-full
            ${x}
          `,children:[e.jsx("div",{className:"border-b border-gray-200 px-6 py-4",children:e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsx("h3",{id:"modal-title",className:"text-lg font-semibold text-gray-900",children:l}),s&&e.jsx("button",{onClick:r,className:`
                    rounded-lg p-1.5 text-gray-400 
                    hover:bg-gray-100 hover:text-gray-500 
                    transition-colors focus:outline-none 
                    focus:ring-2 focus:ring-primary-500
                  `,children:e.jsx("svg",{className:"h-5 w-5",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",children:e.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M6 18L18 6M6 6l12 12"})})})]})}),e.jsx("div",{className:"px-6 py-4",children:d})]})]})}),document.body)};export{j as B,N as M};
