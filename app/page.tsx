"use client";

import { useState, useRef, useEffect } from "react";

type Todo = {
  id: number;
  text: string;
  done: boolean;
};

export default function Home() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [input, setInput] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");
  const editRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editingId !== null) editRef.current?.focus();
  }, [editingId]);

  const addTodo = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    setTodos((prev) => [
      ...prev,
      { id: Date.now(), text: trimmed, done: false },
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

  const remaining = todos.filter((t) => !t.done).length;

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-start justify-center pt-16 px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8">
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
        <div className="flex gap-2 mb-6">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && e.metaKey) addTodo();
            }}
            placeholder="タスクを入力..."
            rows={1}
            className="flex-1 px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-300 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition resize-none"
          />
          <button
            onClick={addTodo}
            className="px-5 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700 text-white text-sm font-medium shadow-sm transition-colors cursor-pointer"
          >
            追加
          </button>
        </div>

        {/* Todo list */}
        <ul className="space-y-2">
          {todos.length === 0 && (
            <li className="text-center text-slate-300 text-sm py-12">
              タスクがありません
            </li>
          )}
          {todos.map((todo) => (
            <li
              key={todo.id}
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white border border-slate-100 shadow-sm group transition-all"
            >
              {/* Checkbox */}
              <button
                onClick={() => toggleTodo(todo.id)}
                className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors cursor-pointer ${
                  todo.done
                    ? "bg-indigo-500 border-indigo-500"
                    : "border-slate-300 hover:border-indigo-400"
                }`}
                aria-label={todo.done ? "未完了に戻す" : "完了にする"}
              >
                {todo.done && (
                  <svg
                    className="w-3 h-3 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </button>

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
                  className="flex-1 text-sm leading-relaxed text-slate-700 bg-indigo-50 border border-indigo-300 rounded-lg px-2 py-1 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  rows={2}
                />
              ) : (
                <span
                  onClick={() => !todo.done && startEdit(todo)}
                  className={`flex-1 text-sm leading-relaxed transition-colors whitespace-pre-wrap ${
                    todo.done
                      ? "line-through text-slate-300"
                      : "text-slate-700 cursor-text hover:text-indigo-600"
                  }`}
                >
                  {todo.text}
                </span>
              )}

              {/* Delete */}
              <button
                onClick={() => deleteTodo(todo.id)}
                className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-400 transition-all cursor-pointer"
                aria-label="削除"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
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
