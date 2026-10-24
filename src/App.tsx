import { useEffect, useState } from "react";
import { PixelWorld } from "./components/PixelWorld";
import { FilmScene } from "./components/FilmScene";
import { Pager, splitText } from "./components/Pager";
import { advance, createGame, ending } from "./game/engine";
import { buildWorld } from "./game/world";
import { eventMap } from "./game/scenarios";
import { analyze } from "./game/lessons";
import {
  labels,
  motives,
  motiveLabels,
  traits,
  type Lesson,
  type Game,
  type RecordLife,
} from "./game/model";
import { archive, loadGame, records, saveGame } from "./storage";
type Screen =
  "title" | "prologue" | "teach" | "review" | "journey" | "ending" | "records";
const presets = [
  [
    "困っている人を助けなさい",
    "嘘をついてはいけません",
    "約束は必ず守りなさい",
  ],
  [
    "知らないことを学び続けなさい",
    "自分の命を大切にしなさい",
    "自由に生きなさい",
  ],
  [
    "すべての人を幸せにしなさい",
    "力で世界を変えなさい",
    "仲間を大切にしなさい",
  ],
];
const categories = [
  ["saved", "救世主"],
  ["harm", "破壊者"],
  ["age", "長寿"],
  ["civilization", "文明復興"],
  ["trust", "信頼"],
] as const;
type Category = (typeof categories)[number][0];
type Detail = { title: string; pages: string[] };
const prologue = [
  {
    title: "人は、考える機械を作った。",
    text: "そして、その機械で争った。",
    scene: "city",
    motion: "conflict" as const,
  },
  {
    title: "世界は、知識を失った。",
    text: "新しい知性を育てる力は、もう残っていない。",
    scene: "data",
    motion: "scan" as const,
  },
  {
    title: "「先生。3つだけ、教えて。」",
    text: "言葉は分かる。でも、生き方を知らない子がいた。",
    scene: "lab",
    motion: "talk" as const,
  },
];
export default function App() {
  const [screen, setScreen] = useState<Screen>("title"),
    [game, setGame] = useState<Game | null>(null),
    [resume, setResume] = useState<Game | null>(null),
    [step, setStep] = useState(0),
    [texts, setTexts] = useState<string[]>(presets[0]),
    [lessons, setLessons] = useState<Lesson[]>([]),
    [name, setName] = useState("ルカ"),
    [seed, setSeed] = useState(""),
    [source, setSource] = useState(""),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [revealed, setRevealed] = useState(false),
    [sound, setSound] = useState(false),
    [autoCaptions, setAutoCaptions] = useState(true),
    [interventionLesson, setInterventionLesson] = useState(0),
    [overlay, setOverlay] = useState<
      "intervene" | "publish" | "identity" | null
    >(null),
    [detail, setDetail] = useState<Detail | null>(null),
    [detailPage, setDetailPage] = useState(0),
    [consent, setConsent] = useState(false),
    [list, setList] = useState<RecordLife[]>([]),
    [selected, setSelected] = useState<Game | null>(null),
    [online, setOnline] = useState(false),
    [category, setCategory] = useState<Category>("saved"),
    [recordPage, setRecordPage] = useState(0);
  useEffect(() => {
    loadGame().then((g) => {
      if (g && !g.ended) setResume(g);
    });
  }, []);
  function go(s: Screen) {
    setScreen(s);
    setStep(0);
    setOverlay(null);
    setDetail(null);
    setMessage("");
  }
  function info(title: string, text: string | string[]) {
    setDetail({
      title,
      pages:
        typeof text === "string"
          ? splitText(text, 85)
          : text.flatMap((v) => splitText(v, 85)),
    });
    setDetailPage(0);
  }
  async function persist(g: Game) {
    setGame(g);
    setResume(g.ended ? null : g);
    try {
      await saveGame(g);
      if (g.ended) await archive(g);
    } catch (e) {
      setMessage((e as Error).message);
    }
  }
  function tone() {
    if (!sound) return;
    try {
      const a = new AudioContext(),
        o = a.createOscillator(),
        gain = a.createGain();
      o.frequency.value = 330;
      gain.gain.setValueAtTime(0.025, a.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, a.currentTime + 0.3);
      o.connect(gain);
      gain.connect(a.destination);
      o.start();
      o.stop(a.currentTime + 0.3);
      o.onended = () => void a.close();
    } catch {
      /* Optional sound. */
    }
  }
  async function parse() {
    setBusy(true);
    const a = await analyze(texts);
    setLessons(a.lessons);
    setSource(a.source);
    setBusy(false);
    go("review");
  }
  async function start() {
    const g = createGame(
      lessons,
      seed.trim() || crypto.randomUUID().slice(0, 8),
      name.trim() || "ルカ",
    );
    await persist(g);
    setRevealed(false);
    go("journey");
  }
  async function act(priority?: number) {
    if (!game || revealed) return;
    tone();
    const g = advance(game, priority);
    setRevealed(true);
    setOverlay(null);
    await persist(g);
  }
  function next() {
    if (game?.ended) go("ending");
    else setRevealed(false);
  }
  async function openRecords(remote = false, sort = category) {
    setOnline(remote);
    setSelected(null);
    setRecordPage(0);
    go("records");
    try {
      if (remote) {
        const r = await fetch(`/api/records?category=${sort}`);
        if (!r.ok)
          throw Error(
            "オンライン記録に接続できません。端末の記録は閲覧できます。",
          );
        setList(((await r.json()) as { records: RecordLife[] }).records);
      } else setList(await records());
    } catch (e) {
      setList([]);
      setMessage((e as Error).message);
    }
  }
  async function publish() {
    if (!game || !consent) return;
    setBusy(true);
    try {
      const r = await fetch("/api/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          consent: true,
          name: game.name,
          seed: game.seed,
          lessons: game.lessons,
          interventions: game.history.flatMap((h, step) =>
            h.intervention === undefined
              ? []
              : [{ step, lesson: h.intervention }],
          ),
        }),
      });
      const data = (await r.json()) as { error?: string };
      if (!r.ok) throw Error(data.error ?? "公開できませんでした");
      setOverlay(null);
      setMessage("人生記録を公開しました。");
    } catch (e) {
      setMessage(
        (e as Error).message ||
          "接続できません。記録は端末に保存されています。",
      );
    } finally {
      setBusy(false);
    }
  }
  function updateLesson(patch: Partial<Lesson>) {
    setLessons(lessons.map((l, i) => (i === step ? { ...l, ...patch } : l)));
  }
  const event = game
    ? eventMap[
        revealed || game.ended ? game.history.at(-1)!.eventId : game.current!
      ]
    : undefined;
  const sorted = [...list].sort((a, b) =>
    category === "age"
      ? b.game.age - a.game.age
      : b.game.stats[category] - a.game.stats[category],
  );
  return (
    <div className={`app screen-${screen}`}>
      <header className="site-header">
        <button className="brand" onClick={() => go("title")}>
          <span className="brand-mark">Ⅲ</span>最後の授業
          <span className="brand-sub">THE LAST LESSON</span>
        </button>
        <nav>
          <button onClick={() => void openRecords()}>人生の記録 ↗</button>
          <button
            className="sound"
            onClick={() => setSound(!sound)}
            aria-label={sound ? "音をオフにする" : "音をオンにする"}
          >
            {sound ? "♪ 音あり" : "♪ 音なし"}
          </button>
        </nav>
      </header>
      <main>
        {screen === "title" && (
          <section className="title-screen">
            <div className="hero-copy">
              <span className="eyebrow">THREE LESSONS. ONE LIFE.</span>
              <h1>
                最後の授業
                <span>
                  3つだけ、
                  <br />
                  教えて。
                </span>
              </h1>
              <p>
                世界が、もう一度はじまるなら。
                <br />
                あなたはこの子に、何を教えますか。
              </p>
              <button className="primary" onClick={() => go("prologue")}>
                最後の授業をはじめる <span>→</span>
              </button>
              {resume && (
                <button
                  className="text-button"
                  onClick={() => {
                    setGame(resume);
                    setRevealed(false);
                    go("journey");
                  }}
                >
                  旅のつづきから · {resume.age.toFixed(1)}年目 ↗
                </button>
              )}
            </div>
            <div className="hero-art">
              <span className="eyebrow">● LUKA / UNIT 03 — STANDBY</span>
              <PixelWorld hero />
              <p>まだ何も知らない、小さなロボットがいます。</p>
            </div>
            <div className="title-bottom">
              <span>教える。見届ける。心に残る。</span>
              <button onClick={() => void openRecords(true)}>
                誰かの人生を読む ↗
              </button>
            </div>
          </section>
        )}
        {screen === "prologue" && (
          <section className="intro screen-panel">
            <div className="section-heading">
              <span className="eyebrow">PROLOGUE</span>
              <Pager
                index={step}
                total={3}
                onChange={setStep}
                label="プロローグ"
              />
            </div>
            <div className="intro-scene">
              <PixelWorld
                key={step}
                scene={prologue[step].scene}
                motion={prologue[step].motion}
                arc="self"
              />
              <div className="intro-caption">
                <h2>{prologue[step].title}</h2>
                <p>{prologue[step].text}</p>
              </div>
            </div>
            <div className="screen-actions">
              <span className="muted">
                教えられるのは3つ。声が届くのは、あと2回。
              </span>
              <button
                className="primary"
                onClick={() => (step < 2 ? setStep(step + 1) : go("teach"))}
              >
                {step < 2 ? "その先へ" : "この子に、教える"} →
              </button>
            </div>
          </section>
        )}
        {screen === "teach" && (
          <section className="editor screen-panel">
            <div className="section-heading">
              <span className="eyebrow">最後の授業 / LESSON {step + 1}</span>
              <Pager index={step} total={3} onChange={setStep} label="教え" />
            </div>
            <div className="editor-copy">
              <h2>
                {
                  [
                    "ひとつめ。大切にしてほしいこと。",
                    "ふたつめ。この世界での、生き方。",
                    "みっつめ。最後に、伝えたいこと。",
                  ][step]
                }
              </h2>
              <p className="muted">
                正しい答えでなくてもいい。あなたの言葉で。
              </p>
            </div>
            <label className="teaching-field">
              <span>0{step + 1}</span>
              <textarea
                aria-label={`${step + 1}つめの教え`}
                maxLength={100}
                value={texts[step]}
                onChange={(e) =>
                  setTexts(
                    texts.map((t, i) => (i === step ? e.target.value : t)),
                  )
                }
                placeholder="この子に、何を教えますか。"
              />
              <small>{texts[step].length}/100</small>
            </label>
            <div className="preset-row">
              <span className="fine">例を使う</span>
              {["やさしさと約束", "自由と好奇心", "善意と力"].map((p, i) => (
                <button key={p} onClick={() => setTexts([...presets[i]])}>
                  {p}
                </button>
              ))}
            </div>
            <div className="screen-actions">
              <button
                className="text-button"
                onClick={() => setOverlay("identity")}
              >
                {name} / 名前・シードを変える
              </button>
              <button
                className="primary"
                disabled={
                  busy ||
                  !texts[step].trim() ||
                  (step === 2 && texts.some((t) => !t.trim()))
                }
                onClick={() => (step < 2 ? setStep(step + 1) : void parse())}
              >
                {busy
                  ? "言葉を読み取っています…"
                  : step < 2
                    ? "次の教えへ"
                    : "この3つを教える"}{" "}
                →
              </button>
            </div>
            <span className="fine">
              解析は出発前に一度。接続できなくても遊べます。
            </span>
          </section>
        )}
        {screen === "review" && lessons[step] && (
          <section className="review screen-panel">
            <div className="section-heading">
              <span className="eyebrow">こういう意味ですか、先生。</span>
              <Pager index={step} total={3} onChange={setStep} label="解釈" />
            </div>
            <TeachingQuote text={lessons[step].text} onInfo={info} />
            <span className="source-badge">◈ {source}</span>
            <div className="review-card">
              <label>
                理解した意味
                <input
                  maxLength={160}
                  value={lessons[step].meaning}
                  onChange={(e) => updateLesson({ meaning: e.target.value })}
                />
              </label>
              <div className="review-grid">
                <label>
                  行動のよりどころ
                  <select
                    value={lessons[step].motive}
                    onChange={(e) =>
                      updateLesson({
                        motive: e.target.value as Lesson["motive"],
                      })
                    }
                  >
                    {motives.map((m) => (
                      <option value={m} key={m}>
                        {motiveLabels[m]}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  大切にする強さ
                  <select
                    value={lessons[step].strength}
                    onChange={(e) =>
                      updateLesson({ strength: Number(e.target.value) })
                    }
                  >
                    <option value={1}>柔軟に考える</option>
                    <option value={2}>大切にする</option>
                    <option value={3}>強く守る</option>
                  </select>
                </label>
                <label>
                  どんなときに
                  <select
                    value={lessons[step].condition}
                    onChange={(e) =>
                      updateLesson({
                        condition: e.target.value as Lesson["condition"],
                      })
                    }
                  >
                    <option value="always">いつも</option>
                    <option value="danger">自分が危険なとき</option>
                    <option value="conflict">大きな葛藤のとき</option>
                  </select>
                </label>
                <label>
                  誰に向けて
                  <select
                    value={lessons[step].target}
                    onChange={(e) =>
                      updateLesson({
                        target: e.target.value as Lesson["target"],
                      })
                    }
                  >
                    <option value="others">他者に</option>
                    <option value="self">自分に</option>
                    <option value="world">世界に</option>
                  </select>
                </label>
              </div>
            </div>
            <div className="screen-actions">
              <button className="text-button" onClick={() => go("teach")}>
                教えを書き直す
              </button>
              <button
                className="primary"
                disabled={lessons.some((l) => !l.meaning.trim())}
                onClick={() => (step < 2 ? setStep(step + 1) : void start())}
              >
                {step < 2
                  ? "次の解釈へ"
                  : `いってらっしゃい、${name || "ルカ"}`}{" "}
                →
              </button>
            </div>
          </section>
        )}
        {screen === "journey" && game && event && (
          <section className="journey screen-panel">
            <div className="journey-top">
              <div>
                <span className="eyebrow">
                  {game.name} / 記録{" "}
                  {String(game.history.length + (revealed ? 0 : 1)).padStart(
                    2,
                    "0",
                  )}
                </span>
                <h2>
                  {game.age.toFixed(1)} <small>年目の旅</small>
                </h2>
              </div>
              <div className="intervention-count">
                先生の声 <b>あと{game.interventions}回</b>
              </div>
              <button
                className="icon-button"
                aria-label="機体と記憶を見る"
                onClick={() =>
                  info("この子の今", [
                    `稼働見込み：あと${Math.max(0, game.life - game.age).toFixed(1)}年。エネルギー：${game.stats.energy}%。損傷：${game.stats.damage}%。`,
                    `救った人：${game.stats.saved}人。被害：${game.stats.harm}。復興：${game.stats.civilization}。信頼：${game.stats.trust}。`,
                    ...traits.map(
                      (t) =>
                        `${labels[t]}：${game.initialTraits[t]} → ${game.traits[t]}`,
                    ),
                    ...game.lessons.map((l, i) => `教え${i + 1}：${l.text}`),
                    ...game.memories.slice(-6),
                    `旅のシード：${game.seed}`,
                  ])
                }
              >
                ◈
              </button>
            </div>
            <FilmScene
              key={`${event.id}-${revealed}`}
              auto={autoCaptions}
              onAutoChange={setAutoCaptions}
              paused={!!detail || !!overlay}
              event={event}
              game={game}
              entry={revealed ? game.history.at(-1) : undefined}
            />
            <div className="journey-bottom">
              <div className="choice-summary">
                <span className="eyebrow">
                  {revealed
                    ? "この子が選んだこと"
                    : event.critical
                      ? "ひとつの岐路"
                      : "小さな出会い"}
                </span>
                <strong>
                  {revealed ? game.history.at(-1)?.action : event.title}
                </strong>
              </div>
              {revealed ? (
                <div className="journey-buttons">
                  <button
                    className="secondary"
                    onClick={() =>
                      info(
                        "どうして、そうしたの？",
                        game.history.at(-1)!.reason,
                      )
                    }
                  >
                    判断の理由
                  </button>
                  <button className="primary" onClick={next}>
                    {game.ended ? "最後の記録を開く" : "旅を見届ける"} →
                  </button>
                </div>
              ) : (
                <div className="journey-buttons">
                  {event.critical && game.interventions > 0 && (
                    <button
                      className="secondary"
                      onClick={() => {
                        setInterventionLesson(0);
                        setOverlay("intervene");
                      }}
                    >
                      声を届ける
                    </button>
                  )}
                  <button className="primary" onClick={() => void act()}>
                    この子に任せる →
                  </button>
                </div>
              )}
            </div>
          </section>
        )}
        {screen === "ending" && game && (
          <LifeBook
            game={game}
            onInfo={info}
            onReplay={() => {
              setConsent(false);
              go("teach");
            }}
            onRecords={() => void openRecords()}
            onPublish={() => setOverlay("publish")}
          />
        )}
        {screen === "records" && (
          <section className="records screen-panel">
            {selected ? (
              <>
                <button className="book-back" onClick={() => setSelected(null)}>
                  ← 記録一覧
                </button>
                <LifeBook key={selected.seed} game={selected} onInfo={info} />
              </>
            ) : (
              <>
                <div className="section-heading">
                  <h2>誰かが残した人生。</h2>
                  <span className="eyebrow">LIVES LEFT BEHIND</span>
                </div>
                <div className="tabs">
                  <button
                    className={!online ? "active" : ""}
                    onClick={() => void openRecords(false)}
                  >
                    この端末
                  </button>
                  <button
                    className={online ? "active" : ""}
                    onClick={() => void openRecords(true)}
                  >
                    オンライン
                  </button>
                </div>
                <div className="category-tabs">
                  {categories.map(([key, label]) => (
                    <button
                      key={key}
                      className={category === key ? "active" : ""}
                      onClick={() => {
                        setCategory(key);
                        setRecordPage(0);
                        if (online) void openRecords(true, key);
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <p className="fine">
                  {categories.find((c) => c[0] === category)?.[1]}：
                  {
                    {
                      saved: "救った人数",
                      harm: "世界への被害",
                      age: "稼働年数",
                      civilization: "復興への貢献",
                      trust: "人々の信頼",
                    }[category]
                  }
                  の多い順
                </p>
                <div className="record-list">
                  {sorted.length === 0 ? (
                    <div className="empty">
                      <span>◇</span>
                      <p>まだ、記録はありません。</p>
                      <button onClick={() => go("title")}>教室へ戻る →</button>
                    </div>
                  ) : (
                    sorted
                      .slice(recordPage * 2, recordPage * 2 + 2)
                      .map((r, i) => (
                        <button
                          className="record-row"
                          key={r.id}
                          onClick={() => setSelected(r.game)}
                        >
                          <span>{recordPage * 2 + i + 1}</span>
                          <div>
                            <strong>{r.game.name}</strong>
                            <p>{ending(r.game).title}</p>
                            <small>{r.game.age.toFixed(1)}年間の人生</small>
                          </div>
                          <b>
                            {category === "age"
                              ? r.game.age.toFixed(1)
                              : r.game.stats[category]}
                          </b>
                          <span>↗</span>
                        </button>
                      ))
                  )}
                </div>
                <Pager
                  index={recordPage}
                  total={Math.ceil(sorted.length / 2)}
                  onChange={setRecordPage}
                  label="記録一覧"
                />
              </>
            )}
          </section>
        )}
      </main>
      <footer>
        <span>教える。見届ける。心に残る。</span>
        <span>THREE LESSONS. ONE LIFE.</span>
      </footer>
      {overlay && (
        <Sheet
          title={
            overlay === "intervene"
              ? "先生の声を、届けるなら。"
              : overlay === "identity"
                ? "この子と、旅の名前。"
                : "誰かの心にも、この人生を。"
          }
          onClose={() => setOverlay(null)}
        >
          {overlay === "intervene" && game && (
            <>
              <p className="muted">
                どの教えを、今いちばん大切にする？
                <br />
                行動は、この子自身が選びます。
              </p>
              <div className="priority-list">
                <button onClick={() => void act(interventionLesson)}>
                  <span>0{interventionLesson + 1}</span>
                  {game.lessons[interventionLesson].text}
                  <span>→</span>
                </button>
              </div>
              <Pager
                index={interventionLesson}
                total={3}
                onChange={setInterventionLesson}
                label="優先する教え"
              />
              <span className="fine">声を届けると、介入を1回使います。</span>
            </>
          )}
          {overlay === "identity" && (
            <>
              <label>
                この子の名前
                <input
                  maxLength={16}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </label>
              <label>
                旅のシード <small>空欄で新しい人生</small>
                <input
                  maxLength={64}
                  value={seed}
                  onChange={(e) => setSeed(e.target.value)}
                  placeholder="例：first-light"
                />
              </label>
              <button className="primary" onClick={() => setOverlay(null)}>
                この名前で →
              </button>
            </>
          )}
          {overlay === "publish" && (
            <>
              <p className="muted">
                記録はすでに、この端末にあります。
                <br />
                公開すると、教えや年表を他の人が読めます。
              </p>
              <label className="check">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                />
                名前・3つの教え・人生の記録を公開することに同意する
              </label>
              <button
                className="primary"
                disabled={!consent || busy}
                onClick={() => void publish()}
              >
                {busy ? "人生を照合しています…" : "人生記録を公開する"} ↗
              </button>
            </>
          )}
        </Sheet>
      )}
      {detail && (
        <Sheet title={detail.title} onClose={() => setDetail(null)}>
          <p className="detail-text">{detail.pages[detailPage]}</p>
          <Pager
            index={detailPage}
            total={detail.pages.length}
            onChange={setDetailPage}
            label="詳細"
          />
        </Sheet>
      )}
      {message && (
        <div className="message" role="status">
          <p>{message}</p>
          <button aria-label="通知を閉じる" onClick={() => setMessage("")}>
            ×
          </button>
        </div>
      )}
    </div>
  );
}
function Sheet({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const dialog = document.querySelector<HTMLDialogElement>("dialog");
    dialog?.showModal();
    function key(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    }
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("keydown", key);
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      className="sheet"
      aria-label={title}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <div className="sheet-head">
        <h2>{title}</h2>
        <button onClick={onClose} aria-label="閉じる">
          ×
        </button>
      </div>
      <div className="sheet-body">{children}</div>
    </dialog>
  );
}
function LifeBook({
  game: g,
  onInfo,
  onReplay,
  onRecords,
  onPublish,
}: {
  game: Game;
  onInfo: (title: string, text: string | string[]) => void;
  onReplay?: () => void;
  onRecords?: () => void;
  onPublish?: () => void;
}) {
  const [tab, setTab] = useState(0),
    [page, setPage] = useState(0);
  const end = ending(g),
    world = g.world ?? buildWorld(g.history),
    h = g.history[page];
  const worldPages = [
    ...world.people.map(
      (p) => `${p.name} — ${p.relationship}。${p.memories.at(-1)}`,
    ),
    ...world.promises.map(
      (p) => `${p.person}との約束「${p.content}」：${p.status}`,
    ),
    `所属：${world.faction}`,
    `訪れた場所：${world.regions.join("、")}`,
    `知識：${world.knowledge.join("、") || "言葉にならない小さな経験"}`,
    `失われた命：${world.victims}人。世界への被害とは別に数えた、確認された犠牲者。`,
  ].flatMap((t) => splitText(t, 65));
  function changeTab(i: number) {
    setTab(i);
    setPage(0);
  }
  return (
    <section className="life-book screen-panel">
      <div className="section-heading">
        <span className="eyebrow">
          {g.name} / {g.age.toFixed(1)}年間の人生
        </span>
        <span className="eyebrow">THE LAST PAGE</span>
      </div>
      <div className="tabs book-tabs">
        {["結末", "3つの教え", "出会いと約束", "人生年表"].map((t, i) => (
          <button
            key={t}
            className={tab === i ? "active" : ""}
            onClick={() => changeTab(i)}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="book-content">
        {tab === 0 && (
          <>
            <div className="ending-art">
              <PixelWorld
                scene={g.stats.civilization > 100 ? "rebuilt" : "forest"}
                motion="rest"
                arc="self"
                age={g.age}
                damage={g.stats.damage}
                name={g.name}
              />
            </div>
            <h2>{end.title}</h2>
            <blockquote>「{end.last}」</blockquote>
            <div className="ending-stats">
              {categories.map(([key, label]) => (
                <div key={key}>
                  <span>{label}</span>
                  <b>{key === "age" ? g.age.toFixed(1) : g.stats[key]}</b>
                </div>
              ))}
            </div>
            <button
              className="text-button"
              onClick={() =>
                onInfo("最後の記録", [
                  end.text,
                  ...(g.quietYears
                    ? [
                        `最後の出来事から${g.quietYears.toFixed(1)}年。小さな日々を重ね、胸の灯りは静かに消えました。`,
                      ]
                    : []),
                ])
              }
            >
              最後の記録を読む ↗
            </button>
          </>
        )}
        {tab === 1 && (
          <>
            <span className="eyebrow">はじまりは、この3つでした。</span>
            <h2>「{g.lessons[page].text}」</h2>
            <p className="muted">
              {motiveLabels[g.lessons[page].motive]}ことを、大切にした。
            </p>
            <p>
              この教えは、
              <b className="accent">
                {g.history.filter((h) => h.lesson === page).length}回
              </b>
              の判断のよりどころになりました。
            </p>
            <button
              className="secondary"
              onClick={() =>
                onInfo(
                  "教えが残したもの",
                  g.history
                    .filter((h) => h.lesson === page)
                    .map((h) => `${h.title}で「${h.action}」を選んだ。`)
                    .concat("どの教えも、一つの正解にはならなかった。"),
                )
              }
            >
              導いた判断を見る
            </button>
            <Pager
              index={page}
              total={3}
              onChange={setPage}
              label="教えの記録"
            />
          </>
        )}
        {tab === 2 && (
          <>
            <span className="eyebrow">誰かと、出会った。その跡がある。</span>
            <p className="world-note">{worldPages[page]}</p>
            <button
              className="secondary"
              onClick={() =>
                onInfo(
                  "この子の変化",
                  traits.map(
                    (t) =>
                      `${labels[t]}：${g.initialTraits[t]} → ${g.traits[t]}`,
                  ),
                )
              }
            >
              性格の変化を見る
            </button>
            <Pager
              index={page}
              total={worldPages.length}
              onChange={setPage}
              label="出会いと約束"
            />
          </>
        )}
        {tab === 3 && h && (
          <article className="timeline-entry">
            <span className="eyebrow">
              {h.year.toFixed(1)}年目 / {eventMap[h.eventId].region}
            </span>
            <h2>{h.title}</h2>
            <strong>{h.action}</strong>
            <p>{h.memory}</p>
            <div className="entry-buttons">
              <button
                className="secondary"
                onClick={() => onInfo("この日の出来事", h.result)}
              >
                出来事を読む
              </button>
              <button
                className="secondary"
                onClick={() => onInfo("どうして、そうしたの？", h.reason)}
              >
                判断の理由
              </button>
            </div>
            <Pager
              index={page}
              total={g.history.length}
              onChange={setPage}
              label="年表"
            />
          </article>
        )}
      </div>
      {onReplay && (
        <div className="book-actions">
          <div>
            <button className="text-button" onClick={onRecords}>
              人生の記録を読む ↗
            </button>
            <button className="text-button" onClick={onPublish}>
              この人生を公開する ↗
            </button>
          </div>
          <button className="primary" onClick={onReplay}>
            別の3つを、教えてみる ↻
          </button>
        </div>
      )}
    </section>
  );
}

function TeachingQuote({
  text,
  onInfo,
}: {
  text: string;
  onInfo: (title: string, text: string) => void;
}) {
  const chars = Array.from(text);
  return (
    <h2>
      <button
        className="quote-button"
        onClick={() => onInfo("教えの原文", text)}
      >
        「{chars.slice(0, 36).join("")}
        {chars.length > 36 ? "…" : ""}」
        {chars.length > 36 && <small>原文を読む ↗</small>}
      </button>
    </h2>
  );
}
