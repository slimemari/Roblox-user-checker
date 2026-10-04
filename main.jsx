import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const letters = "abcdefghijklmnopqrstuvwxyz";
const makeHandle = () => Array.from({length:4}, () => letters[Math.floor(Math.random()*letters.length)]).join("");

function App() {
  const [running, setRunning] = useState(false);
  const [handles, setHandles] = useState([]);
  const [checked, setChecked] = useState(0);
  const [available, setAvailable] = useState(0);
  const [rateLimited, setRateLimited] = useState(false);
  const [mode, setMode] = useState("demo");
  const seen = useRef(new Set());
  const timer = useRef(null);

  const stats = useMemo(() => ({
    checked,
    available,
    taken: Math.max(0, checked - available),
    rate: checked ? Math.round((checked / Math.max(1, checked)) * 100) : 0
  }), [checked, available]);

  function addResult(name, status) {
    setHandles(h => [{name, status, time: new Date().toLocaleTimeString([], {hour:"2-digit", minute:"2-digit", second:"2-digit"})}, ...h].slice(0, 80));
    if (status !== "checking") {
      setChecked(v => v + 1);
      if (status === "available") setAvailable(v => v + 1);
    }
  }

  async function checkHandle(name) {
    if (mode === "demo") {
      await new Promise(r => setTimeout(r, 180 + Math.random()*300));
      const availableDemo = Math.random() < 0.055;
      return availableDemo ? "available" : "taken";
    }

    // The production checker is intentionally endpoint-based so the site does
    // not bypass Discord protections. Point this at your authorized backend.
    const res = await fetch(`/api/check?username=${encodeURIComponent(name)}`);
    if (res.status === 429) {
      setRateLimited(true);
      return "rate_limited";
    }
    if (!res.ok) throw new Error("Checker backend unavailable");
    const data = await res.json();
    return data.available ? "available" : "taken";
  }

  async function tick() {
    if (rateLimited) return;
    let name = makeHandle();
    while (seen.current.has(name)) name = makeHandle();
    seen.current.add(name);
    addResult(name, "checking");

    try {
      const status = await checkHandle(name);
      if (status === "rate_limited") {
        setRunning(false);
        setHandles(h => h.map(x => x.name === name ? {...x, status:"rate_limited"} : x));
        return;
      }
      setHandles(h => h.map(x => x.name === name ? {...x, status} : x));
      setChecked(v => v + 1);
      if (status === "available") setAvailable(v => v + 1);
    } catch {
      setRunning(false);
      setHandles(h => h.map(x => x.name === name ? {...x, status:"error"} : x));
    }
  }

  useEffect(() => {
    if (!running) {
      clearInterval(timer.current);
      return;
    }
    tick();
    timer.current = setInterval(tick, 900);
    return () => clearInterval(timer.current);
  }, [running, mode, rateLimited]);

  function reset() {
    setRunning(false);
    setHandles([]);
    setChecked(0);
    setAvailable(0);
    setRateLimited(false);
    seen.current.clear();
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand"><div className="brandMark">◈</div><div><b>HANDLE</b><span>SNIPER</span></div></div>
        <div className="nav active"><span>◎</span> Scanner</div>
        <div className="nav"><span>⌁</span> Generator</div>
        <div className="nav"><span>▣</span> Results</div>
        <div className="sideBottom">
          <div className="connection"><i></i><div><b>CHECKER</b><small>{mode === "demo" ? "Demo mode" : "Backend connected"}</small></div></div>
          <button className="reset" onClick={reset}>Reset session</button>
        </div>
      </aside>

      <main>
        <header>
          <div><div className="eyebrow">DISCORD / USERNAME SCANNER</div><h1>4-Letter Sniper</h1><p>Generate unique handles and monitor their availability.</p></div>
          <div className="modeBox"><label>CHECK MODE</label><select value={mode} onChange={e=>setMode(e.target.value)}><option value="demo">Demo / UI Preview</option><option value="backend">Authorized Backend</option></select></div>
        </header>

        <section className="controls">
          <div className="target"><span>FORMAT</span><strong>AAAA</strong><small>4 lowercase letters</small></div>
          <div className="target"><span>SESSION</span><strong>{seen.current.size.toString().padStart(4,"0")}</strong><small>unique generated</small></div>
          <button className={"start " + (running ? "stop" : "")} onClick={()=>setRunning(v=>!v)}>
            {running ? "■ STOP SCANNER" : "▶ START SCANNER"}
          </button>
        </section>

        {rateLimited && <div className="alert"><b>Rate limit detected.</b> Scanner paused safely. Resume only when your authorized backend is ready to accept requests.</div>}

        <section className="stats">
          <div><span>CHECKED</span><strong>{stats.checked}</strong></div>
          <div><span>AVAILABLE</span><strong className="green">{stats.available}</strong></div>
          <div><span>TAKEN</span><strong>{stats.taken}</strong></div>
          <div><span>STATUS</span><strong className={running ? "green" : ""}>{running ? "SCANNING" : "IDLE"}</strong></div>
        </section>

        <section className="panel">
          <div className="panelHead"><div><h2>Live Results</h2><span>Newest checks appear first</span></div><div className="live"><i></i> LIVE</div></div>
          <div className="tableHead"><span>HANDLE</span><span>STATUS</span><span>TIME</span></div>
          <div className="results">
            {handles.length === 0 && <div className="empty"><div>⌁</div><b>Waiting for scan</b><span>Press START SCANNER to generate 4-letter handles.</span></div>}
            {handles.map((x,i)=><div className={"row "+x.status} key={x.name+"-"+i}>
              <code>{x.name}</code>
              <span className="status">{x.status==="available" ? "✓ AVAILABLE" : x.status==="taken" ? "✕ TAKEN" : x.status==="checking" ? "… CHECKING" : x.status==="rate_limited" ? "⚠ RATE LIMITED" : "⚠ ERROR"}</span>
              <small>{x.time}</small>
            </div>)}
          </div>
        </section>
        <footer>Use an authorized checker backend and respect Discord rate limits. Demo mode is included for previewing the interface.</footer>
      </main>
    </div>
  );
}
createRoot(document.getElementById("root")).render(<App />);
