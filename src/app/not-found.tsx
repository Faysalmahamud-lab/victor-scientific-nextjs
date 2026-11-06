import Link from "next/link";
export default function NotFound(){return <section className="not-found container"><span className="eyebrow">404 • Page not found</span><h1>That page is unavailable.</h1><p>The address may have changed or the content may not be part of the approved public catalogue.</p><Link className="button button-primary" href="/">Return home</Link></section>;}
