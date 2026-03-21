import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center gap-8 px-6 py-12 text-center">
      <div className="flex gap-4">
        <a
          href="https://vite.dev"
          target="_blank"
          rel="noreferrer"
          className="transition-[filter] duration-300 hover:drop-shadow-[0_0_2em_#646cffaa]"
        >
          <img src={viteLogo} className="h-24 p-6" alt="Vite logo" />
        </a>
        <a
          href="https://react.dev"
          target="_blank"
          rel="noreferrer"
          className="transition-[filter] duration-300 hover:drop-shadow-[0_0_2em_#61dafbaa]"
        >
          <img
            src={reactLogo}
            className="h-24 animate-[spin_20s_linear_infinite] p-6 motion-reduce:animate-none"
            alt="React logo"
          />
        </a>
      </div>
      <h1 className="text-4xl font-semibold tracking-tight text-slate-900 dark:text-white">
        Vite + React + TypeScript
      </h1>
      <div className="flex flex-col gap-4">
        <button
          type="button"
          onClick={() => setCount((c) => c + 1)}
          className="rounded-lg border border-transparent bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:border-violet-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500 dark:bg-white dark:text-slate-900 dark:hover:border-violet-600"
        >
          count is {count}
        </button>
        <p className="text-slate-600 dark:text-slate-400">
          Edit{" "}
          <code className="rounded bg-slate-200 px-1.5 py-0.5 font-mono text-sm dark:bg-slate-800">
            src/App.tsx
          </code>{" "}
          and save to test HMR.
        </p>
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-500">
        Click on the Vite and React logos to learn more
      </p>
    </div>
  );
}

export default App;
