import React, { useEffect, useMemo, useState } from 'react';
import cardData from '../data/cards.json';

interface DeckEditorProps {
  onBack: () => void;
}

type CardType = 'UNIT' | 'SPELL' | 'SPELL_INSTANT' | 'TERRITORY';

interface RawCard {
  id: string;
  name: string;
  type: CardType;
  cost: number;
  stats?: { atk: number };
  bp?: number;
  keywords?: string[];
  description: string;
  image: string;
}

interface CardDef {
  id: string;
  name: string;
  type: CardType;
  cost: number;
  bp?: number;
  keywords?: string[];
  description: string;
  image: string;
}

interface Deck {
  id: string;
  name: string;
  cards: Record<string, number>;
  territories: string[];
}

const MAX_DECK_SIZE = 40;
const MAX_COPIES = 4;
const STORAGE_KEY = 'aether-nexus-decks';

const createDeck = (id: string, name: string, cardIds: string[]): Deck => {
  const cards: Record<string, number> = {};
  cardIds.forEach((cardId) => {
    cards[cardId] = MAX_COPIES;
  });
  return { id, name, cards, territories: ['t001', 't002', 't003'] };
};

const TEMPLATE_DECKS: Deck[] = [
  createDeck('deck-sanctum', 'Sanctum Rampart', [
    'sc001', 'sc002', 'sc003', 'sc004', 'sc005',
    'sc006', 'sc007', 'sc008', 'sc009', 'sc010'
  ]),
  createDeck('deck-verdant', 'Verdant Wilds', [
    've001', 've002', 've003', 've004', 've005',
    've006', 've007', 've008', 've009', 've010'
  ]),
  createDeck('deck-arcane', 'Arcane Circuit', [
    'ar001', 'ar002', 'ar003', 'ar004', 'ar005',
    'ar006', 'ar007', 'ar008', 'ar009', 'ar010'
  ]),
  createDeck('deck-nightmare', 'Nightmare Veil', [
    'nm001', 'nm002', 'nm003', 'nm004', 'nm005',
    'nm006', 'nm007', 'nm008', 'nm009', 'nm010'
  ])
];

const normalizeCards = (raw: RawCard[]): CardDef[] =>
  raw.map((card) => ({
    id: card.id,
    name: card.name,
    type: card.type,
    cost: card.cost,
    bp: card.bp ?? card.stats?.atk,
    keywords: card.keywords ?? [],
    description: card.description,
    image: card.image
  }));

const defaultDecks = (): Deck[] => TEMPLATE_DECKS.map((deck) => ({
  ...deck,
  cards: { ...deck.cards },
  territories: [...deck.territories]
}));

const loadDecks = (): Deck[] => {
  if (typeof window === 'undefined') return defaultDecks();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultDecks();
    const parsed = JSON.parse(raw) as Deck[];
    if (!Array.isArray(parsed) || parsed.length === 0) return defaultDecks();
    return parsed.map((deck, index) => ({
      ...deck,
      territories: Array.isArray(deck.territories) && deck.territories.length === 3
        ? deck.territories
        : ['t001', 't002', 't003']
    }));
  } catch {
    return defaultDecks();
  }
};

const saveDecks = (decks: Deck[]) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(decks));
};

export const DeckEditor: React.FC<DeckEditorProps> = ({ onBack }) => {
  const allCards = useMemo(() => normalizeCards(cardData as RawCard[]), []);
  const [decks, setDecks] = useState<Deck[]>(() => loadDecks());
  const [selectedId, setSelectedId] = useState<string>('');
  const [activeDeckId, setActiveDeckId] = useState<string>('');
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<CardType | 'ALL'>('ALL');
  const [costMin, setCostMin] = useState('');
  const [costMax, setCostMax] = useState('');

  useEffect(() => {
    if (!selectedId && decks.length > 0) setSelectedId(decks[0].id);
  }, [decks, selectedId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedActive = window.localStorage.getItem('aether-active-deck-id');
    if (savedActive) setActiveDeckId(savedActive);
  }, []);

  useEffect(() => {
    saveDecks(decks);
  }, [decks]);

  const selectedDeck = decks.find((deck) => deck.id === selectedId) ?? decks[0];

  const filteredCards = useMemo(() => {
    const min = costMin ? Number(costMin) : undefined;
    const max = costMax ? Number(costMax) : undefined;
    return allCards.filter((card) => {
      if (typeFilter !== 'ALL' && card.type !== typeFilter) return false;
      if (query && !card.name.toLowerCase().includes(query.toLowerCase())) return false;
      if (min !== undefined && !Number.isNaN(min) && card.cost < min) return false;
      if (max !== undefined && !Number.isNaN(max) && card.cost > max) return false;
      return true;
    });
  }, [allCards, typeFilter, query, costMin, costMax]);

  const deckEntries = useMemo(() => {
    if (!selectedDeck) return [];
    return Object.entries(selectedDeck.cards)
      .map(([cardId, count]) => {
        const card = allCards.find((c) => c.id === cardId);
        if (!card) return null;
        return { card, count };
      })
      .filter(Boolean) as { card: CardDef; count: number }[];
  }, [selectedDeck, allCards]);

  const deckCount = deckEntries.reduce((sum, entry) => sum + entry.count, 0);
  const isDeckFull = deckCount >= MAX_DECK_SIZE;

  const typeBreakdown = deckEntries.reduce<Record<CardType, number>>(
    (acc, entry) => {
      acc[entry.card.type] += entry.count;
      return acc;
    },
    { UNIT: 0, SPELL: 0, SPELL_INSTANT: 0, TERRITORY: 0 }
  );

  const updateDeck = (updater: (deck: Deck) => Deck) => {
    if (!selectedDeck) return;
    setDecks((prev) => prev.map((deck) => (deck.id === selectedDeck.id ? updater(deck) : deck)));
  };

  const addCardToDeck = (cardId: string) => {
    updateDeck((deck) => {
      const total = Object.values(deck.cards).reduce((sum, count) => sum + count, 0);
      const current = deck.cards[cardId] ?? 0;
      if (total >= MAX_DECK_SIZE || current >= MAX_COPIES) return deck;
      return {
        ...deck,
        cards: { ...deck.cards, [cardId]: current + 1 }
      };
    });
  };

  const removeCardFromDeck = (cardId: string) => {
    updateDeck((deck) => {
      const next = { ...deck.cards };
      const count = (next[cardId] ?? 0) - 1;
      if (count <= 0) delete next[cardId];
      else next[cardId] = count;
      return { ...deck, cards: next };
    });
  };

  const clearDeck = () => {
    updateDeck((deck) => ({ ...deck, cards: {} }));
  };

  const addDeck = () => {
    const nextDeck: Deck = {
      id: `deck-custom-${Date.now()}`,
      name: `Custom Deck ${decks.length + 1}`,
      cards: {},
      territories: ['t001', 't002', 't003']
    };
    setDecks((prev) => [...prev, nextDeck]);
    setSelectedId(nextDeck.id);
  };

  const territoryCards = allCards.filter((card) => card.type === 'TERRITORY');
  const updateTerritory = (index: number, value: string) => {
    updateDeck((deck) => {
      const next = [...deck.territories];
      next[index] = value;
      return { ...deck, territories: next };
    });
  };

  const handleSetActive = (id: string) => {
    setActiveDeckId(id);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('aether-active-deck-id', id);
    }
  };

  useEffect(() => {
    if (!activeDeckId && selectedDeck) {
      handleSetActive(selectedDeck.id);
    }
  }, [activeDeckId, selectedDeck]);

  const deleteDeck = (deckId: string) => {
    setDecks((prev) => {
      const next = prev.filter((deck) => deck.id !== deckId);
      if (next.length === 0) {
        const fresh = defaultDecks();
        setSelectedId(fresh[0].id);
        setActiveDeckId(fresh[0].id);
        if (typeof window !== 'undefined') {
          window.localStorage.setItem('aether-active-deck-id', fresh[0].id);
        }
        return fresh;
      }
      if (!next.find((deck) => deck.id === selectedId)) {
        setSelectedId(next[0].id);
      }
      if (deckId === activeDeckId) {
        setActiveDeckId(next[0].id);
        if (typeof window !== 'undefined') {
          window.localStorage.setItem('aether-active-deck-id', next[0].id);
        }
      }
      return next;
    });
  };

  return (
    <div className="min-h-screen w-full aether-bg relative overflow-hidden">
      <div className="aether-grid" />
      <div className="aether-orb orb-left" />
      <div className="aether-orb orb-right" />

      <div className="relative z-10 min-h-screen px-6 py-10">
        <div className="flex items-center justify-between max-w-5xl mx-auto mb-8">
          <div>
            <div className="text-xs uppercase tracking-[0.6em] text-amber-200/70 mb-2">Deck Workshop</div>
            <h2 className="aether-title text-3xl md:text-4xl">Forge Your Arsenal</h2>
          </div>
          <button
            onClick={onBack}
            className="px-4 py-2 rounded-full border border-white/20 text-sm uppercase tracking-widest text-white/70 hover:text-white hover:border-white/40 transition-colors"
          >
            Back
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 max-w-6xl mx-auto">
          <div className="space-y-3">
            <button
              onClick={addDeck}
              className="w-full px-4 py-3 rounded-xl border border-amber-400/50 text-amber-100 bg-amber-400/10 hover:bg-amber-400/20 transition-colors"
            >
              + Add New Deck
            </button>
            <div className="space-y-2">
              {decks.map((deck) => (
                <button
                  key={deck.id}
                  onClick={() => setSelectedId(deck.id)}
                  className={`w-full px-4 py-3 rounded-xl border text-left transition-colors ${
                    selectedDeck?.id === deck.id
                      ? 'border-sky-400/60 bg-sky-400/10 text-sky-100'
                      : 'border-white/10 bg-white/5 text-white/70 hover:text-white hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col items-start">
                      <span>{deck.name}</span>
                      {deck.id === activeDeckId && (
                        <span className="text-[10px] bg-amber-500/80 text-black px-1.5 rounded font-bold">
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-white/40">{Object.values(deck.cards).reduce((a, b) => a + b, 0)} cards</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-black/40 backdrop-blur p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div>
                  <div className="text-xs uppercase tracking-[0.4em] text-white/40 mb-2">Selected Deck</div>
                  <input
                    className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-lg text-white w-full md:w-72"
                    value={selectedDeck?.name ?? ''}
                    onChange={(event) => {
                      const value = event.target.value;
                      updateDeck((deck) => ({ ...deck, name: value }));
                    }}
                    placeholder="Deck name"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => selectedDeck && handleSetActive(selectedDeck.id)}
                    disabled={selectedDeck?.id === activeDeckId}
                    className={`px-3 py-2 rounded-full border text-xs uppercase tracking-widest transition-colors ${
                      selectedDeck?.id === activeDeckId
                        ? 'border-amber-500 bg-amber-500/20 text-amber-200 cursor-default'
                        : 'border-green-400/40 text-green-200 hover:bg-green-400/10 hover:border-green-300'
                    }`}
                  >
                    {selectedDeck?.id === activeDeckId ? 'Equipped' : 'Equip Deck'}
                  </button>
                  <button
                    onClick={clearDeck}
                    className="px-3 py-2 rounded-full border border-white/15 text-xs uppercase tracking-widest text-white/60 hover:text-white hover:border-white/40"
                  >
                    Clear
                  </button>
                  <button
                    onClick={() => selectedDeck && deleteDeck(selectedDeck.id)}
                    className="px-3 py-2 rounded-full border border-rose-400/40 text-xs uppercase tracking-widest text-rose-200 hover:text-white hover:border-rose-300"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => saveDecks(decks)}
                    className="px-3 py-2 rounded-full border border-amber-300/40 text-xs uppercase tracking-widest text-amber-100 hover:text-white hover:border-amber-200"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setDecks(loadDecks())}
                    className="px-3 py-2 rounded-full border border-sky-300/40 text-xs uppercase tracking-widest text-sky-100 hover:text-white hover:border-sky-200"
                  >
                    Reload
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-white/60 mb-6">
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="text-white/40 uppercase tracking-widest text-[10px]">Total</div>
                  <div className="text-lg text-white">{deckCount} / {MAX_DECK_SIZE}</div>
                  <div className="text-[10px] text-white/30 uppercase tracking-widest mt-1">Max 4 copies</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="text-white/40 uppercase tracking-widest text-[10px]">Units</div>
                  <div className="text-lg text-white">{typeBreakdown.UNIT}</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="text-white/40 uppercase tracking-widest text-[10px]">Spells</div>
                  <div className="text-lg text-white">{typeBreakdown.SPELL + typeBreakdown.SPELL_INSTANT}</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="text-white/40 uppercase tracking-widest text-[10px]">Territory</div>
                  <div className="text-lg text-white">{typeBreakdown.TERRITORY}</div>
                </div>
              </div>

              <div className="grid md:grid-cols-[1fr_1fr] gap-6">
                <div>
                  <div className="text-xs uppercase tracking-[0.3em] text-white/40 mb-3">Deck List</div>
                  <div className="space-y-2 max-h-[360px] overflow-y-auto pr-2">
                    {isDeckFull && (
                      <div className="text-xs text-amber-200 bg-amber-500/10 border border-amber-400/40 rounded-xl px-3 py-2">
                        Deck is full. Remove cards to add more.
                      </div>
                    )}
                    {deckEntries.length === 0 && (
                      <div className="text-sm text-white/40 border border-dashed border-white/10 rounded-xl p-4">
                        No cards yet. Use the library on the right to add cards.
                      </div>
                    )}
                    {deckEntries.map(({ card, count }) => (
                      <div
                        key={card.id}
                        className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2"
                      >
                        <div>
                          <div className="text-white text-sm">{card.name}</div>
                          <div className="text-xs text-white/40">
                            {card.type} • Cost {card.cost}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => removeCardFromDeck(card.id)}
                            className="w-7 h-7 rounded-full border border-white/15 text-white/70 hover:text-white"
                          >
                            -
                          </button>
                          <span className="text-sm text-white">{count}</span>
                          <button
                            onClick={() => addCardToDeck(card.id)}
                            disabled={isDeckFull || count >= MAX_COPIES}
                            className={`w-7 h-7 rounded-full border text-white/70 transition-colors ${
                              isDeckFull || count >= MAX_COPIES
                                ? 'border-white/10 text-white/30 cursor-not-allowed'
                                : 'border-white/15 hover:text-white'
                            }`}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-xs uppercase tracking-[0.3em] text-white/40 mb-3">Card Library</div>
                  <div className="rounded-2xl border border-white/10 bg-black/40 p-3 mb-4">
                    <div className="text-[10px] uppercase tracking-[0.4em] text-white/40 mb-2">Territory Order</div>
                    <div className="flex flex-col gap-2">
                      {[0, 1, 2].map((slot) => (
                        <div key={`territory-${slot}`} className="flex items-center gap-2">
                          <span className="text-xs text-white/50 w-5">#{slot + 1}</span>
                          <select
                            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white"
                            value={selectedDeck?.territories?.[slot] ?? territoryCards[slot]?.id ?? ''}
                            onChange={(event) => updateTerritory(slot, event.target.value)}
                          >
                            {territoryCards.map((card) => (
                              <option key={card.id} value={card.id}>
                                {card.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                    <div className="text-[10px] text-white/40 mt-2">
                      Territory cards flip in order on your turns up to turn 6.
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <input
                      className="flex-1 min-w-[160px] bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white"
                      placeholder="Search cards..."
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                    />
                    <select
                      className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white"
                      value={typeFilter}
                      onChange={(event) => setTypeFilter(event.target.value as CardType | 'ALL')}
                    >
                      <option value="ALL">All</option>
                      <option value="UNIT">Unit</option>
                      <option value="SPELL">Spell</option>
                      <option value="SPELL_INSTANT">Instant</option>
                      <option value="TERRITORY">Territory</option>
                    </select>
                    <input
                      className="w-20 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white"
                      placeholder="Min"
                      value={costMin}
                      onChange={(event) => setCostMin(event.target.value)}
                    />
                    <input
                      className="w-20 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white"
                      placeholder="Max"
                      value={costMax}
                      onChange={(event) => setCostMax(event.target.value)}
                    />
                  </div>
                  <div className="space-y-2 max-h-[360px] overflow-y-auto pr-2">
                    {filteredCards.map((card) => (
                      <div
                        key={card.id}
                        className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 hover:border-amber-300/40"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-white text-sm">{card.name}</div>
                            <div className="text-xs text-white/40">
                              {card.type} • Cost {card.cost}
                              {card.bp ? ` • BP ${card.bp}` : ''}
                            </div>
                          </div>
                          <button
                            onClick={() => addCardToDeck(card.id)}
                            disabled={
                              isDeckFull ||
                              (selectedDeck?.cards[card.id] ?? 0) >= MAX_COPIES
                            }
                            className={`px-3 py-1 rounded-full border text-xs uppercase tracking-widest transition-colors ${
                              isDeckFull || (selectedDeck?.cards[card.id] ?? 0) >= MAX_COPIES
                                ? 'border-white/10 text-white/30 cursor-not-allowed'
                                : 'border-amber-300/40 text-amber-100 hover:text-white hover:border-amber-200'
                            }`}
                          >
                            Add
                          </button>
                        </div>
                        <div className="text-xs text-white/50 mt-1 line-clamp-2">{card.description}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
