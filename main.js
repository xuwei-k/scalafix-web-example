"use strict";

import {
  html,
  render,
  useState,
  useEffect,
  useReducer,
  useRef,
} from "https://unpkg.com/htm@3.1.1/preact/standalone.module.js";

import hljs from "https://unpkg.com/@highlightjs/cdn-assets@11.9.0/es/highlight.min.js";
import scala from "https://unpkg.com/@highlightjs/cdn-assets@11.9.0/es/languages/scala.min.js";
import { rules } from "./dist/rules.js";
import { jarNames } from "./dist/jar_files.js";

hljs.registerLanguage("scala", scala);

const fix = (async function () {
  await cheerpjInit();
  const s = await cheerpjRunLibrary(
    jarNames.map((x) => "/app/scalafix-web-example/dist/" + x).join(":"),
  );

  return s.scalafix_web.Main;
})();

const App = () => {
  const [fixed, setFixed] = useState("");
  const [warnings, setWarnings] = useState("");
  const [input, setInput] = useState("");

  const [currentRules, setCurrentRules] = useReducer(
    (state, [ruleName, action]) => {
      switch (action) {
        case "add":
          return [...state, ruleName];
        case "del":
          return state.filter((x) => x != ruleName);
        default:
          throw new Error("Unexpected action" + action);
      }
    },
    [],
  );

  useEffect(() => {
    (async () => {
      const main = await fix;
      const t = await main.main(input, currentRules.join());
      const errorString = await t.error();
      if (errorString === "") {
        const fixedCode = await t.fixed();
        const diagnostics = await t.diagnostics();
        setFixed(fixedCode);
        setWarnings(diagnostics);
      } else {
        setWarnings(errorString);
      }
    })();
  }, [fixed, input, currentRules]);

  return html`<div class="row">
      <div class="col">
        <div>
          <pre style="height: 150px; background-color:rgb(100, 100, 100);">
${warnings}</pre
          >
        </div>
      </div>
    </div>
    <div class="row">
      <div class="col-2">
        <fieldset>
          <legend>rules</legend>
          ${rules.map((r) => {
            const simpleName = r.slice(4);
            return html`
              <div>
                <input
                  type="checkbox"
                  id="${simpleName}"
                  name="${simpleName}"
                  onChange="${(e) => {
                    if (e.target.checked) {
                      setCurrentRules([r, "add"]);
                    } else {
                      setCurrentRules([r, "del"]);
                    }
                  }}"
                />
                <label for="${simpleName}">${simpleName}</label>
              </div>
            `;
          })}
        </fieldset>
      </div>
      <div class="col">
        <textarea
          style="width: 100%; height: 800px"
          onkeyup=${(e) => setInput(e.target.value)}
          onChange=${(e) => setInput(e.target.value)}
        ></textarea>
      </div>
      <div class="col">
        <pre
          style="width: 100%; height: 800px; background-color:rgb(122, 122, 122);"
        >
${fixed}</pre
        >
      </div>
    </div>`;
};

render(html`<${App} />`, document.getElementById("root"));
