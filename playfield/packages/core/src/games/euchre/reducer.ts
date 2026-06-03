import { shuffle, createEuchreDeck, removeCard, effectiveSuit } from './cards';
import {
  DEFAULT_EUCHRE_AI_DIFFICULTY,
  normalizeEuchreAIDifficulty,
} from './aiDifficulty';
import { CARDS_PER_HAND, PLAYER_COUNT, WINNING_SCORE, SUIT_SYMBOL } from './constants';
import {
  leftOfDealer,
  firstLeader,
  nextActivePlayer,
  nextDealer,
  nextPlayer,
  playerTeam,
  scoreHand,
  trickSizeForState,
} from './teams';
import { getLegalPlays, trickWinner, validatePlay } from './trickPlay';
import type {
  BidAction,
  Card,
  GameAction,
  GameLogEntry,
  GameState,
  Player,
  SeatConfig,
  Suit,
  TeamId,
} from './types';
import { generateName } from '../../utils/nameGenerator';
import {
  DEFAULT_HUMAN_NAME,
  displayPlayerName,
  sanitizePlayerName,
} from '../../utils/playerName';
import {
  createLogEntry,
  pushLog,
  resetLogCounter,
} from './gameLog';

function log(message: string, type: GameLogEntry['type'] = 'info'): GameLogEntry {
  return createLogEntry(message, type);
}

function appendLog(state: GameState, entry: GameLogEntry): GameState {
  return pushLog(state, entry);
}

function playerName(state: GameState, id: number): string {
  return displayPlayerName(state.players[id]);
}

function teamLabel(team: TeamId): string {
  return team === 0 ? 'You & partner' : 'Opponents';
}

function dealNewHand(state: GameState): GameState {
  const deck = shuffle(createEuchreDeck());
  const hands: Card[][] = [[], [], [], []];
  let idx = 0;
  for (let round = 0; round < CARDS_PER_HAND; round += 1) {
    for (let p = 0; p < PLAYER_COUNT; p += 1) {
      hands[p].push(deck[idx++]);
    }
  }
  const turnedCard = deck[idx];
  const players = state.players.map((p, i) => ({ ...p, cards: hands[i] }));
  const starter = leftOfDealer(state.dealerId);
  return appendLog(
    {
      ...state,
      players,
      trump: null,
      turnedCard,
      biddingRound: 1,
      passesThisRound: 0,
      makerTeam: null,
      trumpCallerId: null,
      trumpCallKind: null,
      goAlone: false,
      lonerId: null,
      currentTrick: [],
      leadSuit: null,
      tricksWon: { 0: 0, 1: 0 },
      phase: 'bidding',
      currentPlayer: starter,
      handSummary: null,
    },
    log(
      `Hand ${state.roundNumber} — ${playerName({ ...state, players }, state.dealerId)} deals. Turned: ${turnedCard.value}${SUIT_SYMBOL[turnedCard.suit]}`,
      'info'
    )
  );
}

function startGame(seats: SeatConfig[], aiDifficulty = DEFAULT_EUCHRE_AI_DIFFICULTY): GameState {
  resetLogCounter();
  const players: Player[] = seats.map((seat, i) => ({
    id: i,
    name: seat.isHuman
      ? sanitizePlayerName(seat.name || DEFAULT_HUMAN_NAME)
      : seat.name || generateName(),
    isHuman: seat.isHuman,
    cards: [],
    team: playerTeam(i),
  }));
  const soloHuman = seats.filter((s) => s.isHuman).length === 1;
  const opening = [log('First team to 10 wins. You partner with seat 3.', 'info')];
  let state: GameState = {
    players,
    dealerId: 0,
    currentPlayer: 0,
    phase: 'setup',
    trump: null,
    turnedCard: null,
    biddingRound: 1,
    passesThisRound: 0,
    makerTeam: null,
    trumpCallerId: null,
    trumpCallKind: null,
    goAlone: false,
    lonerId: null,
    currentTrick: [],
    leadSuit: null,
    tricksWon: { 0: 0, 1: 0 },
    score: { 0: 0, 1: 0 },
    roundNumber: 1,
    log: opening,
    sessionStartedAt: Date.now(),
    sessionLog: [...opening],
    sessionLogDroppedCount: 0,
    soundEnabled: true,
    isSoloSession: soloHuman,
    aiDifficulty: normalizeEuchreAIDifficulty(aiDifficulty),
    handSummary: null,
  };
  state = dealNewHand(state);
  return state;
}

function allPassedRound(state: GameState): boolean {
  return state.passesThisRound >= PLAYER_COUNT;
}

function beginRound2(state: GameState): GameState {
  return appendLog(
    {
      ...state,
      phase: 'biddingRound2',
      biddingRound: 2,
      passesThisRound: 0,
      currentPlayer: leftOfDealer(state.dealerId),
    },
    log('All passed — name trump or pass again', 'info')
  );
}

function redeal(state: GameState): GameState {
  const dealerId = nextDealer(state.dealerId);
  return dealNewHand({
    ...state,
    dealerId,
    roundNumber: state.roundNumber + 1,
  });
}

function orderUp(state: GameState, callerId: number, goAlone: boolean): GameState {
  if (!state.turnedCard) return state;
  const trump = state.turnedCard.suit;
  const dealerCards = [...state.players[state.dealerId].cards, state.turnedCard];
  const alone = goAlone;
  return appendLog(
    {
      ...state,
      trump,
      makerTeam: playerTeam(callerId),
      trumpCallerId: callerId,
      trumpCallKind: 'orderUp',
      goAlone: alone,
      lonerId: alone ? callerId : null,
      players: state.players.map((p, i) =>
        i === state.dealerId ? { ...p, cards: dealerCards } : p
      ),
      turnedCard: null,
      phase: 'dealerDiscard',
      currentPlayer: state.dealerId,
    },
    log(
      alone
        ? `${playerName(state, callerId)} orders up ${SUIT_SYMBOL[trump]} — going alone`
        : `${playerName(state, callerId)} orders up ${SUIT_SYMBOL[trump]} — dealer picks up`,
      'success'
    )
  );
}

function nameTrump(
  state: GameState,
  callerId: number,
  suit: Suit,
  goAlone: boolean
): GameState {
  const alone = goAlone;
  const lonerId = alone ? callerId : null;
  return appendLog(
    {
      ...state,
      trump: suit,
      makerTeam: playerTeam(callerId),
      trumpCallerId: callerId,
      trumpCallKind: 'nameTrump',
      goAlone: alone,
      lonerId,
      phase: 'playing',
      currentPlayer: firstLeader({
        dealerId: state.dealerId,
        goAlone: alone,
        lonerId,
      }),
      leadSuit: null,
      currentTrick: [],
    },
    log(
      alone
        ? `${playerName(state, callerId)} names ${SUIT_SYMBOL[suit]} trump — going alone`
        : `${playerName(state, callerId)} names ${SUIT_SYMBOL[suit]} trump`,
      'success'
    )
  );
}

function startPlayingAfterDiscard(state: GameState): GameState {
  return {
    ...state,
    phase: 'playing',
    currentPlayer: firstLeader(state),
    leadSuit: null,
    currentTrick: [],
  };
}

function completeTrick(state: GameState): GameState {
  const needed = trickSizeForState(state);
  if (!state.trump || state.leadSuit === null || state.currentTrick.length !== needed) {
    return state;
  }
  const winnerId = trickWinner(state.currentTrick, state.trump, state.leadSuit);
  const team = playerTeam(winnerId);
  const tricksWon = { ...state.tricksWon, [team]: state.tricksWon[team] + 1 };
  let next = appendLog(
    {
      ...state,
      tricksWon,
      currentTrick: [],
      leadSuit: null,
      currentPlayer: winnerId,
    },
    log(`${playerName(state, winnerId)} wins the trick`, 'info')
  );
  if (tricksWon[0] + tricksWon[1] >= 5) {
    return finishHand(next);
  }
  return next;
}

function finishHand(state: GameState): GameState {
  if (state.makerTeam === null) return state;
  const result = scoreHand(state.makerTeam, state.tricksWon, { goAlone: state.goAlone });
  const score = {
    ...state.score,
    [result.team]: state.score[result.team] + result.points,
  };
  const summaryBase = {
    outcome: {
      scoringTeam: result.team,
      points: result.points,
      kind: result.kind,
      makerTeam: state.makerTeam,
    },
    tricksWon: { ...state.tricksWon },
    score,
  };
  const lines = [
    `${teamLabel(result.team)} +${result.points} — ${result.description}`,
    `Tricks — ${teamLabel(0)}: ${state.tricksWon[0]}, ${teamLabel(1)}: ${state.tricksWon[1]}`,
    `Score — ${teamLabel(0)}: ${score[0]}, ${teamLabel(1)}: ${score[1]}`,
  ];
  if (score[0] >= WINNING_SCORE || score[1] >= WINNING_SCORE) {
    const winTeam = (score[0] >= WINNING_SCORE ? 0 : 1) as TeamId;
    return appendLog(
      {
        ...state,
        score,
        phase: 'gameOver',
        handSummary: {
          title: 'Game over',
          lines: [...lines, `${teamLabel(winTeam)} win!`],
          ...summaryBase,
          winningTeam: winTeam,
        },
      },
      log(`${teamLabel(winTeam)} reach ${WINNING_SCORE}!`, 'success')
    );
  }
  return appendLog(
    {
      ...state,
      score,
      phase: 'handSummary',
      handSummary: { title: 'Hand complete', lines, ...summaryBase },
    },
    log(result.description, 'success')
  );
}

function handleBid(
  state: GameState,
  action: BidAction,
  suit?: Suit,
  goAlone?: boolean
): GameState {
  const player = state.players[state.currentPlayer];
  if (!player) return state;

  if (action === 'pass') {
    const passesThisRound = state.passesThisRound + 1;
    let next = appendLog(
      { ...state, passesThisRound },
      log(`${playerName(state, player.id)} passes`, 'info')
    );
    if (!allPassedRound(next)) {
      return { ...next, currentPlayer: nextActivePlayer(player.id, next) };
    }
    if (next.biddingRound === 1) {
      return beginRound2(next);
    }
    return redeal(next);
  }

  if (action === 'orderUp') {
    if (state.phase !== 'bidding' || state.biddingRound !== 1) return state;
    return orderUp(state, player.id, Boolean(goAlone));
  }

  if (action === 'nameTrump') {
    if (state.phase !== 'biddingRound2' || !suit) return state;
    return nameTrump(state, player.id, suit, Boolean(goAlone));
  }

  return state;
}

export const initialGameState: GameState = {
  players: [],
  dealerId: 0,
  currentPlayer: 0,
  phase: 'setup',
  trump: null,
  turnedCard: null,
  biddingRound: 1,
  passesThisRound: 0,
  makerTeam: null,
  trumpCallerId: null,
  trumpCallKind: null,
  goAlone: false,
  lonerId: null,
  currentTrick: [],
  leadSuit: null,
  tricksWon: { 0: 0, 1: 0 },
  score: { 0: 0, 1: 0 },
  roundNumber: 1,
  log: [],
  soundEnabled: true,
  isSoloSession: false,
  aiDifficulty: DEFAULT_EUCHRE_AI_DIFFICULTY,
  handSummary: null,
};

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START_GAME':
      if (action.seats.length !== PLAYER_COUNT) return state;
      return startGame(action.seats, action.aiDifficulty);

    case 'QUIT_GAME':
      return { ...initialGameState, soundEnabled: state.soundEnabled };

    case 'BID':
      return handleBid(state, action.action, action.suit, action.goAlone);

    case 'DEALER_DISCARD': {
      if (state.phase !== 'dealerDiscard') return state;
      if (state.currentPlayer !== state.dealerId) return state;
      const dealer = state.players[state.dealerId];
      if (!dealer.cards.some((c) => c.id === action.card.id)) return state;
      const cards = removeCard(dealer.cards, action.card);
      if (cards.length !== CARDS_PER_HAND) return state;
      const players = state.players.map((p, i) =>
        i === state.dealerId ? { ...p, cards } : p
      );
      return appendLog(
        startPlayingAfterDiscard({ ...state, players }),
        log(`${playerName(state, state.dealerId)} discards`, 'info')
      );
    }

    case 'PLAY_CARD': {
      if (state.phase !== 'playing' || !state.trump) return state;
      const player = state.players[state.currentPlayer];
      if (!player) return state;
      if (
        !validatePlay(
          player.cards,
          action.card,
          state.currentTrick,
          state.trump,
          state.leadSuit
        )
      ) {
        return state;
      }
      const leadSuit =
        state.currentTrick.length === 0
          ? effectiveSuit(action.card, state.trump)
          : state.leadSuit;
      const trick = [
        ...state.currentTrick,
        { playerId: player.id, card: action.card },
      ];
      const players = state.players.map((p, i) =>
        i === player.id ? { ...p, cards: removeCard(p.cards, action.card) } : p
      );
      let next = appendLog(
        { ...state, players, currentTrick: trick, leadSuit },
        log(
          `${playerName(state, player.id)} plays ${action.card.value}${SUIT_SYMBOL[action.card.suit]}`,
          'info'
        )
      );
      const needed = trickSizeForState(state);
      if (trick.length < needed) {
        return { ...next, currentPlayer: nextActivePlayer(player.id, next) };
      }
      return completeTrick(next);
    }

    case 'DISMISS_HAND_SUMMARY': {
      if (state.phase === 'gameOver') {
        return { ...initialGameState, soundEnabled: state.soundEnabled };
      }
      if (state.phase !== 'handSummary') return state;
      const dealerId = nextDealer(state.dealerId);
      return dealNewHand({
        ...state,
        dealerId,
        roundNumber: state.roundNumber + 1,
      });
    }

    case 'REORDER_CARDS': {
      const player = state.players.find((p) => p.id === action.playerId);
      if (!player || !player.isHuman) return state;
      if (action.cards.length !== player.cards.length) return state;
      const ids = new Set(player.cards.map((c) => c.id));
      if (!action.cards.every((c) => ids.has(c.id))) return state;
      return {
        ...state,
        players: state.players.map((p) =>
          p.id === action.playerId ? { ...p, cards: action.cards } : p
        ),
      };
    }

    case 'TOGGLE_SOUND':
      return { ...state, soundEnabled: !state.soundEnabled };

    default:
      return state;
  }
}
