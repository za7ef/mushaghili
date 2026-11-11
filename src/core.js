import React, { useEffect, useRef, useState, useCallback, useContext, createContext } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  View, Text, TextInput, Pressable, StyleSheet, ScrollView, Alert, StatusBar,
  KeyboardAvoidingView, Platform, Animated, Modal, LayoutAnimation, UIManager, Linking, ActivityIndicator,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEvent } from 'expo';
import * as DocumentPicker from 'expo-document-picker';
import * as ScreenOrientation from 'expo-screen-orientation';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { decodeSubBytes, parseSubs, readBytes, guessQuery, searchSubs, downloadSub, cleanCues } from './subs';

if (Platform.OS === 'android') UIManager.setLayoutAnimationEnabledExperimental?.(true);

const SAMPLE = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
const NTFY = 'ntfy.sh';
const TOPIC_PREFIX = 'mhvp-room-';
const MY_ID = Math.random().toString(36).slice(2, 10);
const ACCENT = '#0A84FF';
const APP_VERSION = '1.2.0';
const C = {
  bg: '#000', card: 'rgba(255,255,255,0.06)', stroke: 'rgba(255,255,255,0.09)',
  text: '#F5F5F7', sub: '#98989F', dim: '#636366', green: '#30D158', red: '#FF453A', yellow: '#FFD60A',
};

let LIQUID = false;
try { LIQUID = isLiquidGlassAvailable(); } catch {}

const Ctx = createContext(null);

const tap = () => Haptics.selectionAsync().catch(() => {});

function newRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}
function fmt(t) {
  if (!isFinite(t) || t < 0) t = 0;
  const h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = Math.floor(t % 60);
  const mm = h ? String(m).padStart(2, '0') : m;
  return `${h ? h + ':' : ''}${mm}:${String(s).padStart(2, '0')}`;
}

/* ---------- UI atoms ---------- */
// Real iOS 26+ Liquid Glass when available, blur fallback otherwise.
// Note: GlassView must not sit inside an animated-opacity parent, so the in-player controls use Blur.
function Glass({ style, children, intensity = 40, interactive, forceBlur }) {
  if (LIQUID && !forceBlur) {
    return (
      <GlassView glassEffectStyle="regular" isInteractive={interactive} colorScheme="dark" style={[styles.glass, style]}>
        {children}
      </GlassView>
    );
  }
  return (
    <BlurView intensity={intensity} tint="dark" style={[styles.glass, style]}>
      {children}
    </BlurView>
  );
}
function IconBtn({ name, size = 22, onPress, style, color = '#fff' }) {
  return (
    <Pressable onPress={() => { tap(); onPress?.(); }} hitSlop={10}
      style={({ pressed }) => [styles.iconBtn, style, pressed && { transform: [{ scale: 0.9 }], opacity: 0.7 }]}>
      <Ionicons name={name} size={size} color={color} />
    </Pressable>
  );
}
function Btn({ title, icon, onPress, kind = 'primary', style }) {
  const bg = kind === 'primary' ? ACCENT : kind === 'danger' ? 'rgba(255,69,58,0.16)' : 'rgba(255,255,255,0.08)';
  const fg = kind === 'danger' ? C.red : '#fff';
  return (
    <Pressable onPress={() => { tap(); onPress?.(); }}
      style={({ pressed }) => [styles.btn, { backgroundColor: bg }, style, pressed && { transform: [{ scale: 0.97 }], opacity: 0.85 }]}>
      {icon && <Ionicons name={icon} size={18} color={fg} style={{ marginLeft: 8 }} />}
      <Text style={[styles.btnText, { color: fg }]}>{title}</Text>
    </Pressable>
  );
}
function Card({ title, icon, children }) {
  return (
    <Glass style={styles.card} intensity={25}>
      {title && (
        <View style={styles.cardHead}>
          <View style={styles.cardIcon}><Ionicons name={icon} size={16} color={ACCENT} /></View>
          <Text style={styles.cardTitle}>{title}</Text>
        </View>
      )}
      {children}
    </Glass>
  );
}
function Field(props) {
  return <TextInput placeholderTextColor={C.dim} autoCapitalize="none" autoCorrect={false} {...props} style={[styles.input, props.style]} />;
}
const P = ({ children, style }) => <Text style={[styles.p, style]}>{children}</Text>;
const Hint = ({ children, color }) => <Text style={[styles.hint, color && { color }]}>{children}</Text>;

/* ---------- Player surface with custom auto-hiding controls ---------- */
function PlayerSurface({ player, viewRef, isPlaying, currentTime, title, cue, subSize, full, onToggleFull, nativeMode, roomActive }) {
  const [visible, setVisible] = useState(true);
  const fade = useRef(new Animated.Value(1)).current;
  const hideTimer = useRef(null);
  const [barW, setBarW] = useState(1);
  const duration = player.duration || 0;
  const progress = duration ? Math.min(1, currentTime / duration) : 0;

  const show = useCallback((v) => {
    setVisible(v);
    Animated.timing(fade, { toValue: v ? 1 : 0, duration: 220, useNativeDriver: true }).start();
  }, [fade]);
  const arm = useCallback(() => {
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => { if (player.playing) show(false); }, 3000);
  }, [player, show]);
  useEffect(() => { if (isPlaying) arm(); else { clearTimeout(hideTimer.current); show(true); } }, [isPlaying]);
  useEffect(() => () => clearTimeout(hideTimer.current), []);

  const onSurface = () => { if (visible) show(false); else { show(true); arm(); } };
  const act = (fn) => () => { fn(); arm(); };

  return (
    <View style={[styles.surface, full && styles.surfaceFull]}>
      <VideoView
        ref={viewRef}
        style={StyleSheet.absoluteFill}
        player={player}
        nativeControls={nativeMode}
        allowsPictureInPicture
        startsPictureInPictureAutomatically
        contentFit="contain"
        allowsVideoFrameAnalysis={false}
      />
      {cue && (
        <View pointerEvents="none" style={[styles.subWrap, { bottom: visible && !nativeMode ? (full ? 92 : 64) : (full ? 36 : 14) }]}>
          <Text style={[styles.subText, { fontSize: full ? subSize * 1.25 : subSize }]}>{cue.text}</Text>
        </View>
      )}
      {!nativeMode && (
        <>
          <Pressable style={StyleSheet.absoluteFill} onPress={onSurface} />
          <Animated.View pointerEvents={visible ? 'box-none' : 'none'} style={[StyleSheet.absoluteFill, { opacity: fade }]}>
            <LinearGradient colors={['rgba(0,0,0,0.65)', 'transparent', 'transparent', 'rgba(0,0,0,0.75)']}
              locations={[0, 0.3, 0.6, 1]} style={StyleSheet.absoluteFill} pointerEvents="none" />
            <View style={[styles.topBar, full && { paddingHorizontal: 40, paddingTop: 18 }]}>
              <IconBtn name={full ? 'contract' : 'expand'} size={20} onPress={act(onToggleFull)} />
              <IconBtn name="albums-outline" size={20} onPress={act(() => viewRef.current?.startPictureInPicture?.())} />
              <View style={{ flex: 1 }} />
              {roomActive && <View style={styles.livePill}><View style={styles.liveDot} /><Text style={styles.liveTxt}>مع ربعك</Text></View>}
              <Text numberOfLines={1} style={styles.topTitle}>{title}</Text>
            </View>
            <View style={styles.center} pointerEvents="box-none">
              <IconBtn name="play-back" size={26} style={styles.roundSm} onPress={act(() => player.seekBy(-10))} />
              <Glass style={styles.roundLg} intensity={30} forceBlur>
                <Pressable onPress={() => { tap(); isPlaying ? player.pause() : player.play(); arm(); }} style={styles.fillCenter}>
                  <Ionicons name={isPlaying ? 'pause' : 'play'} size={34} color="#fff" style={!isPlaying && { marginLeft: 4 }} />
                </Pressable>
              </Glass>
              <IconBtn name="play-forward" size={26} style={styles.roundSm} onPress={act(() => player.seekBy(10))} />
            </View>
            <View style={[styles.bottomBar, full && { paddingHorizontal: 40, paddingBottom: 26 }]}>
              <Text style={styles.time}>{fmt(currentTime)}</Text>
              <Pressable style={styles.trackHit} onLayout={(e) => setBarW(e.nativeEvent.layout.width)}
                onPress={(e) => { if (duration) { player.currentTime = (e.nativeEvent.locationX / barW) * duration; arm(); } }}>
                <View style={styles.track}>
                  <View style={[styles.trackFill, { width: `${progress * 100}%` }]} />
                </View>
                <View style={[styles.knob, { left: `${progress * 100}%` }]} />
              </Pressable>
              <Text style={styles.time}>-{fmt(Math.max(0, duration - currentTime))}</Text>
            </View>
          </Animated.View>
        </>
      )}
    </View>
  );
}

/* ---------- App ---------- */
export const useFullscreen = () => useContext(Ctx)?.full ?? false;

export function PlayerProvider({ children }) {
  const [urlInput, setUrlInput] = useState('');
  const [source, setSource] = useState({ uri: SAMPLE, local: false, name: 'Big Buck Bunny' });
  const [full, setFull] = useState(false);
  const [nativeMode, setNativeMode] = useState(false);
  const viewRef = useRef(null);

  const player = useVideoPlayer(SAMPLE, (p) => {
    p.allowsExternalPlayback = true;
    p.timeUpdateEventInterval = 0.25;
    p.showNowPlayingNotification = true;
  });
  const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: player.playing });
  const timeEv = useEvent(player, 'timeUpdate', { currentTime: 0 });
  const currentTime = timeEv?.currentTime ?? 0;


  const [layoutKey, setLayoutKey] = useState(0);
  const [about, setAbout] = useState(false);
  const toggleFull = async () => {
    if (!full) {
      setFull(true);
      try { await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE); } catch {}
    } else {
      try { await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP); } catch {}
      setFull(false);
      // re-measure everything after rotating back
      setTimeout(() => setLayoutKey((k) => k + 1), 350);
    }
  };

  /* subtitles: local per user, never synced */
  const [cues, setCues] = useState([]);
  const [subName, setSubName] = useState('');
  const [subUrl, setSubUrl] = useState('');
  const [subOffset, setSubOffset] = useState(0);
  const [subSize, setSubSize] = useState(17);
  const [subsOn, setSubsOn] = useState(true);
  const loadSubs = async (uri, name) => {
    try {
      const c = parseSubs(decodeSubBytes(await readBytes(uri)));
      if (!c.length) return Alert.alert('ما لقيت ترجمة', 'تأكد إن الملف srt أو vtt');
      setCues(c); setSubName(name); setSubsOn(true); setSubOffset(0);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch (e) { Alert.alert('ما قدرت أفتح الترجمة', String(e?.message || e)); }
  };
  const pickSub = async () => {
    const r = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
    if (!r.canceled && r.assets?.length) loadSubs(r.assets[0].uri, r.assets[0].name || 'ترجمة');
  };
  const [subQuery, setSubQuery] = useState('');
  const [subResults, setSubResults] = useState([]);
  const [subBusy, setSubBusy] = useState(false);
  const [subMsg, setSubMsg] = useState('');
  const [embedded, setEmbedded] = useState(null);

  useEffect(() => { setSubQuery(guessQuery(source.name).query); setSubResults([]); setSubMsg(''); setEmbedded(null); }, [source.uri]);

  const loadFromResult = async (r) => {
    setSubBusy(true);
    try {
      const c = cleanCues(parseSubs(decodeSubBytes(await downloadSub(r.link))));
      if (!c.length) throw new Error('الملف فاضي');
      setCues(c); setSubName(r.file); setSubsOn(true); setSubOffset(0);
      try { player.subtitleTrack = null; } catch {}
      setEmbedded(null);
      setSubMsg('تمام، حمّلت: ' + r.file);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch (e) { setSubMsg('ما قدرت أحمّلها: ' + String(e?.message || e)); }
    setSubBusy(false);
  };

  const autoSubs = async () => {
    setSubBusy(true); setSubMsg(''); setSubResults([]);
    // 1) embedded tracks inside the video
    try {
      const tracks = player.availableSubtitleTracks || [];
      const ar = tracks.find((t) => /^ar/i.test(t.language || '') || /arab|عرب/i.test(t.label || ''));
      if (ar) {
        player.subtitleTrack = ar;
        setEmbedded(ar.label || 'عربي');
        setCues([]); setSubName('');
        setSubMsg('لقيت ترجمة عربية داخل الفيديو وشغّلتها');
        setSubBusy(false);
        return;
      }
    } catch {}
    // 2) online search
    const g = guessQuery(subQuery || source.name);
    const q = { ...g, query: (subQuery || g.query).trim() };
    if (!q.query) { setSubMsg('اكتب اسم الفيلم أو المسلسل'); setSubBusy(false); return; }
    try {
      let res = await searchSubs(q, 'ara');
      if (!res.length && (q.season || q.episode)) res = await searchSubs({ query: q.query }, 'ara');
      if (!res.length) { setSubMsg('ما لقيت ترجمة عربية. جرّب تكتب الاسم بالإنجليزي، ومعه S01E01 لو مسلسل'); setSubBusy(false); return; }
      setSubResults(res.slice(0, 10));
      setSubBusy(false);
      await loadFromResult(res[0]);
    } catch (e) { setSubMsg('البحث ما ضبط: ' + String(e?.message || e)); setSubBusy(false); }
  };
  const st = currentTime - subOffset;
  const cue = subsOn ? cues.find((c) => st >= c.start && st <= c.end) : null;

  /* watch together via ntfy.sh */
  const [room, setRoom] = useState(null);
  const [roomInput, setRoomInput] = useState('');
  const [connState, setConnState] = useState('off');
  const [peers, setPeers] = useState({});
  const [log, setLog] = useState([]);
  const wsRef = useRef(null);
  const applyingRemote = useRef(false);
  const lastTime = useRef({ t: 0, at: Date.now() });
  const sourceRef = useRef(source);
  sourceRef.current = source;
  const addLog = (s) => setLog((l) => [{ s, at: new Date().toLocaleTimeString('ar-SA', { hour: 'numeric', minute: '2-digit' }) }, ...l].slice(0, 5));

  const loadSource = useCallback(async (src) => {
    setSource(src);
    try { await player.replaceAsync(src.uri); player.play(); }
    catch (e) { Alert.alert('ما اشتغل الفيديو', String(e?.message || e)); }
  }, [player]);

  const publish = useCallback(async (msg) => {
    if (!room) return;
    try {
      await fetch(`https://${NTFY}/${TOPIC_PREFIX}${room}`, { method: 'POST', body: JSON.stringify({ ...msg, from: MY_ID, ts: Date.now() }) });
    } catch { addLog('فشل الإرسال، شيك على النت'); }
  }, [room]);

  const sendState = useCallback((reason) => {
    const src = sourceRef.current;
    if (src.local) { if (reason !== 'auto') addLog('الملفات اللي من جوالك ما تنشارك'); return; }
    publish({ type: 'state', url: src.uri, name: src.name, playing: player.playing, time: player.currentTime });
  }, [publish, player]);

  const applyRemote = useCallback(async (m) => {
    applyingRemote.current = true;
    try {
      if (m.url && m.url !== sourceRef.current.uri) {
        setSource({ uri: m.url, local: false, name: m.name || 'فيديو من الغرفة' });
        await player.replaceAsync(m.url);
      }
      const lag = m.playing ? Math.max(0, (Date.now() - m.ts) / 1000) : 0;
      const target = (m.time || 0) + lag;
      if (Math.abs(player.currentTime - target) > 1.5) player.currentTime = target;
      if (m.playing && !player.playing) player.play();
      if (!m.playing && player.playing) player.pause();
      lastTime.current = { t: target, at: Date.now() };
    } catch (e) { addLog('مشكلة بالمزامنة'); }
    setTimeout(() => { applyingRemote.current = false; }, 1200);
  }, [player]);

  useEffect(() => {
    if (!room) return;
    let closed = false, retry;
    const connect = () => {
      setConnState('connecting');
      const ws = new WebSocket(`wss://${NTFY}/${TOPIC_PREFIX}${room}/ws`);
      wsRef.current = ws;
      ws.onopen = () => { setConnState('on'); addLog('دخلت الغرفة'); publish({ type: 'hello' }); };
      ws.onmessage = (e) => {
        let ev, m;
        try { ev = JSON.parse(e.data); } catch { return; }
        if (ev.event !== 'message' || !ev.message) return;
        try { m = JSON.parse(ev.message); } catch { return; }
        if (m.from === MY_ID) return;
        setPeers((p) => ({ ...p, [m.from]: Date.now() }));
        if (m.type === 'hello') { addLog('أحد دخل الغرفة'); sendState('auto'); }
        else if (m.type === 'req') sendState('auto');
        else if (m.type === 'state') { addLog(m.playing ? 'الطرف الثاني شغّل' : 'الطرف الثاني وقّف'); applyRemote(m); }
      };
      ws.onclose = () => { setConnState('off'); if (!closed) retry = setTimeout(connect, 2000); };
    };
    connect();
    return () => { closed = true; clearTimeout(retry); wsRef.current?.close(); };
  }, [room]);

  useEffect(() => { if (room && !applyingRemote.current) sendState('auto'); }, [isPlaying]);
  useEffect(() => {
    const prev = lastTime.current;
    const expected = prev.t + (isPlaying ? (Date.now() - prev.at) / 1000 : 0);
    lastTime.current = { t: currentTime, at: Date.now() };
    if (room && !applyingRemote.current && Math.abs(currentTime - expected) > 2.5) sendState('auto');
  }, [currentTime]);

  const createRoom = () => { setPeers({}); setLog([]); setRoom(newRoomCode()); };
  const joinRoom = () => {
    const c = roomInput.trim().toUpperCase();
    if (c.length < 4) return Alert.alert('الكود قصير', 'اكتب كود الغرفة اللي عطاك إياه صاحبك');
    setPeers({}); setLog([]); setRoom(c);
  };
  const onlinePeers = Object.values(peers).filter((t) => Date.now() - t < 5 * 60 * 1000).length;

  const pickFile = async () => {
    const r = await DocumentPicker.getDocumentAsync({ type: 'video/*', copyToCacheDirectory: true });
    if (!r.canceled && r.assets?.length) loadSource({ uri: r.assets[0].uri, local: true, name: r.assets[0].name || 'فيديو من الجوال' });
  };
  const openUrl = () => {
    const u = urlInput.trim();
    if (!/^https?:\/\//i.test(u)) return Alert.alert('الرابط غلط', 'لازم يبدأ بـ https://');
    loadSource({ uri: u, local: false, name: decodeURIComponent(u.split('/').pop() || 'رابط') });
    setUrlInput('');
  };

  const surface = (
    <PlayerSurface player={player} viewRef={viewRef} isPlaying={isPlaying} currentTime={currentTime}
      title={source.name} cue={cue} subSize={subSize} full={full} onToggleFull={toggleFull}
      nativeMode={nativeMode} roomActive={!!room && connState === 'on'} />
  );

  const value = { about, addLog, applyRemote, applyingRemote, autoSubs, connState, createRoom, cue, cues, currentTime, embedded, full, isPlaying, joinRoom, lastTime, layoutKey, loadFromResult, loadSource, loadSubs, log, nativeMode, onlinePeers, openUrl, peers, pickFile, pickSub, player, publish, room, roomInput, sendState, setAbout, setConnState, setCues, setEmbedded, setFull, setLayoutKey, setLog, setNativeMode, setPeers, setRoom, setRoomInput, setSource, setSubBusy, setSubMsg, setSubName, setSubOffset, setSubQuery, setSubResults, setSubSize, setSubUrl, setSubsOn, setUrlInput, source, sourceRef, st, subBusy, subMsg, subName, subOffset, subQuery, subResults, subSize, subUrl, subsOn, surface, timeEv, toggleFull, urlInput, viewRef, wsRef };
  return (
    <Ctx.Provider value={value}>
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        <StatusBar barStyle="light-content" hidden={full} />
        {children}
        {full && <View style={styles.fullLayer}>{surface}</View>}
        <AboutSheet visible={about} onClose={() => setAbout(false)} />
      </View>
    </Ctx.Provider>
  );
}

export function TabScreen({ tab }) {
  const { about, addLog, applyRemote, applyingRemote, autoSubs, connState, createRoom, cue, cues, currentTime, embedded, full, isPlaying, joinRoom, lastTime, layoutKey, loadFromResult, loadSource, loadSubs, log, nativeMode, onlinePeers, openUrl, peers, pickFile, pickSub, player, publish, room, roomInput, sendState, setAbout, setConnState, setCues, setEmbedded, setFull, setLayoutKey, setLog, setNativeMode, setPeers, setRoom, setRoomInput, setSource, setSubBusy, setSubMsg, setSubName, setSubOffset, setSubQuery, setSubResults, setSubSize, setSubUrl, setSubsOn, setUrlInput, source, sourceRef, st, subBusy, subMsg, subName, subOffset, subQuery, subResults, subSize, subUrl, subsOn, surface, timeEv, toggleFull, urlInput, viewRef, wsRef } = useContext(Ctx);
  const [focused, setFocused] = useState(false);
  useFocusEffect(useCallback(() => { setFocused(true); return () => setFocused(false); }, []));
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <LinearGradient colors={['#0B1A33', '#000', '#000']} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.headerBadge}><Ionicons name="film" size={16} color="#fff" /></View>
          <Text style={styles.headerTitle}>مشغّلي</Text>
          <View style={{ flex: 1 }} />
          <IconBtn name="information-circle-outline" size={26} color={C.sub} onPress={() => setAbout(true)} />
        </View>
        <View style={styles.playerCard}>{!full && focused ? surface : <View style={styles.surface} />}</View>

        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView key={layoutKey} contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {tab === 'player' && (
              <>
                <Card title="شغّل من رابط" icon="link">
                  <Field value={urlInput} onChangeText={setUrlInput} placeholder="https://example.com/video.mp4" keyboardType="url" onSubmitEditing={openUrl} returnKeyType="go" />
                  <Btn title="شغّل" icon="play" onPress={openUrl} />
                  <Hint>لازم يكون رابط مباشر للفيديو (mp4 أو m3u8)، مو صفحة يوتيوب.</Hint>
                </Card>
                <Card title="من جوالك" icon="folder-open">
                  <Btn title="اختر فيديو من الملفات" icon="document" kind="ghost" onPress={pickFile} />
                </Card>
              </>
            )}

            {tab === 'subs' && (
              <>
                <Card title="جيب الترجمة تلقائي" icon="sparkles">
                  <Field value={subQuery} onChangeText={setSubQuery} placeholder="Movie name / Show S01E01" onSubmitEditing={autoSubs} returnKeyType="search" />
                  <Btn title={subBusy ? 'يدوّر…' : 'جيب الترجمة تلقائي'} icon="sparkles" onPress={subBusy ? undefined : autoSubs} />
                  {subBusy && <ActivityIndicator color={ACCENT} style={{ marginVertical: 6 }} />}
                  {!!subMsg && <Hint color={embedded || cues.length ? C.green : C.sub}>{subMsg}</Hint>}
                  {subResults.length > 1 && (
                    <View style={{ marginTop: 4 }}>
                      <Text style={styles.listHead}>ترجمات ثانية لو هذي ما ضبطت</Text>
                      {subResults.map((r) => (
                        <Pressable key={r.id} onPress={() => { tap(); loadFromResult(r); }} style={({ pressed }) => [styles.resRow, pressed && { opacity: 0.6 }]}>
                          <Ionicons name={subName === r.file ? 'checkmark-circle' : 'document-text-outline'} size={18} color={subName === r.file ? C.green : C.sub} />
                          <View style={{ flex: 1, marginRight: 10 }}>
                            <Text style={styles.resFile} numberOfLines={1}>{r.file}</Text>
                            <Text style={styles.resMeta}>{r.title}{r.season && r.season !== '0' ? ` · S${r.season}E${r.episode}` : ''} · {r.downloads.toLocaleString('en')} تحميل</Text>
                          </View>
                        </Pressable>
                      ))}
                    </View>
                  )}
                  <Hint>يدوّر أول داخل الفيديو نفسه، وبعدين في OpenSubtitles بالعربي. الاسم ينأخذ من اسم الملف، وعدّله لو مو صح.</Hint>
                </Card>
                <Card title="ملف الترجمة" icon="text">
                  <View style={styles.statusRow}>
                    <Ionicons name={cues.length ? 'checkmark-circle' : 'ellipse-outline'} size={18} color={cues.length ? C.green : C.dim} />
                    <Text style={[styles.p, { flex: 1, marginBottom: 0, marginRight: 8 }]} numberOfLines={1}>
                      {cues.length ? `${subName} · ${cues.length} سطر` : 'ما فيه ترجمة'}
                    </Text>
                  </View>
                  <Btn title="من ملفات الجوال (srt / vtt)" icon="document-text" kind="ghost" onPress={pickSub} />
                  <Field value={subUrl} onChangeText={setSubUrl} placeholder="https://example.com/subtitle.srt" keyboardType="url" />
                  <Btn title="حمّل من الرابط" icon="cloud-download" onPress={() => {
                    const u = subUrl.trim();
                    if (!/^https?:\/\//i.test(u)) return Alert.alert('الرابط غلط', 'لازم يبدأ بـ https://');
                    loadSubs(u, decodeURIComponent(u.split('/').pop() || 'ترجمة'));
                  }} />
                </Card>
                {cues.length > 0 && (
                  <Card title="ضبط" icon="options">
                    <Stepper label="التوقيت" value={`${subOffset > 0 ? '+' : ''}${subOffset.toFixed(1)} ث`}
                      onMinus={() => setSubOffset((o) => +(o - 0.5).toFixed(1))} onPlus={() => setSubOffset((o) => +(o + 0.5).toFixed(1))} onReset={() => setSubOffset(0)} />
                    <Stepper label="الحجم" value={subSize}
                      onMinus={() => setSubSize((x) => Math.max(10, x - 2))} onPlus={() => setSubSize((x) => Math.min(40, x + 2))} />
                    <View style={styles.row}>
                      <Btn style={{ flex: 1 }} title={subsOn ? 'اخفها' : 'اعرضها'} icon={subsOn ? 'eye-off' : 'eye'} kind="ghost" onPress={() => setSubsOn((v) => !v)} />
                      <Btn style={{ flex: 1 }} title="شيلها" icon="trash" kind="danger" onPress={() => { setCues([]); setSubName(''); }} />
                    </View>
                    <Hint>زِد التوقيت (+) لو الكلام يطلع قبل الصوت، ونقّصه (−) لو يطلع بعده.</Hint>
                  </Card>
                )}
                <Hint>الترجمة تطلع في المشغل وفي الشاشة الكاملة حقت التطبيق، بس ما تطلع على التلفزيون ولا في صورة داخل صورة. وفي "سوا" كل واحد ترجمته عنده.</Hint>
              </>
            )}

            {tab === 'together' && (
              <>
                {!room ? (
                  <Card title="نتفرج سوا عن بعد" icon="people">
                    <Btn title="سوّ غرفة جديدة" icon="add-circle" onPress={createRoom} />
                    <View style={styles.divider}><View style={styles.line} /><Text style={styles.or}>أو</Text><View style={styles.line} /></View>
                    <Field value={roomInput} onChangeText={setRoomInput} placeholder="كود غرفة صاحبك" autoCapitalize="characters" style={{ textAlign: 'center', letterSpacing: 4, fontSize: 18 }} />
                    <Btn title="ادخل" icon="enter" kind="ghost" onPress={joinRoom} />
                  </Card>
                ) : (
                  <Card>
                    <Text style={styles.codeLabel}>كود الغرفة</Text>
                    <Text style={styles.code} selectable>{room}</Text>
                    <View style={[styles.statusRow, { justifyContent: 'center' }]}>
                      <View style={[styles.dot, { backgroundColor: connState === 'on' ? C.green : connState === 'connecting' ? C.yellow : C.red }]} />
                      <Text style={styles.statusTxt}>
                        {connState === 'on' ? 'متصل' : connState === 'connecting' ? 'يتصل…' : 'مو متصل'} · معك {onlinePeers}
                      </Text>
                    </View>
                    <View style={styles.row}>
                      <Btn style={{ flex: 1 }} title="زامن" icon="sync" onPress={() => publish({ type: 'req' })} />
                      <Btn style={{ flex: 1 }} title="ارسل وضعي" icon="paper-plane" kind="ghost" onPress={() => sendState('manual')} />
                    </View>
                    <Btn title="اطلع من الغرفة" icon="exit" kind="danger" onPress={() => { setRoom(null); setConnState('off'); }} />
                    {log.map((l, i) => (
                      <View key={i} style={styles.logRow}><Text style={styles.logTime}>{l.at}</Text><Text style={styles.logTxt}>{l.s}</Text></View>
                    ))}
                  </Card>
                )}
                <Hint color={C.yellow}>المزامنة تشتغل مع الروابط بس. الفيديو اللي من ملفات جوالك ما يوصل للثاني.</Hint>
                <Hint>عط الكود لصاحبك يفتح نفس التطبيق ويدخله. المزامنة تمر عن طريق ntfy.sh المجاني، وأي أحد يعرف الكود يشوف الرابط، فلا تحط روابط خاصة.</Hint>
              </>
            )}

            {tab === 'tv' && (
              <Card title="اعرض على التلفزيون" icon="tv">
                <View style={styles.statusRow}>
                  <Ionicons name={player.isExternalPlaybackActive ? 'checkmark-circle' : 'phone-portrait'} size={18} color={player.isExternalPlaybackActive ? C.green : C.sub} />
                  <Text style={[styles.statusTxt, { marginRight: 8 }]}>{player.isExternalPlaybackActive ? 'شغّال على التلفزيون' : 'شغّال على الجوال'}</Text>
                </View>
                <Step n={1} t="خلّ الجوال والتلفزيون على نفس الواي فاي." />
                <Step n={2} t="فعّل أزرار النظام تحت، وبيطلع زر AirPlay على الفيديو." />
                <Step n={3} t="اضغط زر AirPlay واختر التلفزيون." />
                <Btn title={nativeMode ? 'رجّع أزرار التطبيق' : 'فعّل أزرار النظام (AirPlay)'} icon="radio" kind={nativeMode ? 'ghost' : 'primary'} onPress={() => setNativeMode((v) => !v)} />
                <Hint>لو ما ضبط: مركز التحكم ← انعكاس الشاشة.</Hint>
              </Card>
            )}

            {tab === 'screen' && (
              <Card title="بث شاشة الجوال" icon="phone-portrait">
                <Step n="•" t="للتلفزيون: مركز التحكم ← انعكاس الشاشة." />
                <Step n="•" t="لشخص بعيد: مكالمة FaceTime ← مشاركة الشاشة." />
              </Card>
            )}
          </ScrollView>
        </KeyboardAvoidingView>

      </SafeAreaView>
    </View>
  );
}


function AboutSheet({ visible, onClose }) {
  const feats = [
    ['play-circle', 'تشغيل من رابط أو من ملفات جوالك'],
    ['text', 'ترجمة عربية تلقائية أو من ملف'],
    ['people', 'تتفرج مع ربعك عن بعد بكود غرفة'],
    ['tv', 'تعرض على التلفزيون بـ AirPlay'],
    ['albums', 'صورة داخل صورة وشاشة كاملة'],
  ];
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.aboutWrap}>
        <View style={styles.aboutTop}>
          <IconBtn name="close" size={24} color={C.sub} onPress={onClose} />
        </View>
        <View style={styles.aboutIcon}><Ionicons name="film" size={44} color="#fff" /></View>
        <Text style={styles.aboutName}>مشغّلي</Text>
        <Text style={styles.aboutVer}>الإصدار {APP_VERSION}</Text>
        <Text style={[styles.p, { textAlign: 'center', color: C.sub, marginVertical: 14 }]}>
          مشغّل فيديو للآيفون بتصميم Liquid Glass، يشغّل أي فيديو ويجيب له ترجمة عربية، وتقدر تتفرج فيه مع ربعك.
        </Text>
        <View style={[styles.card, { backgroundColor: C.card }]}>
          {feats.map(([ic, t]) => (
            <View key={t} style={styles.featRow}>
              <Ionicons name={ic} size={18} color={ACCENT} />
              <Text style={[styles.p, { flex: 1, marginBottom: 0, marginRight: 10 }]}>{t}</Text>
            </View>
          ))}
        </View>
        <Pressable onPress={() => Linking.openURL('https://github.com/za7ef')} style={({ pressed }) => [styles.devRow, pressed && { opacity: 0.6 }]}>
          <Ionicons name="logo-github" size={20} color={C.text} />
          <Text style={styles.devTxt}>المطوّر: za7ef</Text>
          <Ionicons name="open-outline" size={16} color={ACCENT} />
        </Pressable>
      </View>
    </Modal>
  );
}

function Stepper({ label, value, onMinus, onPlus, onReset }) {
  return (
    <View style={styles.stepper}>
      <Text style={styles.stepLabel}>{label}</Text>
      <View style={{ flex: 1 }} />
      <View style={styles.stepCtl}>
        <IconBtn name="remove" size={18} onPress={onMinus} style={styles.stepBtn} />
        <Pressable onLongPress={onReset}><Text style={styles.stepVal}>{value}</Text></Pressable>
        <IconBtn name="add" size={18} onPress={onPlus} style={styles.stepBtn} />
      </View>
    </View>
  );
}
function Step({ n, t }) {
  return (
    <View style={styles.stepRow}>
      <View style={styles.stepNum}><Text style={styles.stepNumTxt}>{n}</Text></View>
      <Text style={[styles.p, { flex: 1, marginBottom: 0 }]}>{t}</Text>
    </View>
  );
}


const rtl = { textAlign: 'right', writingDirection: 'rtl' };
const styles = StyleSheet.create({
  glass: { overflow: 'hidden' },
  header: { flexDirection: 'row-reverse', alignItems: 'center', paddingHorizontal: 20, paddingTop: 6, paddingBottom: 12 },
  headerBadge: { width: 30, height: 30, borderRadius: 9, backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center', marginLeft: 10 },
  headerTitle: { color: C.text, fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  playerCard: { marginHorizontal: 14, borderRadius: 22, overflow: 'hidden', backgroundColor: '#000', borderWidth: StyleSheet.hairlineWidth, borderColor: C.stroke,
    shadowColor: ACCENT, shadowOpacity: 0.25, shadowRadius: 24, shadowOffset: { width: 0, height: 8 } },
  surface: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000' },
  surfaceFull: { flex: 1, aspectRatio: undefined },
  subWrap: { position: 'absolute', left: 16, right: 16, alignItems: 'center' },
  subText: { color: '#fff', textAlign: 'center', writingDirection: 'rtl', fontWeight: '700', lineHeight: undefined,
    backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8, overflow: 'hidden',
    textShadowColor: '#000', textShadowRadius: 4 },
  topBar: { position: 'absolute', top: 0, left: 0, right: 0, height: 56, flexDirection: 'row', direction: 'ltr', alignItems: 'center', padding: 10, gap: 6 },
  topTitle: { color: '#fff', fontSize: 14, fontWeight: '600', flexShrink: 1, maxWidth: '60%', ...rtl },
  livePill: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: 'rgba(48,209,88,0.2)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, marginLeft: 8 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.green, marginLeft: 5 },
  liveTxt: { color: C.green, fontSize: 11, fontWeight: '700' },
  iconBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18 },
  center: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, flexDirection: 'row', direction: 'ltr', alignItems: 'center', justifyContent: 'center', gap: 34 },
  roundLg: { width: 68, height: 68, borderRadius: 34, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.25)' },
  roundSm: { width: 46, height: 46, borderRadius: 23 },
  fillCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', direction: 'ltr', alignItems: 'center', paddingHorizontal: 14, paddingBottom: 10, gap: 10 },
  time: { color: '#fff', fontSize: 12, fontVariant: ['tabular-nums'], fontWeight: '600', minWidth: 40, textAlign: 'center' },
  trackHit: { flex: 1, height: 28, justifyContent: 'center' },
  track: { height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.25)', overflow: 'hidden' },
  trackFill: { height: 4, backgroundColor: '#fff' },
  knob: { position: 'absolute', width: 12, height: 12, borderRadius: 6, backgroundColor: '#fff', marginLeft: -6, top: 8 },
  body: { padding: 14, paddingTop: 16, paddingBottom: 40 },
  fullLayer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#000', zIndex: 50 },
  listHead: { color: C.sub, fontSize: 12, fontWeight: '600', marginBottom: 4, textAlign: 'right' },
  resRow: { flexDirection: 'row-reverse', alignItems: 'center', paddingVertical: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.stroke },
  resFile: { color: C.text, fontSize: 13, textAlign: 'left', writingDirection: 'ltr' },
  resMeta: { color: C.dim, fontSize: 11, marginTop: 2, textAlign: 'right' },
  aboutWrap: { flex: 1, backgroundColor: '#0d0d10', padding: 20, alignItems: 'stretch' },
  aboutTop: { flexDirection: 'row', justifyContent: 'flex-start' },
  aboutIcon: { alignSelf: 'center', width: 88, height: 88, borderRadius: 22, backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  aboutName: { color: C.text, fontSize: 28, fontWeight: '800', textAlign: 'center', marginTop: 14 },
  aboutVer: { color: C.dim, fontSize: 13, textAlign: 'center', marginTop: 4 },
  featRow: { flexDirection: 'row-reverse', alignItems: 'center', paddingVertical: 8 },
  devRow: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, marginTop: 6 },
  devTxt: { color: C.text, fontSize: 15, fontWeight: '600' },
  glassTag: { color: C.dim, fontSize: 11, fontWeight: '600' },
  card: { backgroundColor: LIQUID ? 'transparent' : C.card, borderRadius: 20, padding: 16, marginBottom: 12, borderWidth: StyleSheet.hairlineWidth, borderColor: C.stroke },
  cardHead: { flexDirection: 'row-reverse', alignItems: 'center', marginBottom: 12 },
  cardIcon: { width: 28, height: 28, borderRadius: 8, backgroundColor: 'rgba(10,132,255,0.15)', alignItems: 'center', justifyContent: 'center', marginLeft: 10 },
  cardTitle: { color: C.text, fontSize: 17, fontWeight: '700', ...rtl },
  btn: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 14, marginBottom: 8 },
  btnText: { fontSize: 15, fontWeight: '700' },
  input: { textAlign: 'left', writingDirection: 'ltr', backgroundColor: 'rgba(255,255,255,0.06)', color: C.text, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13, marginBottom: 10, fontSize: 15, borderWidth: StyleSheet.hairlineWidth, borderColor: C.stroke },
  p: { color: C.text, fontSize: 15, lineHeight: 23, marginBottom: 8, ...rtl },
  hint: { color: C.sub, fontSize: 13, lineHeight: 20, marginTop: 4, marginBottom: 8, paddingHorizontal: 4, ...rtl },
  row: { flexDirection: 'row-reverse', gap: 8 },
  statusRow: { flexDirection: 'row-reverse', alignItems: 'center', marginBottom: 12 },
  statusTxt: { color: C.sub, fontSize: 14, ...rtl },
  dot: { width: 8, height: 8, borderRadius: 4, marginLeft: 8 },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 10 },
  line: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: C.stroke },
  or: { color: C.dim, marginHorizontal: 10, fontSize: 13 },
  codeLabel: { color: C.sub, textAlign: 'center', fontSize: 13 },
  code: { color: C.text, fontSize: 42, fontWeight: '800', textAlign: 'center', letterSpacing: 8, marginVertical: 6, fontVariant: ['tabular-nums'] },
  logRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', paddingVertical: 6, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.stroke },
  logTxt: { color: C.sub, fontSize: 13, ...rtl },
  logTime: { color: C.dim, fontSize: 12 },
  stepper: { flexDirection: 'row-reverse', alignItems: 'center', marginBottom: 12 },
  stepLabel: { color: C.text, fontSize: 15, fontWeight: '600' },
  stepCtl: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12 },
  stepBtn: { width: 40, height: 36 },
  stepVal: { color: C.text, minWidth: 62, textAlign: 'center', fontSize: 14, fontWeight: '700', fontVariant: ['tabular-nums'] },
  stepRow: { flexDirection: 'row-reverse', alignItems: 'flex-start', marginBottom: 10 },
  stepNum: { width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(10,132,255,0.18)', alignItems: 'center', justifyContent: 'center', marginLeft: 10, marginTop: 0 },
  stepNumTxt: { color: ACCENT, fontWeight: '800', fontSize: 12 },
  tabWrap: { position: 'absolute', left: 0, right: 0, bottom: 24, alignItems: 'center' },
  tabBar: { flexDirection: 'row-reverse', borderRadius: 28, paddingHorizontal: 8, paddingVertical: 8, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.15)', width: '92%' },
  tabItem: { flex: 1, alignItems: 'center', paddingVertical: 2 },
  tabTxt: { color: C.sub, fontSize: 10, fontWeight: '600', marginTop: 3 },
});
