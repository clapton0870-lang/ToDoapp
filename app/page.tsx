"use client";

import { useState, useRef, useEffect } from "react";

type Category = "短期" | "中期" | "長期" | "未定";

type Todo = {
  id: number;
  text: string;
  done: boolean;
  category: Category;
};

const CATEGORIES: Category[] = ["短期", "中期", "長期", "未定"];

const CATEGORY_COLOR: Record<Category, string> = {
  短期: "bg-rose-100 text-rose-600 border-rose-200",
  中期: "bg-amber-100 text-amber-600 border-amber-200",
  長期: "bg-blue-100 text-blue-600 border-blue-200",
  未定: "bg-slate-100 text-slate-500 border-slate-200",
};

const CATEGORY_ACTIVE: Record<Category, string> = {
  短期: "bg-rose-500 text-white border-rose-500",
  中期: "bg-amber-500 text-white border-amber-500",
  長期: "bg-blue-500 text-white border-blue-500",
  未定: "bg-slate-400 text-white border-slate-400",
};

export default function Home() {
  const [todos, setTodos] = useState<Todo[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem("todos");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [input, setInput] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category>("未定");
  const [activeTab, setActiveTab] = useState<Category | "すべて">("すべて");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");
  const editRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    localStorage.setItem("todos", JSON.stringify(todos));
  }, [todos]);

  useEffect(() => {
    if (editingId !== null) editRef.current?.focus();
  }, [editingId]);

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
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
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
      setTodos((prev) =>
        prev.map((t) => (t.id === editingId ? { ...t, text: trimmed } : t))
      );
    }
    setEditingId(null);
  };

  const changeCategory = (id: number, category: Category) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, category } : t))
    );
  };

  const moveUp = (id: number) => {
    setTodos((prev) => {
      const idx = prev.findIndex((t) => t.id === id);
      if (idx <= 0) return prev;
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next;
    });
  };

  const moveDown = (id: number) => {
    setTodos((prev) => {
      const idx = prev.findIndex((t) => t.id === id);
      if (idx >= prev.length - 1) return prev;
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next;
    });
  };

  const filteredTodos =
    activeTab === "すべて"
      ? todos
      : todos.filter((t) => t.category === activeTab);

  const remaining = todos.filter((t) => !t.done).length;

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-start justify-center pt-12 px-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
            ToDoリスト
          </h1>
          {todos.length > 0 && (
            <p className="mt-1 text-sm text-slate-400">
              残り {remaining} 件 / 全 {todos.length} 件
            </p>
          )}
        </div>

        {/* Input */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-4">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && e.metaKey) addTodo();
            }}
            placeholder="タスクを入力..."
            rows={2}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition resize-none mb-3"
          />
          {/* Category selector */}
          <div className="flex gap-2 flex-wrap mb-3">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition cursor-pointer ${
                  selectedCategory === cat
                    ? CATEGORY_ACTIVE[cat]
                    : CATEGORY_COLOR[cat]
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <button
            onClick={addTodo}
            className="w-full py-2 rounded-xl bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700 text-white text-sm font-medium shadow-sm transition-colors cursor-pointer"
          >
            追加（⌘+Enter）
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-3 bg-white rounded-xl p-1 border border-slate-100 shadow-sm">
          {(["すべて", ...CATEGORIES] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                activeTab === tab
                  ? "bg-indigo-500 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {tab}
              {tab !== "すべて" && (
                <span className="ml-1 opacity-70">
                  ({todos.filter((t) => t.category === tab).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Todo list */}
        <ul className="space-y-2">
          {filteredTodos.length === 0 && (
            <li className="text-center text-slate-300 text-sm py-12">
              タスクがありません
            </li>
          )}
          {filteredTodos.map((todo, idx) => (
            <li
              key={todo.id}
              className="flex items-start gap-3 px-4 py-3 rounded-xl bg-white border border-slate-100 shadow-sm group transition-all"
            >
              {/* 並び替えボタン */}
              <div className="flex flex-col gap-0.5 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => moveUp(todo.id)}
                  disabled={idx === 0}
                  className="text-slate-300 hover:text-indigo-400 disabled:opacity-20 cursor-pointer"
                  aria-label="上へ"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                  </svg>
                </button>
                <button
                  onClick={() => moveDown(todo.id)}
                  disabled={idx === filteredTodos.length - 1}
                  className="text-slate-300 hover:text-indigo-400 disabled:opacity-20 cursor-pointer"
                  aria-label="下へ"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>

              {/* Checkbox */}
              <button
                onClick={() => toggleTodo(todo.id)}
                className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors cursor-pointer mt-0.5 ${
                  todo.done
                    ? "bg-indigo-500 border-indigo-500"
                    : "border-slate-300 hover:border-indigo-400"
                }`}
                aria-label={todo.done ? "未完了に戻す" : "完了にする"}
              >
                {todo.done && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>

              {/* Content */}
              <div className="flex-1 min-w-0">
                {/* Category badge + change */}
                <div className="flex gap-1 flex-wrap mb-1">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => changeCategory(todo.id, cat)}
                      className={`px-2 py-0.5 rounded-full text-xs border transition cursor-pointer ${
                        todo.category === cat
                          ? CATEGORY_ACTIVE[cat]
                          : "bg-transparent border-slate-100 text-slate-300 hover:border-slate-300"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Text / Edit */}
                {editingId === todo.id ? (
                  <textarea
                    ref={editRef}
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                    onBlur={commitEdit}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    className="w-full text-sm leading-relaxed text-slate-700 bg-indigo-50 border border-indigo-300 rounded-lg px-2 py-1 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    rows={2}
                  />
                ) : (
                  <span
                    onClick={() => !todo.done && startEdit(todo)}
                    className={`text-sm leading-relaxed whitespace-pre-wrap block transition-colors ${
                      todo.done
                        ? "line-through text-slate-300"
                        : "text-slate-700 cursor-text hover:text-indigo-600"
                    }`}
                  >
                    {todo.text}
                  </span>
                )}
              </div>

              {/* Delete */}
              <button
                onClick={() => deleteTodo(todo.id)}
                className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-400 transition-all cursor-pointer mt-0.5"
                aria-label="削除"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </li>
          ))}
        </ul>

        {/* Clear completed */}
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
