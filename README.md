

# Solo Tracker – Complete Guide (with AI Coach & Reminders)

## 1. What is Solo Tracker?

**Solo Tracker** is a small full-stack productivity app that helps you:

* Log your daily activities (Work, Workout, Reading, etc.)
* See how much time you spend in each category
* Set **daily time goals** per category
* Track a simple **streak**
* Get **browser reminders** for planned tasks
* Use an **AI coach button** that calls a **Large Language Model (LLM)** to generate personalized suggestions based on your actual activity log

Visually it has a **“neo-grid” / glowing card** style, so it feels a bit like a tiny game dashboard rather than a boring CRUD app.

---

## 2. Tech Stack

**Backend (API)**

* Python 3.11+
* Django 4+
* Django REST Framework (DRF)
* `openai` Python client (used with OpenAI-compatible endpoints like **Ollama**)
* SQLite by default (DB file is `backend/db.sqlite3`)
* Ready for deployment (has `requirements.txt`, `runtime.txt`)

**Frontend (UI)**

* Node.js + npm
* Vite
* React
* React Router
* Axios
* Custom CSS theme (`theme.css`)

---

## 3. Project Structure

After cloning the repo **or** downloading and unzipping `solo-tracker-main.zip`, you’ll have the `solo-tracker` project folder on your machine.

To clone with git (recommended):

```bash
git clone https://github.com/Sanapala-Aravind/solo-tracker.git
cd solo-tracker
```

```text
solo-tracker-main/
├── backend/
│   ├── db.sqlite3          # SQLite DB (already created, you can reuse or delete)
│   ├── manage.py           # Django entry point
│   ├── requirements.txt    # Backend dependencies (Django, DRF, etc.)
│   ├── runtime.txt         # Python version (for PaaS like Render/Heroku)
│   ├── player/             # Django project config
│   │   ├── __init__.py
│   │   ├── asgi.py
│   │   ├── wsgi.py
│   │   ├── middleware.py   # Simple CORS middleware
│   │   └── settings.py     # Core settings (DB, REST, timezone, etc.)
│   └── tracker/            # Main app: activities, categories, AI
│       ├── __init__.py
│       ├── admin.py        # Admin registration for Activity & Category
│       ├── models.py       # Activity & ActivityCategory models
│       ├── serializers.py  # DRF serializers
│       ├── urls.py         # /api/ routes (activities, categories)
│       ├── views.py        # CRUD, stats, AI suggestions endpoints
│       ├── ai.py           # LLM integration used by the AI button
│       └── migrations/     # Database schema + default categories
│           ├── 0001_initial.py
│           └── 0002_default_categories.py
└── frontend/
    ├── index.html
    ├── package.json        # Frontend dependencies & scripts
    ├── vite.config.js      # Vite dev server + API proxy config
    └── src/
        ├── main.jsx        # React entry: sets up router & global AI button
        ├── App.jsx         # Screens, components, dashboard logic
        ├── api.js          # Axios-based API helpers for /api/*
        ├── AiSuggestions.jsx # AI modal + floating AI button
        └── theme.css       # All main styling for “Solo” look
```

### 3.1 Backend: Models & Endpoints

#### Models (`backend/tracker/models.py`)

* **ActivityCategory**

  * `name` – short label, e.g. `"Work"`, `"Workout"`, `"Reading"`

* **Activity**

  * `title` – short description (“Deep work block”, “Gym”, “Reading”)
  * `description` – free-text notes
  * `category` – FK → `ActivityCategory`
  * `start_time`, `end_time` – optional timestamps
  * `duration_minutes` – optional duration if you don’t use start/end
  * `reminder_time` – optional time for browser reminder notification
  * `completed` – boolean
  * `created_at`, `updated_at` – auto timestamps

#### API Routes (`backend/tracker/urls.py`)

All under `/api/` (because `player/urls.py` includes `path("api/", include("tracker.urls"))`):

Categories:

* `GET /api/categories/` – list categories
* `POST /api/categories/` – create a category `{ "name": "Workout" }`
* `PUT/PATCH/DELETE /api/categories/{id}/` – update/delete category

Activities:

* `GET /api/activities/` – list all activities
* `POST /api/activities/` – create a new activity
* `GET /api/activities/{id}/` – single activity
* `PATCH /api/activities/{id}/` – update (e.g. to edit title)
* `DELETE /api/activities/{id}/` – delete

Extra activity actions:

* `GET /api/activities/by-date/?date=YYYY-MM-DD`
  All activities overlapping that date
* `GET /api/activities/stats-today/`
  Aggregated **seconds per category** for today (used for progress bars)
* `POST /api/activities/{id}/toggle-complete/`
  Toggle `completed` flag
* `GET /api/activities/ai_suggestions/?date=YYYY-MM-DD`
  **Calls the LLM** and returns AI suggestions based on that day’s activities

#### Admin (`backend/tracker/admin.py`)

* `ActivityCategory` and `Activity` are registered:

  * You can log into `/admin/` (after creating a superuser) to inspect and edit data in a GUI.

#### Simple CORS Middleware (`backend/player/middleware.py`)

* `SimpleCORS` is added to `MIDDLEWARE` in `settings.py`.
* It sets permissive CORS headers so the Vite dev server (`localhost:5173`) can talk to Django (`localhost:8000`) easily during development.

---

### 3.2 Frontend: Screens & Components

#### Entry (`frontend/src/main.jsx`)

* Imports `App`, `GlobalAiButton` and CSS theme.
* Wraps everything in a `<BrowserRouter>`.
* Ensures default categories are present before first render:

  ```js
  api.ensureDefaultCategories?.().catch(() => {});
  ```
* Renders:

  ```jsx
  <BrowserRouter>
    <App />
    <GlobalAiButton />
  </BrowserRouter>
  ```

  So the **floating AI button** is available on every page.

#### App + Screens (`frontend/src/App.jsx`)

Main screens & components:

* **WelcomeScreen**

  * Asks for browser notification permission:

    ```js
    useEffect(() => {
      Notification?.requestPermission?.();
    }, []);
    ```
  * Shows a “game-like” welcome message.
  * Button → navigates to `/dashboard`.

* **Dashboard**

  * Central view where you spend most time:

    * Date picker
    * Category filter dropdown
    * Tab: `Todo` / `Done`
    * List of activities for the selected date
    * **Progress cards** per category with:

      * Time spent today (hours)
      * Progress vs daily goal (%)
      * Nice gradient progress bar

  * Extra UX features:

    * **Quick add category** (“New Category”) inline from the dashboard
    * **Daily streak** indicator
    * “Daily Goals” button to set per-category target minutes

* **GoalsModal**

  * Lets you set **goal minutes per category**.
  * Example: Work = 240, Workout = 60, Reading = 30.
  * Goals are saved in `localStorage` (`goals_v1`).
  * Dashboard uses these to compute percentage completion for each category.

* **ActivityCard**

  * Shows:

    * Title, category, notes
    * Time range (start → end) OR `Duration: Xm` OR `Unscheduled`
    * If `reminder_time` is set, it shows `🔔 HH:MM`
    * `Complete / Undo` button
    * `Edit` button
    * `Delete` button

* **AddActivityModal**

  * Modal form to **add or edit** an activity.
  * Fields:

    * Title
    * Category (select)
    * Notes
    * Start time (datetime-local)
    * End time (datetime-local)
    * Duration (minutes)
    * Reminder time (datetime-local)
    * “Mark as completed” checkbox
  * When you save:

    * Converts selected times into ISO strings for the backend.
    * Calls `onSubmit(payload)` which creates/updates activity through the API.

* **Reminders (browser notifications)**

  * Dashboard schedules reminders for activities with a `reminder_time`:

    ```js
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
    ```
  * Practically, this means:

    * If you create an activity “Call Mom” at 5:00 PM with a reminder at 4:55 PM, your browser can show a native notification at 4:55 PM (as long as the tab is open and notifications are allowed).

#### API Helpers (`frontend/src/api.js`)

Wraps all calls to `/api/...` with Axios:

* Category APIs:

  * `getCategories()`
  * `createCategory(name)`
  * `ensureDefaultCategories()` – if there are no categories, creates a basic set (`Work`, `Personal`, `Health`, `Study`, `Reading`, `Workout`, `Meals`, etc.)

* Activity APIs:

  * `getActivities()`
  * `getActivitiesByDate(dateIso)`
  * `getStatsToday()`
  * `createActivity(payload)`
  * `updateActivity(id, payload)`
  * `deleteActivity(id)`
  * `toggleComplete(id)`

* AI API:

  * `getAiSuggestions(dateIso)` → calls `/activities/ai_suggestions/?date=YYYY-MM-DD`.

#### AI UI (`frontend/src/AiSuggestions.jsx`)

Three main pieces:

* **AiSuggestionsModal**

  * Props: `{ open, onClose, date }`
  * When `open` becomes `true`:

    * Calls `api.getAiSuggestions(date)`
    * Shows “Generating suggestions…” while loading
    * On success: displays returned text in a nice panel
    * On error: shows an error message

* **InlineAiButton**

  * A small button you can embed inside any screen (e.g., near the date picker) to open the AI modal for the current date.

* **GlobalAiButton** (default export)

  * Floating button in bottom-right corner of the screen:

    ```jsx
    <div
      className="fixed bottom-6 right-6 solo-btn"
      title="AI suggestion"
    >
      AI suggestion
    </div>
    ```
  * Clicking it opens `AiSuggestionsModal` for the currently selected date (defaults to **today** if not overridden).

#### Styling (`frontend/src/theme.css`)

* Sets a game-like background:

  * `bg-solo`, `neo-grid`, glowing cards (`solo-card`, `solo-glow`), etc.
* Styled buttons: `.solo-btn`
* Progress bars, layout spacing, etc.

You don’t *need* to understand the CSS to run the app, but it’s there if you want to tweak the look.

---

## 4. How the AI Button Calls the LLM (Step by Step)

### 4.1 Frontend → Backend

1. User clicks the **AI suggestion** button (floating or inline).

2. `GlobalAiButton` sets `open = true` and renders `AiSuggestionsModal`.

3. `AiSuggestionsModal` runs:

   ```js
   useEffect(() => {
     if (!open) return;
     setLoading(true);
     setText("");
     setError("");
     api
       .getAiSuggestions(date)
       .then((res) => setText(res.suggestions))
       .catch(() => setError("There was a problem talking to the AI coach."))
       .finally(() => setLoading(false));
   }, [open, date]);
   ```

4. `api.getAiSuggestions(dateIso)` sends a GET request to:

   ```text
   /api/activities/ai_suggestions/?date=YYYY-MM-DD
   ```

   (Vite proxies `/api` to `http://localhost:8000`.)

### 4.2 Backend: Preparing Data

In `backend/tracker/views.py`:

* The `ActivityViewSet` has an action `ai_suggestions`:

  * Parses `date` query parameter.

  * Defines a 24-hour interval for that date in the current timezone.

  * Queries `Activity` objects that overlap that date.

  * Builds a Python list of dicts:

    ```python
    rows = [{
        "title": a.title,
        "category_name": a.category.name if a.category_id else "",
        "start_time": a.start_time.isoformat() if a.start_time else None,
        "end_time": a.end_time.isoformat() if a.end_time else None,
        "duration_minutes": a.duration_minutes,
        "completed": a.completed,
    } for a in qs]
    ```

  * Calls `get_suggestions(date_str, rows)` from `backend/tracker/ai.py`.

### 4.3 Backend: Talking to the LLM (`backend/tracker/ai.py`)

* System prompt defines the “personality”:

  ```python
  SYSTEM_PROMPT = (
      "You are a focused productivity coach.\n"
      "Given activity logs, return 3–6 clear, actionable suggestions to improve the user's day.\n"
      "Keep it specific, prioritised, and concise. Use bullets, not paragraphs.\n"
      "If data is sparse, say so and suggest helpful next steps."
  )
  ```

* Client setup (note the environment variables):

  ```python
  def _client():
      base_url = os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434/v1")
      api_key = os.environ.get("OLLAMA_API_KEY", "ollama")
      return OpenAI(base_url=base_url, api_key=api_key)
  ```

* When `get_suggestions` is called:

  ```python
  def get_suggestions(date_str: str, rows: List[Dict]) -> str:
      client = _client()
      model = os.environ.get("OLLAMA_MODEL", "llama3:8b")
      prompt = build_user_prompt(date_str, rows)
      resp = client.chat.completions.create(
          model=model,
          temperature=0.4,
          messages=[
              {"role": "system", "content": SYSTEM_PROMPT},
              {"role": "user", "content": prompt},
          ],
      )
      return resp.choices[0].message.content.strip()
  ```

* `build_user_prompt` makes a text table with all activities for that day so the model has context.

### 4.4 Backend → Frontend

* The view returns JSON like:

  ```json
  {
    "date": "2025-01-01",
    "count": 7,
    "suggestions": "• Bullet 1\n• Bullet 2\n• Bullet 3"
  }
  ```

* Frontend displays `.suggestions` in the modal.
  All LLM details (base URL, API key, model) stay **on the backend**.

---

## 5. LLM / AI Setup (Environment Variables)

This project expects an OpenAI-compatible endpoint, e.g. **Ollama** running locally.

Environment variables used (on the backend):

* `OLLAMA_BASE_URL` – default: `http://localhost:11434/v1`
* `OLLAMA_API_KEY` – default: `"ollama"` (Ollama doesn’t really need it, but the OpenAI client expects something)
* `OLLAMA_MODEL` – default: `"llama3:8b"`

### Example: Using Ollama locally

1. Install [Ollama](https://ollama.com/).

2. Download a model:

   ```bash
   ollama pull llama3
   ```

3. Make sure Ollama is running (it usually runs as a background service).

4. In the **backend terminal**, set env vars before running `runserver`:

   **macOS / Linux (bash/zsh):**

   ```bash
   export OLLAMA_BASE_URL="http://127.0.0.1:11434/v1"
   export OLLAMA_API_KEY="ollama"
   export OLLAMA_MODEL="llama3:8b"
   ```

   **Windows (Command Prompt):**

   ```cmd
   set OLLAMA_BASE_URL=http://127.0.0.1:11434/v1
   set OLLAMA_API_KEY=ollama
   set OLLAMA_MODEL=llama3:8b
   ```

If these are not set and the AI endpoint isn’t reachable, the AI button will show an error message instead of suggestions.

---

## 6. Running the Project Locally

You’ll run **backend and frontend in two separate terminals**.

### 6.1 Backend (Django API)

From the repo root:

```bash
cd solo-tracker-main/backend
```

1. **Create & activate virtual env**

   ```bash
   python -m venv .venv

   # macOS / Linux:
   source .venv/bin/activate

   # Windows (PowerShell):
   .venv\Scripts\Activate.ps1
   ```

2. **Install dependencies**

   ```bash
   pip install -r requirements.txt
   pip install openai
   ```

3. (Optional) **Reset DB** if you want a fresh start:

   * Delete `db.sqlite3`:

     ```bash
     rm db.sqlite3  # or del db.sqlite3 on Windows
     ```
   * Then run migrations:

     ```bash
     python manage.py migrate
     ```

   If you keep `db.sqlite3`, it already has the schema and possibly some sample data.

4. (Optional) **Create admin user**

   ```bash
   python manage.py createsuperuser
   ```

5. **Run the dev server**

   ```bash
   python manage.py runserver 8000
   ```

* API will be at: `http://localhost:8000/api/`
* Admin (if created): `http://localhost:8000/admin/`

> If you want AI suggestions to work, make sure your LLM endpoint (Ollama or similar) is running and env vars (`OLLAMA_*`) are set in this same terminal before `runserver`.

---

### 6.2 Frontend (Vite + React)

In a **new terminal**:

```bash
cd solo-tracker-main/frontend
```

1. **Install frontend dependencies**

   ```bash
   npm install
   ```

2. **Run Vite dev server**

   ```bash
   npm run dev
   ```

   You’ll see output like:

   ```text
   VITE v5.x  ready in 300 ms

   ➜  Local:   http://localhost:5173/
   ```

3. Open that URL in your browser.

Thanks to `vite.config.js`:

```js
server: {
  proxy: {
    '/api': 'http://localhost:8000',
  },
},
```

Any call from the frontend to `/api/...` automatically goes to the Django backend.

---

## 7. Quick “Is It Working?” Checklist

1. **Backend check**

   * Visit `http://localhost:8000/api/activities/`
   * You should see JSON (empty list or some data)

2. **Frontend check**

   * Visit `http://localhost:5173/`
   * See welcome screen
   * Click to go to the dashboard
   * Add a couple of activities

3. **Reminder check**

   * Create an activity with a `reminder_time` a few minutes in the future.
   * Keep the tab open.
   * When the time comes, you should receive a browser notification like:

     > “Solo Tracker – [activity title] — reminder”

4. **AI button check**

   * Make sure your LLM server is running and env variables are set.
   * Click **“AI suggestion”** (bottom-right).
   * You should see a modal:

     * It says “Generating suggestions…” for a moment
     * Then shows bullet-point tips based on your logged activities.

If something fails:

* Check the backend terminal for Python errors.
* Check the browser dev tools → Network for failed `/api/...` requests.
* Make sure the LLM endpoint is reachable (`curl http://localhost:11434/v1/models` etc.).

---

