import { useEffect, useMemo, useState } from "react";
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Input,
  Select,
  TabsSimple
} from "chromium-ui-react";

const STORAGE_KEY = "customdirecte-bac-sidebar-v6";

const seriesSubjects = {
  STMG: ["Droit et économie", "Management, sciences de gestion et numérique"],
  ST2S: ["Chimie, biologie et physiopathologie humaines", "Sciences et techniques sanitaires et sociales"],
  STI2D: ["Physique-chimie et mathématiques", "Ingénierie, innovation et développement durable"],
  STL: ["Physique-chimie et mathématiques", "Biochimie-biologie-biotechnologie ou SPCL"],
  STD2A: ["Analyse et méthodes en design", "Conception et création en design et métiers d’art"],
  STHR: ["Économie-gestion hôtelière", "Sciences et technologies culinaires et des services"],
  S2TMD: ["Culture et sciences artistiques", "Pratique artistique"]
};

const general = {
  premiere: [["hg-p", "Histoire-géographie", 3], ["lva-p", "Langue vivante A", 3], ["lvb-p", "Langue vivante B", 3], ["science-p", "Enseignement scientifique", 3], ["emc-p", "Enseignement moral et civique", 1], ["specialty-p", "Spécialité abandonnée", 8]],
  terminale: [["hg-t", "Histoire-géographie", 3], ["lva-t", "Langue vivante A", 3], ["lvb-t", "Langue vivante B", 3], ["science-t", "Enseignement scientifique", 3], ["eps-t", "Éducation physique et sportive", 6], ["emc-t", "Enseignement moral et civique", 1]],
  anticipees: [["french-written", "Français écrit", 5], ["french-oral", "Français oral", 5], ["math-anticipated", "Mathématiques anticipées", 2]],
  finales: [["specialty-1", "Spécialité terminale 1", 16], ["specialty-2", "Spécialité terminale 2", 16], ["philosophy", "Philosophie", 8], ["grand-oral", "Grand oral", 8]]
};

const technological = {
  premiere: [["specialty-p", "Spécialité abandonnée", 8], ["hg-p", "Histoire-géographie", 3], ["lva-p", "Langue vivante A", 3], ["lvb-p", "Langue vivante B", 3], ["math-p", "Mathématiques", 3], ["emc-p", "Enseignement moral et civique", 1]],
  terminale: [["hg-t", "Histoire-géographie", 3], ["lva-t", "Langue vivante A", 3], ["lvb-t", "Langue vivante B", 3], ["math-t", "Mathématiques", 3], ["eps-t", "Éducation physique et sportive", 6], ["emc-t", "Enseignement moral et civique", 1]],
  anticipees: [["french-written", "Français écrit", 5], ["french-oral", "Français oral", 5], ["math-anticipated", "Mathématiques anticipées", 2]],
  finales: [["specialty-1", "Épreuve de spécialité 1", 16], ["specialty-2", "Épreuve de spécialité 2", 16], ["philosophy", "Philosophie", 4], ["grand-oral", "Grand oral", 12]]
};

const optionModels = [
  { id: "cycle", label: "Option suivie sur le cycle", coefficient: 4 },
  { id: "year", label: "Option suivie sur une année", coefficient: 2 },
  { id: "lca", label: "LCA additive", coefficient: 4 }
];

const initialState = { track: "general", session: "2027", series: "STMG", mathPath: "none", splitContinuous: false, periodMode: "trimesters", tab: "premiere", values: {}, options: [] };

const periodLabels = {
  trimesters: ["T1", "T2", "T3"],
  semesters: ["S1", "S2"]
};

function readSavedState() {
  try { return { ...initialState, ...(JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}) }; }
  catch { return initialState; }
}

function getSections(state) {
  const source = state.track === "general" ? general : technological;
  const sections = {
    premiere: source.premiere.map((row) => [...row]),
    terminale: source.terminale.map((row) => [...row]),
    anticipees: source.anticipees.map((row) => [...row]),
    finales: source.finales.map((row) => [...row])
  };
  if (state.track === "general" && state.mathPath === "stopped") sections.premiere.find((row) => row[0] === "specialty-p")[1] = "Spécialité maths abandonnée";
  if (state.track === "general" && state.mathPath === "continued") {
    sections.premiere.find((row) => row[0] === "specialty-p")[1] = "Autre spécialité abandonnée";
    sections.finales.find((row) => row[0] === "specialty-1")[1] = "Mathématiques — spécialité terminale";
  }
  if (state.track === "technological") {
    sections.finales.find((row) => row[0] === "specialty-1")[1] = seriesSubjects[state.series][0];
    sections.finales.find((row) => row[0] === "specialty-2")[1] = seriesSubjects[state.series][1];
  }
  return sections;
}

function parseNote(value) {
  if (value === "" || value === null || value === undefined) return null;
  const note = Number(String(value).replace(",", "."));
  return Number.isFinite(note) && note >= 0 && note <= 20 ? note : null;
}

function readDraggedAverage(dataTransfer) {
  if (!dataTransfer) return null;
  const raw = dataTransfer.getData("application/x-customdirecte-average") || dataTransfer.getData("text/plain");
  if (!raw) return null;
  try {
    const payload = JSON.parse(raw);
    const value = parseNote(payload.value);
    return value === null ? null : { subject: String(payload.subject || ""), value };
  } catch {
    return null;
  }
}

function periodKey(id, mode, index) {
  return `${id}-${mode}-${index + 1}`;
}

function periodAverage(state, id) {
  const notes = periodLabels[state.periodMode].map((_, index) => parseNote(state.values[periodKey(id, state.periodMode, index)])).filter((note) => note !== null);
  return notes.length ? notes.reduce((sum, note) => sum + note, 0) / notes.length : null;
}

function calculate(state, sections) {
  const continuousIds = new Set([...sections.premiere, ...sections.terminale].map(([id]) => id));
  const rows = Object.values(sections).flat().map(([id, label, coefficient]) => ({ id, label, coefficient, value: continuousIds.has(id) && state.splitContinuous ? periodAverage(state, id) : parseNote(state.values[id]) }));
  const options = state.options.filter((item) => item.enabled).map((item) => ({ id: item.id, label: item.label, coefficient: item.coefficient, value: parseNote(state.values[item.id]) }));
  const all = rows.concat(options);
  const filled = all.filter((row) => row.value !== null);
  const points = filled.reduce((sum, row) => sum + row.value * row.coefficient, 0);
  const entered = filled.reduce((sum, row) => sum + row.coefficient, 0);
  const baseCoefficient = rows.reduce((sum, row) => sum + row.coefficient, 0);
  const optionCoefficient = options.reduce((sum, row) => sum + row.coefficient, 0);
  const required = baseCoefficient + optionCoefficient;
  return { filled, entered, required, total: required, average: entered ? points / entered : null };
}

function mention(average) {
  if (average === null) return { label: "À compléter", variant: "neutral", key: "empty" };
  if (average < 8) return { label: "Ajourné", variant: "error", key: "fail" };
  if (average < 10) return { label: "Rattrapage possible", variant: "warning", key: "catchup" };
  if (average < 12) return { label: "Admis sans mention", variant: "success", key: "admitted" };
  if (average < 14) return { label: "Assez bien", variant: "success", key: "ab" };
  if (average < 16) return { label: "Bien", variant: "success", key: "bien" };
  return { label: "Très bien", variant: "success", key: "tb" };
}

function Result({ result }) {
  const status = mention(result.average);
  const progress = result.required ? Math.min(100, result.entered / result.required * 100) : 0;
  const marker = result.average === null ? null : Math.min(100, Math.max(0, result.average / 20 * 100));
  const scoreText = result.average === null ? "—" : result.average.toFixed(2).replace(".", ",");
  return <Card variant="flat" className={`result-block result-${status.key}`}>
    <CardBody>
      <div className="result-head"><div><span className="result-label">Résultat actuel</span><div className="result-score" aria-live="polite">{scoreText}<small>/20</small></div></div><div className="result-status"><span>Mention estimée</span><Badge variant={status.variant}>{status.label}</Badge></div></div>
      <div className="mention-graph" role="img" aria-label={result.average === null ? "Jauge des zones de résultat, aucune note saisie" : `Moyenne ${scoreText} sur 20, ${status.label}`}>
        <div className="graph-track"><span className="graph-zone fail" /><span className="graph-zone catchup" /><span className="graph-zone admitted" /><span className="graph-zone ab" /><span className="graph-zone bien" /><span className="graph-zone tb" />{marker !== null && <i className="graph-marker" style={{ left: `${marker}%` }}><b>{scoreText}</b></i>}</div>
        <div className="graph-labels"><span><b>&lt; 8</b>Ajourné</span><span><b>8–10</b>Rattrapage</span><span><b>10–12</b>Admis</span><span><b>12–14</b>Assez bien</span><span><b>14–16</b>Bien</span><span><b>16–20</b>Très bien</span></div>
      </div>
      <div className="result-meta"><span>{result.entered} / {result.required} coefficients renseignés</span><strong>{result.entered >= result.required ? "Calcul complet" : "Calcul partiel"}</strong></div>
      <div className="progress-line" aria-label={`${Math.round(progress)} % des coefficients renseignés`}><span style={{ width: `${progress}%` }} /></div>
      <p className="result-note">Les notes non renseignées sont ignorées du calcul provisoire.</p>
    </CardBody>
  </Card>;
}

function Switch({ checked, label, help, onChange }) {
  return <button type="button" className={`toggle-row ${checked ? "is-on" : ""}`} role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)}>
    <span className="toggle-control" aria-hidden="true"><span /></span>
    <span className="toggle-copy"><strong>{label}</strong>{help && <small>{help}</small>}</span>
  </button>;
}

function SubjectBlock({ id, label, coefficient, periodized, state, onNoteChange, dropTargetId, setDropTargetId }) {
  const average = periodized ? periodAverage(state, id) : null;
  const handleDragOver = (event) => { event.preventDefault(); event.dataTransfer.dropEffect = "copy"; };
  const handleDrop = (targetId, event) => {
    event.preventDefault();
    setDropTargetId(null);
    const dropped = readDraggedAverage(event.dataTransfer);
    if (dropped) onNoteChange(targetId, String(dropped.value).replace(".", ","));
  };
  const inputProps = (targetId) => ({
    "data-bac-drop-target": targetId,
    className: dropTargetId === targetId ? "bac-drop-active" : "",
    onDragEnter: () => setDropTargetId(targetId),
    onDragLeave: () => setDropTargetId(null),
    onDragOver: handleDragOver,
    onDrop: (event) => handleDrop(targetId, event)
  });
  return <div className="subject-block">
    <div className="subject-content"><div className="subject-name"><strong>{label}</strong><span>{periodized ? "Moyenne des périodes" : "Note sur 20"}</span></div>{periodized ? <div className={`period-grid period-count-${periodLabels[state.periodMode].length}`}>{periodLabels[state.periodMode].map((period, index) => <div className="period-cell" key={period}><span>{period}</span><Input {...inputProps(periodKey(id, state.periodMode, index))} aria-label={`${label}, ${period}, sur 20`} type="text" inputMode="decimal" pattern="[0-9,\.]*" autoComplete="off" placeholder="—" value={state.values[periodKey(id, state.periodMode, index)] ?? ""} onChange={(event) => onNoteChange(periodKey(id, state.periodMode, index), event.target.value)} /></div>)}<div className="average-cell"><span>Moyenne</span><strong>{average === null ? "—" : average.toFixed(2).replace(".", ",")}</strong></div></div> : <Input {...inputProps(id)} aria-label={`Note de ${label}, sur 20`} type="text" inputMode="decimal" pattern="[0-9,\.]*" autoComplete="off" placeholder="—" value={state.values[id] ?? ""} onChange={(event) => onNoteChange(id, event.target.value)} />}</div>
    <div className="coefficient-block" aria-label={`Coefficient ${coefficient}`}><small>Coef.</small><strong>{coefficient}</strong></div>
  </div>;
}

function SubjectGroup({ eyebrow, title, rows, tone, periodized = false, state, onNoteChange, dropTargetId, setDropTargetId }) {
  const entered = rows.reduce((sum, row) => sum + ((periodized ? periodAverage(state, row[0]) : parseNote(state.values[row[0]])) === null ? 0 : row[2]), 0);
  const total = rows.reduce((sum, row) => sum + row[2], 0);
  return <section className={`subject-group tone-${tone}`} aria-labelledby={`heading-${title}`}>
    <div className="group-heading"><div><span>{eyebrow}</span><h3 id={`heading-${title}`}>{title}</h3></div><strong>{entered} / {total}</strong></div>
    <div className="column-heading"><span>Matière</span><span>{periodized ? periodLabels[state.periodMode].join(" / ") : "Note"}</span><span>Coef.</span></div>
    <div className="subject-list">{rows.map(([id, label, coefficient]) => <SubjectBlock key={id} id={id} label={label} coefficient={coefficient} periodized={periodized} state={state} onNoteChange={onNoteChange} dropTargetId={dropTargetId} setDropTargetId={setDropTargetId} />)}</div>
  </section>;
}

function Options({ state, setState }) {
  const addOption = () => setState((current) => ({ ...current, options: current.options.concat({ id: `option-${Date.now()}-${current.options.length}`, label: "Option suivie sur une année", coefficient: 2, model: "year", enabled: true }) }));
  const updateOption = (id, changes) => setState((current) => ({ ...current, options: current.options.map((item) => item.id === id ? { ...item, ...changes } : item) }));
  const removeOption = (id) => setState((current) => ({ ...current, options: current.options.filter((item) => item.id !== id), values: Object.fromEntries(Object.entries(current.values).filter(([key]) => key !== id)) }));
  return <section className="options-section" aria-labelledby="options-title">
    <div className="group-heading"><div><span>À afficher uniquement si nécessaire</span><h3 id="options-title">Enseignements optionnels</h3></div><Badge variant="info">Modèle général</Badge></div>
    <p className="options-copy">Ajoutez une option seulement si vous la suivez. Le switch commande son inclusion dans le calcul ; une option désactivée reste mémorisée mais ne compte pas.</p>
    {!state.options.length && <div className="empty-options"><strong>Aucune option ajoutée</strong><span>Le calcul fonctionne sans option.</span></div>}
    <div className="options-list">
      {state.options.map((item, index) => <div className={`option-row ${item.enabled ? "" : "option-row-disabled"}`} key={item.id}>
        <div className="option-row-head"><div><strong>Option {index + 1}</strong><span>{item.label}</span></div><Button variant="text" size="sm" onClick={() => removeOption(item.id)}>Supprimer</Button></div>
        <Switch checked={item.enabled} label="Inclure dans le calcul" help={item.enabled ? `Coefficient ${item.coefficient} · note prise en compte` : "Option désactivée · note conservée"} onChange={(enabled) => updateOption(item.id, { enabled })} />
        <Select label="Nature de l’option" value={item.model} options={optionModels.map((model) => ({ value: model.id, label: `${model.label} — coef. ${model.coefficient}` }))} onChange={(event) => { const model = optionModels.find((entry) => entry.id === event.target.value); updateOption(item.id, { model: model.id, coefficient: model.coefficient, label: model.label }); }} />
        <Input disabled={!item.enabled} aria-label={`Note de l'option ${index + 1}, sur 20`} label={`Note /20 · coef. ${item.coefficient}`} type="text" inputMode="decimal" placeholder="—" value={state.values[item.id] ?? ""} onChange={(event) => setState((current) => ({ ...current, values: { ...current.values, [item.id]: event.target.value } }))} />
      </div>)}
    </div>
    <Button variant="action" size="sm" onClick={addOption}>Ajouter une option</Button>
  </section>;
}

export function App() {
  const [state, setState] = useState(readSavedState);
  const [dropTargetId, setDropTargetId] = useState(null);
  const sections = useMemo(() => getSections(state), [state.track, state.session, state.series, state.mathPath]);
  const result = useMemo(() => calculate(state, sections), [state, sections]);
  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }, [state]);
  const onNoteChange = (id, value) => setState((current) => ({ ...current, values: { ...current.values, [id]: value } }));
  useEffect(() => {
    const onAverageMessage = (message) => {
      if (message?.type !== "CD_BAC_AVERAGE") return;
      const value = parseNote(message.average?.value);
      if (value !== null && message.average?.targetId) onNoteChange(message.average.targetId, String(value).replace(".", ","));
    };
    const runtime = globalThis.chrome?.runtime || globalThis.browser?.runtime;
    runtime?.onMessage?.addListener(onAverageMessage);
    return () => runtime?.onMessage?.removeListener?.(onAverageMessage);
  }, []);
  const toggleContinuousSplit = (enabled) => setState((current) => {
    if (enabled) return { ...current, splitContinuous: true };
    const currentSections = getSections(current);
    const continuousIds = [...currentSections.premiere, ...currentSections.terminale].map(([id]) => id);
    const values = { ...current.values };
    continuousIds.forEach((id) => {
      if (parseNote(values[id]) === null) {
        const average = periodAverage(current, id);
        if (average !== null) values[id] = average.toFixed(2).replace(".", ",");
      }
    });
    return { ...current, splitContinuous: false, values };
  });
  const reset = () => { if (window.confirm("Effacer toutes les notes de cette simulation ?")) setState((current) => ({ ...current, values: {}, options: [] })); };
  const sessionDetails = state.session === "2027" ? "Passage du bac en 2027 · Terminale en 2026–2027 · nouveau cadre avec mathématiques anticipées" : "Passage du bac en 2028 · Terminale en 2027–2028 · même cadre avec mathématiques anticipées";
  const profile = <Card variant="flat" className="profile-block"><CardHeader><div><span className="profile-kicker">Votre parcours</span><CardTitle>Paramètres du bac</CardTitle></div><span className="saved">Sauvegardé</span></CardHeader><CardBody><div className="profile-fields"><Select label="Voie" value={state.track} options={[{ value: "general", label: "Bac général" }, { value: "technological", label: "Bac technologique" }]} onChange={(event) => setState((current) => ({ ...current, track: event.target.value, tab: "premiere" }))} /><Select label="Session du bac" value={state.session} options={[{ value: "2027", label: "Bac 2027" }, { value: "2028", label: "Bac 2028" }]} onChange={(event) => setState((current) => ({ ...current, session: event.target.value }))} /></div><div className="session-explanation"><strong>Règles de la session {state.session}</strong><span>{sessionDetails}</span></div><div className="split-setting"><Switch checked={state.splitContinuous} label="Découper le contrôle continu" help={state.splitContinuous ? "Saisissez une note par trimestre ou semestre." : "Une seule note par matière · réglage recommandé par défaut."} onChange={toggleContinuousSplit} />{state.splitContinuous && <Select label="Périodicité" value={state.periodMode} options={[{ value: "trimesters", label: "Trimestres — 3 périodes" }, { value: "semesters", label: "Semestres — 2 périodes" }]} onChange={(event) => setState((current) => ({ ...current, periodMode: event.target.value }))} />}</div>{state.track === "technological" && <Select label="Série technologique" value={state.series} options={Object.keys(seriesSubjects).map((series) => ({ value: series, label: series }))} onChange={(event) => setState((current) => ({ ...current, series: event.target.value }))} />}{state.track === "general" && <Select label="Parcours de mathématiques" value={state.mathPath} options={[{ value: "none", label: "Sans spécialité maths" }, { value: "stopped", label: "Maths arrêtées après la Première" }, { value: "continued", label: "Maths poursuivies en Terminale" }]} onChange={(event) => setState((current) => ({ ...current, mathPath: event.target.value }))} />}<p className="profile-help">Activez le découpage seulement si vous voulez renseigner chaque période. Une note vide est ignorée.</p></CardBody></Card>;
  const tabs = [
    { value: "premiere", label: "Première", content: <div className="tab-stack"><SubjectGroup eyebrow="Notes de l’année" title="Contrôle continu" tone="yellow" periodized={state.splitContinuous} rows={sections.premiere} state={state} onNoteChange={onNoteChange} dropTargetId={dropTargetId} setDropTargetId={setDropTargetId} /><SubjectGroup eyebrow="Passées en Première" title="Épreuves anticipées" tone="peach" rows={sections.anticipees} state={state} onNoteChange={onNoteChange} dropTargetId={dropTargetId} setDropTargetId={setDropTargetId} /></div> },
    { value: "terminale", label: "Terminale", content: <div className="tab-stack"><SubjectGroup eyebrow="Notes de l’année" title="Contrôle continu" tone="blue" periodized={state.splitContinuous} rows={sections.terminale} state={state} onNoteChange={onNoteChange} dropTargetId={dropTargetId} setDropTargetId={setDropTargetId} /><SubjectGroup eyebrow="Épreuves finales" title="Épreuves terminales" tone="blue" rows={sections.finales} state={state} onNoteChange={onNoteChange} dropTargetId={dropTargetId} setDropTargetId={setDropTargetId} /></div> },
    { value: "options", label: "Options", content: <Options state={state} setState={setState} /> }
  ];
  const backToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });
  return <div className="app-shell"><header className="app-header"><h1>Calculateur du bac</h1><Button variant="text" size="sm" onClick={reset} aria-label="Effacer toutes les notes">Effacer</Button></header><Result result={result} />{profile}<main aria-label="Notes du bac"><div className="notes-heading"><div><span>Simulation instantanée</span><h2>Renseignez vos notes</h2></div><strong>Note /20</strong></div><TabsSimple value={state.tab} tabs={tabs} onValueChange={(tab) => setState((current) => ({ ...current, tab }))} /></main><footer><Button variant="text" size="sm" onClick={reset}>Effacer toutes les notes</Button><a href="https://www.education.gouv.fr/reussir-au-lycee/comment-calculer-votre-note-au-baccalaureat-325511" target="_blank" rel="noreferrer">Voir les règles officielles</a><button className="back-to-top" type="button" onClick={backToTop} aria-label="Remonter en haut de la page"><span aria-hidden="true">↑</span> Haut de page</button></footer></div>;
}
