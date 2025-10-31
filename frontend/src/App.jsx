import React, { useEffect, useMemo, useState } from "react";
import { Routes, Route, useNavigate, Link } from "react-router-dom";
import api from "./api";
import { InlineAiButton } from "./AiSuggestions.jsx";

// --- Helpers
const fmtHM = (d) =>
  new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const todayStr = () => new Date().toISOString().slice(0, 10);
const toHours = (secs) => Math.round((secs / 3600) * 10) / 10;

// --- WelcomeScreen.jsx
function WelcomeScreen() {
  const navigate = useNavigate();
  useEffect(() => {
    Notification?.requestPermission?.();
  }, []);

  return (
    <div className="relative flex items-center justify-center min-h-screen px-6">
      <div className="neo-grid"></div>
      <div className="text-center space-y-8 z-10">
        <div className="mx-auto w-fit p-8 solo-card solo-glow">
          <h1 className="welcome-title font-extrabold">Welcome, Player!</h1>
          <p className="mt-2 text-slate-300 max-w-md">
            You have awakened as a Solo Tracker. Chronicle your quests, forge
            habits, and level up daily.
          </p>
        </div>
        <button className="solo-btn" onClick={() => navigate("/dashboard")}>
          Next →
        </button>
      </div>
    </div>
  );
}

// --- ActivityCard.jsx
function ActivityCard({ activity, onToggle, onEdit, onDelete }) {
  return (
    <div className="p-4 solo-card flex items-start justify-between gap-4">
      <div>
        <div className="flex items-center gap-2">
          <h4 className="text-lg font-bold">{activity.title}</h4>
          {activity.completed && (
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
              Completed
            </span>
          )}
        </div>
        {activity.description && (
          <p className="text-slate-300 text-sm mt-1">{activity.description}</p>
        )}
        <div className="text-slate-400 text-sm mt-2">
          {activity.start_time && activity.end_time ? (
            <span>
              {fmtHM(activity.start_time)} → {fmtHM(activity.end_time)}
            </span>
          ) : activity.duration_minutes ? (
            <span>Duration: {activity.duration_minutes}m</span>
          ) : (
            <span>Unscheduled</span>
          )}
          {activity.reminder_time && (
            <span className="ml-3">🔔 {fmtHM(activity.reminder_time)}</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button className="solo-btn" onClick={() => onToggle(activity.id)}>
          {activity.completed ? "Undo" : "Complete"}
        </button>
        <button className="solo-btn" onClick={() => onEdit(activity)}>
          Edit
        </button>
        <button className="solo-btn" onClick={() => onDelete(activity.id)}>
          Delete
        </button>
      </div>
    </div>
  );
}

// --- AddActivityModal.jsx (also used for Edit)
function AddActivityModal({ open, onClose, categories, onSubmit, initial }) {
  const [form, setForm] = useState(
    () =>
      initial || {
        title: "",
        description: "",
        category: categories?.[0]?.id ?? null,
        start_time: "",
        end_time: "",
        duration_minutes: "",
        reminder_time: "",
        completed: false,
      }
  );

  useEffect(() => {
    if (initial) {
      setForm({
        ...initial,
        start_time: initial.start_time ? initial.start_time.slice(0, 16) : "",
        end_time: initial.end_time ? initial.end_time.slice(0, 16) : "",
        reminder_time: initial.reminder_time
          ? initial.reminder_time.slice(0, 16)
          : "",
        duration_minutes: initial.duration_minutes ?? "",
      });
    } else {
      setForm((f) => ({ ...f, category: categories?.[0]?.id ?? null }));
    }
  }, [initial, categories]);

  if (!open) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const submit = () => {
    const payload = {
      ...form,
      category: Number(form.category) || null,
      duration_minutes: form.duration_minutes
        ? Number(form.duration_minutes)
        : null,
      start_time: form.start_time
        ? new Date(form.start_time).toISOString()
        : null,
      end_time: form.end_time ? new Date(form.end_time).toISOString() : null,
      reminder_time: form.reminder_time
        ? new Date(form.reminder_time).toISOString()
        : null,
    };
    onSubmit(payload);
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
      <div className="solo-card w-full max-w-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">
            {initial ? "Edit Activity" : "Add Activity"}
          </h3>
          <button onClick={onClose} className="text-slate-300">
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-slate-300 mb-1">Title</label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              className="w-full p-2 rounded bg-slate-900/60 border border-slate-700"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">
              Category
            </label>
            <select
              name="category"
              value={form.category ?? ""}
              onChange={handleChange}
              className="w-full p-2 rounded bg-slate-900/60 border border-slate-700"
            >
              {categories?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm text-slate-300 mb-1">Notes</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows="2"
              className="w-full p-2 rounded bg-slate-900/60 border border-slate-700"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1">Start</label>
            <input
              type="datetime-local"
              name="start_time"
              value={form.start_time}
              onChange={handleChange}
              className="w-full p-2 rounded bg-slate-900/60 border border-slate-700"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">End</label>
            <input
              type="datetime-local"
              name="end_time"
              value={form.end_time}
              onChange={handleChange}
              className="w-full p-2 rounded bg-slate-900/60 border border-slate-700"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">
              Duration (min) — optional
            </label>
            <input
              type="number"
              min="1"
              name="duration_minutes"
              value={form.duration_minutes}
              onChange={handleChange}
              className="w-full p-2 rounded bg-slate-900/60 border border-slate-700"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">
              Reminder
            </label>
            <input
              type="datetime-local"
              name="reminder_time"
              value={form.reminder_time}
              onChange={handleChange}
              className="w-full p-2 rounded bg-slate-900/60 border border-slate-700"
            />
          </div>

          <div className="md:col-span-2 flex items-center gap-2">
            <input
              type="checkbox"
              name="completed"
              checked={!!form.completed}
              onChange={handleChange}
            />
            <span className="text-slate-300 text-sm">Mark as completed</span>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button className="solo-btn" onClick={submit}>
            {initial ? "Save" : "Add"}
          </button>
          <button className="solo-btn" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Goals Modal
function GoalsModal({ open, onClose, categories, goals, saveGoals }) {
  const [local, setLocal] = useState(goals || {});

  useEffect(() => {
    setLocal(goals || {});
  }, [goals]);

  if (!open) return null;

  const setVal = (id, val) => {
    setLocal((prev) => ({
      ...prev,
      [id]: { minutes: Math.max(0, Number(val) || 0) },
    }));
  };

  const handleSave = () => {
    saveGoals(local);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
      <div className="solo-card w-full max-w-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold">Set Daily Goals</h3>
          <button onClick={onClose} className="text-slate-300">
            ✕
          </button>
        </div>
        <p className="text-slate-300 text-sm">
          Enter target minutes per category for today (e.g., 60 = 1 hour).
        </p>
        <div className="grid gap-3">
          {categories.map((c) => (
            <label
              key={c.id}
              className="flex items-center justify-between gap-3"
            >
              <span className="text-slate-200">{c.name}</span>
              <input
                type="number"
                min="0"
                value={local?.[c.id]?.minutes ?? ""}
                onChange={(e) => setVal(c.id, e.target.value)}
                className="w-32 p-2 rounded bg-slate-900/60 border border-slate-700 text-right"
                placeholder="minutes"
              />
            </label>
          ))}
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button className="solo-btn" onClick={handleSave}>
            Save Goals
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Dashboard.jsx
function Dashboard() {
  const [categories, setCategories] = useState([]);
  const [activities, setActivities] = useState([]);
  const [stats, setStats] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [date, setDate] = useState(todayStr());
  const [selectedCategory, setSelectedCategory] = useState("");
  const [tab, setTab] = useState("todo"); // 'todo' | 'done'
  const [goalsOpen, setGoalsOpen] = useState(false);
  const [goals, setGoals] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("goals_v1") || "{}");
    } catch {
      return {};
    }
  });

  // Daily streak (very simple local version)
  const [streak, setStreak] = useState(() =>
    Number(localStorage.getItem("streak") || 0)
  );

  const scheduleReminders = (items) => {
    if (!("Notification" in window)) return;
    items.forEach((a) => {
      if (!a.reminder_time) return;
      const when = new Date(a.reminder_time).getTime() - Date.now();
      if (when > 0 && when < 24 * 3600 * 1000) {
        setTimeout(() => {
          if (Notification.permission === "granted") {
            new Notification("Solo Tracker", { body: `${a.title} — reminder` });
          }
        }, when);
      }
    });
  };

  const fetchAll = async () => {
    // Ensure categories exist (bootstrap defaults if empty)
    let cats = await api.getCategories();
    if (!cats || cats.length === 0) {
      cats = await api.ensureDefaultCategories();
    }
    setCategories(cats);

    const acts = await api.getActivitiesByDate(
      date,
      selectedCategory || undefined
    );
    setActivities(acts);

    const st = await api.getStatsToday();
    setStats(st);

    scheduleReminders(acts);
  };

  useEffect(() => {
    fetchAll();
  }, [date, selectedCategory]);

  const grouped = useMemo(() => {
    const byCat = {};
    for (const c of categories) byCat[c.id] = [];
    for (const a of activities) {
      const key = a.category;
      if (!byCat[key]) byCat[key] = [];
      byCat[key].push(a);
    }
    return byCat;
  }, [categories, activities]);

  const todos = activities.filter((a) => !a.completed);
  const dones = activities.filter((a) => a.completed);

  const onToggle = async (id) => {
    await api.toggleComplete(id);
    await fetchAll();
    // naive streak: if everything today is completed
    const latest = await api.getActivitiesByDate(
      date,
      selectedCategory || undefined
    );
    if (latest.length > 0 && latest.every((a) => a.completed)) {
      const ns = streak + 1;
      setStreak(ns);
      localStorage.setItem("streak", String(ns));
    }
  };

  const onDelete = async (id) => {
    await api.deleteActivity(id);
    fetchAll();
  };

  const onEdit = (a) => {
    setEditing(a);
    setModalOpen(true);
  };

  const onCreateSubmit = async (payload) => {
    if (editing) {
      await api.updateActivity(editing.id, payload);
      setEditing(null);
    } else {
      await api.createActivity(payload);
    }
    setModalOpen(false);
    fetchAll();
  };

  // Helper: seconds spent today for a category from stats endpoint
  const secondsFor = (catId) => {
    const row = stats.find((r) => r.category.id === catId);
    return row ? row.seconds : 0;
  };

  // Goals helpers
  const saveGoals = (next) => {
    setGoals(next);
    localStorage.setItem("goals_v1", JSON.stringify(next));
  };

  const goalMinutes = (catId) => goals?.[catId]?.minutes || 0;
  const percentFor = (catId) => {
    const goal = goalMinutes(catId) * 60;
    const secs = secondsFor(catId);
    if (goal <= 0) return Math.min(100, Math.round((secs / (4 * 3600)) * 100)); // fallback to 4h scale if no goal
    return Math.min(100, Math.round((secs / goal) * 100));
  };

  // "New Category" quick add
  const quickAddCategory = async () => {
    const name = window.prompt("New category name:");
    if (!name) return;
    try {
      await api.createCategory(name);
      fetchAll();
    } catch (e) {
      alert("Could not create category. It may already exist.");
    }
  };

  return (
    <div className="min-h-screen">
      <div className="neo-grid"></div>
      <header className="relative z-10 p-4 flex flex-wrap items-center justify-between gap-3">
        <Link to="/welcome" className="font-bold tracking-wide">
          Solo Tracker
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <div className="text-sm text-slate-300">
            🔥 Streak: <b>{streak}</b>
          </div>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-slate-900/60 border border-slate-700 rounded p-2 text-slate-200"
          />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-900/60 border border-slate-700 rounded p-2 text-slate-200"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <button className="solo-btn" onClick={quickAddCategory}>
            New Category
          </button>
          <button className="solo-btn" onClick={() => setGoalsOpen(true)}>
            Goals
          </button>
          <button className="solo-btn" onClick={() => setModalOpen(true)}>
            + Add
          </button>
          <InlineAiButton date={date} />
        </div>
      </header>

      <main className="relative z-10 p-4 md:p-8 grid gap-6">
        {/* Tabs: To-do / Completed */}
        <div className="flex gap-2">
          <button
            className={`solo-btn ${tab === "todo" ? "" : "opacity-60"}`}
            onClick={() => setTab("todo")}
          >
            To-do ({todos.length})
          </button>
          <button
            className={`solo-btn ${tab === "done" ? "" : "opacity-60"}`}
            onClick={() => setTab("done")}
          >
            Completed ({dones.length})
          </button>
        </div>

        {/* Category sections */}
        {categories.map((cat) => {
          if (selectedCategory && String(cat.id) !== String(selectedCategory))
            return null;
          const list = (grouped[cat.id] || []).filter((a) =>
            tab === "todo" ? !a.completed : a.completed
          );
          const secs = secondsFor(cat.id);
          const hrs = toHours(secs);
          const goalMin = goalMinutes(cat.id);
          const pct = percentFor(cat.id);

          return (
            <section key={cat.id} className="space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <h3 className="text-xl font-extrabold">
                  {cat.name}
                  <span className="ml-3 text-sm font-normal text-slate-300">
                    {goalMin > 0
                      ? `${hrs}h / ${(goalMin / 60).toFixed(1)}h • ${pct}%`
                      : `${hrs}h`}
                  </span>
                </h3>
                <div className="w-64 progress">
                  <div style={{ width: `${pct}%` }} />
                </div>
              </div>
              <div className="grid gap-3">
                {list.map((a) => (
                  <ActivityCard
                    key={a.id}
                    activity={a}
                    onToggle={onToggle}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                ))}
                {list.length === 0 && (
                  <div className="p-4 solo-card text-slate-300">
                    No {tab === "todo" ? "tasks" : "completed items"} here.
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </main>

      <AddActivityModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        categories={categories}
        onSubmit={onCreateSubmit}
        initial={editing}
      />

      <GoalsModal
        open={goalsOpen}
        onClose={() => setGoalsOpen(false)}
        categories={categories}
        goals={goals}
        saveGoals={saveGoals}
      />
    </div>
  );
}

// --- App.jsx root
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<WelcomeScreen />} />
      <Route path="/welcome" element={<WelcomeScreen />} />
      <Route path="/dashboard" element={<Dashboard />} />
    </Routes>
  );
}
