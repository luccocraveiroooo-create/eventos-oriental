/**
 * EVENTOS ORIENTAL - Painel de Chaveamento para GM (Perfect World Oriental)
 * Credenciais de GM:
 * Login: admin
 * Senha: Oriental@2026Admin
 */

// Credenciais do GM
const GM_CREDENTIALS = {
  username: "admin",
  password: "Oriental@2026Admin"
};

// Estado da Aplicação
let isAdminLoggedIn = false;
let currentTournament = null;
let savedActiveTournament = null;
let isViewingHistory = false;
let activeModalMatch = null;

// Participantes padrão removidos (inicia 100% limpo)

// Inicialização ao carregar a página
document.addEventListener("DOMContentLoaded", () => {
  if (window.lucide) {
    lucide.createIcons();
  }

  // Verificar se o GM já estava logado
  const savedAuth = sessionStorage.getItem("oriental_gm_auth");
  if (savedAuth === "true") {
    isAdminLoggedIn = true;
  }
  updateAdminUI();

  // Carregar torneio do localStorage
  loadTournamentData();
  updateHistoryBadge();
});

// ================= AUTENTICAÇÃO GM =================

function openLoginModal() {
  document.getElementById("loginErrorMsg").classList.add("hidden");
  document.getElementById("loginForm").reset();
  const modal = document.getElementById("loginModal");
  modal.style.display = "flex";
  document.getElementById("loginUsername").focus();
}

function closeLoginModal() {
  document.getElementById("loginModal").style.display = "none";
}

function handleLoginSubmit(event) {
  event.preventDefault();
  const u = document.getElementById("loginUsername").value.trim();
  const p = document.getElementById("loginPassword").value.trim();

  if (u === GM_CREDENTIALS.username && p === GM_CREDENTIALS.password) {
    isAdminLoggedIn = true;
    sessionStorage.setItem("oriental_gm_auth", "true");
    closeLoginModal();
    updateAdminUI();
    renderBracket();
  } else {
    document.getElementById("loginErrorMsg").classList.remove("hidden");
  }
}

function logoutAdmin() {
  isAdminLoggedIn = false;
  sessionStorage.removeItem("oriental_gm_auth");
  updateAdminUI();
  renderBracket();
}

function updateAdminUI() {
  const adminControls = document.getElementById("adminControlsGroup");
  const adminStatusBar = document.getElementById("adminStatusBar");
  const btnLoginGM = document.getElementById("btnLoginGM");

  if (isAdminLoggedIn) {
    adminControls.classList.remove("hidden");
    adminStatusBar.classList.remove("hidden");
    btnLoginGM.classList.add("hidden");
  } else {
    adminControls.classList.add("hidden");
    adminStatusBar.classList.add("hidden");
    btnLoginGM.classList.remove("hidden");
  }
  if (window.lucide) lucide.createIcons();
}

// ================= ESTRUTURA DO TORNEIO & BRACKET =================

const STORAGE_KEY = "oriental_tournament_v3";

function loadTournamentData() {
  // Limpar dados de versões antigas que estavam travadas no navegador
  localStorage.removeItem("oriental_tournament_data");
  localStorage.removeItem("oriental_tournament_v1");
  localStorage.removeItem("oriental_tournament_v2");

  // Se houver parâmetro de reset na URL
  if (window.location.search.includes("reset=true")) {
    localStorage.removeItem(STORAGE_KEY);
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      currentTournament = JSON.parse(saved);
      renderBracket();
      return;
    } catch (e) {
      console.error("Erro ao ler localStorage:", e);
    }
  }

  // Estado inicial 100% limpo
  currentTournament = null;
  renderBracket();
}

function confirmClearTournament() {
  if (confirm("Tem certeza que deseja apagar o chaveamento atual e iniciar do zero?")) {
    currentTournament = null;
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem("oriental_tournament_data");
    renderBracket();
  }
}

function forceResetAll() {
  localStorage.clear();
  currentTournament = null;
  window.location.reload();
}

// ================= GERENCIAMENTO DE SORTEIO & QUANTIDADE =================

let currentSelectedCount = 8;
let currentTeamSize = 1; // 1 = 1x1, 2 = 2x2, ..., 8 = 8x8
let teamFormingMode = "random_teams"; // "random_teams" ou "preformed_teams"
let currentInputMode = "paste";

function setTeamSize(size) {
  size = parseInt(size) || 1;
  if (size < 1) size = 1;
  if (size > 8) size = 8;
  currentTeamSize = size;

  // Atualizar botões de modalidade
  document.querySelectorAll(".team-btn").forEach(btn => {
    const btnSize = parseInt(btn.getAttribute("data-team"));
    if (btnSize === size) {
      btn.className = "team-btn px-2 py-2 text-xs font-bold rounded-lg border border-cyan-500 bg-cyan-950/80 text-cyan-300 transition text-center shadow";
    } else {
      btn.className = "team-btn px-2 py-2 text-xs font-bold rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:border-cyan-400 transition text-center";
    }
  });

  // Atualizar badge do resumo da modalidade
  const badge = document.getElementById("teamModeSummaryBadge");
  const optionBox = document.getElementById("teamSorteioOptionBox");
  const step2Title = document.getElementById("step2TitleLabel");
  const step2Unit = document.getElementById("step2CountUnitLabel");
  const step3Title = document.getElementById("step3TitleLabel");
  const step3Helper = document.getElementById("step3HelperText");

  const modeNames = {
    1: "1x1 (Individual)",
    2: "2x2 (Duplas)",
    3: "3x3 (Trios)",
    4: "4x4 (Squads)",
    5: "5x5 (Times / Partys)",
    6: "6x6 (Sextetos)",
    7: "7x7",
    8: "8x8 (Partys Completas)"
  };

  if (badge) badge.textContent = modeNames[size] || `${size}x${size}`;

  if (size === 1) {
    if (optionBox) optionBox.classList.add("hidden");
    if (step2Title) step2Title.textContent = "Quantidade de Participantes";
    if (step2Unit) step2Unit.textContent = "participantes (mínimo 2, máximo 64)";
    if (step3Title) step3Title.textContent = "Nomes dos Lutadores";
    if (step3Helper) step3Helper.textContent = "💡 Dica: Cole os nicks dos lutadores (1 por linha). O sistema irá sortear os confrontos!";
  } else {
    if (optionBox) optionBox.classList.remove("hidden");
    if (step2Title) step2Title.textContent = "Quantidade de Equipes no Chaveamento";
    if (step2Unit) step2Unit.textContent = "equipes no chaveamento (ex: 8 equipes)";
    if (step3Title) step3Title.textContent = teamFormingMode === "random_teams" 
      ? `Nomes dos Jogadores para Sortear nos Times (${size} por equipe)` 
      : "Nomes das Equipes Formadas";
    if (step3Helper) step3Helper.textContent = teamFormingMode === "random_teams"
      ? `💡 Dica: Cole os nicks individuais de todos os jogadores. O sistema irá embaralhar os nomes, montar as equipes de ${size}x${size} e depois sortear os confrontos!`
      : "💡 Dica: Cada linha representa uma equipe já formada.";
  }

  updateBracketStructureHint(currentSelectedCount);
  updatePlayerListStatusBadge();

  if (currentInputMode === "slots") {
    renderSlotsInputs();
  }
}

function onTeamFormingModeChange() {
  const radio = document.querySelector('input[name="teamFormingMode"]:checked');
  if (radio) {
    teamFormingMode = radio.value;
    setTeamSize(currentTeamSize);
  }
}

function setPlayerCount(count) {
  count = parseInt(count) || 2;
  if (count < 2) count = 2;
  if (count > 64) count = 64;
  currentSelectedCount = count;

  // Atualizar input numérico
  const customInput = document.getElementById("customPlayerCountInput");
  if (customInput) customInput.value = count;

  // Atualizar botões de presets
  document.querySelectorAll(".preset-btn").forEach(btn => {
    const btnCount = parseInt(btn.getAttribute("data-count"));
    if (btnCount === count) {
      btn.className = "preset-btn px-3 py-1.5 text-xs font-bold rounded-lg border border-cyan-500 bg-cyan-950/60 text-cyan-300 transition";
    } else {
      btn.className = "preset-btn px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:border-cyan-400 transition";
    }
  });

  updateBracketStructureHint(count);
  updatePlayerListStatusBadge();

  if (currentInputMode === "slots") {
    renderSlotsInputs();
  }
}

function adjustPlayerCount(delta) {
  setPlayerCount(currentSelectedCount + delta);
}

function onCustomCountChange() {
  const val = parseInt(document.getElementById("customPlayerCountInput").value);
  if (!isNaN(val)) {
    setPlayerCount(val);
  }
}

function updateBracketStructureHint(n) {
  const hintEl = document.getElementById("bracketStructureHint");
  if (!hintEl) return;

  const entityType = currentTeamSize === 1 ? "lutadores" : "equipes";

  // Potência de 2
  let power = 2;
  while (power < n) {
    power *= 2;
  }

  let text = "";
  if (n === power) {
    if (n === 4) text = `Semi-Finais (2 lutas) ➔ Grande Final (${n} ${entityType})`;
    else if (n === 8) text = `Quartas (4 lutas) ➔ Semi (2 lutas) ➔ Final (${n} ${entityType})`;
    else if (n === 16) text = `Oitavas (8 lutas) ➔ Quartas ➔ Semi ➔ Final (${n} ${entityType})`;
    else if (n === 32) text = `16 Avos (16 lutas) ➔ Oitavas ➔ Quartas ➔ Semi ➔ Final`;
    else text = `${n} ${entityType} em chaveamento direto perfeito!`;
  } else {
    const targetPlayersInMain = power / 2;
    const prelimMatches = n - targetPlayersInMain;
    let nextStageName = targetPlayersInMain === 8 ? "Quartas" : (targetPlayersInMain === 4 ? "Semi" : "Oitavas");
    text = `Fase 1 com ${prelimMatches} ${prelimMatches === 1 ? 'preliminar' : 'preliminares'} ➔ ${nextStageName} ➔ Final (${n} ${entityType})`;
  }

  if (currentTeamSize > 1 && teamFormingMode === "random_teams") {
    const totalPlayersNeeded = n * currentTeamSize;
    text += ` • Total: ${totalPlayersNeeded} jogadores (${currentTeamSize} por time)`;
  }

  hintEl.textContent = text;
}

function updatePlayerListStatusBadge() {
  const badge = document.getElementById("playerListStatusBadge");
  if (!badge) return;

  const currentNames = getEnteredPlayerNames();
  const filled = currentNames.length;
  const targetRequired = (currentTeamSize > 1 && teamFormingMode === "random_teams") 
    ? (currentSelectedCount * currentTeamSize) 
    : currentSelectedCount;

  const entityLabel = (currentTeamSize > 1 && teamFormingMode === "random_teams") ? "jogadores" : (currentTeamSize === 1 ? "lutadores" : "equipes");
  badge.textContent = `${filled} de ${targetRequired} ${entityLabel} preenchidos`;

  if (filled === targetRequired) {
    badge.className = "text-xs font-mono text-emerald-400 font-bold";
  } else if (filled > targetRequired) {
    badge.className = "text-xs font-mono text-amber-400 font-bold";
  } else {
    badge.className = "text-xs font-mono text-cyan-400 font-bold";
  }
}

function onPlayerListTextInput() {
  const text = document.getElementById("playerListInput").value;
  const lines = text.split("\n").filter(l => l.trim().length > 0);
  
  const targetRequired = (currentTeamSize > 1 && teamFormingMode === "random_teams") 
    ? (currentSelectedCount * currentTeamSize) 
    : currentSelectedCount;

  // Se colar mais nomes que o necessário, auto-ajusta
  if (lines.length > targetRequired) {
    if (currentTeamSize === 1 || teamFormingMode !== "random_teams") {
      setPlayerCount(lines.length);
    } else {
      const neededTeams = Math.ceil(lines.length / currentTeamSize);
      setPlayerCount(neededTeams);
    }
  } else {
    updatePlayerListStatusBadge();
  }
}

function switchInputMode(mode) {
  currentInputMode = mode;
  const tabPaste = document.getElementById("tabPasteMode");
  const tabSlots = document.getElementById("tabSlotsMode");
  const pasteContainer = document.getElementById("pasteInputContainer");
  const slotsContainer = document.getElementById("slotsInputContainer");

  if (mode === "paste") {
    tabPaste.className = "px-3 py-1 text-xs font-bold rounded bg-cyan-950 text-cyan-300 border border-cyan-800 transition";
    tabSlots.className = "px-3 py-1 text-xs font-bold rounded bg-slate-800 text-slate-400 hover:text-white transition";
    pasteContainer.classList.remove("hidden");
    slotsContainer.classList.add("hidden");
  } else {
    tabSlots.className = "px-3 py-1 text-xs font-bold rounded bg-cyan-950 text-cyan-300 border border-cyan-800 transition";
    tabPaste.className = "px-3 py-1 text-xs font-bold rounded bg-slate-800 text-slate-400 hover:text-white transition";
    slotsContainer.classList.remove("hidden");
    pasteContainer.classList.add("hidden");
    renderSlotsInputs();
  }
}

function renderSlotsInputs() {
  const container = document.getElementById("slotsInputContainer");
  if (!container) return;

  const currentNames = getEnteredPlayerNames();
  container.innerHTML = "";

  const totalSlots = (currentTeamSize > 1 && teamFormingMode === "random_teams") 
    ? (currentSelectedCount * currentTeamSize) 
    : currentSelectedCount;

  const labelPrefix = (currentTeamSize > 1 && teamFormingMode === "random_teams") ? "Jogador" : (currentTeamSize === 1 ? "Lutador" : "Equipe");

  for (let i = 0; i < totalSlots; i++) {
    const val = currentNames[i] || "";
    const row = document.createElement("div");
    row.className = "flex items-center gap-2";

    const badge = document.createElement("span");
    badge.className = "w-6 h-6 rounded bg-[#1e232a] text-cyan-400 font-mono font-bold text-xs flex items-center justify-center border border-slate-700/60";
    badge.textContent = i + 1;

    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = `${labelPrefix} ${i + 1}`;
    input.value = val;
    input.className = "slot-input flex-1 bg-[#161c28] border border-slate-700 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400 font-medium";
    input.oninput = syncSlotsToTextarea;

    row.appendChild(badge);
    row.appendChild(input);
    container.appendChild(row);
  }
}

function syncSlotsToTextarea() {
  const inputs = document.querySelectorAll(".slot-input");
  const names = [];
  inputs.forEach(inp => {
    if (inp.value.trim().length > 0) {
      names.push(inp.value.trim());
    }
  });
  document.getElementById("playerListInput").value = names.join("\n");
  updatePlayerListStatusBadge();
}

function autofillMissingPlayers() {
  const currentNames = getEnteredPlayerNames();
  const totalSlots = (currentTeamSize > 1 && teamFormingMode === "random_teams") 
    ? (currentSelectedCount * currentTeamSize) 
    : currentSelectedCount;

  const labelPrefix = (currentTeamSize > 1 && teamFormingMode === "random_teams") ? "Jogador" : (currentTeamSize === 1 ? "Lutador" : "Equipe");

  while (currentNames.length < totalSlots) {
    currentNames.push(`${labelPrefix} ${currentNames.length + 1}`);
  }
  document.getElementById("playerListInput").value = currentNames.slice(0, totalSlots).join("\n");
  if (currentInputMode === "slots") {
    renderSlotsInputs();
  }
  updatePlayerListStatusBadge();
}

function clearPlayerInput() {
  document.getElementById("playerListInput").value = "";
  if (currentInputMode === "slots") {
    renderSlotsInputs();
  }
  updatePlayerListStatusBadge();
}

function getEnteredPlayerNames() {
  const text = document.getElementById("playerListInput").value;
  return text.split("\n").map(l => l.trim()).filter(l => l.length > 0);
}

function saveTournamentData() {
  if (currentTournament) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(currentTournament));
  }
}

/**
 * Cria a estrutura de fases e partidas do torneio para QUALQUER quantidade e formato (1x1 a 8x8)
 */
function buildTournamentStructure(title, teamsList, mode = "random", teamSize = 1) {
  if (teamsList.length < 2) return;

  if (mode === "random") {
    // Embaralha as equipes para os confrontos
    teamsList.sort(() => Math.random() - 0.5);
  }

  const participants = teamsList.map((team, idx) => ({
    seed: idx + 1,
    name: team.name,
    members: team.members || []
  }));

  const count = participants.length;
  const rounds = generateUniversalBracket(participants);

  currentTournament = {
    title: title || "Torneio PvP Oriental",
    date: new Date().toLocaleDateString("pt-BR"),
    participantsCount: count,
    teamSize: teamSize || 1,
    rounds: rounds,
    champion: null
  };

  saveTournamentData();
  renderBracket();
}

/**
 * Gerador de bracket universal adaptativo para qualquer número de lutadores (2 a 64)
 */
function generateUniversalBracket(participants) {
  const n = participants.length;
  let power = 2;
  while (power < n) {
    power *= 2;
  }

  // Se for potência exata de 2 (ex: 4, 8, 16, 32, 64)
  if (n === power) {
    const roundsCount = Math.log2(power);
    const rounds = [];
    let matchIdCounter = 1;

    for (let r = 0; r < roundsCount; r++) {
      const matchesInRound = power / Math.pow(2, r + 1);
      let roundName = `Fase ${r + 1}`;
      if (matchesInRound === 8) roundName = "Oitavas de Final";
      if (matchesInRound === 4) roundName = "Quartas de Final";
      if (matchesInRound === 2) roundName = "Semi-Finais";
      if (matchesInRound === 1) roundName = "Finais";

      const matches = [];
      for (let m = 0; m < matchesInRound; m++) {
        const id = matchIdCounter++;
        let p1 = null;
        let p2 = null;

        if (r === 0) {
          p1 = { ...participants[m * 2], score: 0 };
          p2 = { ...participants[m * 2 + 1], score: 0 };
        }

        matches.push({
          id: id,
          roundIdx: r,
          matchNum: id,
          p1: p1,
          p2: p2,
          winner: null,
          targetMatchId: null,
          targetSlot: (m % 2 === 0) ? 1 : 2
        });
      }
      rounds.push({ name: roundName, matches });
    }

    // Vincular alvos
    for (let r = 0; r < rounds.length - 1; r++) {
      const currentRound = rounds[r];
      const nextRound = rounds[r + 1];
      currentRound.matches.forEach((m, idx) => {
        const targetIdx = Math.floor(idx / 2);
        if (nextRound.matches[targetIdx]) {
          m.targetMatchId = nextRound.matches[targetIdx].id;
        }
      });
    }

    return rounds;
  }

  // Se não for potência de 2 (ex: 5, 6, 7, 10, 12, 14, 20...)
  return generateCustomPrelimBracket(participants, power);
}

function generateCustomPrelimBracket(participants, power) {
  // Número de lutadores na rodada principal seguinte à preliminar
  const targetPlayersInMain = power / 2; // Ex: N=6 -> 4; N=10 -> 8; N=12 -> 8; N=14 -> 8
  const prelimMatchesCount = participants.length - targetPlayersInMain;
  const numMatchesInMain = targetPlayersInMain / 2; // Ex: 4 players -> 2 lutas; 8 players -> 4 lutas
  const round1Matches = [];
  let matchId = 1;

  // Separação de quem ganha Bye e quem joga a preliminar
  const byeCount = participants.length - (prelimMatchesCount * 2);
  const byePlayers = participants.slice(0, byeCount);
  const prelimPlayers = participants.slice(byeCount);

  // 1. Criar as lutas da Fase 1 (Preliminares)
  for (let i = 0; i < prelimMatchesCount; i++) {
    round1Matches.push({
      id: matchId,
      roundIdx: 0,
      matchNum: matchId,
      p1: { ...prelimPlayers[i * 2], score: 0 },
      p2: { ...prelimPlayers[i * 2 + 1], score: 0 },
      winner: null,
      targetMatchId: null,
      targetSlot: 2
    });
    matchId++;
  }

  const rounds = [{ name: "Fase 1 (Preliminar)", matches: round1Matches }];

  // 2. Determinar quais partidas da rodada principal receberão os vencedores das preliminares
  // Distribuímos de forma equilibrada entre as metades superior e inferior da chave
  const receivingMatchIndices = [];
  if (prelimMatchesCount === numMatchesInMain) {
    // Todas as partidas da rodada principal recebem 1 preliminar
    for (let i = 0; i < numMatchesInMain; i++) {
      receivingMatchIndices.push(i);
    }
  } else if (prelimMatchesCount === 2 && numMatchesInMain === 4) {
    // Caso clássico de 10 players (Quartas de 4 lutas):
    // A luta 0 e a luta 2 recebem as preliminares (enfrentando Seed 1 e Seed 2)
    receivingMatchIndices.push(0, 2);
  } else {
    // Espaçamento geral
    const step = numMatchesInMain / prelimMatchesCount;
    for (let i = 0; i < prelimMatchesCount; i++) {
      receivingMatchIndices.push(Math.floor(i * step));
    }
  }

  // 3. Montar as partidas da rodada principal
  const mainRoundMatches = [];
  let topByeIndex = 0; // Para quem espera preliminar (Seeds mais altas)
  let restByeIndex = prelimMatchesCount; // Para quem joga entre si

  for (let i = 0; i < numMatchesInMain; i++) {
    const isReceivingPrelim = receivingMatchIndices.includes(i);
    let p1 = null;
    let p2 = null;

    if (isReceivingPrelim) {
      // 1 Lutador do Bye espera o vencedor da preliminar
      p1 = topByeIndex < byePlayers.length ? { ...byePlayers[topByeIndex++], score: 0 } : null;
      p2 = null; // Aguardando vencedor da Fase 1!
    } else {
      // 2 Lutadores do Bye se enfrentam diretamente
      p1 = restByeIndex < byePlayers.length ? { ...byePlayers[restByeIndex++], score: 0 } : null;
      p2 = restByeIndex < byePlayers.length ? { ...byePlayers[restByeIndex++], score: 0 } : null;
    }

    mainRoundMatches.push({
      id: matchId,
      roundIdx: 1,
      matchNum: matchId,
      p1: p1,
      p2: p2,
      winner: null,
      targetMatchId: null,
      targetSlot: (i % 2 === 0) ? 1 : 2
    });
    matchId++;
  }

  // 4. Conectar os vencedores de cada preliminar à sua respectiva partida da rodada principal
  round1Matches.forEach((pm, idx) => {
    const targetMainIdx = receivingMatchIndices[idx];
    if (mainRoundMatches[targetMainIdx]) {
      pm.targetMatchId = mainRoundMatches[targetMainIdx].id;
      pm.targetSlot = 2; // Entra no slot 2 para enfrentar o cabeça de chave (p1)
    }
  });

  let mainRoundName = "Fase 2";
  if (numMatchesInMain === 4) mainRoundName = "Quartas de Final";
  if (numMatchesInMain === 2) mainRoundName = "Semi-Finais";
  if (numMatchesInMain === 1) mainRoundName = "Finais";
  rounds.push({ name: mainRoundName, matches: mainRoundMatches });

  // 5. Restante das fases (Semi-Finais, Finais)
  let currentMatchesInRound = numMatchesInMain / 2;
  let prevRoundMatches = mainRoundMatches;
  let rIndex = 2;

  while (currentMatchesInRound >= 1) {
    let rName = `Fase ${rIndex + 1}`;
    if (currentMatchesInRound === 4) rName = "Quartas de Final";
    if (currentMatchesInRound === 2) rName = "Semi-Finais";
    if (currentMatchesInRound === 1) rName = "Finais";

    const nextMatches = [];
    for (let i = 0; i < currentMatchesInRound; i++) {
      const nm = {
        id: matchId,
        roundIdx: rIndex,
        matchNum: matchId,
        p1: null,
        p2: null,
        winner: null,
        targetMatchId: null,
        targetSlot: (i % 2 === 0) ? 1 : 2
      };
      nextMatches.push(nm);
      matchId++;
    }

    // Vincular anterior
    prevRoundMatches.forEach((pm, idx) => {
      const targetIdx = Math.floor(idx / 2);
      if (nextMatches[targetIdx]) {
        pm.targetMatchId = nextMatches[targetIdx].id;
        pm.targetSlot = (idx % 2 === 0) ? 1 : 2;
      }
    });

    rounds.push({ name: rName, matches: nextMatches });
    prevRoundMatches = nextMatches;
    currentMatchesInRound /= 2;
    rIndex++;
  }

  return rounds;
}

// ================= RENDERIZAÇÃO VISUAL DO BRACKET =================

function renderBracket() {
  const captureArea = document.getElementById("bracketCaptureArea");
  const emptyState = document.getElementById("emptyTournamentState");
  const champBanner = document.getElementById("championBanner");
  const btnExport = document.getElementById("btnExportImage");
  const headerInfoBox = document.getElementById("headerTournamentInfoBox");

  if (!currentTournament) {
    if (captureArea) captureArea.classList.add("hidden");
    if (champBanner) champBanner.classList.add("hidden");
    if (btnExport) btnExport.classList.add("hidden");
    if (emptyState) emptyState.classList.remove("hidden");
    if (headerInfoBox) headerInfoBox.classList.add("hidden");

    const headerTitle = document.getElementById("headerTournamentTitle");
    if (headerTitle) headerTitle.textContent = "Aguardando Início";

    if (window.lucide) lucide.createIcons();
    return;
  }

  // Torneio Ativo
  if (captureArea) captureArea.classList.remove("hidden");
  if (emptyState) emptyState.classList.add("hidden");
  if (btnExport) btnExport.classList.remove("hidden");
  if (headerInfoBox) headerInfoBox.classList.remove("hidden");

  // Atualizar textos dos cabeçalhos
  document.getElementById("headerTournamentTitle").textContent = currentTournament.title;
  document.getElementById("displayTournamentTitle").textContent = currentTournament.title;
  
  const modeLabel = currentTournament.teamSize && currentTournament.teamSize > 1 
    ? `${currentTournament.teamSize}x${currentTournament.teamSize} (Equipes)` 
    : "1x1 Individual";
  const entityName = currentTournament.teamSize && currentTournament.teamSize > 1 ? "Equipes" : "Participantes";
  
  document.getElementById("displayTournamentMeta").textContent = 
    `${currentTournament.participantsCount} ${entityName} • ${modeLabel} • ${currentTournament.rounds.length} Fases • Eliminatória Simples`;
  document.getElementById("tournamentDateLabel").textContent = `Data: ${currentTournament.date}`;

  // Campeão
  const champName = document.getElementById("championName");
  if (currentTournament.champion) {
    const champ = currentTournament.champion;
    if (champ.members && champ.members.length > 1) {
      champName.innerHTML = `${champ.name} <span class="block text-sm font-normal text-amber-200 mt-1 font-mono">Integrantes: ${champ.members.join(" • ")}</span>`;
    } else {
      champName.textContent = champ.name;
    }
    champBanner.classList.remove("hidden");
  } else {
    champBanner.classList.add("hidden");
  }

  const container = document.getElementById("bracketRoundsContainer");
  container.innerHTML = "";

  currentTournament.rounds.forEach((round, roundIndex) => {
    const col = document.createElement("div");
    col.className = "flex-1 min-w-[270px] max-w-[320px] flex flex-col";

    // Cabeçalho da coluna (Fase 1, Fase 2, Semi-Finais, Finais)
    const header = document.createElement("div");
    header.className = "text-center py-2.5 px-3 mb-6 bg-[#1a202c] border border-slate-700/80 rounded-lg text-slate-200 text-xs font-bold uppercase tracking-wider shadow";
    header.textContent = round.name;
    col.appendChild(header);

    // Lista de partidas centralizadas verticalmente
    const matchesList = document.createElement("div");
    matchesList.className = "flex flex-col justify-around flex-1 gap-6 relative";

    round.matches.forEach((match) => {
      const matchCard = createMatchCard(match, roundIndex);
      matchesList.appendChild(matchCard);
    });

    col.appendChild(matchesList);
    container.appendChild(col);
  });

  if (window.lucide) lucide.createIcons();
}

/**
 * Cria o card da partida exatamente com a identidade visual do print 1
 */
function createMatchCard(match, roundIndex) {
  const wrapper = document.createElement("div");
  wrapper.className = "relative flex items-center";

  // Número da partida à esquerda do bloco (ex: 1, 2, 3...)
  const matchNumBadge = document.createElement("span");
  matchNumBadge.className = "text-slate-400 font-mono text-xs font-semibold mr-2.5 w-4 text-right select-none";
  matchNumBadge.textContent = match.matchNum;
  wrapper.appendChild(matchNumBadge);

  // Bloco dos dois lutadores
  const card = document.createElement("div");
  card.className = "flex-1 bg-[#2b303c] border border-slate-700/90 rounded-lg overflow-hidden shadow-lg transition-all duration-200 relative";
  
  if (isAdminLoggedIn) {
    card.classList.add("hover:border-cyan-400/80", "hover:shadow-cyan-900/20");
  }

  // Slot 1 (Jogador 1)
  const slot1 = createPlayerSlot(match, match.p1, 1);
  // Linha divisória sutil
  const divider = document.createElement("div");
  divider.className = "h-[1px] bg-slate-700/60 w-full";
  // Slot 2 (Jogador 2)
  const slot2 = createPlayerSlot(match, match.p2, 2);

  card.appendChild(slot1);
  card.appendChild(divider);
  card.appendChild(slot2);
  wrapper.appendChild(card);

  // Botão de GM para abrir modal de placar
  if (isAdminLoggedIn && match.p1 && match.p2) {
    const editBtn = document.createElement("button");
    editBtn.className = "absolute -top-2.5 -right-2 bg-slate-800 hover:bg-cyan-600 text-slate-300 hover:text-white p-1 rounded-full border border-slate-600 shadow transition";
    editBtn.title = "Gerenciar Placar / Vencedor";
    editBtn.innerHTML = '<i data-lucide="edit-3" class="w-3 h-3"></i>';
    editBtn.onclick = (e) => {
      e.stopPropagation();
      openMatchModal(match);
    };
    wrapper.appendChild(editBtn);
  }

  return wrapper;
}

function createPlayerSlot(match, player, slotNumber) {
  const slot = document.createElement("div");
  slot.className = "flex items-center justify-between px-3 py-2 text-sm transition select-none min-h-[38px]";

  const isWinner = match.winner && match.winner.name === (player ? player.name : null);
  const isLoser = match.winner && player && match.winner.name !== player.name;

  if (isWinner) {
    slot.className += " bg-emerald-950/40 text-emerald-300 font-bold border-l-4 border-emerald-500";
  } else if (isLoser) {
    slot.className += " opacity-40 text-slate-400 line-through";
  } else {
    slot.className += " text-slate-200";
  }

  if (isAdminLoggedIn && player && !match.winner) {
    slot.className += " cursor-pointer hover:bg-cyan-950/40 hover:text-cyan-200";
    slot.title = `Clique para declarar ${player.name} vencedor!`;
    slot.onclick = () => {
      quickSelectWinner(match, player);
    };
  }

  // Lado Esquerdo: Seed e Nome
  const leftSide = document.createElement("div");
  leftSide.className = "flex items-center gap-2.5 truncate min-w-0 flex-1";

  const seedBadge = document.createElement("span");
  seedBadge.className = "w-5 h-5 flex-shrink-0 flex items-center justify-center text-xs font-mono font-bold rounded bg-[#1e232a] text-slate-400";
  seedBadge.textContent = player && player.seed ? player.seed : "-";

  const nameBox = document.createElement("div");
  nameBox.className = "truncate flex flex-col justify-center min-w-0 flex-1 py-0.5";

  const titleSpan = document.createElement("span");
  titleSpan.className = "truncate font-semibold text-xs text-white";
  titleSpan.textContent = player ? player.name : "Aguardando...";
  nameBox.appendChild(titleSpan);

  if (player && player.members && player.members.length > 0 && currentTournament && currentTournament.teamSize > 1) {
    const membersSpan = document.createElement("span");
    membersSpan.className = "truncate text-[10px] text-cyan-300 font-mono";
    membersSpan.textContent = player.members.join(" • ");
    membersSpan.title = player.members.join(", ");
    nameBox.appendChild(membersSpan);
  }

  leftSide.appendChild(seedBadge);
  leftSide.appendChild(nameBox);
  slot.appendChild(leftSide);

  // Lado Direito: Placar ou Ícone de Vitória
  const rightSide = document.createElement("div");
  rightSide.className = "flex items-center gap-1.5 ml-2";

  if (isWinner) {
    const trophy = document.createElement("span");
    trophy.className = "text-amber-400 text-xs font-bold";
    trophy.innerHTML = "★";
    rightSide.appendChild(trophy);
  }

  if (player && player.score !== undefined && player.score > 0) {
    const scoreSpan = document.createElement("span");
    scoreSpan.className = "font-mono text-xs font-bold text-cyan-400 bg-slate-900/60 px-1.5 py-0.5 rounded";
    scoreSpan.textContent = player.score;
    rightSide.appendChild(scoreSpan);
  }

  slot.appendChild(rightSide);
  return slot;
}

// ================= LÓGICA DE AVANÇO DE FASE / VENCEDORES =================

function quickSelectWinner(match, player) {
  if (!isAdminLoggedIn) return;
  setMatchWinner(match, player);
}

function setMatchWinner(match, winnerPlayer) {
  match.winner = winnerPlayer;

  const isFinalRound = currentTournament && currentTournament.rounds && match.roundIdx === currentTournament.rounds.length - 1;

  // Se tiver partida seguinte vinculada, propaga o vencedor
  if (match.targetMatchId) {
    const targetMatch = findMatchById(match.targetMatchId);
    if (targetMatch) {
      if (match.targetSlot === 1) {
        targetMatch.p1 = { ...winnerPlayer, score: 0 };
      } else {
        targetMatch.p2 = { ...winnerPlayer, score: 0 };
      }
    }
  } else if (isFinalRound) {
    // SÓ COROA O CAMPEÃO SE FOR DE FATO A ÚLTIMA FASE (GRANDE FINAL)!
    currentTournament.champion = winnerPlayer;
    triggerConfetti();

    // Salvar automaticamente no Histórico / Hall da Fama Oficial
    saveTournamentToHistory(currentTournament, match);
  }

  saveTournamentData();
  renderBracket();
}

function findMatchById(id) {
  for (const r of currentTournament.rounds) {
    for (const m of r.matches) {
      if (m.id === id) return m;
    }
  }
  return null;
}

// ================= MODAL DE PLACAR DA PARTIDA =================

function openMatchModal(match) {
  activeModalMatch = match;

  const round = currentTournament.rounds[match.roundIdx];
  document.getElementById("modalMatchRoundName").textContent = `${round.name} • Luta ${match.matchNum}`;

  // Player 1
  document.getElementById("modalP1Seed").textContent = match.p1 ? match.p1.seed : "-";
  document.getElementById("modalP1Name").textContent = match.p1 ? match.p1.name : "Aguardando";
  document.getElementById("modalP1Score").value = match.p1 ? match.p1.score || 0 : 0;

  // Player 2
  document.getElementById("modalP2Seed").textContent = match.p2 ? match.p2.seed : "-";
  document.getElementById("modalP2Name").textContent = match.p2 ? match.p2.name : "Aguardando";
  document.getElementById("modalP2Score").value = match.p2 ? match.p2.score || 0 : 0;

  document.getElementById("matchModal").style.display = "flex";
}

function closeMatchModal() {
  document.getElementById("matchModal").style.display = "none";
  activeModalMatch = null;
}

function selectWinner(slotNum) {
  if (!activeModalMatch) return;
  const winner = slotNum === 1 ? activeModalMatch.p1 : activeModalMatch.p2;
  if (!winner) return;

  saveMatchScores();
  setMatchWinner(activeModalMatch, winner);
  closeMatchModal();
}

function saveMatchScores() {
  if (!activeModalMatch) return;
  const s1 = parseInt(document.getElementById("modalP1Score").value) || 0;
  const s2 = parseInt(document.getElementById("modalP2Score").value) || 0;

  if (activeModalMatch.p1) activeModalMatch.p1.score = s1;
  if (activeModalMatch.p2) activeModalMatch.p2.score = s2;

  saveTournamentData();
  renderBracket();
  closeMatchModal();
}

function resetCurrentMatchWinner() {
  if (!activeModalMatch) return;
  resetMatchRecursive(activeModalMatch);
  saveTournamentData();
  renderBracket();
  closeMatchModal();
}

function resetMatchRecursive(match) {
  match.winner = null;
  if (match.p1) match.p1.score = 0;
  if (match.p2) match.p2.score = 0;

  // Se for final, desfaz o campeão
  if (!match.targetMatchId && currentTournament.champion) {
    currentTournament.champion = null;
  }

  // Limpar avanço na próxima fase
  if (match.targetMatchId) {
    const targetMatch = findMatchById(match.targetMatchId);
    if (targetMatch) {
      if (match.targetSlot === 1) targetMatch.p1 = null;
      else targetMatch.p2 = null;
      resetMatchRecursive(targetMatch);
    }
  }
}

// ================= MODAL NOVO TORNEIO =================

function openNewTournamentModal() {
  if (!isAdminLoggedIn) {
    openLoginModal();
    return;
  }
  setTeamSize(currentTeamSize || 1);
  setPlayerCount(currentSelectedCount || 8);
  switchInputMode("paste");
  updatePlayerListStatusBadge();
  document.getElementById("newTournamentModal").style.display = "flex";
}

function closeNewTournamentModal() {
  document.getElementById("newTournamentModal").style.display = "none";
}

function openQuickAddModal() {
  openNewTournamentModal();
}

function handleCreateTournament(event) {
  event.preventDefault();
  const title = document.getElementById("tournamentTitleInput").value.trim() || "Torneio PvP Oriental";
  let rawNames = getEnteredPlayerNames();
  const mode = document.getElementById("drawModeSelect").value;

  if (rawNames.length < 2) {
    alert("Insira ao menos 2 participantes para gerar o evento!");
    return;
  }

  let teamsList = [];

  if (currentTeamSize === 1) {
    // 1x1 Individual
    if (rawNames.length < currentSelectedCount) {
      const faltam = currentSelectedCount - rawNames.length;
      if (confirm(`Você escolheu ${currentSelectedCount} vagas, mas inseriu ${rawNames.length} nomes.\n\nDeseja preencher as ${faltam} vagas restantes automaticamente (ex: Lutador ${rawNames.length + 1})?`)) {
        while (rawNames.length < currentSelectedCount) {
          rawNames.push(`Lutador ${rawNames.length + 1}`);
        }
      } else {
        return;
      }
    }

    teamsList = rawNames.slice(0, currentSelectedCount).map((name) => ({
      name: name,
      members: [name]
    }));
  } else {
    // Modalidade por Equipes: 2x2 a 8x8
    if (teamFormingMode === "random_teams") {
      const totalPlayersNeeded = currentSelectedCount * currentTeamSize;
      if (rawNames.length < totalPlayersNeeded) {
        const faltam = totalPlayersNeeded - rawNames.length;
        if (confirm(`Para formar ${currentSelectedCount} equipes no formato ${currentTeamSize}x${currentTeamSize}, são necessários ${totalPlayersNeeded} jogadores individuais, mas você inseriu ${rawNames.length}.\n\nDeseja preencher os ${faltam} jogadores restantes automaticamente (ex: Jogador ${rawNames.length + 1})?`)) {
          while (rawNames.length < totalPlayersNeeded) {
            rawNames.push(`Jogador ${rawNames.length + 1}`);
          }
        } else {
          return;
        }
      }

      // Sorteio dos integrantes dos times:
      // Embaralha TODOS os jogadores individuais aleatoriamente
      let pool = [...rawNames];
      pool.sort(() => Math.random() - 0.5);

      for (let i = 0; i < currentSelectedCount; i++) {
        const members = pool.slice(i * currentTeamSize, (i + 1) * currentTeamSize);
        teamsList.push({
          name: `Equipe ${i + 1}`,
          members: members
        });
      }
    } else {
      // Times já formados (cada linha é uma equipe pronta)
      if (rawNames.length < currentSelectedCount) {
        while (rawNames.length < currentSelectedCount) {
          rawNames.push(`Equipe ${rawNames.length + 1}`);
        }
      }
      teamsList = rawNames.slice(0, currentSelectedCount).map((teamName) => ({
        name: teamName,
        members: []
      }));
    }
  }

  buildTournamentStructure(title, teamsList, mode, currentTeamSize);
  closeNewTournamentModal();
}

// ================= EXPORTAR IMAGEM & FULLSCREEN =================

function exportBracketImage() {
  const element = document.getElementById("bracketCaptureArea");
  const btn = document.getElementById("btnExportImage");
  const originalHTML = btn.innerHTML;

  btn.innerHTML = '<span class="animate-spin">⏳</span> Gerando PNG...';
  btn.disabled = true;

  html2canvas(element, {
    backgroundColor: "#0d1117",
    scale: 2,
    logging: false,
    useCORS: true
  }).then(canvas => {
    const link = document.createElement("a");
    const safeTitle = (currentTournament ? currentTournament.title : "chaveamento")
      .toLowerCase()
      .replace(/\s+/g, "-");
    link.download = `eventos-oriental-${safeTitle}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();

    btn.innerHTML = originalHTML;
    btn.disabled = false;
    if (window.lucide) lucide.createIcons();
  }).catch(err => {
    console.error("Erro ao exportar imagem:", err);
    alert("Não foi possível gerar a imagem. Tente novamente.");
    btn.innerHTML = originalHTML;
    btn.disabled = false;
    if (window.lucide) lucide.createIcons();
  });
}

function toggleFullScreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(err => {
      console.log(err);
    });
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }
}

function triggerConfetti() {
  if (typeof confetti === "function") {
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 }
    });
    setTimeout(() => {
      confetti({
        particleCount: 80,
        angle: 60,
        spread: 55,
        origin: { x: 0 }
      });
      confetti({
        particleCount: 80,
        angle: 120,
        spread: 55,
        origin: { x: 1 }
      });
    }, 250);
  }
}

// ================= HISTÓRICO OFICIAL DE TORNEIOS (HALL DA FAMA) =================

const HISTORY_STORAGE_KEY = "oriental_tournaments_history_v1";

function getTournamentsHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Erro ao carregar histórico:", e);
    return [];
  }
}

function updateHistoryBadge() {
  const badge = document.getElementById("historyCountBadge");
  const clearBtn = document.getElementById("btnClearAllHistoryBtn");
  if (!badge) return;

  const history = getTournamentsHistory();
  if (history.length > 0) {
    badge.textContent = history.length;
    badge.classList.remove("hidden");
  } else {
    badge.classList.add("hidden");
  }

  if (clearBtn) {
    if (isAdminLoggedIn && history.length > 0) {
      clearBtn.classList.remove("hidden");
    } else {
      clearBtn.classList.add("hidden");
    }
  }
}

function saveTournamentToHistory(tournament, finalMatch) {
  if (!tournament || !tournament.champion) return;

  const history = getTournamentsHistory();
  const id = tournament.id || ("torneio_" + Date.now());
  tournament.id = id;

  // Localizar o vice-campeão da final
  let runnerUp = null;
  if (finalMatch) {
    if (finalMatch.p1 && tournament.champion.name === finalMatch.p1.name) {
      runnerUp = finalMatch.p2;
    } else if (finalMatch.p2 && tournament.champion.name === finalMatch.p2.name) {
      runnerUp = finalMatch.p1;
    }
  }

  // Prepara o registro histórico
  const entry = {
    id: id,
    title: tournament.title || "Torneio PvP Oriental",
    date: tournament.date || new Date().toLocaleDateString("pt-BR"),
    timestamp: Date.now(),
    teamSize: tournament.teamSize || 1,
    participantsCount: tournament.participantsCount,
    champion: tournament.champion,
    runnerUp: runnerUp,
    rounds: JSON.parse(JSON.stringify(tournament.rounds))
  };

  // Evita duplicatas substituindo caso já exista o mesmo ID
  const existingIndex = history.findIndex(h => h.id === id);
  if (existingIndex >= 0) {
    history[existingIndex] = entry;
  } else {
    history.unshift(entry); // Adiciona no início (mais recente primeiro)
  }

  localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
  updateHistoryBadge();
}

function openHistoryModal() {
  const modal = document.getElementById("historyModal");
  const container = document.getElementById("historyListContainer");
  const history = getTournamentsHistory();

  container.innerHTML = "";

  if (history.length === 0) {
    container.innerHTML = `
      <div class="text-center py-12 px-4 bg-[#12161f] rounded-xl border border-pw-border/60">
        <div class="w-16 h-16 mx-auto rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3">
          <i data-lucide="award" class="w-8 h-8"></i>
        </div>
        <h4 class="text-base font-bold text-white mb-1">Nenhum Torneio Arquivado</h4>
        <p class="text-xs text-slate-400 max-w-sm mx-auto">
          Assim que um torneio for disputado e o campeão for coroado na Grande Final, o histórico do evento e o chaveamento completo serão salvos automaticamente aqui!
        </p>
      </div>
    `;
  } else {
    history.forEach((t, index) => {
      const card = document.createElement("div");
      card.className = "p-4 bg-[#141923] border border-slate-700/80 hover:border-amber-500/60 rounded-xl transition shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4";

      const modeText = t.teamSize > 1 ? `${t.teamSize}x${t.teamSize} (Equipes)` : "1x1 Individual";

      let champMembers = "";
      if (t.champion && t.champion.members && t.champion.members.length > 1) {
        champMembers = `<span class="text-[11px] text-cyan-300 font-mono block mt-0.5">${t.champion.members.join(" • ")}</span>`;
      }

      let runnerUpDisplay = "";
      if (t.runnerUp) {
        let runnerMembers = "";
        if (t.runnerUp.members && t.runnerUp.members.length > 1) {
          runnerMembers = ` (${t.runnerUp.members.join(", ")})`;
        }
        runnerUpDisplay = `
          <div class="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
            <span class="text-slate-300 font-semibold">🥈 Vice:</span>
            <span class="text-slate-200">${t.runnerUp.name}${runnerMembers}</span>
          </div>
        `;
      }

      card.innerHTML = `
        <div class="flex-1 min-w-0">
          <div class="flex flex-wrap items-center gap-2 mb-1.5">
            <h4 class="text-base font-bold text-white truncate">${t.title}</h4>
            <span class="px-2 py-0.5 text-[10px] font-bold rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800">
              ${modeText}
            </span>
            <span class="text-[11px] text-slate-400 font-mono">
              📅 ${t.date}
            </span>
          </div>

          <!-- Campeão -->
          <div class="flex items-start gap-2 bg-[#1a212d] p-2.5 rounded-lg border border-amber-500/30">
            <span class="text-lg">🏆</span>
            <div>
              <div class="text-[10px] font-bold uppercase tracking-wider text-amber-400">Grande Campeão</div>
              <div class="text-sm font-extrabold text-amber-300">${t.champion ? t.champion.name : "N/D"}</div>
              ${champMembers}
            </div>
          </div>

          ${runnerUpDisplay}
        </div>

        <!-- Ações -->
        <div class="flex items-center gap-2 w-full md:w-auto justify-end pt-2 md:pt-0 border-t md:border-t-0 border-slate-800">
          <button onclick="viewHistoricalTournament('${t.id}')" class="px-3.5 py-2 text-xs font-bold bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-black rounded-lg shadow-md transition flex items-center gap-1.5">
            <i data-lucide="eye" class="w-3.5 h-3.5"></i>
            <span>Ver Chaveamento</span>
          </button>

          ${isAdminLoggedIn ? `
            <button onclick="deleteHistoricalTournament('${t.id}')" title="Excluir este registro" class="p-2 text-rose-400 hover:text-white bg-rose-950/40 hover:bg-rose-900 border border-rose-900/60 rounded-lg transition">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          ` : ''}
        </div>
      `;

      container.appendChild(card);
    });
  }

  updateHistoryBadge();
  modal.style.display = "flex";
  if (window.lucide) lucide.createIcons();
}

function closeHistoryModal() {
  document.getElementById("historyModal").style.display = "none";
}

function viewHistoricalTournament(historyId) {
  const history = getTournamentsHistory();
  const target = history.find(h => h.id === historyId);
  if (!target) return;

  // Se não estiver vendo histórico, salva o torneio ao vivo atual na memória
  if (!isViewingHistory) {
    savedActiveTournament = currentTournament ? JSON.parse(JSON.stringify(currentTournament)) : null;
  }

  isViewingHistory = true;
  currentTournament = JSON.parse(JSON.stringify(target));

  // Exibe o banner de aviso
  const banner = document.getElementById("viewingHistoryBanner");
  const titleSpan = document.getElementById("viewingHistoryTitle");
  if (banner && titleSpan) {
    titleSpan.textContent = `"${target.title}" (Realizado em ${target.date})`;
    banner.classList.remove("hidden");
  }

  closeHistoryModal();
  renderBracket();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function returnToLiveTournament() {
  isViewingHistory = false;
  currentTournament = savedActiveTournament;
  savedActiveTournament = null;

  const banner = document.getElementById("viewingHistoryBanner");
  if (banner) banner.classList.add("hidden");

  renderBracket();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function deleteHistoricalTournament(historyId) {
  if (!isAdminLoggedIn) return;
  if (!confirm("Tem certeza que deseja excluir este torneio do histórico?")) return;

  let history = getTournamentsHistory();
  history = history.filter(h => h.id !== historyId);
  localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));

  openHistoryModal(); // Atualiza a lista na tela
}

function confirmClearAllHistory() {
  if (!isAdminLoggedIn) return;
  if (!confirm("Tem certeza que deseja apagar TODO o histórico de torneios do servidor? Esta ação não pode ser desfeita.")) return;

  localStorage.removeItem(HISTORY_STORAGE_KEY);
  openHistoryModal();
}
