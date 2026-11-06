"use client";
import { useEffect } from "react";
export default function ErrorPage({error,reset}:{error:Error&{digest?:string};reset:()=>void}){useEffect(()=>{console.error(error);},[error]);return <section className="not-found container"><h1>Something went wrong.</h1><p>The page could not be loaded. Try again.</p><button className="button button-primary" onClick={()=>reset()}>Try again</button></section>;}
