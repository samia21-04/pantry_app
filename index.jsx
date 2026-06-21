import { useState, useEffect } from "react";

const COLORS = {
  bg: "#F7F3EC",
  card: "#FFFDF8",
  green: "#3A6B35",
  greenLight: "#6BA368",
  greenPale: "#E8F0E7",
  accent: "#D4823A",
  accentLight: "#F5E6D3",
  text: "#2C2C2C",
  muted: "#8C8C7A",
  border: "#DDD8CC",
  checked: "#B8C9B6",
};

const CATEGORIES = ["🥦 Produce", "🥩 Meat & Fish", "🥛 Dairy", "🥫 Pantry", "🧴 Personal Care", "🍞 Bakery", "🧊 Frozen", "🛒 Other"];

const defaultList = {
  id: "default",
  name: "Weekly Groceries",
  items: [],
  collaborators: [],
  createdAt: Date.now(),
};

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

export default function GroceryCollab() {
  const [lists, setLists] = useState([defaultList]);
  const [activeListId, setActiveListId] = useState("default");
  const [loaded, setLoaded] = useState(false);

  // Panels
  const [showAddItem, setShowAddItem] = useState(false);
  const [showAddCollab, setShowAddCollab] = useState(false);
  const [showNewList, setShowNewList] = useState(false);

  // Form state
  const [newItemName, setNewItemName] = useState("");
  const [newItemQty, setNewItemQty] = useState("1");
  const [newItemCat, setNewItemCat] = useState(CATEGORIES[7]);
  const [newItemNote, setNewItemNote] = useState("");
  const [collabName, setCollabName] = useState("");
  const [collabEmail, setCollabEmail] = useState("");
  const [newListName, setNewListName] = useState("");
  const [filterCat, setFilterCat] = useState("All");
  const [filterChecked, setFilterChecked] = useState("all");
  const [toast, setToast] = useState(null);

  // Load from storage
  useEffect(() => {
    (async () => {
      try {
        const result = await window.storage.get("grocery_lists");
        if (result) {
          const data = JSON.parse(result.value);
          setLists(data.lists || [defaultList]);
          setActiveListId(data.activeListId || "default");
        }
      } catch {}
      setLoaded(true);
    })();
  }, []);

  // Save to storage
  useEffect(() => {
    if (!loaded) return;
    window.storage.set("grocery_lists", JSON.stringify({ lists, activeListId })).catch(() => {});
  }, [lists, activeListId, loaded]);

  const activeList = lists.find((l) => l.id === activeListId) || lists[0];

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  function saveList(updated) {
    setLists((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
  }

  function addItem() {
    if (!newItemName.trim()) return;
    const item = {
      id: generateId(),
      name: newItemName.trim(),
      qty: newItemQty || "1",
      category: newItemCat,
      note: newItemNote.trim(),
      checked: false,
      addedAt: Date.now(),
    };
    saveList({ ...activeList, items: [...activeList.items, item] });
    setNewItemName("");
    setNewItemQty("1");
    setNewItemNote("");
    setShowAddItem(false);
    showToast(`"${item.name}" added!`);
  }

  function toggleItem(itemId) {
    saveList({
      ...activeList,
      items: activeList.items.map((i) => (i.id === itemId ? { ...i, checked: !i.checked } : i)),
    });
  }

  function deleteItem(itemId) {
    saveList({ ...activeList, items: activeList.items.filter((i) => i.id !== itemId) });
  }

  function addCollaborator() {
    if (!collabName.trim() && !collabEmail.trim()) return;
    const collab = {
      id: generateId(),
      name: collabName.trim() || collabEmail.split("@")[0],
      email: collabEmail.trim(),
      avatar: (collabName.trim()[0] || collabEmail[0] || "?").toUpperCase(),
      color: ["#D4823A", "#6BA368", "#5B8DB8", "#9B6BB5", "#C45C5C"][Math.floor(Math.random() * 5)],
      addedAt: Date.now(),
    };
    saveList({ ...activeList, collaborators: [...activeList.collaborators, collab] });
    setCollabName("");
    setCollabEmail("");
    setShowAddCollab(false);
    showToast(`${collab.name} added as collaborator!`);
  }

  function removeCollaborator(collabId) {
    saveList({ ...activeList, collaborators: activeList.collaborators.filter((c) => c.id !== collabId) });
  }

  function createList() {
    if (!newListName.trim()) return;
    const newList = {
      id: generateId(),
      name: newListName.trim(),
      items: [],
      collaborators: [],
      createdAt: Date.now(),
    };
    setLists((prev) => [...prev, newList]);
    setActiveListId(newList.id);
    setNewListName("");
    setShowNewList(false);
    showToast(`"${newList.name}" created!`);
  }

  function deleteList(listId) {
    if (lists.length === 1) return;
    const remaining = lists.filter((l) => l.id !== listId);
    setLists(remaining);
    setActiveListId(remaining[0].id);
  }

  function clearChecked() {
    saveList({ ...activeList, items: activeList.items.filter((i) => !i.checked) });
    showToast("Checked items cleared!");
  }

  const filteredItems = activeList.items.filter((item) => {
    if (filterCat !== "All" && item.category !== filterCat) return false;
    if (filterChecked === "active" && item.checked) return false;
    if (filterChecked === "checked" && !item.checked) return false;
    return true;
  });

  const checkedCount = activeList.items.filter((i) => i.checked).length;
  const progress = activeList.items.length ? Math.round((checkedCount / activeList.items.length) * 100) : 0;

  if (!loaded) {
    return (
      <div style={{ background: COLORS.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: COLORS.muted, fontFamily: "serif", fontSize: 18 }}>Loading your lists…</p>
      </div>
    );
  }

  return (
    <div style={{ background: COLORS.bg, minHeight: "100vh", fontFamily: "'Georgia', serif", color: COLORS.text }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)",
          background: COLORS.green, color: "#fff", padding: "10px 22px", borderRadius: 30,
          fontSize: 14, zIndex: 9999, boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
          fontFamily: "sans-serif", whiteSpace: "nowrap",
        }}>{toast}</div>
      )}

      {/* Header */}
      <div style={{ background: COLORS.green, padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: 3, color: "#A8CCA6", fontFamily: "sans-serif", textTransform: "uppercase" }}>Pantry Pals</div>
          <div style={{ fontSize: 22, color: "#fff", fontWeight: "bold", marginTop: 2 }}>🛒 {activeList.name}</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {activeList.collaborators.slice(0, 4).map((c) => (
            <div key={c.id} title={c.name} style={{
              width: 34, height: 34, borderRadius: "50%", background: c.color,
              color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, fontWeight: "bold", border: "2px solid rgba(255,255,255,0.4)",
              fontFamily: "sans-serif",
            }}>{c.avatar}</div>
          ))}
          {activeList.collaborators.length > 4 && (
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(255,255,255,0.2)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontFamily: "sans-serif" }}>
              +{activeList.collaborators.length - 4}
            </div>
          )}
        </div>
      </div>

      {/* List Tabs */}
      <div style={{ background: "#2D5529", padding: "0 16px", display: "flex", gap: 4, overflowX: "auto" }}>
        {lists.map((l) => (
          <button key={l.id} onClick={() => setActiveListId(l.id)} style={{
            padding: "9px 14px", fontSize: 12, border: "none", cursor: "pointer", whiteSpace: "nowrap",
            background: l.id === activeListId ? COLORS.bg : "transparent",
            color: l.id === activeListId ? COLORS.green : "#A8CCA6",
            borderRadius: "6px 6px 0 0", fontFamily: "sans-serif", fontWeight: l.id === activeListId ? "600" : "400",
          }}>{l.name}</button>
        ))}
        <button onClick={() => setShowNewList(true)} style={{
          padding: "9px 14px", fontSize: 16, border: "none", cursor: "pointer",
          background: "transparent", color: "#A8CCA6", fontFamily: "sans-serif",
        }}>＋</button>
      </div>

      {/* Progress Bar */}
      {activeList.items.length > 0 && (
        <div style={{ padding: "12px 20px 0", background: COLORS.card, borderBottom: `1px solid ${COLORS.border}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontFamily: "sans-serif", color: COLORS.muted, marginBottom: 6 }}>
            <span>{checkedCount} of {activeList.items.length} items</span>
            <span>{progress}%</span>
          </div>
          <div style={{ background: COLORS.greenPale, borderRadius: 10, height: 8, overflow: "hidden" }}>
            <div style={{ width: `${progress}%`, background: COLORS.greenLight, height: "100%", borderRadius: 10, transition: "width 0.4s ease" }} />
          </div>
          <div style={{ height: 10 }} />
        </div>
      )}

      {/* Filter Bar */}
      <div style={{ background: COLORS.card, borderBottom: `1px solid ${COLORS.border}`, padding: "10px 16px", display: "flex", gap: 8, overflowX: "auto" }}>
        {["All", ...CATEGORIES].map((cat) => (
          <button key={cat} onClick={() => setFilterCat(cat)} style={{
            padding: "5px 12px", borderRadius: 20, fontSize: 12, whiteSpace: "nowrap",
            border: filterCat === cat ? "none" : `1px solid ${COLORS.border}`,
            background: filterCat === cat ? COLORS.green : "transparent",
            color: filterCat === cat ? "#fff" : COLORS.muted,
            cursor: "pointer", fontFamily: "sans-serif",
          }}>{cat}</button>
        ))}
        <div style={{ borderLeft: `1px solid ${COLORS.border}`, margin: "0 4px" }} />
        {["all", "active", "checked"].map((f) => (
          <button key={f} onClick={() => setFilterChecked(f)} style={{
            padding: "5px 12px", borderRadius: 20, fontSize: 12, whiteSpace: "nowrap",
            border: filterChecked === f ? "none" : `1px solid ${COLORS.border}`,
            background: filterChecked === f ? COLORS.accent : "transparent",
            color: filterChecked === f ? "#fff" : COLORS.muted,
            cursor: "pointer", fontFamily: "sans-serif",
          }}>{f === "all" ? "All" : f === "active" ? "To Buy" : "Got It"}</button>
        ))}
      </div>

      {/* Items List */}
      <div style={{ padding: "16px 16px 120px" }}>
        {filteredItems.length === 0 ? (
          <div style={{ textAlign: "center", padding: "50px 20px", color: COLORS.muted }}>
            <div style={{ fontSize: 48 }}>🥬</div>
            <p style={{ marginTop: 12, fontSize: 16 }}>No items yet!</p>
            <p style={{ fontSize: 13, fontFamily: "sans-serif" }}>Tap the + button to add groceries</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {filteredItems.map((item) => (
              <div key={item.id} style={{
                background: item.checked ? COLORS.greenPale : COLORS.card,
                border: `1px solid ${item.checked ? COLORS.checked : COLORS.border}`,
                borderRadius: 12, padding: "12px 14px",
                display: "flex", alignItems: "center", gap: 12,
                transition: "all 0.2s ease",
              }}>
                <button onClick={() => toggleItem(item.id)} style={{
                  width: 24, height: 24, borderRadius: "50%",
                  border: `2px solid ${item.checked ? COLORS.greenLight : COLORS.border}`,
                  background: item.checked ? COLORS.greenLight : "transparent",
                  cursor: "pointer", flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, color: "#fff",
                }}>{item.checked ? "✓" : ""}</button>

                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                    <span style={{
                      fontSize: 15, fontWeight: "500",
                      textDecoration: item.checked ? "line-through" : "none",
                      color: item.checked ? COLORS.muted : COLORS.text,
                    }}>{item.name}</span>
                    <span style={{ fontSize: 12, color: COLORS.muted, fontFamily: "sans-serif" }}>×{item.qty}</span>
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 3, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 11, color: COLORS.muted, fontFamily: "sans-serif" }}>{item.category}</span>
                    {item.note && <span style={{ fontSize: 11, color: COLORS.accent, fontFamily: "sans-serif" }}>📝 {item.note}</span>}
                  </div>
                </div>

                <button onClick={() => deleteItem(item.id)} style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: COLORS.muted, fontSize: 16, padding: 4, lineHeight: 1,
                }}>×</button>
              </div>
            ))}
          </div>
        )}

        {/* Collaborators Section */}
        <div style={{ marginTop: 28 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <h3 style={{ fontSize: 13, letterSpacing: 2, color: COLORS.muted, fontFamily: "sans-serif", textTransform: "uppercase", margin: 0 }}>
              Collaborators ({activeList.collaborators.length})
            </h3>
            <button onClick={() => setShowAddCollab(true)} style={{
              fontSize: 12, color: COLORS.green, background: COLORS.greenPale,
              border: "none", padding: "5px 12px", borderRadius: 20, cursor: "pointer",
              fontFamily: "sans-serif", fontWeight: "600",
            }}>+ Add Person</button>
          </div>

          {activeList.collaborators.length === 0 ? (
            <p style={{ fontSize: 13, color: COLORS.muted, fontFamily: "sans-serif", fontStyle: "italic" }}>No collaborators yet — add friends or family!</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {activeList.collaborators.map((c) => (
                <div key={c.id} style={{
                  background: COLORS.card, border: `1px solid ${COLORS.border}`,
                  borderRadius: 10, padding: "10px 14px",
                  display: "flex", alignItems: "center", gap: 12,
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: "50%", background: c.color,
                    color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: "bold", fontSize: 14, flexShrink: 0, fontFamily: "sans-serif",
                  }}>{c.avatar}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: "500" }}>{c.name}</div>
                    {c.email && <div style={{ fontSize: 12, color: COLORS.muted, fontFamily: "sans-serif" }}>{c.email}</div>}
                  </div>
                  <button onClick={() => removeCollaborator(c.id)} style={{
                    background: "none", border: "none", cursor: "pointer",
                    color: COLORS.muted, fontSize: 16, padding: 4,
                  }}>×</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Danger zone */}
        {lists.length > 1 && (
          <div style={{ marginTop: 32, textAlign: "center" }}>
            <button onClick={() => deleteList(activeList.id)} style={{
              fontSize: 12, color: "#C45C5C", background: "none",
              border: `1px solid #C45C5C`, padding: "6px 16px",
              borderRadius: 20, cursor: "pointer", fontFamily: "sans-serif",
            }}>Delete this list</button>
          </div>
        )}
      </div>

      {/* FAB */}
      <div style={{ position: "fixed", bottom: 24, right: 24, display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-end" }}>
        {checkedCount > 0 && (
          <button onClick={clearChecked} style={{
            background: COLORS.accentLight, color: COLORS.accent,
            border: `1px solid ${COLORS.accent}`, borderRadius: 30,
            padding: "10px 18px", fontSize: 13, cursor: "pointer",
            fontFamily: "sans-serif", boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
          }}>Clear {checkedCount} checked</button>
        )}
        <button onClick={() => setShowAddItem(true)} style={{
          width: 56, height: 56, borderRadius: "50%", background: COLORS.green,
          color: "#fff", border: "none", fontSize: 28, cursor: "pointer",
          boxShadow: "0 4px 20px rgba(58,107,53,0.4)", lineHeight: 1,
        }}>+</button>
      </div>

      {/* Modal: Add Item */}
      {showAddItem && (
        <Modal onClose={() => setShowAddItem(false)} title="Add Item">
          <Label>Item Name</Label>
          <Input value={newItemName} onChange={setNewItemName} placeholder="e.g. Almond milk" autoFocus />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 10, marginTop: 12 }}>
            <div>
              <Label>Qty</Label>
              <Input value={newItemQty} onChange={setNewItemQty} placeholder="1" />
            </div>
            <div>
              <Label>Category</Label>
              <select value={newItemCat} onChange={(e) => setNewItemCat(e.target.value)} style={selectStyle}>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <Label>Note (optional)</Label>
            <Input value={newItemNote} onChange={setNewItemNote} placeholder="e.g. organic, no brand" />
          </div>
          <ModalActions onCancel={() => setShowAddItem(false)} onConfirm={addItem} confirmLabel="Add Item" confirmColor={COLORS.green} />
        </Modal>
      )}

      {/* Modal: Add Collaborator */}
      {showAddCollab && (
        <Modal onClose={() => setShowAddCollab(false)} title="Add Collaborator">
          <Label>Name</Label>
          <Input value={collabName} onChange={setCollabName} placeholder="e.g. Jordan" autoFocus />
          <div style={{ marginTop: 12 }}>
            <Label>Email (optional)</Label>
            <Input value={collabEmail} onChange={setCollabEmail} placeholder="jordan@email.com" type="email" />
          </div>
          <ModalActions onCancel={() => setShowAddCollab(false)} onConfirm={addCollaborator} confirmLabel="Add Collaborator" confirmColor={COLORS.green} />
        </Modal>
      )}

      {/* Modal: New List */}
      {showNewList && (
        <Modal onClose={() => setShowNewList(false)} title="New List">
          <Label>List Name</Label>
          <Input value={newListName} onChange={setNewListName} placeholder="e.g. Costco Run" autoFocus onEnter={createList} />
          <ModalActions onCancel={() => setShowNewList(false)} onConfirm={createList} confirmLabel="Create List" confirmColor={COLORS.green} />
        </Modal>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────

function Modal({ onClose, title, children }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000,
      display: "flex", alignItems: "flex-end", justifyContent: "center",
    }} onClick={onClose}>
      <div style={{
        background: COLORS.card, borderRadius: "20px 20px 0 0", padding: "24px 20px 32px",
        width: "100%", maxWidth: 480, boxShadow: "0 -8px 40px rgba(0,0,0,0.15)",
      }} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ margin: "0 0 18px", fontSize: 18, color: COLORS.green }}>{title}</h2>
        {children}
      </div>
    </div>
  );
}

function Label({ children }) {
  return <label style={{ fontSize: 11, letterSpacing: 1.5, color: COLORS.muted, fontFamily: "sans-serif", textTransform: "uppercase", display: "block", marginBottom: 5 }}>{children}</label>;
}

function Input({ value, onChange, placeholder, type = "text", autoFocus, onEnter }) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoFocus={autoFocus}
      onKeyDown={(e) => e.key === "Enter" && onEnter && onEnter()}
      style={{
        width: "100%", padding: "10px 14px", borderRadius: 10,
        border: `1.5px solid ${COLORS.border}`, fontSize: 15,
        fontFamily: "Georgia, serif", background: COLORS.bg,
        outline: "none", boxSizing: "border-box", color: COLORS.text,
      }}
    />
  );
}

const selectStyle = {
  width: "100%", padding: "10px 14px", borderRadius: 10,
  border: `1.5px solid ${COLORS.border}`, fontSize: 13,
  fontFamily: "sans-serif", background: COLORS.bg,
  outline: "none", boxSizing: "border-box", color: COLORS.text,
};

function ModalActions({ onCancel, onConfirm, confirmLabel, confirmColor }) {
  return (
    <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
      <button onClick={onCancel} style={{
        flex: 1, padding: "12px", borderRadius: 10, border: `1.5px solid ${COLORS.border}`,
        background: "transparent", cursor: "pointer", fontSize: 14, fontFamily: "sans-serif", color: COLORS.muted,
      }}>Cancel</button>
      <button onClick={onConfirm} style={{
        flex: 2, padding: "12px", borderRadius: 10, border: "none",
        background: confirmColor, color: "#fff", cursor: "pointer",
        fontSize: 14, fontFamily: "sans-serif", fontWeight: "600",
      }}>{confirmLabel}</button>
    </div>
  );
}
