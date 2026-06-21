// src/App.jsx
import { useState, useEffect } from "react";
import { auth, db } from "./firebase";
import {
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
} from "firebase/auth";
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  arrayUnion,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";

// ─── Design tokens ───────────────────────────────────────
const C = {
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
  error: "#C45C5C",
};

const CATEGORIES = [
  "🥦 Produce", "🥩 Meat & Fish", "🥛 Dairy",
  "🥫 Pantry", "🧴 Personal Care", "🍞 Bakery",
  "🧊 Frozen", "🛒 Other",
];

const AVATAR_COLORS = ["#D4823A", "#6BA368", "#5B8DB8", "#9B6BB5", "#C45C5C", "#3A8B8B"];

function initials(name) {
  return (name || "?").split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

function randomColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

// ─── Root ────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
  }, []);

  if (authLoading) return <Splash />;
  if (!user) return <LoginScreen />;
  return <GroceryApp user={user} />;
}

// ─── Splash ──────────────────────────────────────────────
function Splash() {
  return (
    <div style={{ background: C.green, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", color: "#fff" }}>
        <div style={{ fontSize: 56 }}>🛒</div>
        <p style={{ fontFamily: "Lora, serif", fontSize: 20, marginTop: 12 }}>Pantry Pals</p>
      </div>
    </div>
  );
}

// ─── Login ───────────────────────────────────────────────
function LoginScreen() {
  const [error, setError] = useState("");

  async function signInGoogle() {
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div style={{ background: C.bg, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ fontSize: 64, marginBottom: 8 }}>🛒</div>
      <h1 style={{ fontFamily: "Lora, serif", fontSize: 32, color: C.green, margin: 0 }}>Pantry Pals</h1>
      <p style={{ fontFamily: "DM Sans, sans-serif", color: C.muted, marginTop: 8, marginBottom: 36, textAlign: "center" }}>
        Shared grocery lists that update in real time
      </p>
      <button onClick={signInGoogle} style={{
        display: "flex", alignItems: "center", gap: 12, padding: "14px 28px",
        background: C.green, color: "#fff", border: "none", borderRadius: 14,
        fontSize: 16, fontFamily: "DM Sans, sans-serif", fontWeight: 600,
        cursor: "pointer", boxShadow: "0 4px 20px rgba(58,107,53,0.3)",
      }}>
        <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#fff" d="M44.5 20H24v8h11.8C34.7 33.9 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 20-8 20-20 0-1.3-.2-2.7-.5-4z"/></svg>
        Continue with Google
      </button>
      {error && <p style={{ color: C.error, marginTop: 16, fontFamily: "DM Sans, sans-serif", fontSize: 13 }}>{error}</p>}
    </div>
  );
}

// ─── Main App ────────────────────────────────────────────
function GroceryApp({ user }) {
  const [lists, setLists] = useState([]);
  const [activeListId, setActiveListId] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // UI state
  const [showAddItem, setShowAddItem] = useState(false);
  const [showAddCollab, setShowAddCollab] = useState(false);
  const [showNewList, setShowNewList] = useState(false);
  const [filterCat, setFilterCat] = useState("All");
  const [filterChecked, setFilterChecked] = useState("all");
  const [toast, setToast] = useState(null);

  // Form state
  const [itemName, setItemName] = useState("");
  const [itemQty, setItemQty] = useState("1");
  const [itemCat, setItemCat] = useState(CATEGORIES[7]);
  const [itemNote, setItemNote] = useState("");
  const [collabEmail, setCollabEmail] = useState("");
  const [newListName, setNewListName] = useState("");

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  }

  // Real-time listener: lists where user is owner OR collaborator
  useEffect(() => {
    const q = query(
      collection(db, "lists"),
      where("members", "array-contains", user.email)
    );
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
      setLists(data);
      if (!activeListId && data.length > 0) setActiveListId(data[0].id);
      setLoading(false);
    });
    return unsub;
  }, [user.email]);

  // Real-time listener: items for active list
  useEffect(() => {
    if (!activeListId) return;
    const q = collection(db, "lists", activeListId, "items");
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => (a.addedAt?.seconds || 0) - (b.addedAt?.seconds || 0));
      setItems(data);
    });
    return unsub;
  }, [activeListId]);

  const activeList = lists.find((l) => l.id === activeListId);

  // ── Actions ──

  async function createList() {
    if (!newListName.trim()) return;
    const ref = await addDoc(collection(db, "lists"), {
      name: newListName.trim(),
      ownerId: user.uid,
      ownerEmail: user.email,
      members: [user.email],
      collaborators: [],
      createdAt: serverTimestamp(),
    });
    setActiveListId(ref.id);
    setNewListName("");
    setShowNewList(false);
    showToast(`"${newListName.trim()}" created!`);
  }

  async function deleteList() {
    if (!activeList) return;
    await deleteDoc(doc(db, "lists", activeListId));
    setActiveListId(lists.find((l) => l.id !== activeListId)?.id || null);
    showToast("List deleted");
  }

  async function addItem() {
    if (!itemName.trim() || !activeListId) return;
    await addDoc(collection(db, "lists", activeListId, "items"), {
      name: itemName.trim(),
      qty: itemQty || "1",
      category: itemCat,
      note: itemNote.trim(),
      checked: false,
      addedBy: user.displayName || user.email,
      addedAt: serverTimestamp(),
    });
    setItemName(""); setItemQty("1"); setItemNote("");
    setShowAddItem(false);
    showToast(`"${itemName.trim()}" added!`);
  }

  async function toggleItem(item) {
    await updateDoc(doc(db, "lists", activeListId, "items", item.id), {
      checked: !item.checked,
    });
  }

  async function deleteItem(itemId) {
    await deleteDoc(doc(db, "lists", activeListId, "items", itemId));
  }

  async function clearChecked() {
    const checked = items.filter((i) => i.checked);
    await Promise.all(checked.map((i) => deleteDoc(doc(db, "lists", activeListId, "items", i.id))));
    showToast(`${checked.length} item${checked.length > 1 ? "s" : ""} cleared!`);
  }

  async function addCollaborator() {
    if (!collabEmail.trim() || !activeList) return;
    const email = collabEmail.trim().toLowerCase();
    if (activeList.members?.includes(email)) {
      showToast("Already a collaborator!"); return;
    }
    const collab = { email, name: email.split("@")[0], addedAt: Date.now() };
    await updateDoc(doc(db, "lists", activeListId), {
      members: arrayUnion(email),
      collaborators: arrayUnion(collab),
    });
    setCollabEmail("");
    setShowAddCollab(false);
    showToast(`Invited ${email}!`);
  }

  async function removeCollaborator(collab) {
    if (!activeList) return;
    const updatedCollabs = activeList.collaborators.filter((c) => c.email !== collab.email);
    const updatedMembers = activeList.members.filter((m) => m !== collab.email);
    await updateDoc(doc(db, "lists", activeListId), {
      collaborators: updatedCollabs,
      members: updatedMembers,
    });
    showToast(`${collab.name} removed`);
  }

  const filteredItems = items.filter((item) => {
    if (filterCat !== "All" && item.category !== filterCat) return false;
    if (filterChecked === "active" && item.checked) return false;
    if (filterChecked === "checked" && !item.checked) return false;
    return true;
  });

  const checkedCount = items.filter((i) => i.checked).length;
  const progress = items.length ? Math.round((checkedCount / items.length) * 100) : 0;
  const isOwner = activeList?.ownerId === user.uid;

  if (loading) return <Splash />;

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "DM Sans, sans-serif", color: C.text }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)",
          background: C.green, color: "#fff", padding: "10px 22px", borderRadius: 30,
          fontSize: 13, zIndex: 9999, boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
          whiteSpace: "nowrap", fontWeight: 500,
        }}>{toast}</div>
      )}

      {/* Header */}
      <div style={{ background: C.green, padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: 3, color: "#A8CCA6", textTransform: "uppercase" }}>Pantry Pals</div>
          <div style={{ fontFamily: "Lora, serif", fontSize: 20, color: "#fff", fontWeight: 700, marginTop: 2 }}>
            🛒 {activeList?.name || "No list selected"}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Collaborator avatars */}
          {activeList?.collaborators?.slice(0, 3).map((c) => (
            <div key={c.email} title={c.name} style={{
              width: 30, height: 30, borderRadius: "50%",
              background: randomColor(c.email), color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 700, border: "2px solid rgba(255,255,255,0.4)",
            }}>{initials(c.name)}</div>
          ))}
          {/* User avatar + sign out */}
          <button onClick={() => signOut(auth)} title="Sign out" style={{
            width: 32, height: 32, borderRadius: "50%",
            background: randomColor(user.email),
            border: "2px solid rgba(255,255,255,0.6)",
            overflow: "hidden", cursor: "pointer", padding: 0,
          }}>
            {user.photoURL
              ? <img src={user.photoURL} alt="" width="32" height="32" style={{ display: "block" }} />
              : <span style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}>{initials(user.displayName || user.email)}</span>
            }
          </button>
        </div>
      </div>

      {/* List Tabs */}
      <div style={{ background: "#2D5529", padding: "0 12px", display: "flex", gap: 2, overflowX: "auto" }}>
        {lists.length === 0 && (
          <span style={{ padding: "10px 14px", color: "#A8CCA6", fontSize: 13, fontStyle: "italic" }}>No lists yet</span>
        )}
        {lists.map((l) => (
          <button key={l.id} onClick={() => { setActiveListId(l.id); setFilterCat("All"); setFilterChecked("all"); }} style={{
            padding: "9px 14px", fontSize: 12, border: "none", cursor: "pointer", whiteSpace: "nowrap",
            background: l.id === activeListId ? C.bg : "transparent",
            color: l.id === activeListId ? C.green : "#A8CCA6",
            borderRadius: "6px 6px 0 0", fontWeight: l.id === activeListId ? 600 : 400,
          }}>{l.name}</button>
        ))}
        <button onClick={() => setShowNewList(true)} style={{
          padding: "9px 14px", fontSize: 18, border: "none", cursor: "pointer",
          background: "transparent", color: "#A8CCA6",
        }}>＋</button>
      </div>

      {/* Progress bar */}
      {items.length > 0 && (
        <div style={{ padding: "12px 20px 0", background: C.card, borderBottom: `1px solid ${C.border}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: C.muted, marginBottom: 6 }}>
            <span>{checkedCount} of {items.length} items</span>
            <span>{progress}%</span>
          </div>
          <div style={{ background: C.greenPale, borderRadius: 10, height: 7, overflow: "hidden" }}>
            <div style={{ width: `${progress}%`, background: C.greenLight, height: "100%", borderRadius: 10, transition: "width 0.4s ease" }} />
          </div>
          <div style={{ height: 10 }} />
        </div>
      )}

      {/* Filter bar */}
      {activeList && (
        <div style={{ background: C.card, borderBottom: `1px solid ${C.border}`, padding: "10px 12px", display: "flex", gap: 6, overflowX: "auto" }}>
          {["All", ...CATEGORIES].map((cat) => (
            <button key={cat} onClick={() => setFilterCat(cat)} style={{
              padding: "5px 11px", borderRadius: 20, fontSize: 11, whiteSpace: "nowrap",
              border: filterCat === cat ? "none" : `1px solid ${C.border}`,
              background: filterCat === cat ? C.green : "transparent",
              color: filterCat === cat ? "#fff" : C.muted,
              cursor: "pointer", fontFamily: "DM Sans, sans-serif",
            }}>{cat}</button>
          ))}
          <div style={{ borderLeft: `1px solid ${C.border}`, margin: "0 2px" }} />
          {[["all", "All"], ["active", "To Buy"], ["checked", "Got It"]].map(([val, label]) => (
            <button key={val} onClick={() => setFilterChecked(val)} style={{
              padding: "5px 11px", borderRadius: 20, fontSize: 11, whiteSpace: "nowrap",
              border: filterChecked === val ? "none" : `1px solid ${C.border}`,
              background: filterChecked === val ? C.accent : "transparent",
              color: filterChecked === val ? "#fff" : C.muted,
              cursor: "pointer", fontFamily: "DM Sans, sans-serif",
            }}>{label}</button>
          ))}
        </div>
      )}

      {/* Main content */}
      <div style={{ padding: "16px 16px 140px" }}>
        {!activeList ? (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div style={{ fontSize: 52 }}>🥬</div>
            <p style={{ marginTop: 12, fontFamily: "Lora, serif", fontSize: 20, color: C.green }}>No lists yet</p>
            <p style={{ fontSize: 13, color: C.muted }}>Tap ＋ above to create your first list</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div style={{ textAlign: "center", padding: "50px 20px" }}>
            <div style={{ fontSize: 48 }}>🛍️</div>
            <p style={{ marginTop: 12, fontFamily: "Lora, serif", fontSize: 18, color: C.green }}>Nothing here yet</p>
            <p style={{ fontSize: 13, color: C.muted }}>Tap + to add groceries</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {filteredItems.map((item) => (
              <div key={item.id} style={{
                background: item.checked ? C.greenPale : C.card,
                border: `1px solid ${item.checked ? C.checked : C.border}`,
                borderRadius: 12, padding: "12px 14px",
                display: "flex", alignItems: "center", gap: 12,
                transition: "all 0.2s ease",
              }}>
                <button onClick={() => toggleItem(item)} style={{
                  width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
                  border: `2px solid ${item.checked ? C.greenLight : C.border}`,
                  background: item.checked ? C.greenLight : "transparent",
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, color: "#fff",
                }}>{item.checked ? "✓" : ""}</button>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                    <span style={{ fontSize: 15, fontWeight: 500, textDecoration: item.checked ? "line-through" : "none", color: item.checked ? C.muted : C.text }}>
                      {item.name}
                    </span>
                    <span style={{ fontSize: 12, color: C.muted }}>×{item.qty}</span>
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 3, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 11, color: C.muted }}>{item.category}</span>
                    {item.note && <span style={{ fontSize: 11, color: C.accent }}>📝 {item.note}</span>}
                    <span style={{ fontSize: 10, color: C.border }}>by {item.addedBy}</span>
                  </div>
                </div>
                <button onClick={() => deleteItem(item.id)} style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, fontSize: 18, padding: 4 }}>×</button>
              </div>
            ))}
          </div>
        )}

        {/* Collaborators section */}
        {activeList && (
          <div style={{ marginTop: 28 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <h3 style={{ fontSize: 11, letterSpacing: 2, color: C.muted, textTransform: "uppercase", margin: 0 }}>
                Collaborators ({activeList.collaborators?.length || 0})
              </h3>
              <button onClick={() => setShowAddCollab(true)} style={{
                fontSize: 12, color: C.green, background: C.greenPale,
                border: "none", padding: "5px 12px", borderRadius: 20, cursor: "pointer", fontWeight: 600,
              }}>+ Invite</button>
            </div>
            {(!activeList.collaborators || activeList.collaborators.length === 0) ? (
              <p style={{ fontSize: 13, color: C.muted, fontStyle: "italic" }}>Invite people — they'll see updates in real time!</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {activeList.collaborators.map((c) => (
                  <div key={c.email} style={{
                    background: C.card, border: `1px solid ${C.border}`,
                    borderRadius: 10, padding: "10px 14px",
                    display: "flex", alignItems: "center", gap: 12,
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: "50%", background: randomColor(c.email),
                      color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                      fontWeight: 700, fontSize: 13, flexShrink: 0,
                    }}>{initials(c.name)}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>{c.name}</div>
                      <div style={{ fontSize: 12, color: C.muted }}>{c.email}</div>
                    </div>
                    {isOwner && (
                      <button onClick={() => removeCollaborator(c)} style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, fontSize: 18, padding: 4 }}>×</button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Delete list (owner only) */}
        {activeList && isOwner && lists.length > 0 && (
          <div style={{ marginTop: 32, textAlign: "center" }}>
            <button onClick={deleteList} style={{
              fontSize: 12, color: C.error, background: "none",
              border: `1px solid ${C.error}`, padding: "6px 16px",
              borderRadius: 20, cursor: "pointer",
            }}>Delete this list</button>
          </div>
        )}
      </div>

      {/* FABs */}
      {activeList && (
        <div style={{ position: "fixed", bottom: 24, right: 20, display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-end" }}>
          {checkedCount > 0 && (
            <button onClick={clearChecked} style={{
              background: C.accentLight, color: C.accent,
              border: `1px solid ${C.accent}`, borderRadius: 30,
              padding: "10px 18px", fontSize: 13, cursor: "pointer", fontWeight: 600,
              boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
            }}>Clear {checkedCount} checked ✓</button>
          )}
          <button onClick={() => setShowAddItem(true)} style={{
            width: 56, height: 56, borderRadius: "50%", background: C.green,
            color: "#fff", border: "none", fontSize: 28, cursor: "pointer",
            boxShadow: "0 4px 20px rgba(58,107,53,0.4)", lineHeight: 1,
          }}>+</button>
        </div>
      )}

      {/* Modal: Add Item */}
      {showAddItem && (
        <Modal onClose={() => setShowAddItem(false)} title="Add Item">
          <Label>Item name</Label>
          <Input value={itemName} onChange={setItemName} placeholder="e.g. Almond milk" autoFocus />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 10, marginTop: 12 }}>
            <div><Label>Qty</Label><Input value={itemQty} onChange={setItemQty} placeholder="1" /></div>
            <div>
              <Label>Category</Label>
              <select value={itemCat} onChange={(e) => setItemCat(e.target.value)} style={selectStyle}>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <Label>Note (optional)</Label>
            <Input value={itemNote} onChange={setItemNote} placeholder="e.g. organic only" />
          </div>
          <ModalActions onCancel={() => setShowAddItem(false)} onConfirm={addItem} label="Add Item" color={C.green} />
        </Modal>
      )}

      {/* Modal: Add Collaborator */}
      {showAddCollab && (
        <Modal onClose={() => setShowAddCollab(false)} title="Invite Collaborator">
          <p style={{ fontSize: 13, color: C.muted, margin: "0 0 14px" }}>
            Enter their Google account email. They'll see this list automatically when they log in.
          </p>
          <Label>Email address</Label>
          <Input value={collabEmail} onChange={setCollabEmail} placeholder="friend@gmail.com" type="email" autoFocus />
          <ModalActions onCancel={() => setShowAddCollab(false)} onConfirm={addCollaborator} label="Invite" color={C.green} />
        </Modal>
      )}

      {/* Modal: New List */}
      {showNewList && (
        <Modal onClose={() => setShowNewList(false)} title="New List">
          <Label>List name</Label>
          <Input value={newListName} onChange={setNewListName} placeholder="e.g. Costco Run" autoFocus onEnter={createList} />
          <ModalActions onCancel={() => setShowNewList(false)} onConfirm={createList} label="Create List" color={C.green} />
        </Modal>
      )}
    </div>
  );
}

// ─── UI helpers ──────────────────────────────────────────

function Modal({ onClose, title, children }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={onClose}>
      <div style={{ background: C.card, borderRadius: "20px 20px 0 0", padding: "24px 20px 36px", width: "100%", maxWidth: 480, boxShadow: "0 -8px 40px rgba(0,0,0,0.15)" }} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ margin: "0 0 18px", fontFamily: "Lora, serif", fontSize: 20, color: C.green }}>{title}</h2>
        {children}
      </div>
    </div>
  );
}

function Label({ children }) {
  return <label style={{ fontSize: 10, letterSpacing: 1.5, color: C.muted, textTransform: "uppercase", display: "block", marginBottom: 5 }}>{children}</label>;
}

function Input({ value, onChange, placeholder, type = "text", autoFocus, onEnter }) {
  return (
    <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder} autoFocus={autoFocus}
      onKeyDown={(e) => e.key === "Enter" && onEnter?.()}
      style={{
        width: "100%", padding: "11px 14px", borderRadius: 10,
        border: `1.5px solid ${C.border}`, fontSize: 15,
        fontFamily: "DM Sans, sans-serif", background: C.bg,
        outline: "none", boxSizing: "border-box", color: C.text,
      }} />
  );
}

const selectStyle = {
  width: "100%", padding: "11px 14px", borderRadius: 10,
  border: `1.5px solid ${C.border}`, fontSize: 13,
  fontFamily: "DM Sans, sans-serif", background: C.bg,
  outline: "none", boxSizing: "border-box", color: C.text,
};

function ModalActions({ onCancel, onConfirm, label, color }) {
  return (
    <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
      <button onClick={onCancel} style={{ flex: 1, padding: 12, borderRadius: 10, border: `1.5px solid ${C.border}`, background: "transparent", cursor: "pointer", fontSize: 14, color: C.muted }}>Cancel</button>
      <button onClick={onConfirm} style={{ flex: 2, padding: 12, borderRadius: 10, border: "none", background: color, color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 600 }}>{label}</button>
    </div>
  );
}
