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

function loadTournamentData() {
  const saved = localStorage.getItem("oriental_tournament_data");
  if (saved) {
    try {
      currentTournament = JSON.parse(saved);
      renderBracket();
      return;
    } catch (e) {
      console.error("Erro ao ler localStorage:", e);
    }
  }

  // Estado inicial limpo: nenhum torneio fictício
  currentTournament = null;
  renderBracket();
}

function confirmClearTournament() {
  if (!isAdminLoggedIn) return;
  if (confirm("Tem certeza que deseja apagar o chaveamento atual e iniciar do zero?")) {
    currentTournament = null;
    localStorage.removeItem("oriental_tournament_data");
    renderBracket();
  }
}

// ================= GERENCIAMENTO DE SORTEIO & QUANTIDADE =================

let currentSelectedCount = 10;
let currentInputMode = "paste";

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

  // Potência de 2
  let power = 2;
  while (power < n) {
    power *= 2;
  }

  if (n === power) {
    if (n === 4) hintEl.textContent = "Semi-Finais (2 lutas) ➔ Grande Final";
    else if (n === 8) hintEl.textContent = "Quartas (4 lutas) ➔ Semi (2 lutas) ➔ Final";
    else if (n === 16) hintEl.textContent = "Oitavas (8 lutas) ➔ Quartas ➔ Semi ➔ Final";
    else if (n === 32) hintEl.textContent = "16 Avos (16 lutas) ➔ Oitavas ➔ Quartas ➔ Semi ➔ Final";
    else hintEl.textContent = `${n} lutadores em chaveamento direto perfeito!`;
  } else {
    const targetPlayersInMain = power / 2;
    const prelimMatches = n - targetPlayersInMain;
    let nextStageName = targetPlayersInMain === 8 ? "Quartas" : (targetPlayersInMain === 4 ? "Semi" : "Oitavas");
    hintEl.textContent = `Fase 1 com ${prelimMatches} ${prelimMatches === 1 ? 'preliminar' : 'preliminares'} ➔ ${nextStageName} ➔ Final`;
  }
}

function updatePlayerListStatusBadge() {
  const badge = document.getElementById("playerListStatusBadge");
  if (!badge) return;

  const currentNames = getEnteredPlayerNames();
  const filled = currentNames.length;
  badge.textContent = `${filled} de ${currentSelectedCount} preenchidos`;

  if (filled === currentSelectedCount) {
    badge.className = "text-xs font-mono text-emerald-400 font-bold";
  } else if (filled > currentSelectedCount) {
    badge.className = "text-xs font-mono text-amber-400 font-bold";
  } else {
    badge.className = "text-xs font-mono text-cyan-400 font-bold";
  }
}

function onPlayerListTextInput() {
  const text = document.getElementById("playerListInput").value;
  const lines = text.split("\n").filter(l => l.trim().length > 0);
  
  // Se o usuário colou mais nomes do que o selecionado, expande a contagem automaticamente
  if (lines.length > currentSelectedCount) {
    setPlayerCount(lines.length);
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

  for (let i = 0; i < currentSelectedCount; i++) {
    const val = currentNames[i] || "";
    const row = document.createElement("div");
    row.className = "flex items-center gap-2";

    const badge = document.createElement("span");
    badge.className = "w-6 h-6 rounded bg-[#1e232a] text-cyan-400 font-mono font-bold text-xs flex items-center justify-center border border-slate-700/60";
    badge.textContent = i + 1;

    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = `Nome do Lutador ${i + 1}`;
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
  while (currentNames.length < currentSelectedCount) {
    currentNames.push(`Lutador ${currentNames.length + 1}`);
  }
  document.getElementById("playerListInput").value = currentNames.slice(0, currentSelectedCount).join("\n");
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
    localStorage.setItem("oriental_tournament_data", JSON.stringify(currentTournament));
  }
}

/**
 * Cria a estrutura de fases e partidas do torneio para QUALQUER quantidade de participantes
 */
function buildTournamentStructure(title, playerNames, mode = "random") {
  let list = [...playerNames].filter(n => n.trim() !== "");
  if (list.length < 2) return;

  if (mode === "random") {
    // Embaralha para o sorteio oficial
    list.sort(() => Math.random() - 0.5);
  }

  const participants = list.map((name, idx) => ({
    seed: idx + 1,
    name: name.trim()
  }));

  const count = participants.length;
  const rounds = generateUniversalBracket(participants);

  currentTournament = {
    title: title || "Torneio PvP Oriental",
    date: new Date().toLocaleDateString("pt-BR"),
    participantsCount: count,
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
  } else {
    // Caso com fase preliminar
    return generateCustomPrelimBracket(participants, power);
  }

  return rounds;
}

function generateCustomPrelimBracket(participants, power) {
  // Número de lutadores na rodada principal seguinte à preliminar
  const targetPlayersInMain = power / 2; // Ex: para N=6 -> 4; para N=10 -> 8; para N=12 -> 8
  const prelimMatchesCount = participants.length - targetPlayersInMain;
  const round1Matches = [];
  let matchId = 1;

  // Jogadores que jogam a preliminar (as seeds mais baixas)
  const byeCount = participants.length - (prelimMatchesCount * 2);
  const byePlayers = participants.slice(0, byeCount);
  const prelimPlayers = participants.slice(byeCount);

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

  // Rodada Principal seguinte (Quartas, Semi ou oitavas)
  const numMatchesInMain = targetPlayersInMain / 2; // Ex: para 4 players -> 2 lutas; para 8 players -> 4 lutas
  const mainRoundMatches = [];

  // Distribuição equilibrada de byes e preliminares
  let byeIdx = 0;
  let prelimIdx = 0;

  for (let i = 0; i < numMatchesInMain; i++) {
    const p1 = byeIdx < byePlayers.length ? { ...byePlayers[byeIdx++], score: 0 } : null;
    let p2 = null;

    if (byeIdx < byePlayers.length) {
      p2 = { ...byePlayers[byeIdx++], score: 0 };
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

  // Vincular os vencedores das preliminares aos slots vazios da rodada principal
  let emptySlotMatches = mainRoundMatches.filter(m => m.p2 === null);
  round1Matches.forEach((pm, idx) => {
    if (emptySlotMatches[idx]) {
      pm.targetMatchId = emptySlotMatches[idx].id;
      pm.targetSlot = 2;
    }
  });

  let mainRoundName = "Fase 2";
  if (numMatchesInMain === 4) mainRoundName = "Quartas de Final";
  if (numMatchesInMain === 2) mainRoundName = "Semi-Finais";
  if (numMatchesInMain === 1) mainRoundName = "Finais";
  rounds.push({ name: mainRoundName, matches: mainRoundMatches });

  // Restante das fases até a final
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
  document.getElementById("displayTournamentMeta").textContent = 
    `${currentTournament.participantsCount} Participantes • ${currentTournament.rounds.length} Fases • Eliminatória Simples`;
  document.getElementById("tournamentDateLabel").textContent = `Data: ${currentTournament.date}`;

  // Campeão
  const champName = document.getElementById("championName");
  if (currentTournament.champion) {
    champName.textContent = currentTournament.champion.name;
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
  leftSide.className = "flex items-center gap-2.5 truncate";

  const seedBadge = document.createElement("span");
  seedBadge.className = "w-5 h-5 flex items-center justify-center text-xs font-mono font-bold rounded bg-[#1e232a] text-slate-400";
  seedBadge.textContent = player && player.seed ? player.seed : "-";

  const nameSpan = document.createElement("span");
  nameSpan.className = "truncate font-medium";
  nameSpan.textContent = player ? player.name : "Aguardando...";

  leftSide.appendChild(seedBadge);
  leftSide.appendChild(nameSpan);
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
  } else {
    // Se não há targetMatchId, esta foi a GRANDE FINAL!
    currentTournament.champion = winnerPlayer;
    triggerConfetti();
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
  setPlayerCount(currentSelectedCount || 10);
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
  let list = getEnteredPlayerNames();
  const mode = document.getElementById("drawModeSelect").value;

  if (list.length < 2) {
    alert("Insira ao menos 2 participantes para gerar os confrontos!");
    return;
  }

  // Se faltam nomes para a quantidade escolhida, completa automaticamente para o GM
  if (list.length < currentSelectedCount) {
    const faltam = currentSelectedCount - list.length;
    if (confirm(`Você escolheu ${currentSelectedCount} vagas, mas inseriu ${list.length} nomes.\n\nDeseja preencher as ${faltam} vagas restantes automaticamente (ex: Lutador ${list.length + 1})?`)) {
      while (list.length < currentSelectedCount) {
        list.push(`Lutador ${list.length + 1}`);
      }
    }
  }

  buildTournamentStructure(title, list, mode);
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
