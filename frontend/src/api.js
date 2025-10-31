import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
})

export const getCategories = async () => {
  const { data } = await api.get('/categories/')
  return data
}

export const createCategory = async (name) => {
  const { data } = await api.post('/categories/', { name })
  return data
}

export const getActivities = async () => {
  const { data } = await api.get('/activities/')
  return data
}

export const getActivitiesByDate = async (date, categoryId) => {
  const params = { date }
  if (categoryId) params.category = categoryId
  const { data } = await api.get('/activities/by-date/', { params })
  return data
}

export const getStatsToday = async () => {
  const { data } = await api.get('/activities/stats-today/')
  return data
}

export const createActivity = async (payload) => {
  const { data } = await api.post('/activities/', payload)
  return data
}

export const updateActivity = async (id, payload) => {
  const { data } = await api.put(`/activities/${id}/`, payload)
  return data
}

export const deleteActivity = async (id) => {
  await api.delete(`/activities/${id}/`)
}

export const toggleComplete = async (id) => {
  const { data } = await api.post(`/activities/${id}/toggle-complete/`)
  return data
}

/** Ensure we have the default five categories present for first‑time users. */
export const ensureDefaultCategories = async () => {
  const wanted = ["Reading", "Workout", "Meals", "Habits", "Custom"]
  const current = await getCategories()
  const names = new Set(current.map(c => c.name.toLowerCase()))
  const created = []
  for (const w of wanted) {
    if (!names.has(w.toLowerCase())) {
      const c = await createCategory(w)
      created.push(c)
    }
  }
  return [...current, ...created]
}


export const getAiSuggestions = async (dateIso) => {
  const q = dateIso ? `?date=${encodeURIComponent(dateIso)}` : ''
  const { data } = await api.get(`/activities/ai_suggestions/${q}`)
  return data
}

export default {
  getCategories,
  createCategory,
  ensureDefaultCategories,
  getActivities,
  getActivitiesByDate,
  getStatsToday,
  createActivity,
  updateActivity,
  deleteActivity,
  toggleComplete,
  getAiSuggestions,
}
