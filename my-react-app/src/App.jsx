import { useEffect, useMemo, useState } from 'react'
import './App.css'

const API_BASE = "https://sentry-vision-backend.onrender.com/api"
const AUTH_STORAGE_KEY = 'sentryVisionAuth'

const navItems = [
  { id: 'dashboard', label: 'Live Dashboard', icon: 'LD' },
  { id: 'alerts', label: 'Alerts/Incidents', icon: 'AI' },
  { id: 'persons', label: 'Persons of Interest', icon: 'PI' },
  { id: 'radar', label: 'Radar View', icon: 'RV' },
  { id: 'health', label: 'Device Health', icon: 'DH' },
  { id: 'analytics', label: 'Analytics', icon: 'AN' },
  { id: 'settings', label: 'Settings', icon: 'ST' },
]

const zones = ['North Gate', 'Loading Bay', 'Server Hall', 'East Corridor']

const initialAlerts = [
  {
    id: 'INC-1048',
    status: 'pending',
    severity: 'critical',
    title: 'POI match at North Gate',
    zone: 'North Gate',
    confidence: 94,
    timestamp: '2026-07-14 11:47:18',
    servoAngle: 118,
    camera: 'CAM-01',
    radar: 'Presence and elevated heart-rate signature',
    imageTone: 'red',
  },
  {
    id: 'INC-1047',
    status: 'pending',
    severity: 'high',
    title: 'Motion beyond perimeter line',
    zone: 'Loading Bay',
    confidence: 82,
    timestamp: '2026-07-14 11:43:02',
    servoAngle: 64,
    camera: 'CAM-02',
    radar: 'Large movement vector',
    imageTone: 'amber',
  },
  {
    id: 'INC-1046',
    status: 'confirmed',
    severity: 'medium',
    title: 'Through-wall presence detected',
    zone: 'Server Hall',
    confidence: 76,
    timestamp: '2026-07-14 11:38:44',
    servoAngle: 91,
    camera: 'CAM-03',
    radar: 'Static presence, 74 bpm',
    imageTone: 'blue',
  },
  {
    id: 'INC-1045',
    status: 'dismissed',
    severity: 'low',
    title: 'Known staff movement',
    zone: 'East Corridor',
    confidence: 68,
    timestamp: '2026-07-14 11:32:10',
    servoAngle: 33,
    camera: 'CAM-04',
    radar: 'Normal gait signature',
    imageTone: 'green',
  },
  {
    id: 'INC-1044',
    status: 'confirmed',
    severity: 'high',
    title: 'Face obscured after ultrasonic trigger',
    zone: 'North Gate',
    confidence: 71,
    timestamp: '2026-07-14 11:26:55',
    servoAngle: 145,
    camera: 'CAM-01',
    radar: 'Close-range intrusion',
    imageTone: 'amber',
  },
]

const initialPersons = [
  {
    id: 'POI-11',
    name: 'Marcel Dane',
    threat: 'Critical',
    notes: 'Former contractor. Escalate immediately if detected near server hall.',
    lastSeen: 'North Gate',
    confidence: 94,
    photo: '',
  },
  {
    id: 'POI-09',
    name: 'Unknown Badge Clone',
    threat: 'High',
    notes: 'Repeated badge mismatch during overnight access attempts.',
    lastSeen: 'Loading Bay',
    confidence: 81,
    photo: '',
  },
  {
    id: 'POI-04',
    name: 'Talia Renn',
    threat: 'Medium',
    notes: 'Monitor only. Requires supervisor confirmation before escalation.',
    lastSeen: 'East Corridor',
    confidence: 72,
    photo: '',
  },
]

const deviceHealth = [
  {
    name: 'ESP32-CAM',
    status: 'online',
    heartbeat: '7 sec ago',
    firmwareVersion: 'v1.4.2',
    ipAddress: '192.168.1.105',
    sd: 68,
    temp: '42 C',
  },
  {
    name: 'Arduino Uno',
    status: 'online',
    heartbeat: '11 sec ago',
    firmwareVersion: 'v2.0.1',
    ipAddress: '192.168.1.108',
    sd: null,
    temp: '36 C',
  },
  {
    name: 'Radar Node',
    status: 'degraded',
    heartbeat: '41 sec ago',
    firmwareVersion: 'v0.9.8',
    ipAddress: '192.168.1.112',
    sd: 22,
    temp: '39 C',
  },
]

const analytics = {
  detections: [18, 24, 19, 31, 28, 37, 42],
  weekly: [118, 141, 127, 164],
  zones: [
    { label: 'North Gate', value: 42 },
    { label: 'Loading Bay', value: 31 },
    { label: 'Server Hall', value: 18 },
    { label: 'East Corridor', value: 14 },
  ],
  times: [
    { label: '00-04', value: 16 },
    { label: '04-08', value: 22 },
    { label: '08-12', value: 39 },
    { label: '12-16', value: 28 },
    { label: '16-20', value: 33 },
    { label: '20-24', value: 47 },
  ],
  falsePositiveRate: 4.2,
}

const blankPerson = {
  name: '',
  threat: 'Medium',
  notes: '',
  lastSeen: 'North Gate',
  confidence: 0,
  photo: '',
}

function App() {
  const [activePage, setActivePage] = useState('dashboard')
  const [alerts, setAlerts] = useState(initialAlerts)
  const [expandedAlert, setExpandedAlert] = useState('INC-1048')
  const [alertFilter, setAlertFilter] = useState('all')
  const [persons, setPersons] = useState(initialPersons)
  const [devices, setDevices] = useState(deviceHealth)
  const [analyticsData, setAnalyticsData] = useState(analytics)
  const [editingPerson, setEditingPerson] = useState(null)
  const [personDraft, setPersonDraft] = useState(blankPerson)
  const [radarPulse, setRadarPulse] = useState(68)
  const [connection, setConnection] = useState('online')
  const [settings, setSettings] = useState({
    faceThreshold: 86,
    radarSensitivity: 72,
    ultrasonicRange: 260,
    notifySms: true,
    notifyEmail: true,
    notifySirens: false,
    retentionDays: 30,
  })
  const [auth, setAuth] = useState(() => {
    try {
      const saved = window.localStorage.getItem(AUTH_STORAGE_KEY)
      return saved ? JSON.parse(saved) : { token: null, user: null }
    } catch {
      return { token: null, user: null }
    }
  })
  const [role, setRole] = useState(() => auth?.user?.role || 'Admin')
  const [loginUsername, setLoginUsername] = useState('admin')
  const [loginPassword, setLoginPassword] = useState('Password123!')
  const [loginError, setLoginError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)

  const isAuthenticated = Boolean(auth?.token)
  const authHeaders = auth?.token ? { Authorization: `Bearer ${auth.token}` } : {}

  const isAdmin = role === 'Admin'
  const pendingCount = alerts.filter((alert) => alert.status === 'pending').length
  const latestAlerts = alerts.slice(0, 5)
  const filteredAlerts = alerts.filter(
    (alert) => alertFilter === 'all' || alert.status === alertFilter,
  )

  useEffect(() => {
    if (!isAuthenticated) {
      return undefined
    }

    const controller = new AbortController()
    const signal = controller.signal

    async function loadBackendData() {
      try {
        const [alertsResponse, personsResponse, devicesResponse, analyticsResponse] = await Promise.all([
          fetch(`${API_BASE}/alerts/`, { headers: { 'Content-Type': 'application/json', ...authHeaders }, signal }),
          fetch(`${API_BASE}/persons/`, { headers: { 'Content-Type': 'application/json', ...authHeaders }, signal }),
          fetch(`${API_BASE}/devices/`, { headers: { 'Content-Type': 'application/json', ...authHeaders }, signal }),
          fetch(`${API_BASE}/analytics/summary/?days=7`, { headers: { 'Content-Type': 'application/json', ...authHeaders }, signal }),
        ])

        if (!alertsResponse.ok || !personsResponse.ok || !devicesResponse.ok || !analyticsResponse.ok) {
          throw new Error('Failed to load backend data')
        }

        const [fetchedAlerts, fetchedPersons, fetchedDevices, analyticsSummary] = await Promise.all([
          alertsResponse.json(),
          personsResponse.json(),
          devicesResponse.json(),
          analyticsResponse.json(),
        ])

        setAlerts(
          fetchedAlerts.map((alert) => ({
            id: alert.id,
            status: alert.acknowledged ? 'confirmed' : 'pending',
            severity: alert.severity,
            title: alert.message || alert.source,
            zone: alert.zone || 'Unknown',
            confidence: 0,
            timestamp: new Date(alert.created_at).toLocaleString(),
            servoAngle: 0,
            camera: alert.person_name || 'N/A',
            radar: alert.source,
            imageTone: alert.severity === 'critical' ? 'red' : alert.severity === 'high' ? 'amber' : 'blue',
          })),
        )

        setPersons(
          fetchedPersons.map((person) => ({
            id: person.id,
            name: person.full_name,
            threat: person.threat_level,
            notes: person.notes,
            lastSeen: 'Unknown',
            confidence: 0,
            photo: person.photo || '',
          })),
        )

        setDevices(
          fetchedDevices.map((device) => ({
            name: device.label || device.device_id,
            status: device.is_online ? 'online' : 'offline',
            heartbeat: device.last_seen ? new Date(device.last_seen).toLocaleString() : 'Unknown',
            firmwareVersion: device.firmware_version || 'Unknown',
            ipAddress: device.ip_address || 'Unknown',
            sd: device.sd_card_usage_pct,
            temp:
              device.device_type === 'esp32_cam'
                ? 'ESP32-CAM'
                : device.device_type === 'ruview_radar'
                  ? 'Radar node'
                  : 'Sensor node',
          })),
        )

        setAnalyticsData({
          detections: analyticsSummary.detections_per_day.map((item) => item.count),
          weekly: analyticsSummary.alert_counts_by_severity.map((item) => item.count),
          zones: analyticsSummary.busiest_zones.map((item) => ({ label: item.zone, value: item.count })),
          times: analyticsSummary.busiest_times.map((item) => ({
            label: `${String(item.hour).padStart(2, '0')}:00`,
            value: item.count,
          })),
          falsePositiveRate: analyticsSummary.false_positive_rate ?? 0,
        })
      } catch (error) {
        console.error('Backend data load failed', error)
      }
    }

    loadBackendData()
    return () => controller.abort()
  }, [isAuthenticated])

  useEffect(() => {
    if (!auth?.token) {
      window.localStorage.removeItem(AUTH_STORAGE_KEY)
      return
    }

    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth))
  }, [auth])

  async function handleLogin(event) {
    event.preventDefault()
    setLoginLoading(true)
    setLoginError('')

    try {
      const baseUrl = API_BASE.replace(/\/$/, '')

      const response = await fetch(`${baseUrl}/auth/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUsername, password: loginPassword }),
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data.detail || 'Login failed')
      }

<<<<<<< HEAD
      if (data.access) {
        localStorage.setItem('access_token', data.access)
        if (data.refresh) {
          localStorage.setItem('refresh_token', data.refresh)
        }
      } else if (data.token) {
        // Fallback if your endpoint returns key as "token" instead of "access"
        localStorage.setItem('access_token', data.token)
      }

      // 2. Trigger data reload or state update so protected endpoints fetch data now
      if (typeof loadBackendData === 'function') {
        await loadBackendData()
      }

=======
      if (!data.access) {
        throw new Error('Login succeeded but no access token was returned.')
      }

      const newAuth = {
        token: data.access,
        refreshToken: data.refresh || null,
        user: { username: data.username, role: data.role },
      }

      setAuth(newAuth)
      setRole(data.role || 'Admin')

      // No manual data-reload call needed here — the useEffect watching
      // `isAuthenticated` (line ~221) already fires automatically once
      // setAuth() above flips isAuthenticated to true. The existing
      // useEffect watching `auth` (line ~313) also persists this whole
      // object to localStorage under AUTH_STORAGE_KEY.
>>>>>>> c343450 (Changes to App.jsx)
    } catch (error) {
      setLoginError(error.message)
    } finally {
      setLoginLoading(false)
    }
  }

  function handleLogout() {
    setAuth({ token: null, user: null })
    setRole('Admin')
    setAlerts(initialAlerts)
    setPersons(initialPersons)
    setDevices(deviceHealth)
    setAnalyticsData(analytics)
  }

  useEffect(() => {
    const interval = window.setInterval(() => {
      setRadarPulse((value) => (value >= 96 ? 61 : value + 3))
      setConnection((value) => (value === 'online' ? 'online' : 'online'))

      setAlerts((current) => {
        if (!current || current.length === 0) return current

        const next = [...current]
        const index = Math.floor(Date.now() / 3500) % next.length

        if (!next[index]) return current

        next[index] = {
          ...next[index],
          confidence: Math.min(
            98,
            (next[index].confidence ?? 0) + (index % 2 === 0 ? 1 : 0)
          ),
        }
        return next
      })
    }, 3500)

    return () => window.clearInterval(interval)
  }, [])

  const pageTitle = useMemo(
    () => navItems.find((item) => item.id === activePage)?.label ?? 'Dashboard',
    [activePage],
  )

  if (!isAuthenticated) {
    return (
      <div className="login-shell">
        <section className="login-panel">
          <h1>SENTRY-VISION Login</h1>
          <p>Use the backend admin account to connect frontend and backend.</p>
          <form onSubmit={handleLogin}>
            <label>
              Username
              <input
                value={loginUsername}
                onChange={(event) => setLoginUsername(event.target.value)}
                required
              />
            </label>
            <label>
              Password
              <input
                type="password"
                value={loginPassword}
                onChange={(event) => setLoginPassword(event.target.value)}
                required
              />
            </label>
            <button className="primary-button" type="submit" disabled={loginLoading}>
              {loginLoading ? 'Logging in…' : 'Log in'}
            </button>
            {loginError && <p className="error-text">{loginError}</p>}
          </form>
          <p>
            Demo credentials: <strong>admin / Password123!</strong>
          </p>
        </section>
      </div>
    )
  }

  function updateAlertStatus(alertId, status) {
    setAlerts((current) =>
      current.map((alert) => (alert.id === alertId ? { ...alert, status } : alert)),
    )
  }

  function openPersonForm(person = null) {
    if (!isAdmin) return
    setEditingPerson(person?.id ?? 'new')
    setPersonDraft(person ? { ...person } : { ...blankPerson })
  }

  function savePerson(event) {
    event.preventDefault()
    if (!isAdmin || !personDraft.name.trim()) return

    if (editingPerson === 'new') {
      setPersons((current) => [
        {
          ...personDraft,
          id: `POI-${String(current.length + 12).padStart(2, '0')}`,
          confidence: Number(personDraft.confidence) || 0,
        },
        ...current,
      ])
    } else {
      setPersons((current) =>
        current.map((person) =>
          person.id === editingPerson
            ? { ...personDraft, confidence: Number(personDraft.confidence) || 0 }
            : person,
        ),
      )
    }

    setEditingPerson(null)
    setPersonDraft(blankPerson)
  }

  function deletePerson(personId) {
    if (!isAdmin) return
    setPersons((current) => current.filter((person) => person.id !== personId))
  }

  function handlePhotoUpload(event) {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      setPersonDraft((draft) => ({ ...draft, photo: reader.result }))
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Primary">
        <div className="brand-block">
          <div className="brand-mark">SV</div>
          <div>
            <p className="eyebrow">Embedded Surveillance</p>
            <h1>SENTRY-VISION</h1>
          </div>
        </div>

        <nav className="nav-list">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${activePage === item.id ? 'active' : ''}`}
              type="button"
              onClick={() => setActivePage(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="role-panel">
          <span className="field-label">Current role</span>
          <div className="segmented" role="group" aria-label="Role">
            {['Admin', 'Security Viewer'].map((option) => (
              <button
                key={option}
                className={role === option ? 'selected' : ''}
                type="button"
                onClick={() => setRole(option)}
              >
                {option === 'Admin' ? 'Admin' : 'Viewer'}
              </button>
            ))}
          </div>
          <p>{isAdmin ? 'Full control enabled' : 'Read-only with alert acknowledgement'}</p>
        </div>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Operations Console</p>
            <h2>{pageTitle}</h2>
          </div>
          <div className="topbar-actions">
            <span className={`connection-pill ${connection}`}>{connection}</span>
            <span className="clock">14 Jul 2026 / 11:48 EAT</span>
            <button className="secondary-button logout-btn" type="button" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </header>

        {activePage === 'dashboard' && (
          <LiveDashboard
            alerts={latestAlerts}
            pendingCount={pendingCount}
            radarPulse={radarPulse}
            setActivePage={setActivePage}
          />
        )}
        {activePage === 'alerts' && (
          <AlertsPage
            alerts={filteredAlerts}
            expandedAlert={expandedAlert}
            filter={alertFilter}
            isAdmin={isAdmin}
            onAcknowledge={(id) => updateAlertStatus(id, 'confirmed')}
            onDismiss={(id) => updateAlertStatus(id, 'dismissed')}
            onExpand={setExpandedAlert}
            onFilter={setAlertFilter}
          />
        )}
        {activePage === 'persons' && (
          <PersonsPage
            draft={personDraft}
            editingPerson={editingPerson}
            isAdmin={isAdmin}
            onCancel={() => setEditingPerson(null)}
            onChange={setPersonDraft}
            onDelete={deletePerson}
            onEdit={openPersonForm}
            onNew={() => openPersonForm()}
            onPhotoUpload={handlePhotoUpload}
            onSave={savePerson}
            persons={persons}
          />
        )}
        {activePage === 'radar' && <RadarPage pulse={radarPulse} />}
        {activePage === 'health' && <DeviceHealthPage devices={devices} />}
        {activePage === 'analytics' && <AnalyticsPage data={analyticsData} />}
        {activePage === 'settings' && (
          <SettingsPage isAdmin={isAdmin} settings={settings} onChange={setSettings} />
        )}
      </main>
    </div>
  )
}

function LiveDashboard({ alerts, pendingCount, radarPulse, setActivePage }) {
  return (
    <div className="page-grid dashboard-grid">
      <section className="status-strip panel wide">
        <StatusMetric label="Device mesh" value="3 / 3 linked" state="ok" />
        <StatusMetric label="Active alerts" value={pendingCount} state={pendingCount > 0 ? 'alert' : 'ok'} />
        <StatusMetric label="Last heartbeat" value="7 sec" state="ok" />
        <StatusMetric label="Radar presence" value={`${radarPulse} bpm`} state="watch" />
      </section>

      <section className="panel live-camera">
        <div className="panel-header">
          <div>
            <p className="eyebrow">ESP32-CAM</p>
            <h3>Camera Zone Correlation</h3>
          </div>
          <span className="status-dot live">Live</span>
        </div>
        <div className="camera-frame">
          <div className="scanline" />
          <span className="frame-label">CAM-01 / North Gate</span>
          <span className="frame-reticle one" />
          <span className="frame-reticle two" />
        </div>
      </section>

      <section className="panel feed-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">WebSocket Feed</p>
            <h3>Last 5 Detections</h3>
          </div>
          <button className="text-button" type="button" onClick={() => setActivePage('alerts')}>
            Open incidents
          </button>
        </div>
        <DetectionFeed alerts={alerts} />
      </section>

      <section className="panel mini-radar">
        <div className="panel-header">
          <div>
            <p className="eyebrow">RUView</p>
            <h3>Presence Indicator</h3>
          </div>
          <span className="status-dot watch">Tracked</span>
        </div>
        <div className="radar-mini-map">
          <span className="ring r1" />
          <span className="ring r2" />
          <span className="sweep" />
          <span className="presence p1" />
          <span className="presence p2" />
        </div>
      </section>
    </div>
  )
}

function StatusMetric({ label, value, state }) {
  return (
    <div className={`status-metric ${state}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function StatusBadge({ status }) {
  return <span className={`status-badge ${status}`}>{status}</span>
}

function DetectionFeed({ alerts }) {
  return (
    <div className="feed-list">
      {alerts.map((alert) => (
        <article className="feed-item" key={alert.id}>
          <span className={`severity-bar ${alert.severity}`} />
          <div>
            <strong>{alert.title}</strong>
            <span>
              {alert.zone} / {alert.timestamp}
            </span>
          </div>
          <StatusBadge status={alert.status} />
        </article>
      ))}
    </div>
  )
}

function AlertsPage({
  alerts,
  expandedAlert,
  filter,
  isAdmin,
  onAcknowledge,
  onDismiss,
  onExpand,
  onFilter,
}) {
  return (
    <section className="panel page-panel">
      <div className="panel-header table-toolbar">
        <div>
          <p className="eyebrow">Incident Queue</p>
          <h3>Alerts and Incidents</h3>
        </div>
        <div className="segmented compact" role="group" aria-label="Incident filter">
          {['all', 'pending', 'confirmed', 'dismissed'].map((item) => (
            <button
              key={item}
              className={filter === item ? 'selected' : ''}
              type="button"
              onClick={() => onFilter(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="incident-table" role="table" aria-label="Alerts">
        <div className="table-row table-head" role="row">
          <span>Incident</span>
          <span>Status</span>
          <span>Zone</span>
          <span>Confidence</span>
          <span>Time</span>
          <span>Actions</span>
        </div>
        {alerts.map((alert) => (
          <div className="table-group" key={alert.id}>
            <button className="table-row incident-row" type="button" onClick={() => onExpand(alert.id)}>
              <span>
                <strong>{alert.id}</strong>
                <small>{alert.title}</small>
              </span>
              <StatusBadge status={alert.status} />
              <span>{alert.zone}</span>
              <span>{alert.confidence}%</span>
              <span>{alert.timestamp}</span>
              <span className="row-actions">
                <ActionButton onClick={() => onAcknowledge(alert.id)}>Acknowledge</ActionButton>
                {isAdmin && <ActionButton onClick={() => onDismiss(alert.id)}>Dismiss</ActionButton>}
              </span>
            </button>
            {expandedAlert === alert.id && (
              <div className="incident-detail">
                <CapturedImage tone={alert.imageTone} label={`${alert.camera} capture`} />
                <div className="detail-grid">
                  <DetailItem label="Match confidence" value={`${alert.confidence}%`} />
                  <DetailItem label="Timestamp" value={alert.timestamp} />
                  <DetailItem label="Servo angle" value={`${alert.servoAngle} deg`} />
                  <DetailItem label="Zone" value={alert.zone} />
                  <DetailItem label="Radar note" value={alert.radar} />
                  <DetailItem label="Operator rights" value={isAdmin ? 'Confirm, dismiss, edit' : 'Acknowledge only'} />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}

function ActionButton({ children, onClick }) {
  return (
    <button
      className="action-button"
      type="button"
      onClick={(event) => {
        event.stopPropagation()
        onClick()
      }}
    >
      {children}
    </button>
  )
}

function CapturedImage({ tone, label }) {
  return (
    <div className={`captured-image ${tone}`}>
      <span className="frame-label">{label}</span>
      <span className="face-box" />
      <span className="depth-box" />
    </div>
  )
}

function DetailItem({ label, value }) {
  return (
    <div className="detail-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function PersonsPage({
  draft,
  editingPerson,
  isAdmin,
  onCancel,
  onChange,
  onDelete,
  onEdit,
  onNew,
  onPhotoUpload,
  onSave,
  persons,
}) {
  return (
    <div className="page-grid persons-grid">
      <section className="panel page-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Facial Recognition</p>
            <h3>Persons of Interest</h3>
          </div>
          <button className="primary-button" type="button" disabled={!isAdmin} onClick={onNew}>
            Add person
          </button>
        </div>
        {!isAdmin && <p className="permission-note">Security Viewer can review POIs but cannot change records.</p>}
        <div className="person-gallery">
          {persons.map((person) => (
            <article className="person-card" key={person.id}>
              <PersonPhoto person={person} />
              <div className="person-body">
                <div>
                  <span className={`threat-tag ${person.threat.toLowerCase()}`}>{person.threat}</span>
                  <h4>{person.name}</h4>
                  <p>{person.notes}</p>
                </div>
                <div className="person-meta">
                  <span>{person.id}</span>
                  <span>{person.lastSeen}</span>
                  <span>{person.confidence}% match</span>
                </div>
                <div className="card-actions">
                  <button type="button" disabled={!isAdmin} onClick={() => onEdit(person)}>
                    Edit
                  </button>
                  <button type="button" disabled={!isAdmin} onClick={() => onDelete(person.id)}>
                    Delete
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {editingPerson && (
        <section className="panel editor-panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Admin CRUD</p>
              <h3>{editingPerson === 'new' ? 'Add POI' : 'Edit POI'}</h3>
            </div>
          </div>
          <form className="editor-form" onSubmit={onSave}>
            <label>
              <span>Name</span>
              <input
                value={draft.name}
                onChange={(event) => onChange({ ...draft, name: event.target.value })}
                required
              />
            </label>
            <label>
              <span>Threat level</span>
              <select
                value={draft.threat}
                onChange={(event) => onChange({ ...draft, threat: event.target.value })}
              >
                <option>Critical</option>
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
            </label>
            <label>
              <span>Last seen zone</span>
              <select
                value={draft.lastSeen}
                onChange={(event) => onChange({ ...draft, lastSeen: event.target.value })}
              >
                {zones.map((zone) => (
                  <option key={zone}>{zone}</option>
                ))}
              </select>
            </label>
            <label>
              <span>Match confidence</span>
              <input
                max="100"
                min="0"
                type="number"
                value={draft.confidence}
                onChange={(event) => onChange({ ...draft, confidence: event.target.value })}
              />
            </label>
            <label>
              <span>Photo upload</span>
              <input accept="image/*" type="file" onChange={onPhotoUpload} />
            </label>
            <label className="full">
              <span>Notes</span>
              <textarea
                rows="4"
                value={draft.notes}
                onChange={(event) => onChange({ ...draft, notes: event.target.value })}
              />
            </label>
            <div className="form-actions">
              <button className="primary-button" type="submit">
                Save record
              </button>
              <button className="secondary-button" type="button" onClick={onCancel}>
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}
    </div>
  )
}

function PersonPhoto({ person }) {
  if (person.photo) {
    return <img className="person-photo" src={person.photo} alt={person.name} />
  }

  return (
    <div className="person-photo placeholder" aria-label={`${person.name} placeholder`}>
      <span>{person.name ? person.name.slice(0, 2).toUpperCase() : '??'}</span>
    </div>
  )
}

function RadarPage({ pulse }) {
  return (
    <div className="page-grid radar-grid">
      <section className="panel radar-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">RUView</p>
            <h3>Through-Wall Zone Map</h3>
          </div>
          <span className="status-dot live">Correlated</span>
        </div>
        <div className="zone-map">
          <div className="zone-cell zone-a">
            <span>North Gate</span>
            <b>Camera CAM-01</b>
          </div>
          <div className="zone-cell zone-b">
            <span>Server Hall</span>
            <b>Static presence</b>
          </div>
          <div className="zone-cell zone-c">
            <span>Loading Bay</span>
            <b>Movement vector</b>
          </div>
          <div className="zone-cell zone-d">
            <span>East Corridor</span>
            <b>Clear</b>
          </div>
          <span className="movement-path" />
          <span className="radar-target target-one" />
          <span className="radar-target target-two" />
          <span className="camera-cone" />
        </div>
      </section>

      <section className="panel overlay-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Biometric Overlay</p>
            <h3>Presence / Heart Rate / Movement</h3>
          </div>
        </div>
        <div className="overlay-stack">
          <OverlayMeter label="Presence strength" value={88} tone="alert" />
          <OverlayMeter label="Estimated heart rate" value={pulse} suffix=" bpm" tone="watch" />
          <OverlayMeter label="Movement pattern match" value={74} tone="ok" />
          <OverlayMeter label="Camera-zone correlation" value={91} tone="ok" />
        </div>
      </section>
    </div>
  )
}

function OverlayMeter({ label, value, suffix = '%', tone }) {
  return (
    <div className={`overlay-meter ${tone}`}>
      <div>
        <span>{label}</span>
        <strong>
          {value}
          {suffix}
        </strong>
      </div>
      <meter min="0" max="100" value={value} />
    </div>
  )
}

function DeviceHealthPage({ devices }) {
  return (
    <div className="page-grid health-grid">
      {devices.map((device) => (
        <section className="panel health-card" key={device.name}>
          <div className="panel-header">
            <div>
              <p className="eyebrow">Node Status</p>
              <h3>{device.name}</h3>
            </div>
            <span className={`status-dot ${device.status}`}>{device.status}</span>
          </div>
          <div className="health-metrics">
            <DetailItem label="Last seen" value={device.heartbeat} />
            <DetailItem label="Firmware" value={device.firmwareVersion} />
            <DetailItem label="IP address" value={device.ipAddress} />
            {device.sd === null ? (
              <DetailItem label="SD card usage" value="Not installed" />
            ) : (
              <DetailItem label="SD card usage" value={`${device.sd}%`} />
            )}
            <DetailItem label="Node type/temp" value={device.temp} />
          </div>
        </section>
      ))}
    </div>
  )
}

function AnalyticsPage({ data }) {
  return (
    <div className="page-grid analytics-grid">
      <section className="panel metric-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Overview</p>
            <h3>Detection Frequency</h3>
          </div>
        </div>
        <div className="bar-chart">
          {data.detections.map((count, index) => (
            <div key={index} className="bar-column">
              <div className="bar-fill" style={{ height: `${Math.min(100, count * 2)}%` }} />
              <span>Day {index + 1}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="panel summary-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Metrics</p>
            <h3>System Performance</h3>
          </div>
        </div>
        <div className="detail-grid">
          <DetailItem label="False positive rate" value={`${data.falsePositiveRate}%`} />
          <DetailItem label="Busiest zone" value={data.zones[0]?.label || 'N/A'} />
          <DetailItem label="Peak activity hour" value={data.times[0]?.label || 'N/A'} />
        </div>
      </section>
    </div>
  )
}

function SettingsPage({ isAdmin, settings, onChange }) {
  return (
    <section className="panel page-panel settings-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Configuration</p>
          <h3>System Settings</h3>
        </div>
      </div>
      {!isAdmin && <p className="permission-note">Viewers cannot modify system thresholds.</p>}
      <form className="settings-form">
        <label>
          <span>Face Match Threshold ({settings.faceThreshold}%)</span>
          <input
            type="range"
            min="50"
            max="99"
            disabled={!isAdmin}
            value={settings.faceThreshold}
            onChange={(e) => onChange({ ...settings, faceThreshold: Number(e.target.value) })}
          />
        </label>
        <label>
          <span>Radar Sensitivity ({settings.radarSensitivity}%)</span>
          <input
            type="range"
            min="10"
            max="100"
            disabled={!isAdmin}
            value={settings.radarSensitivity}
            onChange={(e) => onChange({ ...settings, radarSensitivity: Number(e.target.value) })}
          />
        </label>
        <label className="checkbox-label">
          <input
            type="checkbox"
            disabled={!isAdmin}
            checked={settings.notifySms}
            onChange={(e) => onChange({ ...settings, notifySms: e.target.checked })}
          />
          <span>Send SMS Alerts for Critical Incidents</span>
        </label>
      </form>
    </section>
  )
}

export default App