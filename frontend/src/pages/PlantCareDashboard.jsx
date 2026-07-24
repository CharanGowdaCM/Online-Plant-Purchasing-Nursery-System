import { useEffect, useMemo, useState, useRef } from 'react';
import productService from '../services/productService';
import plantCareService from '../services/plantCareService';

/* ─── constants ─── */
const HEALTH = {
  HEALTHY:    { dot:'#287848', label:'Healthy',    bg:'#EBF6EF', color:'#1D6038', border:'#A8D9BB' },
  AT_RISK:    { dot:'#C05C38', label:'At Risk',    bg:'#FBEEE9', color:'#9E3D1C', border:'#EBB49C' },
  RECOVERING: { dot:'#B87E18', label:'Recovering', bg:'#FBF3E3', color:'#956510', border:'#E6CA88' },
};
const TASK_ICON = { WATER:'💧', FERTILIZE:'🌱', PRUNE:'✂️', REPOT:'🪴', MONITOR:'🔍' };
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const normalizeTask = (task = {}) => {
  const taskType = String(task.task_type ?? task.taskType ?? '').toUpperCase();
  const status = String(task.status ?? '').toUpperCase();
  const dueDate = task.due_date ?? task.dueDate ?? task.dueAt ?? null;
  const ownerPlantId = task.user_plant_id ?? task.userPlantId ?? task.plant_id ?? task.plantId ?? null;

  return {
    ...task,
    task_type: taskType,
    status,
    due_date: dueDate,
    user_plant_id: ownerPlantId
  };
};

const fmt = v => !v ? 'N/A'
  : new Date(v).toLocaleString('en-IN',{ month:'short', day:'numeric', hour:'numeric', minute:'2-digit' });

const toKey = v => {
  if (!v) return '';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const weatherNote = w => {
  if (!w) return 'Select a plant for weather-aware care tips.';
  const t = Number(w.temperature ?? 0), h = Number(w.humidity ?? 0);
  const c = String(w.condition || '').toLowerCase();
  if (c.includes('rain') || h >= 80) return '🌧 High humidity — skip misting, delay watering.';
  if (t >= 33) return '☀️ Heat alert — water at dawn and monitor for wilting.';
  if (t <= 16) return '🌿 Cool temps — ease back on watering to avoid root stress.';
  return '✅ Balanced conditions — maintain your normal care routine.';
};

const buildGrid = date => {
  const y = date.getFullYear(), m = date.getMonth();
  const first = new Date(y, m, 1).getDay();
  const dim   = new Date(y, m+1, 0).getDate();
  const prevD = new Date(y, m, 0).getDate();
  const cells = [];
  for (let i = 0; i < first; i++) {
    const d = prevD - first + i + 1;
    const cd = new Date(y, m-1, d);
    cells.push({ cd, key: toKey(cd), day: d, cur: false, today: false });
  }
  for (let d = 1; d <= dim; d++) {
    const cd = new Date(y, m, d);
    const now = new Date();
    cells.push({ cd, key: toKey(cd), day: d, cur: true,
      today: now.getFullYear()===y && now.getMonth()===m && now.getDate()===d });
  }
  while (cells.length < 42) {
    const d = cells.length - (first + dim) + 1;
    const cd = new Date(y, m+1, d);
    cells.push({ cd, key: toKey(cd), day: d, cur: false, today: false });
  }
  return cells;
};

/* ══════════════════════════════════════════════════════════
   COMPONENT
══════════════════════════════════════════════════════════ */
export default function PlantCareDashboard() {
  const [dashboard, setDashboard]       = useState(null);
  const [products,  setProducts]        = useState([]);
  const [loading,   setLoading]         = useState(true);
  const [saving,    setSaving]          = useState(false);
  const [toast,     setToast]           = useState('');
  const [selId,     setSelId]           = useState('');
  const [selDetail, setSelDetail]       = useState(null);
  const [weather,   setWeather]         = useState(null);
  const [wLoad,     setWLoad]           = useState(false);
  const [wErr,      setWErr]            = useState('');
  const [dismissed, setDismissed]       = useState([]);
  const [showModal, setShowModal]       = useState(false);
  const [form,      setForm]            = useState({
    plant_id:'',
    nickname:'',
    purchase_date:'',
    location:'',
    plant_type:'',
    watering_frequency_days:'',
    sunlight_requirement:'',
    environment:'INDOOR',
    is_outdoor:false,
    soil_moisture:''
  });
  const [diag,      setDiag]            = useState({ b64:'', mime:'image/jpeg', preview:'', result:null, loading:false });
  const [localDone, setLocalDone]       = useState(new Set());
  const [undoInfo,  setUndoInfo]        = useState(null);
  const [simDays,   setSimDays]         = useState(0);
  const [smartInfo, setSmartInfo]       = useState(null);
  const [notifInfo, setNotifInfo]       = useState({ notifications: [], unread_count: 0 });
  const [historyInfo, setHistoryInfo]   = useState(null);
  const timerRef = useRef(null);
  const autoFocusPlantRef = useRef('');
  const [viewDate, setViewDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  /* ── fetchers ── */
  const loadDash = async () => {
    setLoading(true);
    try {
      const r = await plantCareService.getDashboard();
      setDashboard(r.data);
      const first = r.data?.plants?.[0];
      if (first && !selId) setSelId(first.id);
    } catch (e) { setToast(e?.response?.data?.message || 'Failed to load'); }
    finally { setLoading(false); }
  };

  const loadProducts = async () => {
    try {
      const r = await productService.getAllProducts({ page:1, limit:100 });
      setProducts(Array.isArray(r?.data) ? r.data : Array.isArray(r?.data?.data) ? r.data.data : []);
    } catch { setProducts([]); }
  };

  const loadDetail = async id => {
    if (!id) { setSelDetail(null); return; }
    try { const r = await plantCareService.getPlantDetails(id); setSelDetail(r.data); }
    catch { setSelDetail(null); }
  };

  const loadWeather = async plant => {
    if (!plant) { setWeather(null); setWErr(''); return; }
    setWLoad(true); setWErr('');
    try {
      const r = await plantCareService.refreshWeather(plant.id, { location: plant.location });
      setWeather(r.data?.weather || null);
    } catch (e) { setWeather(null); setWErr(e?.response?.data?.message || 'Unable to fetch weather'); }
    finally { setWLoad(false); }
  };

  const loadNotifications = async () => {
    try {
      const r = await plantCareService.getNotifications({ limit: 20 });
      setNotifInfo(r.data || { notifications: [], unread_count: 0 });
    } catch {
      setNotifInfo({ notifications: [], unread_count: 0 });
    }
  };

  const loadHistory = async (plantId) => {
    if (!plantId) {
      setHistoryInfo(null);
      return;
    }

    try {
      const r = await plantCareService.getCareHistory({ plant_id: plantId, limit: 120 });
      setHistoryInfo(r.data || null);
    } catch {
      setHistoryInfo(null);
    }
  };

  const generateSmartSchedule = async () => {
    if (!selId) return;
    setSaving(true);
    try {
      const r = await plantCareService.generateSmartSchedule(selId, { simulate_days: simDays });
      setSmartInfo(r.data || null);
      setToast('Smart schedule generated.');
      await loadDash();
      await loadDetail(selId);
      await loadNotifications();
      await loadHistory(selId);
    } catch (e) {
      setToast(e?.response?.data?.message || 'Failed to generate smart schedule');
    } finally {
      setSaving(false);
    }
  };

  const detectMissed = async () => {
    setSaving(true);
    try {
      const r = await plantCareService.detectMissedTasks(selId || null, { simulate_days: simDays });
      const count = r?.data?.missed_count ?? 0;
      setToast(`Missed-task scan complete. ${count} task(s) processed.`);
      await loadDash();
      if (selId) await loadDetail(selId);
      await loadNotifications();
      if (selId) await loadHistory(selId);
    } catch (e) {
      setToast(e?.response?.data?.message || 'Failed to detect missed tasks');
    } finally {
      setSaving(false);
    }
  };

  const skipNextPendingTask = async () => {
    if (!selId) return;
    const nextPendingTask = (tasks || []).find((task) => String(task.status || '').toUpperCase() === 'PENDING');
    if (!nextPendingTask) {
      setToast('No pending tasks to skip.');
      return;
    }

    setSaving(true);
    try {
      await plantCareService.skipTask(selId, nextPendingTask.id);
      setToast(`${nextPendingTask.task_type} task skipped.`);
      await loadDash();
      await loadDetail(selId);
      await loadHistory(selId);
    } catch (e) {
      setToast(e?.response?.data?.message || 'Failed to skip task');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => { loadDash(); loadProducts(); }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 2800);
    return () => clearTimeout(timer);
  }, [toast]);

  const selPlant = useMemo(() => dashboard?.plants?.find(p => p.id === selId) || null, [dashboard, selId]);

  useEffect(() => {
    loadDetail(selId);
    loadHistory(selId);
    loadNotifications();
    setDismissed([]);
    setLocalDone(new Set());
    setUndoInfo(null);
    if (timerRef.current) clearTimeout(timerRef.current);
    setDiag({ b64:'', mime:'image/jpeg', preview:'', result:null, loading:false });
  }, [selId]);

  useEffect(() => { loadWeather(selPlant); }, [selId, selPlant?.location]);

  const tasks     = useMemo(() => {
    const allTasks = Array.isArray(selDetail?.tasks) ? selDetail.tasks.map(normalizeTask) : [];
    const selected = String(selId || '');
    return allTasks
      .filter((t) => {
        if (!selected) return true;
        const owner = String(t?.user_plant_id ?? t?.plant_id ?? t?.userPlantId ?? '');
        return !owner || owner === selected;
      })
      .filter((t) => Boolean(toKey(t?.due_date)))
      .slice()
      .sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
  }, [selDetail, selId]);
  const diagnoses = useMemo(() => {
    const allDiagnoses = Array.isArray(selDetail?.diagnoses) ? selDetail.diagnoses : [];
    const selected = String(selId || '');
    return allDiagnoses.filter((d) => {
      if (!selected) return true;
      const owner = String(d?.user_plant_id ?? d?.plant_id ?? d?.userPlantId ?? '');
      return !owner || owner === selected;
    });
  }, [selDetail, selId]);
  const grid      = useMemo(() => buildGrid(viewDate), [viewDate]);
  const taskMap   = useMemo(() => {
    const m = new Map();
    tasks.forEach(t => { const k=toKey(t.due_date); if (k) m.set(k,[...(m.get(k)||[]),t]); });
    return m;
  }, [tasks]);

  useEffect(() => {
    if (!selId || !tasks.length) return;
    if (autoFocusPlantRef.current === selId) return;

    const firstTaskWithDate = tasks.find((task) => Boolean(toKey(task?.due_date)));
    if (!firstTaskWithDate) return;

    const due = new Date(firstTaskWithDate.due_date);
    if (Number.isNaN(due.getTime())) return;

    setViewDate(new Date(due.getFullYear(), due.getMonth(), 1));
    autoFocusPlantRef.current = selId;
  }, [selId, tasks]);

  const alerts = useMemo(() => {
    if (!selDetail) return [];
    const list = [];
    (selDetail.tasks||[]).forEach(t => {
      if (t.status==='PENDING' && new Date(t.due_date)<new Date())
        list.push({ id:`ov-${t.id}`, level:'danger', text:`${t.task_type} task is overdue` });
    });
    diagnoses.forEach(d => {
      if (String(d.status||'').toUpperCase()==='ACTIVE')
        list.push({ id:`dx-${d.id}`, level:'warn', text:`Active diagnosis: ${d.disease}` });
    });
    if (!list.length) list.push({ id:'ok', level:'ok', text:'All clear — no urgent alerts 🌿' });
    return list.filter(a => !dismissed.includes(a.id));
  }, [selDetail, diagnoses, dismissed]);

  /* ── optimistic complete + undo ── */
  const markDone = task => {
    const status = String(task?.status || '').toUpperCase();
    if (localDone.has(task.id) || status === 'COMPLETED' || status === 'DONE') return;
    const taskType = String(task?.task_type || 'TASK').toUpperCase();
    setLocalDone(p => new Set([...p, task.id]));
    setUndoInfo({ id: task.id, taskType });
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      try {
        await plantCareService.completeTask(selId, task.id);
        await loadDash(); await loadDetail(selId);
      } catch { setLocalDone(p => { const n=new Set(p); n.delete(task.id); return n; }); }
      setUndoInfo(null);
    }, 4000);
  };

  const undo = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (undoInfo) setLocalDone(p => { const n=new Set(p); n.delete(undoInfo.id); return n; });
    setUndoInfo(null);
  };

  const addPlant = async e => {
    e.preventDefault(); setSaving(true);
    try {
      await plantCareService.addPlant(form);
      setForm({
        plant_id:'',
        nickname:'',
        purchase_date:'',
        location:'',
        plant_type:'',
        watering_frequency_days:'',
        sunlight_requirement:'',
        environment:'INDOOR',
        is_outdoor:false,
        soil_moisture:''
      });
      setShowModal(false); setToast('Plant added successfully.');
      await loadDash();
    } catch (err) { setToast(err?.response?.data?.message || 'Failed to add plant'); }
    finally { setSaving(false); }
  };

  const pickImage = e => {
    const file = e.target.files?.[0];
    if (!file || !selId) return;
    const reader = new FileReader();
    reader.onload = () => {
      const res = String(reader.result||'');
      setDiag(c => ({ ...c, b64: res.includes(',') ? res.split(',')[1] : res, mime: file.type||'image/jpeg', preview:res, result:null }));
    };
    reader.readAsDataURL(file);
  };

  const diagnose = async () => {
    if (!selId || !diag.b64) { setToast('Upload an image first.'); return; }
    setDiag(c => ({ ...c, loading:true }));
    try {
      const r = await plantCareService.diagnosePlant(selId, { image_base64:diag.b64, mime_type:diag.mime });
      setDiag(c => ({ ...c, result:r.data, loading:false }));
      setToast(r.data?.message || 'Diagnosis complete.');
      await loadDash(); await loadDetail(selId);
    } catch (e) { setDiag(c => ({ ...c, loading:false })); setToast(e?.response?.data?.message||'Analysis failed'); }
  };

  const recover = async () => {
    if (!selId) return;
    setSaving(true);
    try { await plantCareService.markRecovered(selId); setToast('Marked as recovered.');
      await loadDash(); await loadDetail(selId);
    } catch (e) { setToast(e?.response?.data?.message||'Failed'); }
    finally { setSaving(false); }
  };

  const monthLabel = viewDate.toLocaleDateString('en-IN',{ month:'long', year:'numeric' });

  const shiftMonth = delta => {
    setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  };

  const resetToCurrentMonth = () => {
    const d = new Date();
    setViewDate(new Date(d.getFullYear(), d.getMonth(), 1));
  };

  const taskHover = task => {
    const type = String(task?.task_type || 'Task').toUpperCase();
    const status = String(task?.status || 'PENDING').toUpperCase();
    return `${type} - ${fmt(task?.due_date)} - ${status}`;
  };

  const dayHover = tasksForDay => {
    if (!tasksForDay?.length) return 'No tasks for this day';
    const items = tasksForDay.map((t, i) => `${i + 1}. ${taskHover(t)}`);
    return items.join('\n');
  };

  /* ── LOADER ── */
  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
      background:'#F5F3EC', fontFamily:"'Montserrat',sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Montserrat:wght@400;500;600;700&display=swap');
        @keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:44,height:44,border:'3px solid #C0D4CE',borderTopColor:'#1B3022',
          borderRadius:'50%',animation:'spin .9s linear infinite',margin:'0 auto 18px' }}/>
        <p style={{ color:'#5A7060',fontSize:'.82rem',fontWeight:600,letterSpacing:'.12em',textTransform:'uppercase' }}>
          Tending your garden…
        </p>
      </div>
    </div>
  );

  /* ── MAIN RENDER ── */
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;1,600&family=Montserrat:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }

        :root {
          --page:    #F5F3EC;
          --white:   #FFFFFF;
          --cream:   #F0EDE4;
          --cream2:  #E8E4DA;
          --forest:  #1B3022;
          --forest2: #243C28;
          --sage:    #7BA89A;
          --sage-l:  #B5CCC8;
          --sage-xl: #EBF4F1;
          --terra:   #C05C38;
          --terra-b: #FBEEE9;
          --terra-br:#EBB49C;
          --em:      #287848;
          --em-l:    #5DD48A;
          --em-b:    #EBF6EF;
          --em-br:   #A8D9BB;
          --amb:     #B87E18;
          --amb-b:   #FBF3E3;
          --amb-br:  #E6CA88;
          --t1:      #1A2B1C;
          --t2:      #2E4030;
          --t3:      #5A7060;
          --t4:      #8A9E90;
          --t5:      #B0BFBA;
          --bdr:     #DDD9D0;
          --bdr-s:   #C0D4CE;
          --sh-sm:   0 2px 10px rgba(26,43,28,.07);
          --sh-md:   0 4px 20px rgba(26,43,28,.09);
          --sh-lg:   0 10px 40px rgba(26,43,28,.13);
          --r-sm:6px; --r-md:10px; --r-lg:14px; --r-xl:18px; --r-2xl:24px;
        }

        @keyframes fadeUp    { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideIn   { from{opacity:0;transform:translateX(16px)} to{opacity:1;transform:translateX(0)} }
        @keyframes scaleUp   { from{opacity:0;transform:scale(.95)} to{opacity:1;transform:scale(1)} }
        @keyframes spin      { to{transform:rotate(360deg)} }
        @keyframes halo      { 0%,100%{box-shadow:0 0 0 2.5px rgba(123,168,154,.5),0 0 18px rgba(123,168,154,.18)} 50%{box-shadow:0 0 0 3.5px rgba(123,168,154,.7),0 0 30px rgba(123,168,154,.28)} }
        @keyframes popIn     { 0%{transform:scale(.4);opacity:0} 65%{transform:scale(1.2)} 100%{transform:scale(1);opacity:1} }
        @keyframes glowPulse { 0%,100%{filter:drop-shadow(0 0 2px rgba(40,120,72,.4))} 50%{filter:drop-shadow(0 0 8px rgba(40,120,72,.75))} }
        @keyframes undoIn    { from{opacity:0;transform:translateX(-50%) translateY(14px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }

        body { background:var(--page); font-family:'Montserrat',sans-serif; color:var(--t2); -webkit-font-smoothing:antialiased; }

        /* ══ PAGE SHELL ══ */
        .shell {
          min-height:100vh; background:var(--page);
          background-image:
            radial-gradient(ellipse 65% 50% at 92% 2%, rgba(123,168,154,.08) 0%,transparent 55%),
            radial-gradient(ellipse 45% 55% at 4% 96%, rgba(27,48,34,.05) 0%,transparent 55%);
        }

        /* ══ TOPBAR ══ */
        .nav {
          position:sticky; top:0; z-index:200;
          height:64px; background:var(--white);
          border-bottom:2px solid var(--forest);
          display:flex; align-items:center;
          padding:0 36px; gap:20px;
        }
        .nav-brand { display:flex; align-items:center; gap:10px; margin-right:auto; }
        .nav-logo {
          width:36px; height:36px; border-radius:10px; background:var(--forest);
          display:flex; align-items:center; justify-content:center; font-size:17px;
          box-shadow:0 2px 8px rgba(27,48,34,.25);
        }
        .nav-name {
          font-family:'Playfair Display',serif;
          font-size:1.18rem; font-weight:700; color:var(--forest); letter-spacing:-.01em;
        }
        .nav-name em { font-style:italic; color:var(--sage); }

        .metrics {
          display:flex;
          align-items:center;
          gap:8px;
        }
        .metric {
          min-width:110px;
          height:44px;
          display:flex;
          flex-direction:column;
          align-items:center;
          justify-content:center;
          gap:2px;
          padding:0 12px;
          border:1px solid var(--bdr);
          border-radius:12px;
          background:linear-gradient(180deg, #F6F2E8 0%, #EEE9DE 100%);
          box-shadow:0 2px 10px rgba(26,43,28,.06);
        }
        .m-lbl { font-size:.53rem; font-weight:700; letter-spacing:.11em; text-transform:uppercase; color:var(--t4); line-height:1; }
        .m-val { font-family:'Playfair Display',serif; font-size:1.34rem; font-weight:700; line-height:1; color:var(--t1); }
        .m-val.g { color:var(--em); }
        .m-val.a { color:var(--amb); }
        .m-val.r { color:var(--terra); }

        .nav-toast {
          font-size:.72rem; font-weight:600; color:var(--em);
          background:var(--em-b); border:1px solid var(--em-br);
          border-radius:20px; padding:5px 14px; animation:fadeUp .3s ease;
          white-space:nowrap; max-width:200px; overflow:hidden; text-overflow:ellipsis;
        }

        /* ══ PLANT STRIP ══ */
        .strip-wrap { background:var(--white); border-bottom:1px solid var(--bdr); padding:14px 36px; }
        .strip-row { display:flex; align-items:center; gap:8px; overflow-x:auto; scrollbar-width:none; }
        .strip-row::-webkit-scrollbar { display:none; }

        .chip {
          flex-shrink:0; display:flex; align-items:center; gap:7px;
          padding:7px 14px 7px 9px;
          border:1.5px solid var(--bdr); border-radius:40px; background:var(--cream);
          cursor:pointer; transition:all .2s ease;
        }
        .chip:hover { border-color:var(--sage); background:var(--sage-xl); transform:translateY(-1px); box-shadow:var(--sh-sm); }
        .chip.active { background:var(--forest); border-color:var(--forest); box-shadow:0 4px 14px rgba(27,48,34,.22); }
        .chip-icon { width:24px; height:24px; border-radius:50%; background:rgba(123,168,154,.18); font-size:12px; display:flex; align-items:center; justify-content:center; }
        .chip.active .chip-icon { background:rgba(255,255,255,.15); }
        .chip-lbl { font-size:.76rem; font-weight:600; color:var(--t2); white-space:nowrap; }
        .chip.active .chip-lbl { color:#fff; }
        .chip-dot { width:6px; height:6px; border-radius:50%; flex-shrink:0; }
        .strip-sep { width:1px; height:26px; background:var(--bdr); flex-shrink:0; margin:0 4px; }
        .btn-add-chip {
          flex-shrink:0; display:flex; align-items:center; gap:6px;
          padding:7px 16px; border:1.5px dashed var(--bdr-s); border-radius:40px;
          background:transparent; cursor:pointer;
          font-family:'Montserrat',sans-serif; font-size:.76rem; font-weight:600; color:var(--t4);
          transition:all .18s;
        }
        .btn-add-chip:hover { border-color:var(--sage); color:var(--em); background:var(--sage-xl); }

        /* ══ MAIN GRID ══ */
        .main {
          display:grid; grid-template-columns:1fr 348px; gap:24px;
          padding:24px 36px 56px; align-items:start;
          max-width:1440px; margin:0 auto;
        }

        .left-col {
          display:flex;
          flex-direction:column;
          gap:16px;
          min-width:0;
        }

        .lower-panels {
          display:grid;
          grid-template-columns:repeat(2, minmax(0, 1fr));
          gap:16px;
          align-items:start;
          animation:fadeUp .35s ease;
        }

        /* ══ CALENDAR CARD ══ */
        .cal-card {
          background:var(--white); border:1px solid var(--bdr);
          border-radius:var(--r-2xl); box-shadow:var(--sh-md);
          overflow:hidden; animation:fadeUp .35s ease;
        }
        .cal-head {
          padding:22px 28px 18px; background:var(--forest);
          display:flex; align-items:flex-end; justify-content:space-between; gap:16px;
        }
        .cal-title { font-family:'Playfair Display',serif; font-size:1.6rem; font-weight:700; color:#fff; letter-spacing:-.015em; }
        .cal-sub { font-size:.73rem; color:rgba(255,255,255,.62); font-weight:400; margin-top:4px; }
        .cal-badge {
          font-size:.57rem; font-weight:700; letter-spacing:.12em; text-transform:uppercase;
          background:rgba(255,255,255,.12); color:rgba(255,255,255,.85);
          border:1px solid rgba(255,255,255,.2); padding:5px 13px; border-radius:20px;
          white-space:nowrap; align-self:flex-end;
        }
        .cal-actions { display:flex; align-items:center; gap:8px; }
        .cal-nav-btn {
          min-width:34px; height:34px; border-radius:999px;
          border:1px solid rgba(255,255,255,.28);
          background:rgba(255,255,255,.12); color:#fff;
          font-family:'Montserrat',sans-serif; font-size:.9rem; font-weight:700;
          cursor:pointer; transition:all .15s ease;
          display:flex; align-items:center; justify-content:center;
        }
        .cal-nav-btn:hover { background:rgba(255,255,255,.2); }
        .cal-now-btn {
          border-radius:20px;
          padding:0 12px;
          font-size:.62rem;
          letter-spacing:.08em;
          text-transform:uppercase;
        }

        /* alert pills */
        .alerts-row {
          display:flex; gap:7px; padding:11px 20px;
          overflow-x:auto; scrollbar-width:none;
          background:var(--cream); border-bottom:1px solid var(--bdr);
        }
        .alerts-row::-webkit-scrollbar { display:none; }
        .a-pill {
          flex-shrink:0; display:flex; align-items:center; gap:6px;
          padding:5px 12px; border-radius:20px;
          font-size:.7rem; font-weight:600; border:1px solid; white-space:nowrap;
        }
        .a-pill.ok     { background:var(--em-b);  border-color:var(--em-br);   color:var(--em); }
        .a-pill.warn   { background:var(--amb-b);  border-color:var(--amb-br);  color:var(--amb); }
        .a-pill.danger { background:var(--terra-b); border-color:var(--terra-br); color:var(--terra); }
        .dismiss { background:none; border:none; cursor:pointer; font-size:.65rem; color:inherit; opacity:.5; padding:0 2px; transition:opacity .15s; }
        .dismiss:hover { opacity:1; }

        /* calendar body */
        .cal-body { padding:20px 22px 24px; }
        .wd-row { display:grid; grid-template-columns:repeat(7,1fr); gap:5px; margin-bottom:7px; }
        .wd { text-align:center; font-size:.6rem; font-weight:700; letter-spacing:.1em; text-transform:uppercase; color:var(--t4); padding:3px 0; }
        .cal-grid { display:grid; grid-template-columns:repeat(7,1fr); gap:5px; }

        /* date cell */
        .cell {
          border:1px solid var(--bdr); border-radius:var(--r-md); padding:8px 8px 7px;
          background:var(--white); min-height:88px;
          display:flex; flex-direction:column; position:relative; overflow:hidden;
          transition:border-color .15s, box-shadow .15s;
        }
        .cell:hover { border-color:var(--sage-l); box-shadow:var(--sh-sm); }
        .cell.out  { background:var(--cream); border-color:transparent; opacity:.5; }
        .cell.has  { background:#F7FBF8; }
        .cell.today{ background:var(--sage-xl); border-color:var(--sage); border-width:1.5px; animation:halo 3s ease-in-out infinite; }

        .cell-top { display:flex; align-items:center; justify-content:space-between; margin-bottom:5px; }
        .cell-num { font-family:'Montserrat',sans-serif; font-size:.78rem; font-weight:600; color:var(--t3); line-height:1; }
        .cell.out  .cell-num { color:var(--t5); }
        .cell.today .cell-num { color:var(--em); font-weight:800; }
        .today-tag {
          font-size:.48rem; font-weight:800; letter-spacing:.08em; text-transform:uppercase;
          background:var(--em); color:#fff; padding:2px 6px; border-radius:5px; line-height:1.5;
        }

        /* droplet buttons */
        .cell-drops { display:flex; flex-wrap:wrap; gap:3px; flex:1; }
        .drop-btn {
          display:flex; align-items:center; justify-content:center;
          min-width:34px; min-height:34px; border-radius:50%; border:none;
          background:rgba(123,168,154,.08); cursor:pointer;
          transition:background .15s, transform .1s;
          box-shadow:2px 2px 5px rgba(26,43,28,.09),-1px -1px 3px rgba(255,255,255,.75);
        }
        .drop-btn:hover:not(.done) { background:rgba(123,168,154,.2); box-shadow:3px 3px 8px rgba(26,43,28,.13),-1px -1px 4px rgba(255,255,255,.8); transform:scale(1.09); }
        .drop-btn:active:not(.done){ transform:scale(.93); box-shadow:inset 2px 2px 5px rgba(26,43,28,.12),inset -1px -1px 3px rgba(255,255,255,.5); }
        .drop-btn.done { cursor:default; background:rgba(40,120,72,.06); box-shadow:none; }
        .drop-done-svg { animation:popIn .4s cubic-bezier(.34,1.56,.64,1) both, glowPulse 2.5s ease-in-out .5s infinite; }
        .other-task {
          display:flex; align-items:center; justify-content:center;
          min-width:26px; min-height:26px;
          border-radius:50%; border:1px solid transparent;
          font-size:.78rem; padding:0;
          background:rgba(123,168,154,.08);
        }
        .other-task.done { background:rgba(40,120,72,.12); border-color:rgba(40,120,72,.35); }
        .other-task.markable {
          border:none;
          cursor:pointer;
          transition:background .15s, transform .1s;
          box-shadow:2px 2px 5px rgba(26,43,28,.09),-1px -1px 3px rgba(255,255,255,.75);
        }
        .other-task.markable:hover:not(.done) { background:rgba(123,168,154,.2); transform:scale(1.08); }
        .other-task.markable:active:not(.done) { transform:scale(.94); }

        /* hydration */
        .hydration { position:absolute; bottom:0; left:0; right:0; height:3px; background:rgba(123,168,154,.12); }
        .hydration-fill { height:100%; border-radius:0 1.5px 0 0; background:linear-gradient(90deg,var(--em-l),var(--sage)); transition:width .6s cubic-bezier(.4,0,.2,1); }

        /* ══ RIGHT COLUMN ══ */
        .right-col {
          position:sticky; top:88px;
          max-height:none;
          overflow-y:visible;
          display:flex; flex-direction:column; gap:16px;
          padding-bottom:4px;
          scrollbar-width:thin; scrollbar-color:var(--sage-l) transparent;
          animation:slideIn .35s ease;
        }
        .right-col::-webkit-scrollbar { width:3px; }
        .right-col::-webkit-scrollbar-thumb { background:var(--sage-l); border-radius:3px; }

        /* section card */
        .scard { background:var(--white); border:1px solid var(--bdr); border-radius:var(--r-xl); box-shadow:var(--sh-sm); overflow:hidden; transition:box-shadow .2s; }
        .scard:hover { box-shadow:var(--sh-md); }
        .scard-head { padding:12px 16px 11px; background:var(--cream); border-bottom:1px solid var(--bdr); display:flex; align-items:center; justify-content:space-between; gap:8px; }
        .scard-title { font-size:.6rem; font-weight:700; letter-spacing:.12em; text-transform:uppercase; color:var(--t4); display:flex; align-items:center; gap:5px; }
        .scard-body { padding:14px 16px; }

        /* info rows */
        .irow { display:flex; justify-content:space-between; align-items:baseline; padding:7px 0; border-bottom:1px solid var(--cream); gap:12px; }
        .irow:last-child { border-bottom:none; padding-bottom:0; }
        .irow-l { font-size:.7rem; color:var(--t4); font-weight:500; flex-shrink:0; }
        .irow-v { font-size:.8rem; color:var(--t1); font-weight:600; text-align:right; }

        /* health badge */
        .hbadge { display:inline-flex; align-items:center; gap:5px; font-size:.58rem; font-weight:700; letter-spacing:.07em; text-transform:uppercase; padding:3px 10px; border-radius:20px; }
        .hdot   { width:5px; height:5px; border-radius:50%; flex-shrink:0; }

        /* weather */
        .w-cond { font-size:.71rem; color:var(--t3); font-style:italic; margin-bottom:12px; }
        .w-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:12px; }
        .w-box  { background:var(--cream); border:1px solid var(--bdr); border-radius:var(--r-md); padding:12px; text-align:center; }
        .w-val  { font-family:'Playfair Display',serif; font-size:1.65rem; font-weight:700; color:var(--t1); line-height:1; }
        .w-lbl  { font-size:.54rem; letter-spacing:.12em; text-transform:uppercase; color:var(--t4); margin-top:3px; }
        .w-note { background:var(--sage-xl); border:1px solid var(--bdr-s); border-radius:var(--r-md); padding:10px 12px; font-size:.73rem; color:var(--t2); line-height:1.7; }

        /* small neumorphic button */
        .btn-sm {
          background:var(--cream); border:1px solid var(--bdr); border-radius:7px; padding:5px 12px;
          font-family:'Montserrat',sans-serif; font-size:.6rem; font-weight:700; letter-spacing:.07em; text-transform:uppercase;
          color:var(--t3); cursor:pointer; transition:all .15s;
          box-shadow:2px 2px 5px rgba(26,43,28,.08),-1px -1px 3px rgba(255,255,255,.7);
        }
        .btn-sm:hover:not(:disabled) { border-color:var(--sage); color:var(--em); box-shadow:3px 3px 8px rgba(26,43,28,.12),-1px -1px 3px rgba(255,255,255,.8); }
        .btn-sm:active:not(:disabled){ box-shadow:inset 2px 2px 5px rgba(26,43,28,.1),inset -1px -1px 3px rgba(255,255,255,.5); }
        .btn-sm:disabled { opacity:.4; cursor:not-allowed; }

        /* diagnosis item */
        .ditem { padding:11px 12px; background:var(--cream); border:1px solid var(--bdr); border-radius:var(--r-md); margin-bottom:8px; }
        .ditem:last-child { margin-bottom:0; }
        .drow  { display:flex; justify-content:space-between; align-items:flex-start; gap:8px; }
        .dname { font-size:.8rem; font-weight:700; color:var(--t1); }
        .dmeta { font-size:.67rem; color:var(--t4); margin-top:3px; line-height:1.5; }
        .dtag  { font-size:.56rem; font-weight:800; letter-spacing:.09em; text-transform:uppercase; padding:3px 8px; border-radius:20px; background:var(--cream2); border:1px solid var(--bdr); color:var(--t3); white-space:nowrap; flex-shrink:0; }
        .btn-recover {
          display:block; margin:8px 0 0 auto;
          padding:5px 13px; border:1.5px solid var(--em-br); border-radius:7px;
          background:var(--em-b); color:var(--em);
          font-family:'Montserrat',sans-serif; font-size:.65rem; font-weight:700; letter-spacing:.06em;
          cursor:pointer; transition:all .15s;
          box-shadow:2px 2px 5px rgba(26,43,28,.07),-1px -1px 3px rgba(255,255,255,.7);
        }
        .btn-recover:hover:not(:disabled) { border-color:var(--em); box-shadow:3px 3px 8px rgba(26,43,28,.1); }
        .btn-recover:active:not(:disabled){ box-shadow:inset 2px 2px 4px rgba(26,43,28,.1); }
        .btn-recover:disabled { opacity:.4; cursor:not-allowed; }

        /* upload */
        .upload-zone { border:1.5px dashed var(--bdr-s); border-radius:var(--r-md); padding:12px 14px; background:var(--cream); transition:border-color .15s; }
        .upload-zone:hover { border-color:var(--sage); }
        .upload-zone input[type=file] { width:100%; background:none; border:none; outline:none; font-size:.72rem; color:var(--t3); font-family:'Montserrat',sans-serif; cursor:pointer; }
        .diag-preview { width:100%; max-height:140px; object-fit:cover; border-radius:var(--r-md); border:1px solid var(--bdr); margin-top:10px; display:block; }

        /* primary button */
        .btn-primary {
          width:100%; margin-top:10px; padding:11px;
          border:1.5px solid rgba(27,48,34,.1); border-radius:var(--r-md);
          background:var(--forest); color:#fff;
          font-family:'Montserrat',sans-serif; font-size:.78rem; font-weight:700; letter-spacing:.05em;
          cursor:pointer; transition:all .2s;
          box-shadow:3px 3px 10px rgba(27,48,34,.22),-1px -1px 4px rgba(255,255,255,.5);
        }
        .btn-primary:hover:not(:disabled) { background:var(--forest2); box-shadow:4px 4px 14px rgba(27,48,34,.28),-1px -1px 4px rgba(255,255,255,.5); transform:translateY(-1px); }
        .btn-primary:active:not(:disabled){ transform:none; box-shadow:inset 3px 3px 8px rgba(0,0,0,.2),inset -1px -1px 3px rgba(255,255,255,.1); }
        .btn-primary:disabled { opacity:.45; cursor:not-allowed; transform:none; }

        .diag-result { margin-top:10px; padding:11px 13px; background:var(--em-b); border:1px solid var(--em-br); border-radius:var(--r-md); }
        .diag-name   { font-size:.8rem; font-weight:700; color:var(--em); margin-bottom:5px; }
        .diag-meta   { font-size:.7rem; color:var(--t3); line-height:1.7; }
        .empty { font-size:.72rem; color:var(--t5); font-style:italic; }

        /* ══ UNDO TOAST ══ */
        .undo-toast {
          position:fixed; bottom:28px; left:50%; transform:translateX(-50%); z-index:400;
          background:var(--forest); color:#fff; border-radius:40px; padding:11px 18px;
          display:flex; align-items:center; gap:14px; box-shadow:var(--sh-lg);
          animation:undoIn .3s cubic-bezier(.34,1.56,.64,1); white-space:nowrap;
        }
        .undo-msg { font-size:.76rem; font-weight:500; }
        .undo-btn {
          font-size:.68rem; font-weight:700; letter-spacing:.07em; text-transform:uppercase;
          background:rgba(255,255,255,.15); border:1px solid rgba(255,255,255,.28); color:#fff;
          padding:5px 13px; border-radius:20px; font-family:'Montserrat',sans-serif; cursor:pointer; transition:all .15s;
        }
        .undo-btn:hover { background:rgba(255,255,255,.25); }

        /* ══ MODAL ══ */
        .modal-bg {
          position:fixed; inset:0; background:rgba(26,43,28,.4); backdrop-filter:blur(8px);
          z-index:500; display:flex; align-items:center; justify-content:center;
          padding:24px; animation:fadeUp .2s ease;
        }
        .modal-box { width:100%; max-width:460px; background:var(--white); border:1px solid var(--bdr); border-radius:var(--r-2xl); box-shadow:var(--sh-lg); overflow:hidden; animation:scaleUp .22s ease; }
        .modal-head { padding:22px 24px 18px; background:var(--forest); display:flex; align-items:flex-start; justify-content:space-between; gap:14px; }
        .modal-title { font-family:'Playfair Display',serif; font-size:1.25rem; font-weight:700; color:#fff; }
        .modal-sub   { font-size:.7rem; color:rgba(255,255,255,.6); margin-top:4px; }
        .modal-close {
          width:30px; height:30px; flex-shrink:0;
          background:rgba(255,255,255,.12); border:1px solid rgba(255,255,255,.22);
          border-radius:8px; color:#fff; font-size:.8rem;
          display:flex; align-items:center; justify-content:center;
          cursor:pointer; transition:background .15s; font-family:inherit;
        }
        .modal-close:hover { background:rgba(255,255,255,.22); }
        .modal-body { padding:22px 24px 26px; display:flex; flex-direction:column; gap:15px; }
        .fg label { display:block; font-size:.6rem; font-weight:700; letter-spacing:.12em; text-transform:uppercase; color:var(--t4); margin-bottom:5px; }
        .fc {
          width:100%; background:var(--cream); border:1.5px solid var(--bdr); border-radius:var(--r-md);
          padding:10px 13px; color:var(--t1); font-size:.83rem; font-family:'Montserrat',sans-serif;
          outline:none; transition:border-color .15s, box-shadow .15s; appearance:none;
        }
        .fc:focus { border-color:var(--sage); box-shadow:0 0 0 3px rgba(123,168,154,.15); }

        /* ══ RESPONSIVE ══ */
        @media (max-width:1100px) {
          .main { grid-template-columns:1fr; }
          .lower-panels { grid-template-columns:1fr; }
          .right-col { position:static; max-height:none; overflow-y:visible; }
        }
        @media (max-width:680px) {
          .nav, .strip-wrap { padding-left:18px; padding-right:18px; }
          .main { padding:16px 18px 40px; gap:16px; }
          .metrics { display:none; }
          .cal-body { padding:14px 14px 18px; }
          .cal-head { padding:18px 20px 14px; }
        }
      `}</style>

      <div className="shell">

        {/* ══ TOPBAR ══ */}
        <nav className="nav">
          <div className="nav-brand">
            <div className="nav-logo">🪴</div>
            <div className="nav-name">Flora<em>Care</em></div>
          </div>
          <div className="metrics">
            <div className="metric"><span className="m-lbl">Health</span><span className="m-val g">{dashboard?.summary?.healthScore ?? 0}</span></div>
            <div className="metric"><span className="m-lbl">Plants</span><span className="m-val">{dashboard?.summary?.totalPlants ?? 0}</span></div>
            <div className="metric"><span className="m-lbl">Overdue</span><span className="m-val a">{dashboard?.summary?.overdueTasks ?? 0}</span></div>
            <div className="metric"><span className="m-lbl">At Risk</span><span className="m-val r">{dashboard?.summary?.atRiskPlants ?? 0}</span></div>
          </div>
          {toast && <div className="nav-toast">✦ {toast}</div>}
        </nav>

        {/* ══ PLANT STRIP ══ */}
        <div className="strip-wrap">
          <div className="strip-row">
            {(dashboard?.plants || []).map(plant => {
              const s = HEALTH[plant.health_status] || HEALTH.HEALTHY;
              return (
                <button key={plant.id} type="button"
                  className={`chip${selId===plant.id?' active':''}`}
                  onClick={() => setSelId(plant.id)}>
                  <div className="chip-icon">🪴</div>
                  <span className="chip-lbl">{plant.nickname || plant.product?.name || 'Plant'}</span>
                  <span className="chip-dot" style={{ background:s.dot }}/>
                </button>
              );
            })}
            {(dashboard?.plants||[]).length > 0 && <div className="strip-sep"/>}
            <button type="button" className="btn-add-chip" onClick={() => setShowModal(true)}>＋ Add Plant</button>
          </div>
        </div>

        {/* ══ MAIN ══ */}
        <div className="main">
          <div className="left-col">
            {/* ── CALENDAR ── */}
            <div className="cal-card">
              <div className="cal-head">
                <div>
                  <div className="cal-title">Care Calendar</div>
                  <div className="cal-sub">{selPlant?.nickname || selPlant?.product?.name || 'Select a plant'} · {monthLabel}</div>
                </div>
                <div className="cal-actions">
                  <button type="button" className="cal-nav-btn" onClick={() => shiftMonth(-1)} aria-label="Previous month">‹</button>
                  <button type="button" className="cal-nav-btn cal-now-btn" onClick={resetToCurrentMonth}>This Month</button>
                  <button type="button" className="cal-nav-btn" onClick={() => shiftMonth(1)} aria-label="Next month">›</button>
                  {/* <div className="cal-badge">Monthly View</div> */}
                </div>
              </div>

              {alerts.length > 0 && (
                <div className="alerts-row">
                  {alerts.map(a => (
                    <div key={a.id} className={`a-pill ${a.level}`}>
                      <span>{a.text}</span>
                      {a.id !== 'ok' && <button type="button" className="dismiss" onClick={() => setDismissed(d=>[...d,a.id])}>✕</button>}
                    </div>
                  ))}
                </div>
              )}

              <div className="cal-body">
                <div className="wd-row">{DAYS.map(d => <div key={d} className="wd">{d}</div>)}</div>
                {tasks.length === 0 && (
                  <div className="w-note" style={{ marginBottom: 10 }}>
                    No scheduled tasks found for this plant yet. Use Generate Smart Schedule to create or refresh tasks.
                  </div>
                )}
                <div className="cal-grid">
                  {grid.map(cell => {
                    const dayTasks   = taskMap.get(cell.key) || [];
                    const waterTasks = dayTasks.filter(t => String(t.task_type||'').toUpperCase()==='WATER');
                    const otherTasks = dayTasks.filter(t => String(t.task_type||'').toUpperCase()!=='WATER');
                    const done  = dayTasks.filter(t => {
                      const status = String(t.status || '').toUpperCase();
                      return status === 'COMPLETED' || status === 'DONE' || localDone.has(t.id);
                    }).length;
                    const pct   = dayTasks.length > 0 ? Math.round((done/dayTasks.length)*100) : 0;
                    return (
                      <div key={cell.key+cell.day}
                        className={`cell${!cell.cur?' out':''}${cell.today?' today':''}${dayTasks.length>0?' has':''}`}
                        title={dayHover(dayTasks)}>
                        <div className="cell-top">
                          <span className="cell-num">{cell.day}</span>
                          {cell.today && <span className="today-tag">Today</span>}
                        </div>
                        <div className="cell-drops">
                          {waterTasks.map(task => {
                            const isDone = ['COMPLETED', 'DONE'].includes(String(task.status || '').toUpperCase()) || localDone.has(task.id);
                            return (
                              <button key={task.id} type="button"
                                className={`drop-btn${isDone?' done':''}`}
                                title={isDone ? `Watering complete - ${fmt(task.due_date)}` : `Tap to mark watering done - ${fmt(task.due_date)}`}
                                onClick={() => !isDone && markDone(task)}>
                                {isDone
                                  ? <svg className="drop-done-svg" width="16" height="20" viewBox="0 0 16 20" fill="none">
                                      <defs>
                                        <linearGradient id={`dg${task.id}`} x1="0" y1="0" x2="1" y2="1">
                                          <stop offset="0%" stopColor="#5DD48A"/><stop offset="100%" stopColor="#1D6038"/>
                                        </linearGradient>
                                        <filter id={`gf${task.id}`}><feGaussianBlur in="SourceGraphic" stdDeviation="1.5" result="b"/>
                                          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                                      </defs>
                                      <path d="M8 1C8 1 1 8 1 13C1 17 4.1 19 8 19C11.9 19 15 17 15 13C15 8 8 1 8 1Z"
                                        fill={`url(#dg${task.id})`} filter={`url(#gf${task.id})`}/>
                                      <path d="M5.5 14.5C6 16 7 17 8 17" stroke="rgba(255,255,255,.6)" strokeWidth="1.2" strokeLinecap="round"/>
                                    </svg>
                                  : <svg width="16" height="20" viewBox="0 0 16 20" fill="none">
                                      <path d="M8 1C8 1 1 8 1 13C1 17 4.1 19 8 19C11.9 19 15 17 15 13C15 8 8 1 8 1Z"
                                        stroke="#7BA89A" strokeWidth="1.5" fill="rgba(123,168,154,.1)"/>
                                      <path d="M5.5 14.5C6 16 7 17 8 17" stroke="rgba(123,168,154,.45)" strokeWidth="1" strokeLinecap="round"/>
                                    </svg>
                                }
                              </button>
                            );
                          })}
                          {otherTasks.map(task => {
                            const type = String(task.task_type || '').toUpperCase();
                            const isMonitor = type === 'MONITOR';
                            const isDone = ['COMPLETED', 'DONE'].includes(String(task.status || '').toUpperCase()) || localDone.has(task.id);
                            if (isMonitor) {
                              return (
                                <button
                                  key={task.id}
                                  type="button"
                                  className={`other-task markable${isDone ? ' done' : ''}`}
                                  title={isDone ? `Monitoring complete - ${fmt(task.due_date)}` : `Tap to mark monitoring done - ${fmt(task.due_date)}`}
                                  onClick={() => !isDone && markDone(task)}
                                >
                                  {TASK_ICON[type] || '🔍'}
                                </button>
                              );
                            }
                            return (
                              <span key={task.id} className={`other-task${isDone ? ' done' : ''}`} title={taskHover(task)}>
                                {TASK_ICON[type] || '📌'}
                              </span>
                            );
                          })}
                        </div>
                        {dayTasks.length > 0 && (
                          <div className="hydration">
                            <div className="hydration-fill" style={{ width:`${pct}%` }}/>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="lower-panels">
              {/* Disease Detection */}
              <div className="scard">
                <div className="scard-head"><span className="scard-title">🔬 Disease Detection</span></div>
                <div className="scard-body">
                  <div className="upload-zone">
                    <input type="file" accept="image/*" onChange={pickImage} disabled={!selPlant}/>
                  </div>
                  {diag.preview && <img src={diag.preview} alt="Plant preview" className="diag-preview"/>}
                  <button type="button" className="btn-primary" onClick={diagnose} disabled={diag.loading||!selPlant}>
                    {diag.loading ? 'Analyzing…' : '✦ Run AI Analysis'}
                  </button>
                  {diag.result && (
                    <div className="diag-result">
                      <div className="diag-name">{diag.result.plan?.disease || diag.result.diagnosis?.disease || 'Unknown'}</div>
                      <div className="diag-meta">
                        <div>Confidence: {diag.result.diagnosis?.confidence ?? diag.result.confidence_state}</div>
                        <div>Action: {(diag.result.plan?.care_actions||[]).join(', ')||'No action suggested'}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Diagnosis History */}
              <div className="scard">
                <div className="scard-head"><span className="scard-title">📋 Diagnosis History</span></div>
                <div className="scard-body">
                  {diagnoses.length > 0
                    ? diagnoses.map(d => {
                        const st  = String(d.status||'').toLowerCase();
                        const can = ['at risk','risk','active'].includes(st);
                        return (
                          <div key={d.id} className="ditem">
                            <div className="drow">
                              <div>
                                <div className="dname">{d.disease}</div>
                                <div className="dmeta">{fmt(d.created_at)} · {d.confidence}% confidence</div>
                              </div>
                              <span className="dtag">{String(d.status||'').toUpperCase()}</span>
                            </div>
                            {can && <button type="button" className="btn-recover" onClick={recover} disabled={saving}>Mark Recovered ✓</button>}
                          </div>
                        );
                      })
                    : <p className="empty">No diagnosis records yet.</p>}
                </div>
              </div>
            </div>
          </div>

          {/* ── RIGHT PANEL ── */}
          <div className="right-col" key={selId||'none'}>

            {/* Plant Details */}
            <div className="scard">
              <div className="scard-head">
                <span className="scard-title">🪴 Plant Details</span>
                {selDetail && (() => {
                  const s = HEALTH[selDetail.health_status] || HEALTH.HEALTHY;
                  return <div className="hbadge" style={{ background:s.bg, color:s.color, border:`1px solid ${s.border}` }}>
                    <span className="hdot" style={{ background:s.dot }}/>{s.label}
                  </div>;
                })()}
              </div>
              <div className="scard-body">
                {selDetail ? (
                  <>
                    <div className="irow"><span className="irow-l">Plant Name</span><span className="irow-v">{selDetail.nickname || selDetail.product?.name || '—'}</span></div>
                    <div className="irow"><span className="irow-l">Location</span><span className="irow-v">{selDetail.location || '—'}</span></div>
                    <div className="irow"><span className="irow-l">Last Watered</span><span className="irow-v">{fmt(selDetail.last_watered)}</span></div>
                  </>
                ) : <p className="empty">Select a plant to view its details.</p>}
              </div>
            </div>

            {/* Weather */}
            <div className="scard">
              <div className="scard-head">
                <span className="scard-title">🌤 Weather Conditions</span>
                <button type="button" className="btn-sm" onClick={() => loadWeather(selPlant)} disabled={!selPlant||wLoad}>
                  {wLoad ? 'Loading…' : 'Refresh'}
                </button>
              </div>
              <div className="scard-body">
                {wErr && <p style={{ fontSize:'.71rem', color:'var(--terra)', marginBottom:10 }}>{wErr}</p>}
                {weather ? (
                  <>
                    <p className="w-cond">{weather.condition} · {weather.location||selPlant?.location}</p>
                    <div className="w-grid">
                      <div className="w-box"><div className="w-val">{weather.temperature}°</div><div className="w-lbl">Celsius</div></div>
                      <div className="w-box"><div className="w-val">{weather.humidity}%</div><div className="w-lbl">Humidity</div></div>
                    </div>
                    <div className="w-note">{weatherNote(weather)}</div>
                  </>
                ) : <p className="empty">Weather loads on plant selection.</p>}
              </div>
            </div>

            {/* Smart Controls */}
            <div className="scard">
              <div className="scard-head">
                <span className="scard-title">🧠 Smart Controls</span>
                <span style={{ fontSize: '.7rem', color: 'var(--t4)' }}>Demo-ready</span>
              </div>
              <div className="scard-body">
                <div className="irow">
                  <span className="irow-l">Simulate Days</span>
                  <input
                    className="fc"
                    style={{ maxWidth: 120, padding: '7px 10px' }}
                    type="number"
                    min={-30}
                    max={30}
                    value={simDays}
                    onChange={(e) => setSimDays(Number(e.target.value || 0))}
                  />
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                  <button type="button" className="btn-sm" onClick={generateSmartSchedule} disabled={!selId || saving}>Generate Smart Schedule</button>
                  <button type="button" className="btn-sm" onClick={detectMissed} disabled={saving}>Detect Missed</button>
                  <button type="button" className="btn-sm" onClick={skipNextPendingTask} disabled={!selId || saving}>Skip Next Task</button>
                </div>
                {smartInfo?.tasks?.length > 0 && (
                  <div style={{ marginTop: 12, fontSize: '.72rem', color: 'var(--t3)' }}>
                    <div>Upcoming tasks: <strong>{smartInfo.tasks.length}</strong></div>
                    <div>Notifications sent: <strong>{smartInfo.notifications?.length || 0}</strong></div>
                  </div>
                )}
              </div>
            </div>

            {/* Care Analytics */}
            <div className="scard">
              <div className="scard-head"><span className="scard-title">📊 Care Analytics</span></div>
              <div className="scard-body">
                {historyInfo?.analytics ? (
                  <>
                    <div className="irow"><span className="irow-l">Consistency</span><span className="irow-v">{Math.round((historyInfo.analytics.consistency_score || 0) * 100)}%</span></div>
                    <div className="irow"><span className="irow-l">Streak</span><span className="irow-v">🔥 {historyInfo.analytics.streak || 0}</span></div>
                    <div className="irow"><span className="irow-l">Missed</span><span className="irow-v">⚠️ {historyInfo.analytics.missed_tasks || 0}</span></div>
                    <div className="irow"><span className="irow-l">Likely missed day</span><span className="irow-v">{historyInfo.analytics.most_frequently_missed_day || 'N/A'}</span></div>
                    {(historyInfo.analytics.suggestions || []).slice(0, 2).map((tip, idx) => (
                      <div key={idx} className="w-note" style={{ marginTop: 8 }}>{tip}</div>
                    ))}
                  </>
                ) : <p className="empty">No care analytics yet.</p>}
              </div>
            </div>

            {/* Notifications */}
            <div className="scard">
              <div className="scard-head">
                <span className="scard-title">🔔 Notifications</span>
                <span style={{ fontSize: '.7rem', color: 'var(--t4)' }}>Unread: {notifInfo.unread_count || 0}</span>
              </div>
              <div className="scard-body">
                {(notifInfo.notifications || []).slice(0, 4).map((n) => (
                  <div key={n.id} className="ditem" style={{ marginBottom: 10 }}>
                    <div className="drow">
                      <div>
                        <div className="dname" style={{ fontSize: '.76rem' }}>{n.title}</div>
                        <div className="dmeta">{fmt(n.created_at)}</div>
                      </div>
                    </div>
                  </div>
                ))}
                {(!notifInfo.notifications || notifInfo.notifications.length === 0) && <p className="empty">No notifications yet.</p>}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── UNDO TOAST ── */}
      {undoInfo && (
        <div className="undo-toast">
          <span className="undo-msg">
            {undoInfo.taskType === 'MONITOR' ? '🔍 Monitoring marked as done' : '💧 Watering marked as done'}
          </span>
          <button type="button" className="undo-btn" onClick={undo}>Undo</button>
        </div>
      )}

      {/* ── MODAL ── */}
      {showModal && (
        <div className="modal-bg" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <div className="modal-title">Add New Plant</div>
                <div className="modal-sub">Create a profile and begin scheduling care</div>
              </div>
              <button type="button" className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={addPlant} className="modal-body">
              <div className="fg"><label>Plant Product</label>
                <select className="fc" value={form.plant_id} onChange={e=>setForm(c=>({...c,plant_id:e.target.value}))} required>
                  <option value="">Select a plant product</option>
                  {products.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="fg"><label>Nickname</label>
                <input className="fc" type="text" placeholder="e.g. Kitchen Fern" value={form.nickname} onChange={e=>setForm(c=>({...c,nickname:e.target.value}))}/>
              </div>
              <div className="fg"><label>Purchase Date</label>
                <input className="fc" type="date" value={form.purchase_date} onChange={e=>setForm(c=>({...c,purchase_date:e.target.value}))}/>
              </div>
              <div className="fg"><label>Location</label>
                <input className="fc" type="text" placeholder="City, State" value={form.location} onChange={e=>setForm(c=>({...c,location:e.target.value}))}/>
              </div>
              <div className="fg"><label>Plant Type</label>
                <input className="fc" type="text" placeholder="succulent / fern / herb" value={form.plant_type} onChange={e=>setForm(c=>({...c,plant_type:e.target.value}))}/>
              </div>
              <div className="fg"><label>Watering Frequency (days)</label>
                <input className="fc" type="number" min="1" max="21" value={form.watering_frequency_days} onChange={e=>setForm(c=>({...c,watering_frequency_days:e.target.value}))}/>
              </div>
              <div className="fg"><label>Sunlight Requirement</label>
                <input className="fc" type="text" placeholder="low / medium / bright indirect" value={form.sunlight_requirement} onChange={e=>setForm(c=>({...c,sunlight_requirement:e.target.value}))}/>
              </div>
              <div className="fg"><label>Environment</label>
                <select className="fc" value={form.environment} onChange={e=>setForm(c=>({...c,environment:e.target.value,is_outdoor:e.target.value==='OUTDOOR'}))}>
                  <option value="INDOOR">Indoor</option>
                  <option value="OUTDOOR">Outdoor</option>
                </select>
              </div>
              <div className="fg"><label>Soil Moisture (%)</label>
                <input className="fc" type="number" min="0" max="100" value={form.soil_moisture} onChange={e=>setForm(c=>({...c,soil_moisture:e.target.value}))}/>
              </div>
              <button className="btn-primary" type="submit" disabled={saving}>{saving?'Saving…':'✦ Add Plant'}</button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}