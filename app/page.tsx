"use client";

import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

type Category = "短期" | "中期" | "長期" | "未定";

type Todo = {
  id: number;
  text: string;
  done: boolean;
  category: Category;
};

type Board = {
  id: string;
  name: string;
  todos: Todo[];
};

const CATEGORIES: Category[] = ["短期", "中期", "長期", "未定"];

const COLUMN_STYLE: Record<Category, { header: string; border: string; bg: string }> = {
  短期: { header: "bg-rose-500 text-white", border: "border-rose-200", bg: "bg-rose-50" },
  中期: { header: "bg-amber-500 text-white", border: "border-amber-200", bg: "bg-amber-50" },
  長期: { header: "bg-blue-500 text-white", border: "border-blue-200", bg: "bg-blue-50" },
  未定: { header: "bg-slate-400 text-white", border: "border-slate-200", bg: "bg-slate-50" },
};

const CATEGORY_BADGE: Record<Category, string> = {
  短期: "bg-rose-100 text-rose-600 border-rose-200",
  中期: "bg-amber-100 text-amber-600 border-amber-200",
  長期: "bg-blue-100 text-blue-600 border-blue-200",
  未定: "bg-slate-100 text-slate-500 border-slate-200",
};

// 初回ログイン時に localStorage の旧データをクラウドへ移行するための読み込み
function loadLocalBoards(): { name: string; todos: Todo[] }[] {
  try {
    const saved = localStorage.getItem("boards");
    if (saved) {
      const boards = JSON.parse(saved);
      if (Array.isArray(boards) && boards.length > 0) {
        return boards.map((b) => ({ name: b.name, todos: b.todos ?? [] }));
      }
    }
  } catch {}
  return [
    { name: "仕事", todos: [] },
    { name: "プライベート", todos: [] },
  ];
}

export default function Home() {
  const supabase = useRef(createClient()).current;
  const [boards, setBoards] = useState<Board[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeBoardId, setActiveBoardId] = useState<string>("");
  const [input, setInput] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category>("未定");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [dragOverCategory, setDragOverCategory] = useState<Category | null>(null);
  const [editingBoardId, setEditingBoardId] = useState<string | null>(null);
  const [editingBoardName, setEditingBoardName] = useState("");
  const [showNewBoard, setShowNewBoard] = useState(false);
  const [newBoardName, setNewBoardName] = useState("");
  const editRef = useRef<HTMLTextAreaElement>(null);
  const boardEditRef = useRef<HTMLInputElement>(null);
  const prevIdsRef = useRef<string[]>([]);

  // 初回ロード: Supabase から取得。空なら localStorage のデータを移行
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("boards")
        .select("id, name, todos")
        .order("position");
      if (error) {
        console.error("読み込みエラー:", error.message);
        setLoaded(true);
        return;
      }
      if (data.length === 0) {
        const locals = loadLocalBoards();
        const newBoards: Board[] = locals.map((b) => ({
          id: crypto.randomUUID(),
          name: b.name,
          todos: b.todos,
        }));
        await supabase.from("boards").insert(
          newBoards.map((b, i) => ({ id: b.id, name: b.name, todos: b.todos, position: i }))
        );
        setBoards(newBoards);
        setActiveBoardId(newBoards[0].id);
        prevIdsRef.current = newBoards.map((b) => b.id);
      } else {
        setBoards(data as Board[]);
        setActiveBoardId(data[0].id);
        prevIdsRef.current = data.map((b) => b.id);
      }
      setLoaded(true);
    })();
  }, [supabase]);

  // 変更を自動保存（800ms デバウンス）
  useEffect(() => {
    if (!loaded || boards.length === 0) return;
    const timer = setTimeout(async () => {
      setSaving(true);
      const { error } = await supabase.from("boards").upsert(
        boards.map((b, i) => ({ id: b.id, name: b.name, todos: b.todos, position: i }))
      );
      if (error) console.error("保存エラー:", error.message);
      const removed = prevIdsRef.current.filter((id) => !boards.some((b) => b.id === id));
      if (removed.length > 0) {
        await supabase.from("boards").delete().in("id", removed);
      }
      prevIdsRef.current = boards.map((b) => b.id);
      setSaving(false);
    }, 800);
    return () => clearTimeout(timer);
  }, [boards, loaded, supabase]);

  useEffect(() => {
    if (editingId !== null) editRef.current?.focus();
  }, [editingId]);

  useEffect(() => {
    if (editingBoardId !== null) boardEditRef.current?.focus();
  }, [editingBoardId]);

  const logout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const activeBoard = boards.find((b) => b.id === activeBoardId) ?? boards[0];
  const todos = activeBoard?.todos ?? [];

  const setTodos = (updater: (prev: Todo[]) => Todo[]) => {
    setBoards((prev) =>
      prev.map((b) =>
        b.id === activeBoardId ? { ...b, todos: updater(b.todos) } : b
      )
    );
  };

  const addTodo = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    setTodos((prev) => [
      ...prev,
      { id: Date.now(), text: trimmed, done: false, category: selectedCategory },
    ]);
    setInput("");
  };

  const toggleTodo = (id: number) => {
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  };

  const deleteTodo = (id: number) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  };

  const startEdit = (todo: Todo) => {
    setEditingId(todo.id);
    setEditingText(todo.text);
  };

  const commitEdit = () => {
    const trimmed = editingText.trim();
    if (trimmed) {
      setTodos((prev) => prev.map((t) => (t.id === editingId ? { ...t, text: trimmed } : t)));
    }
    setEditingId(null);
  };

  const moveToCategory = (id: number, category: Category) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, category } : t))
    );
  };

  const moveUp = (id: number, category: Category) => {
    setTodos((prev) => {
      const cat = prev.filter((t) => t.category === category);
      const idx = cat.findIndex((t) => t.id === id);
      if (idx <= 0) return prev;
      const targetId = cat[idx - 1].id;
      const ai = prev.findIndex((t) => t.id === id);
      const bi = prev.findIndex((t) => t.id === targetId);
      const next = [...prev];
      [next[ai], next[bi]] = [next[bi], next[ai]];
      return next;
    });
  };

  const moveDown = (id: number, category: Category) => {
    setTodos((prev) => {
      const cat = prev.filter((t) => t.category === category);
      const idx = cat.findIndex((t) => t.id === id);
      if (idx >= cat.length - 1) return prev;
      const targetId = cat[idx + 1].id;
      const ai = prev.findIndex((t) => t.id === id);
      const bi = prev.findIndex((t) => t.id === targetId);
      const next = [...prev];
      [next[ai], next[bi]] = [next[bi], next[ai]];
      return next;
    });
  };

  const addBoard = () => {
    const name = newBoardName.trim();
    if (!name) return;
    const id = crypto.randomUUID();
    setBoards((prev) => [...prev, { id, name, todos: [] }]);
    setActiveBoardId(id);
    setNewBoardName("");
    setShowNewBoard(false);
  };

  const deleteBoard = (id: string) => {
    if (boards.length <= 1) return;
    setBoards((prev) => prev.filter((b) => b.id !== id));
    if (activeBoardId === id) setActiveBoardId(boards.find((b) => b.id !== id)!.id);
  };

  const commitBoardRename = () => {
    const name = editingBoardName.trim();
    if (name) {
      setBoards((prev) => prev.map((b) => (b.id === editingBoardId ? { ...b, name } : b)));
    }
    setEditingBoardId(null);
  };

  const remaining = todos.filter((t) => !t.done).length;

  if (!loaded) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center">
        <p className="text-slate-400 text-sm">読み込み中...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex flex-col items-center pt-8 px-4 pb-10">
      <div className="w-full max-w-6xl">

        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">ToDoリスト</h1>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-300">{saving ? "保存中..." : "✓ 同期済み"}</span>
            <button
              onClick={logout}
              className="text-xs text-slate-400 hover:text-red-400 transition-colors cursor-pointer border border-slate-200 rounded-lg px-3 py-1.5 bg-white"
            >
              ログアウト
            </button>
          </div>
        </div>

        {/* Board Tabs */}
        <div className="flex items-center gap-2 mb-5 flex-wrap">
          {boards.map((board) => (
            <div key={board.id} className="relative group/tab">
              {editingBoardId === board.id ? (
                <input
                  ref={boardEditRef}
                  value={editingBoardName}
                  onChange={(e) => setEditingBoardName(e.target.value)}
                  onBlur={commitBoardRename}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitBoardRename();
                    if (e.key === "Escape") setEditingBoardId(null);
                  }}
                  className="px-3 py-1.5 rounded-xl border-2 border-indigo-400 text-sm font-medium focus:outline-none w-28"
                />
              ) : (
                <button
                  onClick={() => setActiveBoardId(board.id)}
                  onDoubleClick={() => {
                    setEditingBoardId(board.id);
                    setEditingBoardName(board.name);
                  }}
                  className={`px-4 py-1.5 rounded-xl text-sm font-medium transition cursor-pointer border ${
                    activeBoardId === board.id
                      ? "bg-indigo-500 text-white border-indigo-500 shadow-sm"
                      : "bg-white text-slate-500 border-slate-200 hover:border-indigo-300 hover:text-indigo-500"
                  }`}
                >
                  {board.name}
                  {activeBoardId === board.id && todos.length > 0 && (
                    <span className="ml-1.5 text-xs opacity-70">
                      {remaining > 0 ? `残${remaining}` : "✓"}
                    </span>
                  )}
                </button>
              )}
              {/* ボード削除ボタン */}
              {boards.length > 1 && activeBoardId === board.id && (
                <button
                  onClick={() => deleteBoard(board.id)}
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-slate-300 hover:bg-red-400 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover/tab:opacity-100 transition cursor-pointer"
                >
                  ×
                </button>
              )}
            </div>
          ))}

          {/* ボード追加 */}
          {showNewBoard ? (
            <div className="flex gap-1 items-center">
              <input
                autoFocus
                value={newBoardName}
                onChange={(e) => setNewBoardName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") addBoard();
                  if (e.key === "Escape") setShowNewBoard(false);
                }}
                placeholder="ボード名..."
                className="px-3 py-1.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 w-28"
              />
              <button onClick={addBoard} className="px-3 py-1.5 bg-indigo-500 text-white rounded-xl text-sm cursor-pointer hover:bg-indigo-600">追加</button>
              <button onClick={() => setShowNewBoard(false)} className="px-2 py-1.5 text-slate-400 hover:text-slate-600 text-sm cursor-pointer">✕</button>
            </div>
          ) : (
            <button
              onClick={() => setShowNewBoard(true)}
              className="px-3 py-1.5 rounded-xl border border-dashed border-slate-300 text-slate-400 hover:border-indigo-400 hover:text-indigo-500 text-sm transition cursor-pointer"
            >
              ＋ ボード追加
            </button>
          )}
        </div>

        {/* Input */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-5">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && e.metaKey) addTodo(); }}
            placeholder={`「${activeBoard?.name ?? ""}」にタスクを入力...`}
            rows={2}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition resize-none mb-3"
          />
          <div className="flex gap-2 flex-wrap mb-3">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium border transition cursor-pointer ${
                  selectedCategory === cat
                    ? COLUMN_STYLE[cat].header + " border-transparent"
                    : CATEGORY_BADGE[cat]
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <button
            onClick={addTodo}
            className="w-full py-2 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium shadow-sm transition-colors cursor-pointer"
          >
            追加（⌘+Enter）
          </button>
        </div>

        {/* 4列カンバン */}
        <div className="grid grid-cols-4 gap-3">
          {CATEGORIES.map((cat) => {
            const colTodos = todos.filter((t) => t.category === cat);
            const style = COLUMN_STYLE[cat];
            return (
              <div
                key={cat}
                className={`rounded-2xl border ${style.border} overflow-hidden flex flex-col transition-all ${
                  dragOverCategory === cat ? "ring-2 ring-indigo-400 ring-offset-1" : ""
                }`}
                onDragOver={(e) => { e.preventDefault(); setDragOverCategory(cat); }}
                onDragLeave={() => setDragOverCategory(null)}
                onDrop={(e) => {
                  e.preventDefault();
                  if (draggingId !== null) moveToCategory(draggingId, cat);
                  setDraggingId(null);
                  setDragOverCategory(null);
                }}
              >
                <div className={`${style.header} px-4 py-3 flex items-center justify-between`}>
                  <span className="font-semibold text-sm">{cat}</span>
                  <span className="text-xs opacity-80 bg-white/20 rounded-full px-2 py-0.5">{colTodos.length}</span>
                </div>
                <div className={`${style.bg} flex-1 p-2 min-h-40 space-y-2`}>
                  {colTodos.length === 0 && (
                    <p className="text-center text-xs text-slate-300 pt-6">
                      {dragOverCategory === cat ? "ここにドロップ" : "なし"}
                    </p>
                  )}
                  {colTodos.map((todo, idx) => (
                    <div
                      key={todo.id}
                      draggable
                      onDragStart={() => setDraggingId(todo.id)}
                      onDragEnd={() => { setDraggingId(null); setDragOverCategory(null); }}
                      className={`bg-white rounded-xl shadow-sm p-3 group cursor-grab active:cursor-grabbing transition-opacity ${
                        draggingId === todo.id ? "opacity-40" : ""
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <button
                          onClick={() => toggleTodo(todo.id)}
                          className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors cursor-pointer mt-0.5 ${
                            todo.done ? "bg-indigo-500 border-indigo-500" : "border-slate-300 hover:border-indigo-400"
                          }`}
                        >
                          {todo.done && (
                            <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                        <div className="flex-1 min-w-0">
                          {editingId === todo.id ? (
                            <textarea
                              ref={editRef}
                              value={editingText}
                              onChange={(e) => setEditingText(e.target.value)}
                              onBlur={commitEdit}
                              onKeyDown={(e) => { if (e.key === "Escape") setEditingId(null); }}
                              className="w-full text-xs leading-relaxed text-slate-700 bg-indigo-50 border border-indigo-300 rounded-lg px-2 py-1 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400"
                              rows={2}
                            />
                          ) : (
                            <span
                              onClick={() => !todo.done && startEdit(todo)}
                              className={`text-xs leading-relaxed whitespace-pre-wrap block transition-colors ${
                                todo.done ? "line-through text-slate-300" : "text-slate-700 cursor-text hover:text-indigo-600"
                              }`}
                            >
                              {todo.text}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => deleteTodo(todo.id)}
                          className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-400 transition-all cursor-pointer flex-shrink-0"
                        >
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      <div className="flex gap-1 justify-end mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => moveUp(todo.id, cat)} disabled={idx === 0} className="text-slate-300 hover:text-indigo-400 disabled:opacity-20 cursor-pointer">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg>
                        </button>
                        <button onClick={() => moveDown(todo.id, cat)} disabled={idx === colTodos.length - 1} className="text-slate-300 hover:text-indigo-400 disabled:opacity-20 cursor-pointer">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {todos.some((t) => t.done) && (
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => setTodos((prev) => prev.filter((t) => !t.done))}
              className="text-xs text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
            >
              完了済みを削除
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
