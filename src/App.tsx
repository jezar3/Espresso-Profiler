import { useEffect, useState, type FormEvent } from "react";

type Shot = { id: string; name: string; method: string; coffee: string; dose: number; yield_grams: number; seconds: number };

const methods = ["Espresso", "Pour-over / drip", "Coffee sock / filter bag", "Pakulo / boiled", "French press", "Moka pot", "Cold brew", "Instant / 3-in-1"];

function formatTime(shot: Shot) {
  if (shot.method === "Espresso" || shot.method === "Instant / 3-in-1") return `${shot.seconds}s`;
  const minutes = shot.seconds / 60;
  return minutes >= 60 ? `${(minutes / 60).toFixed(1)}h` : `${Math.round(minutes)}m`;
}

export default function App() {
  const [shots, setShots] = useState<Shot[]>([]);
  const [method, setMethod] = useState("Espresso");
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/shots").then((r) => r.json()).then(setShots).catch(() => setMessage("Couldn't connect to the database. Check that the app server is running."));
  }, []);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    try {
      const values = Object.fromEntries(new FormData(form));
      const selectedMethod = String(values.method);
      values.seconds = String(Number(values.time) * (selectedMethod === "Espresso" || selectedMethod === "Instant / 3-in-1" ? 1 : 60));
      delete values.time;
      const response = await fetch("/api/shots", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) });
      if (!response.ok) throw new Error();
      const shot: Shot = await response.json();
      setShots((all) => [shot, ...all]);
      form.reset();
      setMethod("Espresso");
      setMessage("Saved. Your shot is now in the archive.");
    } catch {
      setMessage("Couldn't save the shot. Check the values and make sure the server is running.");
    }
  }

  const visible = shots.filter((shot) => `${shot.name} ${shot.method} ${shot.coffee}`.toLowerCase().includes(query.toLowerCase()));

  return <main>
    <header><b>KAPE NOTES</b><span>PHILIPPINE BREW LOG</span></header>
    <div className="hero">
      <div><small>LOCAL COFFEE · ANY BREW STYLE</small><h1>Brew it your way.</h1><p>Log espresso, drip, pakulo, sock brew, and more.</p></div>
      <div className="seal"><small>BREWS</small><b>{String(shots.length).padStart(2, "0")}</b><small>LOGGED ✿</small></div>
    </div>
    <div className="quick-start" aria-label="How to use Espresso Profiler">
      <div><b>1</b><span><strong>Choose your brew style</strong><small>Espresso, drip, coffee sock, pakulo, or another method.</small></span></div>
      <div><b>2</b><span><strong>Use what you measure</strong><small>Coffee in grams, water in milliliters, time in seconds or minutes.</small></span></div>
      <div><b>3</b><span><strong>Save and compare</strong><small>Your brew appears in the searchable archive.</small></span></div>
    </div>
    <div className="workspace">
      <form className="recipe" onSubmit={save} autoComplete="off">
        <small className="kicker">NEW ENTRY</small><h2>Log a brew</h2>
        <label>Brew name<input name="name" autoComplete="off" placeholder="Morning coffee" required /></label>
        <label>Brew style<select name="method" value={method} onChange={(event) => setMethod(event.target.value)}>{methods.map((option) => <option key={option}>{option}</option>)}</select></label>
        <label>Coffee / origin<small className="hint">Try Batangas Barako, Benguet, Sagada, Bukidnon, or Mt. Apo.</small><input name="coffee" autoComplete="off" placeholder="Batangas Barako" required /></label>
        <div className="row">
          <label>{method === "Instant / 3-in-1" ? "Servings" : "Coffee · grams"}<small className="hint">{method === "Instant / 3-in-1" ? "Sachets or servings" : "Dry coffee used"}</small><input name="dose" type="number" min={method === "Instant / 3-in-1" ? "1" : "0.1"} step={method === "Instant / 3-in-1" ? "1" : "0.1"} placeholder={method === "Instant / 3-in-1" ? "1" : "18"} required /></label>
          <label>{method === "Espresso" ? "Espresso · grams" : "Water · ml"}<small className="hint">{method === "Espresso" ? "Drink collected in the cup" : "Water used to make the brew"}</small><input name="yield" type="number" min="0.1" step="0.1" placeholder={method === "Espresso" ? "36" : "250"} required /></label>
        </div>
        <label>{method === "Espresso" || method === "Instant / 3-in-1" ? "Time · seconds" : "Brew / steep · minutes"}<small className="hint">{method === "Espresso" ? "From first water to finished shot" : method === "Instant / 3-in-1" ? "Time to prepare the cup" : "Total brew or steep time"}</small><input name="time" type="number" min="1" step="1" placeholder={method === "Espresso" ? "28" : method === "Cold brew" ? "720" : method === "Instant / 3-in-1" ? "30" : "3"} required /></label>
        <button>Save brew <span>↗</span></button>
        {message && <p className="message" role="status">{message}</p>}
      </form>
      <section className="archive">
        <div className="archive-head"><div><small className="kicker">SAVED IN THE LOCAL DATABASE</small><h2>Brew archive <span>{shots.length} total</span></h2><p>Search by brew name, style, or coffee.</p></div>
          <input className="search" aria-label="Search brews by name, style, or coffee" placeholder="Search brews or coffee" value={query} onChange={(event) => setQuery(event.target.value)} />
        </div>
        <div className="table-wrap"><table><thead><tr><th>BREW</th><th>STYLE</th><th>COFFEE</th><th>RECIPE</th><th>RATIO<br /><small>water or yield ÷ coffee</small></th><th>TIME</th></tr></thead>
          <tbody>{visible.map((shot) => <tr key={shot.id}>
            <td><b>{shot.name}</b><small>#{shot.id.slice(0, 6)}</small></td><td>{shot.method}</td><td>{shot.coffee}</td>
            <td>{shot.method === "Espresso" ? `${shot.dose}g → ${shot.yield_grams}g` : shot.method === "Instant / 3-in-1" ? `${shot.dose} serving + ${shot.yield_grams}ml water` : `${shot.dose}g + ${shot.yield_grams}ml water`}</td>
            <td className="ratio">{shot.method === "Instant / 3-in-1" ? "—" : `${(shot.yield_grams / shot.dose).toFixed(1)} : 1`}</td><td>{formatTime(shot)}</td>
          </tr>)}</tbody>
        </table></div>
        {!visible.length && <p className="empty">{query ? "No brews match that search. Try another name, style, or coffee." : message.startsWith("Couldn't connect") ? "The archive is unavailable until the server reconnects." : "No brews saved yet. Fill out the form and select Save brew."}</p>}
      </section>
    </div>
    <footer>BREW SLOW · TAKE NOTES · STAY CURIOUS</footer>
  </main>;
}
