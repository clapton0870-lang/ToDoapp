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

const COLUMN_STYLE: Record<Category, { header: string; badge: string; border: string; bg: string }> = {
  短期: {
    header: "bg-rose-500 text-white",
    badge: "bg-rose-100 text-rose-600 border-rose-200",
    border: "border-rose-200",
    bg: "bg-rose-50",
  },
  中期: {
    header: "bg-amber-500 text-white",
    badge: "bg-amber-100 text-amber-600 border-amber-200",
    border: "border-amber-200",
    bg: "bg-amber-50",
  },
  長期: {
    header: "bg-blue-500 text-white",
    badge: "bg-blue-100 text-blue-600 border-blue-200",
    border: "border-blue-200",
    bg: "bg-blue-50",
  },
  未定: {
    header: "bg-slate-400 text-white",
    badge: "bg-slate-100 text-slate-500 border-slate-200",
    border: "border-slate-200",
    bg: "bg-slate-50",
  },
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

  const moveUp = (id: number, category: Category) => {
    setTodos((prev) => {
      const categoryTodos = prev.filter((t) => t.category === category);
      const idx = categoryTodos.findIndex((t) => t.id === id);
      if (idx <= 0) return prev;
      const targetId = categoryTodos[idx - 1].id;
      const allIdx = prev.findIndex((t) => t.id === id);
      const targetAllIdx = prev.findIndex((t) => t.id === targetId);
      const next = [...prev];
      [next[allIdx], next[targetAllIdx]] = [next[targetAllIdx], next[allIdx]];
      return next;
    });
  };

  const moveDown = (id: number, category: Category) => {
    setTodos((prev) => {
      const categoryTodos = prev.filter((t) => t.category === category);
      const idx = categoryTodos.findIndex((t) => t.id === id);
      if (idx >= categoryTodos.length - 1) return prev;
      const targetId = categoryTodos[idx + 1].id;
      const allIdx = prev.findIndex((t) => t.id === id);
      const targetAllIdx = prev.findIndex((t) => t.id === targetId);
      const next = [...prev];
      [next[allIdx], next[targetAllIdx]] = [next[targetAllIdx], next[allIdx]];
      return next;
    });
  };

  const remaining = todos.filter((t) => !t.done).length;

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex flex-col items-center pt-10 px-4 pb-10">
      <div className="w-full max-w-6xl">
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
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-6">
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
          <div className="flex gap-2 flex-wrap mb-3">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium border transition cursor-pointer ${
                  selectedCategory === cat
                    ? COLUMN_STYLE[cat].header + " border-transparent"
                    : COLUMN_STYLE[cat].badge
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

        {/* 4列カンバン */}
        <div className="grid grid-cols-4 gap-3">
          {CATEGORIES.map((cat) => {
            const colTodos = todos.filter((t) => t.category === cat);
            const style = COLUMN_STYLE[cat];
            return (
              <div key={cat} className={`rounded-2xl border ${style.border} overflow-hidden flex flex-col`}>
                {/* Column Header */}
                <div className={`${style.header} px-4 py-3 flex items-center justify-between`}>
                  <span className="font-semibold text-sm">{cat}</span>
                  <span className="text-xs opacity-80 bg-white/20 rounded-full px-2 py-0.5">
                    {colTodos.length}
                  </span>
                </div>

                {/* Column Body */}
                <div className={`${style.bg} flex-1 p-2 min-h-40 space-y-2`}>
                  {colTodos.length === 0 && (
                    <p className="text-center text-xs text-slate-300 pt-6">なし</p>
                  )}
                  {colTodos.map((todo, idx) => (
                    <div
                      key={todo.id}
                      className="bg-white rounded-xl border border-white shadow-sm p-3 group"
                    >
                      <div className="flex items-start gap-2">
                        {/* Checkbox */}
                        <button
                          onClick={() => toggleTodo(todo.id)}
                          className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors cursor-pointer mt-0.5 ${
                            todo.done
                              ? "bg-indigo-500 border-indigo-500"
                              : "border-slate-300 hover:border-indigo-400"
                          }`}
                        >
                          {todo.done && (
                            <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>

                        {/* Text */}
                        <div className="flex-1 min-w-0">
                          {editingId === todo.id ? (
                            <textarea
                              ref={editRef}
                              value={editingText}
                              onChange={(e) => setEditingText(e.target.value)}
                              onBlur={commitEdit}
                              onKeyDown={(e) => {
                                if (e.key === "Escape") setEditingId(null);
                              }}
                              className="w-full text-xs leading-relaxed text-slate-700 bg-indigo-50 border border-indigo-300 rounded-lg px-2 py-1 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400"
                              rows={2}
                            />
                          ) : (
                            <span
                              onClick={() => !todo.done && startEdit(todo)}
                              className={`text-xs leading-relaxed whitespace-pre-wrap block transition-colors ${
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
                          className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-400 transition-all cursor-pointer flex-shrink-0"
                        >
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>

                      {/* 並び替えボタン */}
                      <div className="flex gap-1 justify-end mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => moveUp(todo.id, cat)}
                          disabled={idx === 0}
                          className="text-slate-300 hover:text-indigo-400 disabled:opacity-20 cursor-pointer"
                        >
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => moveDown(todo.id, cat)}
                          disabled={idx === colTodos.length - 1}
                          className="text-slate-300 hover:text-indigo-400 disabled:opacity-20 cursor-pointer"
                        >
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

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
