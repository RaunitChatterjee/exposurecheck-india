import { useState } from "react";
import ToolShell from "./ToolShell.jsx";
import { pwnedCount } from "../../lib/pwned.js";

export default function PasswordCheck() {
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);
  const [state, setState] = useState({ status: "idle" });

  async function check(e) {
    e.preventDefault();
    if (!pw) return;
    setState({ status: "loading" });
    try {
      setState({ status: "done", count: await pwnedCount(pw) });
    } catch (err) {
      setState({ status: "error", message: err.message });
    }
  }

  return (
    <ToolShell
      title="Has this password been leaked?"
      intro="Check a password against more than 800 million passwords from known breaches. Do not use one that appears, anywhere."
      privacy="Your password never leaves this page. Your browser hashes it, and only the first 5 characters of that hash are sent to the Pwned Passwords service, which cannot work out the rest. Do not test a password you are currently using on a device you do not trust.">
      <form className="panel scan" onSubmit={check}>
        <label htmlFor="pw">Password to check</label>
        <div className="row">
          <input id="pw" type={show ? "text" : "password"} autoComplete="off" spellCheck="false" maxLength={128}
                 value={pw} onChange={(e) => { setPw(e.target.value); setState({ status: "idle" }); }} />
          <button className="btn" type="submit" disabled={!pw || state.status === "loading"}>{state.status === "loading" ? "Checking" : "Check password"}</button>
        </div>
        <button type="button" className="textbtn" onClick={() => setShow((v) => !v)}>{show ? "Hide password" : "Show password"}</button>
      </form>
      {state.status === "error" && <div className="notice notice-error" role="alert">{state.message}</div>}
      {state.status === "done" && state.count > 0 && (
        <div className="result result-bad" role="status">
          <h2>Found {state.count.toLocaleString("en-IN")} times in known breaches</h2>
          <p>Attackers try leaked passwords first. Stop using this one everywhere, and change it on any account that shares it. Use a different long password for each account, kept in a password manager.</p>
        </div>
      )}
      {state.status === "done" && state.count === 0 && (
        <div className="result result-ok" role="status">
          <h2>Not found in known breaches</h2>
          <p>That is good, but it does not prove the password is strong. Length and uniqueness matter most: use at least 12 characters, and never reuse it.</p>
        </div>
      )}
    </ToolShell>
  );
}
