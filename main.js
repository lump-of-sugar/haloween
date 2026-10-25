/*
 * ミッション設定
 * 1) floor/title/description: 画面に表示する内容
 * 2) answer: そのミッションで正解となるアルファベット（A〜Z）
 * 3) icon: images フォルダ内のアイコン画像名
 *
 * finalPassword: 3つのミッションをすべてクリアしたときに表示する最終パスワード
 * final_background.jpg は全ミッションクリア後の背景画像です。
 */
const CONFIG = {
  pageTitle: "それゆけ！ハロウィン・バスターズ！！",
  introText: "ハロウィンを前にして、学校が邪悪な霊に乗っ取られてしまった！\n見習い祓魔師（エクソシスト）となってアンデッドたちを倒し、学校の平和を取り戻せ！",
  finalPassword: "Jack-o'-Lantern", // 最終パスワード表示用。必要に応じて変更してください。
  finalMessage: "やつの居場所は《8階》だ！エレベーターで急いで向かえ！",
  missions: [
    {
      id: "mission-1",
      floor: "3F",
      title: "吸血鬼の館",
      answer: "J", // 正解のアルファベットに変更
      icon: "mission_1_icon.jpg",
      description: "【遊び方】\n無数のコウモリの中から吸血鬼の化けた本体を見つけ、十字架を突き付けろ！\n（他のチームにバレないように、見つけたらこっそり共有しよう）"
    },
    {
      id: "mission-2",
      floor: "4F",
      title: "暗黒街の人狼",
      answer: "O", // 正解のアルファベットに変更
      icon: "mission_2_icon.jpg",
      description: "【遊び方】\n証言をもとに人間に紛れて夜を待つ狼男を見破り、銀の弾丸で撃ち抜け！"
    },
    {
      id: "mission-3",
      floor: "5F",
      title: "亡霊の迷宮",
      answer: "L", // 正解のアルファベットに変更
      icon: "mission_3_icon.jpg",
      description: "【遊び方】\n謎を解きながら迷路を駆け抜け、深淵を彷徨うゴーストを除霊せよ！"
    }
  ]
};

const STORAGE_KEY = "missionPortalProgress_v1";
const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const COOLDOWN_KEY = "missionPortalCooldowns_v1";
const COOLDOWN_MS = 3 * 60 * 1000; // 3分間
let cooldownInterval = null;

function loadCooldowns() {
  try {
    return JSON.parse(localStorage.getItem(COOLDOWN_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveCooldowns() {
  try {
    localStorage.setItem(COOLDOWN_KEY, JSON.stringify(state.cooldowns));
  } catch (error) {
    console.warn("クールタイムを保存できませんでした。", error);
  }
}

 // 保存されている進行状況を確認し、全ミッションクリア済みなら初期化
try {
  const savedProgress = JSON.parse(
    localStorage.getItem(STORAGE_KEY) || "{}"
  );

  const wasAllCleared = CONFIG.missions.every(
    (mission) => Boolean(savedProgress[mission.id])
  );

  if (wasAllCleared) {
    // ミッションクリア状況を削除
    localStorage.removeItem(STORAGE_KEY);

    // クールタイム情報も削除
    localStorage.removeItem(COOLDOWN_KEY);
  }
} catch (error) {
  console.warn("進行状況を確認できませんでした。", error);
}

const state = {
  cleared: loadProgress(),
  cooldowns: loadCooldowns(),
  activeMissionId: null,
  selectedLetter: null
};

const $ = (id) => document.getElementById(id);
const missionGrid = $("mission-grid");
const modal = $("mission-modal");
const letterGrid = $("letter-grid");
const submitButton = $("submit-answer");

function loadProgress() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveProgress() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.cleared));
  } catch (error) {
    console.warn("進行状況を保存できませんでした。", error);
  }
}

function allMissionsCleared() {
  return CONFIG.missions.every((mission) => Boolean(state.cleared[mission.id]));
}

function renderPage() {
  $("page-title").textContent = CONFIG.pageTitle;
  $("intro-text").textContent = CONFIG.introText;
  const isAllCleared = allMissionsCleared();
  $("hero").style.backgroundImage = isAllCleared
    ? 'url("images/final_background.jpg")'
    : 'url("images/top_background.jpg")';

  $("final-password").hidden = !isAllCleared;
  $("final-password-value").textContent = isAllCleared ? CONFIG.finalPassword : "";
  $("final-message").textContent = CONFIG.finalMessage;

  missionGrid.replaceChildren();
  CONFIG.missions.forEach((mission) => {
    const cleared = Boolean(state.cleared[mission.id]);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "mission-card";
    button.disabled = cleared || isAllCleared;
    button.setAttribute("aria-label", cleared
      ? `${mission.title}、クリア済み、取得文字 ${state.cleared[mission.id]}`
      : `${mission.title}を開く`);

    const iconWrap = document.createElement("span");
    iconWrap.className = "mission-icon-wrap";
    const img = document.createElement("img");
    img.className = "mission-icon";
    img.src = `images/${mission.icon}`;
    img.alt = "";
    iconWrap.appendChild(img);

    if (cleared) {
      const overlay = document.createElement("span");
      overlay.className = "cleared-letter";
      overlay.textContent = state.cleared[mission.id];
      iconWrap.appendChild(overlay);
    }

    const title = document.createElement("span");
    title.className = "mission-card-title";
    title.textContent = `${mission.floor}｜${mission.title}`;
    button.append(iconWrap, title);

    if (cleared) {
      const tag = document.createElement("span");
      tag.className = "clear-tag";
      tag.textContent = "CLEAR";
      button.appendChild(tag);
    } else {
      button.addEventListener("click", () => openMission(mission.id));
    }
    missionGrid.appendChild(button);
  });

  const clearedCount = CONFIG.missions.filter((mission) => Boolean(state.cleared[mission.id])).length;
  $("progress-text").textContent = isAllCleared
    ? "クリア状況：3 / 3　全ミッションクリア！"
    : `クリア状況：${clearedCount} / ${CONFIG.missions.length}`;
}

function openMission(missionId) {
  const mission = CONFIG.missions.find((item) => item.id === missionId);
  if (!mission || state.cleared[missionId] || allMissionsCleared()) return;

  state.activeMissionId = missionId;
  state.selectedLetter = null;
  $("modal-eyebrow").textContent = `MISSION / ${mission.floor}`;
  $("modal-title").textContent = mission.title;
  $("modal-description").textContent = mission.description;
  $("modal-feedback").textContent = "";
  $("selection-status").textContent = "文字が選択されていません。";
  submitButton.disabled = true;
  renderLetterButtons();
  modal.hidden = false;
  document.body.style.overflow = "hidden";
  updateCooldownUI();
  $("modal-close").focus();
}

function renderLetterButtons() {
  letterGrid.replaceChildren();
  LETTERS.forEach((letter) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "letter-button";
    button.textContent = letter;
    button.setAttribute("aria-pressed", "false");
    button.addEventListener("click", () => {
      state.selectedLetter = letter;
      letterGrid.querySelectorAll(".letter-button").forEach((item) => {
        const selected = item.textContent === letter;
        item.classList.toggle("selected", selected);
        item.setAttribute("aria-pressed", String(selected));
      });
      $("selection-status").textContent = `選択中：${letter}`;
      $("modal-feedback").textContent = "";
      submitButton.disabled = false;
    });
    letterGrid.appendChild(button);
  });
}


function updateCooldownUI() {
  const mission = CONFIG.missions.find(
    (item) => item.id === state.activeMissionId
  );

  if (!mission) return;

  // このミッションの入力禁止期限を取得
  const until = Number(state.cooldowns[mission.id] || 0);
  const remaining = Math.max(0, until - Date.now());
  const isCoolingDown = remaining > 0;

  // アルファベットのボタンを無効化
  letterGrid.querySelectorAll(".letter-button").forEach((button) => {
    button.disabled = isCoolingDown;
  });

  // 決定ボタンも無効化
  submitButton.disabled = isCoolingDown || !state.selectedLetter;

  if (isCoolingDown) {
    const totalSeconds = Math.ceil(remaining / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const timeText =
      String(minutes).padStart(2, "0") + ":" +
      String(seconds).padStart(2, "0");

    $("modal-feedback").style.color = "#ff8d8d";
    $("modal-feedback").textContent =
      "パスワードが違います。" +
      ` 入力再開まで ${timeText}`;

    $("selection-status").textContent =
      "クールタイム中は入力できません。";

    // 1秒ごとに残り時間を更新
    if (cooldownInterval === null) {
      cooldownInterval = window.setInterval(() => {
        const currentUntil = Number(
          state.cooldowns[mission.id] || 0
        );

        if (Date.now() >= currentUntil) {
          window.clearInterval(cooldownInterval);
          cooldownInterval = null;

          // クールタイム終了
          delete state.cooldowns[mission.id];
          saveCooldowns();

          $("modal-feedback").style.color = "var(--success)";
          $("modal-feedback").textContent =
            "入力を再開できます。";

          $("selection-status").textContent =
            "パスワードを入力してください。";

          letterGrid.querySelectorAll(".letter-button").forEach(
            (button) => {
              button.disabled = false;
            }
          );

          submitButton.disabled = !state.selectedLetter;
          return;
        }

        updateCooldownUI();
      }, 1000);
    }
  } else {
    // クールタイムが残っていない場合
    if (cooldownInterval !== null) {
      window.clearInterval(cooldownInterval);
      cooldownInterval = null;
    }

    delete state.cooldowns[mission.id];
    saveCooldowns();

    letterGrid.querySelectorAll(".letter-button").forEach(
      (button) => {
        button.disabled = false;
      }
    );

    submitButton.disabled = !state.selectedLetter;
  }
}

function closeMission() {
  modal.hidden = true;
  document.body.style.overflow = "";
  
  // 画面を閉じたら表示更新用タイマーだけ停止する
  // クールタイムの終了時刻は保存済みなので維持される
  if (cooldownInterval !== null) {
    window.clearInterval(cooldownInterval);
    cooldownInterval = null;
  }

  state.activeMissionId = null;
  state.selectedLetter = null;
}

submitButton.addEventListener("click", () => {
  const mission = CONFIG.missions.find((item) => item.id === state.activeMissionId);
  if (!mission || !state.selectedLetter) return;

  if (state.selectedLetter !== mission.answer.toUpperCase()) {
  // 間違えた時点から3分間の入力禁止を設定
  state.cooldowns[mission.id] = Date.now() + COOLDOWN_MS;
  saveCooldowns();

  // エラーメッセージと残り時間を表示
  updateCooldownUI();
  return;
}

  state.cleared[mission.id] = mission.answer.toUpperCase();
  saveProgress();
  $("modal-feedback").style.color = "var(--success)";
  $("modal-feedback").textContent = `${mission.floor}討伐完了！`;

  // 完了メッセージを少し表示してから、ポップアップを閉じてトップへ戻る
  window.setTimeout(() => {
    closeMission();
    renderPage();
  }, 1300);
});

$("modal-close").addEventListener("click", closeMission);
modal.addEventListener("click", (event) => {
  if (event.target === modal) closeMission();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !modal.hidden) closeMission();
});

renderPage();
