import React, { useEffect, useRef, useState, useCallback, useContext, createContext } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  View, Text, TextInput, Pressable, StyleSheet, ScrollView, Alert, StatusBar,
  KeyboardAvoidingView, Platform, Animated, Modal, Switch, PanResponder, LayoutAnimation, UIManager, Linking, ActivityIndicator,
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { Directory, Paths } from 'expo-file-system';
import { t, setLang, getLang, isRTL, LANGS, SUB_CODES } from './i18n';
import { LEGAL, legalLabels } from './legal';
import { decodeSubBytes, parseSubs, readBytes, guessQuery, searchSubs, downloadSub, cleanCues } from './subs';

if (Platform.OS === 'android') UIManager.setLayoutAnimationEnabledExperimental?.(true);

const SAMPLE = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
const NTFY = 'ntfy.sh';
const TOPIC_PREFIX = 'mhvp-room-';
const MY_ID = Math.random().toString(36).slice(2, 10);
const ACCENT = '#0A84FF';
const APP_VERSION = '1.3.2';
const C = {
  bg: '#000', card: 'rgba(255,255,255,0.06)', stroke: 'rgba(255,255,255,0.09)',
  text: '#F5F5F7', sub: '#98989F', dim: '#636366', green: '#30D158', red: '#FF453A', yellow: '#FFD60A',
};

let LIQUID = false;
try { LIQUID = isLiquidGlassAvailable(); } catch {}

const Ctx = createContext(null);

let HAPTICS = true;
const hSel = () => (HAPTICS ? Haptics.selectionAsync() : Promise.resolve());
const hImpact = () => (HAPTICS ? Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light) : Promise.resolve());
const hOk = () => (HAPTICS ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success) : Promise.resolve());
const tap = () => hSel().catch(() => {});

export const DEFAULTS = {
  lang: 'ar', speed: 1, skip: 10, autoplay: true, resume: true, rememberVolume: true, volume: 1,
  background: false, pipAuto: true, doubleTap: true, haptics: true, keepAwake: true, fit: 'contain',
  subLang: 'ar', subFallback: 'en', subSize: 17, subColor: '#FFFFFF', subBg: 'dark', subPos: 'bottom',
};
const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];
const SUB_COLORS = ['#FFFFFF', '#FFD60A', '#30D158', '#64D2FF'];
const SUB_BGS = { dark: 'rgba(0,0,0,0.6)', light: 'rgba(0,0,0,0.3)', none: 'transparent' };

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
      {icon && <Ionicons name={icon} size={18} color={fg} style={{ [D.iconM]: 8 }} />}
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
function PlayerSurface({ player, viewRef, isPlaying, currentTime, title, cue, subSize, full, onToggleFull, nativeMode, roomActive, cfg, speed, onSpeed }) {
  const [visible, setVisible] = useState(true);
  const [surfW, setSurfW] = useState(1);
  const [flash, setFlash] = useState(null);
  const lastTap = useRef(0);
  const flashTimer = useRef(null);
  const skip = cfg.skip;
  const fade = useRef(new Animated.Value(1)).current;
  const hideTimer = useRef(null);
  const [barW, setBarW] = useState(1);
  const status = useEvent(player, 'statusChange', { status: player.status });
  const srcEv = useEvent(player, 'sourceLoad', null);
  const duration = srcEv?.duration || player.duration || 0;
  const [drag, setDrag] = useState(null); // fraction while scrubbing
  const dragRef = useRef({ startX: 0, w: 1, lastSeek: 0, lastTick: -1 });
  const durRef = useRef(duration); durRef.current = duration;
  const wRef = useRef(1); wRef.current = barW;
  const progress = drag != null ? drag : duration ? Math.min(1, currentTime / duration) : 0;
  const shownTime = drag != null ? drag * duration : currentTime;
  const knobScale = useRef(new Animated.Value(1)).current;
  const clamp = (x) => Math.max(0, Math.min(1, x));
  const pan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderTerminationRequest: () => false,
    onPanResponderGrant: (e) => {
      clearTimeout(hideTimer.current);
      const f = clamp(e.nativeEvent.locationX / wRef.current);
      dragRef.current = { startX: e.nativeEvent.locationX, lastSeek: 0, lastTick: Math.floor(f * 20) };
      setDrag(f);
      Animated.spring(knobScale, { toValue: 1.8, useNativeDriver: true, speed: 30 }).start();
      hImpact().catch(() => {});
    },
    onPanResponderMove: (_, g) => {
      const f = clamp((dragRef.current.startX + g.dx) / wRef.current);
      setDrag(f);
      const tick = Math.floor(f * 20);
      if (tick !== dragRef.current.lastTick) { dragRef.current.lastTick = tick; hSel().catch(() => {}); }
      const now = Date.now();
      if (durRef.current && now - dragRef.current.lastSeek > 250) { dragRef.current.lastSeek = now; player.currentTime = f * durRef.current; }
    },
    onPanResponderRelease: (_, g) => {
      const f = clamp((dragRef.current.startX + g.dx) / wRef.current);
      if (durRef.current) player.currentTime = f * durRef.current;
      Animated.spring(knobScale, { toValue: 1, useNativeDriver: true, speed: 30 }).start();
      setTimeout(() => setDrag(null), 300);
      armRef.current?.();
    },
    onPanResponderTerminate: () => { setDrag(null); Animated.spring(knobScale, { toValue: 1, useNativeDriver: true }).start(); },
  })).current;

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

  const armRef = useRef(null); armRef.current = arm;
  const onSurface = (e) => {
    const now = Date.now();
    const x = e?.nativeEvent?.locationX ?? surfW / 2;
    if (cfg.doubleTap && now - lastTap.current < 300) {
      lastTap.current = 0;
      const fwd = x > surfW / 2;
      player.seekBy(fwd ? skip : -skip);
      tap();
      setFlash({ fwd, n: skip });
      clearTimeout(flashTimer.current);
      flashTimer.current = setTimeout(() => setFlash(null), 600);
      show(true); arm();
      return;
    }
    lastTap.current = now;
    if (visible) show(false); else { show(true); arm(); }
  };
  const act = (fn) => () => { fn(); arm(); };

  return (
    <View style={[styles.surface, full && styles.surfaceFull]} onLayout={(e) => setSurfW(e.nativeEvent.layout.width)}>
      <VideoView
        ref={viewRef}
        style={StyleSheet.absoluteFill}
        player={player}
        nativeControls={nativeMode}
        allowsPictureInPicture
        startsPictureInPictureAutomatically={cfg.pipAuto}
        contentFit={cfg.fit}
        allowsVideoFrameAnalysis={false}
      />
      {cue && (
        <View pointerEvents="none" style={[styles.subWrap, cfg.subPos === 'top'
          ? { top: visible && !nativeMode ? (full ? 70 : 52) : (full ? 30 : 12) }
          : { bottom: visible && !nativeMode ? (full ? 92 : 64) : (full ? 36 : 14) }]}>
          <Text style={[styles.subText, { fontSize: full ? subSize * 1.25 : subSize, color: cfg.subColor, backgroundColor: SUB_BGS[cfg.subBg] },
            cfg.subBg === 'none' && { textShadowColor: '#000', textShadowRadius: 4, textShadowOffset: { width: 0, height: 1 } }]}>{cue.text}</Text>
        </View>
      )}
      {flash && (
        <View pointerEvents="none" style={[styles.flash, flash.fwd ? { right: '12%' } : { left: '12%' }]}>
          <Ionicons name={flash.fwd ? 'play-forward' : 'play-back'} size={22} color="#fff" />
          <Text style={styles.flashTxt}>{flash.fwd ? '+' : '−'}{flash.n}</Text>
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
              <Pressable onPress={act(() => { tap(); onSpeed(SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length] ?? 1); })} style={styles.speedPill}>
                <Text style={styles.speedTxt}>{speed}×</Text>
              </Pressable>
              <View style={{ flex: 1 }} />
              {roomActive && <View style={styles.livePill}><View style={styles.liveDot} /><Text style={styles.liveTxt}>{t('live')}</Text></View>}
              <Text numberOfLines={1} style={styles.topTitle}>{title}</Text>
            </View>
            <View style={styles.center} pointerEvents="box-none">
              <IconBtn name="play-back" size={26} style={styles.roundSm} onPress={act(() => player.seekBy(-skip))} />
              <Glass style={styles.roundLg} intensity={30} forceBlur>
                <Pressable onPress={() => { tap(); isPlaying ? player.pause() : player.play(); arm(); }} style={styles.fillCenter}>
                  <Ionicons name={isPlaying ? 'pause' : 'play'} size={34} color="#fff" style={!isPlaying && { marginLeft: 4 }} />
                </Pressable>
              </Glass>
              <IconBtn name="play-forward" size={26} style={styles.roundSm} onPress={act(() => player.seekBy(skip))} />
            </View>
            <View style={[styles.bottomBar, full && { paddingHorizontal: 40, paddingBottom: 26 }]}>
              <Text style={styles.time}>{fmt(shownTime)}</Text>
              <View style={styles.trackHit} onLayout={(e) => setBarW(e.nativeEvent.layout.width)} {...pan.panHandlers}>
                <View pointerEvents="none" style={[styles.track, drag != null && { height: 7, borderRadius: 4 }]}>
                  <View style={[styles.trackFill, { width: `${progress * 100}%` }, drag != null && { height: 7 }]} />
                </View>
                <Animated.View pointerEvents="none" style={[styles.knob, { left: `${progress * 100}%`, transform: [{ scale: knobScale }] }]} />
                {drag != null && (
                  <View pointerEvents="none" style={[styles.bubble, { left: Math.max(0, Math.min(barW - 64, progress * barW - 32)) }]}>
                    <Text style={styles.bubbleTxt}>{fmt(shownTime)}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.time}>-{fmt(Math.max(0, duration - shownTime))}</Text>
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

  /* settings (persisted) */
  const [cfg, setCfg] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [speed, setSpeedState] = useState(1);
  const positions = useRef({});
  useEffect(() => {
    (async () => {
      let saved = {};
      try { saved = JSON.parse((await AsyncStorage.getItem('settings')) || '{}'); } catch {}
      try { positions.current = JSON.parse((await AsyncStorage.getItem('positions')) || '{}'); } catch {}
      setCfg({ ...DEFAULTS, ...saved });
    })();
  }, []);
  const setOpt = useCallback((k, v) => {
    setCfg((c) => { const n = { ...c, [k]: v }; AsyncStorage.setItem('settings', JSON.stringify(n)).catch(() => {}); return n; });
  }, []);
  if (cfg) { setLang(cfg.lang); applyDir(isRTL()); HAPTICS = cfg.haptics; }

  const player = useVideoPlayer(SAMPLE, (p) => {
    p.allowsExternalPlayback = true;
    p.timeUpdateEventInterval = 0.25;
    p.showNowPlayingNotification = true;
  });
  const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: player.playing });
  const timeEv = useEvent(player, 'timeUpdate', { currentTime: 0 });
  const currentTime = timeEv?.currentTime ?? 0;

  // apply settings to the player
  const cfgLoaded = !!cfg;
  useEffect(() => { if (cfg) { player.playbackRate = cfg.speed; setSpeedState(cfg.speed); if (cfg.rememberVolume) player.volume = cfg.volume; } }, [cfgLoaded]);
  useEffect(() => { if (cfg) player.staysActiveInBackground = cfg.background; }, [cfg?.background]);
  useEffect(() => { if (cfg) { player.playbackRate = cfg.speed; setSpeedState(cfg.speed); } }, [cfg?.speed]);
  const onSpeed = useCallback((v) => { player.playbackRate = v; setSpeedState(v); }, [player]);
  const volEv = useEvent(player, 'volumeChange', { volume: player.volume });
  useEffect(() => { if (cfg?.rememberVolume && volEv && Math.abs((volEv.volume ?? 1) - cfg.volume) > 0.01) setOpt('volume', volEv.volume); }, [volEv?.volume]);
  useEffect(() => {
    if (cfg?.keepAwake && isPlaying) activateKeepAwakeAsync('player').catch(() => {});
    else { try { deactivateKeepAwake('player'); } catch {} }
  }, [isPlaying, cfg?.keepAwake]);


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
  const [subSize, setSubSizeState] = useState(17);
  const setSubSize = (v) => { setSubSizeState(v); setOpt('subSize', v); };
  useEffect(() => { if (cfg) setSubSizeState(cfg.subSize); }, [cfg?.subSize]);
  const [subsOn, setSubsOn] = useState(true);
  const loadSubs = async (uri, name) => {
    try {
      const c = parseSubs(decodeSubBytes(await readBytes(uri)));
      if (!c.length) return Alert.alert(t('noSubFound'), t('checkSrt'));
      setCues(c); setSubName(name); setSubsOn(true); setSubOffset(0);
      hOk().catch(() => {});
    } catch (e) { Alert.alert(t('cantOpenSub'), String(e?.message || e)); }
  };
  const pickSub = async () => {
    const r = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
    if (!r.canceled && r.assets?.length) loadSubs(r.assets[0].uri, r.assets[0].name || t('subtitle'));
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
      if (!c.length) throw new Error(t('emptyFile'));
      setCues(c); setSubName(r.file); setSubsOn(true); setSubOffset(0);
      try { player.subtitleTrack = null; } catch {}
      setEmbedded(null);
      setSubMsg(t('loadedSub', { x: r.file }));
      hOk().catch(() => {});
    } catch (e) { setSubMsg(t('cantDownload', { x: String(e?.message || e) })); }
    setSubBusy(false);
  };

  const autoSubs = async () => {
    setSubBusy(true); setSubMsg(''); setSubResults([]);
    // 1) embedded tracks inside the video
    try {
      const tracks = player.availableSubtitleTracks || [];
      const want = [cfg.subLang, cfg.subFallback].filter((l) => l && l !== 'none');
      let ar = null;
      for (const l of want) { ar = tracks.find((tr) => (tr.language || '').toLowerCase().startsWith(l)); if (ar) break; }
      if (ar) {
        player.subtitleTrack = ar;
        setEmbedded(ar.label || ar.language || '✓');
        setCues([]); setSubName('');
        setSubMsg(t('embeddedFound'));
        setSubBusy(false);
        return;
      }
    } catch {}
    // 2) online search
    const g = guessQuery(subQuery || source.name);
    const q = { ...g, query: (subQuery || g.query).trim() };
    if (!q.query) { setSubMsg(t('typeName')); setSubBusy(false); return; }
    try {
      let res = [];
      for (const l of [cfg.subLang, cfg.subFallback]) {
        if (!l || l === 'none' || res.length) continue;
        const code = SUB_CODES[l] || 'ara';
        res = await searchSubs(q, code);
        if (!res.length && (q.season || q.episode)) res = await searchSubs({ query: q.query }, code);
      }
      if (!res.length) { setSubMsg(t('noSubsOnline')); setSubBusy(false); return; }
      setSubResults(res.slice(0, 10));
      setSubBusy(false);
      await loadFromResult(res[0]);
    } catch (e) { setSubMsg(t('searchFailed', { x: String(e?.message || e) })); setSubBusy(false); }
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
  const seekSendTimer = useRef(null);
  const lastTime = useRef({ t: 0, at: Date.now() });
  const sourceRef = useRef(source);
  sourceRef.current = source;
  const addLog = (s) => setLog((l) => [{ s, at: new Date().toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }) }, ...l].slice(0, 5));

  const loadSource = useCallback(async (src) => {
    setSource(src);
    try {
      await player.replaceAsync(src.uri);
      player.playbackRate = speed;
      const pos = positions.current[src.uri];
      if (cfg?.resume && pos > 5) {
        setTimeout(() => { const d = player.duration || 0; if (!d || pos < d - 10) player.currentTime = pos; }, 400);
      }
      if (cfg?.autoplay !== false) player.play();
    }
    catch (e) { Alert.alert(t('videoFailed'), String(e?.message || e)); }
  }, [player, cfg, speed]);

  const publish = useCallback(async (msg) => {
    if (!room) return;
    try {
      await fetch(`https://${NTFY}/${TOPIC_PREFIX}${room}`, { method: 'POST', body: JSON.stringify({ ...msg, from: MY_ID, ts: Date.now() }) });
    } catch { addLog(t('sendFailed')); }
  }, [room]);

  const sendState = useCallback((reason) => {
    const src = sourceRef.current;
    if (src.local) { if (reason !== 'auto') addLog(t('localNoShare')); return; }
    publish({ type: 'state', url: src.uri, name: src.name, playing: player.playing, time: player.currentTime });
  }, [publish, player]);

  const applyRemote = useCallback(async (m) => {
    applyingRemote.current = true;
    try {
      if (m.url && m.url !== sourceRef.current.uri) {
        setSource({ uri: m.url, local: false, name: m.name || t('roomVideo') });
        await player.replaceAsync(m.url);
      }
      const lag = m.playing ? Math.max(0, (Date.now() - m.ts) / 1000) : 0;
      const target = (m.time || 0) + lag;
      if (Math.abs(player.currentTime - target) > 1.5) player.currentTime = target;
      if (m.playing && !player.playing) player.play();
      if (!m.playing && player.playing) player.pause();
      lastTime.current = { t: target, at: Date.now() };
    } catch (e) { addLog(t('syncProblem')); }
    setTimeout(() => { applyingRemote.current = false; }, 1200);
  }, [player]);

  useEffect(() => {
    if (!room) return;
    let closed = false, retry;
    const connect = () => {
      setConnState('connecting');
      const ws = new WebSocket(`wss://${NTFY}/${TOPIC_PREFIX}${room}/ws`);
      wsRef.current = ws;
      ws.onopen = () => { setConnState('on'); addLog(t('joinedRoom')); publish({ type: 'hello' }); };
      ws.onmessage = (e) => {
        let ev, m;
        try { ev = JSON.parse(e.data); } catch { return; }
        if (ev.event !== 'message' || !ev.message) return;
        try { m = JSON.parse(ev.message); } catch { return; }
        if (m.from === MY_ID) return;
        setPeers((p) => ({ ...p, [m.from]: Date.now() }));
        if (m.type === 'hello') { addLog(t('someoneJoined')); sendState('auto'); }
        else if (m.type === 'req') sendState('auto');
        else if (m.type === 'state') { addLog(m.playing ? t('otherPlayed') : t('otherPaused')); applyRemote(m); }
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
    if (room && !applyingRemote.current && Math.abs(currentTime - expected) > 2.5) {
      clearTimeout(seekSendTimer.current);
      seekSendTimer.current = setTimeout(() => sendState('auto'), 600); // debounce scrubbing
    }
  }, [currentTime]);

  const createRoom = () => { setPeers({}); setLog([]); setRoom(newRoomCode()); };
  const joinRoom = () => {
    const c = roomInput.trim().toUpperCase();
    if (c.length < 4) return Alert.alert(t('codeShort'), t('codeShortMsg'));
    setPeers({}); setLog([]); setRoom(c);
  };
  const onlinePeers = Object.values(peers).filter((t) => Date.now() - t < 5 * 60 * 1000).length;

  const pickFile = async () => {
    const r = await DocumentPicker.getDocumentAsync({ type: 'video/*', copyToCacheDirectory: true });
    if (!r.canceled && r.assets?.length) loadSource({ uri: r.assets[0].uri, local: true, name: r.assets[0].name || t('phoneVideo') });
  };
  const openUrl = () => {
    const u = urlInput.trim();
    if (!/^https?:\/\//i.test(u)) return Alert.alert(t('badLink'), t('badLinkMsg'));
    loadSource({ uri: u, local: false, name: decodeURIComponent(u.split('/').pop() || t('link')) });
    setUrlInput('');
  };

  const surface = (
    <PlayerSurface player={player} viewRef={viewRef} isPlaying={isPlaying} currentTime={currentTime}
      title={source.name} cue={cue} subSize={subSize} full={full} onToggleFull={toggleFull} cfg={cfg || DEFAULTS} speed={speed} onSpeed={onSpeed}
      nativeMode={nativeMode} roomActive={!!room && connState === 'on'} />
  );

  const lastSave = useRef(0);
  useEffect(() => {
    if (!cfg?.resume || !source?.uri || currentTime < 1) return;
    const now = Date.now();
    if (isPlaying && now - lastSave.current < 5000) return;
    lastSave.current = now;
    positions.current[source.uri] = currentTime;
    const keys = Object.keys(positions.current);
    if (keys.length > 50) delete positions.current[keys[0]];
    AsyncStorage.setItem('positions', JSON.stringify(positions.current)).catch(() => {});
  }, [Math.floor(currentTime), isPlaying]);
  const clearData = async () => {
    positions.current = {};
    try { await AsyncStorage.removeItem('positions'); } catch {}
    try { const d = new Directory(Paths.cache); for (const f of d.list()) { try { f.delete(); } catch {} } } catch {}
    hOk().catch(() => {});
    Alert.alert(t('cleared'));
  };

  const value = { cfg, setOpt, setSettingsOpen, clearData, about, addLog, applyRemote, applyingRemote, autoSubs, connState, createRoom, cue, cues, currentTime, embedded, full, isPlaying, joinRoom, lastTime, layoutKey, loadFromResult, loadSource, loadSubs, log, nativeMode, onlinePeers, openUrl, peers, pickFile, pickSub, player, publish, room, roomInput, sendState, setAbout, setConnState, setCues, setEmbedded, setFull, setLayoutKey, setLog, setNativeMode, setPeers, setRoom, setRoomInput, setSource, setSubBusy, setSubMsg, setSubName, setSubOffset, setSubQuery, setSubResults, setSubSize, setSubUrl, setSubsOn, setUrlInput, source, sourceRef, st, subBusy, subMsg, subName, subOffset, subQuery, subResults, subSize, subUrl, subsOn, surface, timeEv, toggleFull, urlInput, viewRef, wsRef };
  if (!cfg) return <View style={{ flex: 1, backgroundColor: '#000' }} />;
  return (
    <Ctx.Provider value={value}>
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        <StatusBar barStyle="light-content" hidden={full} />
        <React.Fragment key={cfg.lang}>{children}</React.Fragment>
        <SettingsSheet visible={settingsOpen} onClose={() => setSettingsOpen(false)} cfg={cfg} setOpt={setOpt}
          onClear={clearData} onAbout={() => { setSettingsOpen(false); setTimeout(() => setAbout(true), 450); }} />
        {full && <View style={styles.fullLayer}>{surface}</View>}
        <AboutSheet visible={about} onClose={() => setAbout(false)} />
      </View>
    </Ctx.Provider>
  );
}

export function TabScreen({ tab }) {
  const { setSettingsOpen, about, addLog, applyRemote, applyingRemote, autoSubs, connState, createRoom, cue, cues, currentTime, embedded, full, isPlaying, joinRoom, lastTime, layoutKey, loadFromResult, loadSource, loadSubs, log, nativeMode, onlinePeers, openUrl, peers, pickFile, pickSub, player, publish, room, roomInput, sendState, setAbout, setConnState, setCues, setEmbedded, setFull, setLayoutKey, setLog, setNativeMode, setPeers, setRoom, setRoomInput, setSource, setSubBusy, setSubMsg, setSubName, setSubOffset, setSubQuery, setSubResults, setSubSize, setSubUrl, setSubsOn, setUrlInput, source, sourceRef, st, subBusy, subMsg, subName, subOffset, subQuery, subResults, subSize, subUrl, subsOn, surface, timeEv, toggleFull, urlInput, viewRef, wsRef } = useContext(Ctx);
  const [focused, setFocused] = useState(false);
  useFocusEffect(useCallback(() => { setFocused(true); return () => setFocused(false); }, []));
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <LinearGradient colors={['#0B1A33', '#000', '#000']} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.headerBadge}><Ionicons name="film" size={16} color="#fff" /></View>
          <Text style={styles.headerTitle}>{t('appName')}</Text>
          <View style={{ flex: 1 }} />
          <IconBtn name="information-circle-outline" size={26} color={C.sub} onPress={() => setAbout(true)} />
          <IconBtn name="settings-outline" size={24} color={C.sub} onPress={() => { tap(); setSettingsOpen(true); }} />
        </View>
        <View style={styles.playerCard}>{!full && focused ? surface : <View style={styles.surface} />}</View>

        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView key={layoutKey} contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {tab === 'player' && (
              <>
                <Card title={t('playFromLink')} icon="link">
                  <Field value={urlInput} onChangeText={setUrlInput} placeholder="https://example.com/video.mp4" keyboardType="url" onSubmitEditing={openUrl} returnKeyType="go" />
                  <Btn title={t('play')} icon="play" onPress={openUrl} />
                  <Hint>{t('directLinkHint')}</Hint>
                </Card>
                <Card title={t('fromPhone')} icon="folder-open">
                  <Btn title={t('pickVideo')} icon="document" kind="ghost" onPress={pickFile} />
                </Card>
              </>
            )}

            {tab === 'subs' && (
              <>
                <Card title={t('autoSubs')} icon="sparkles">
                  <Field value={subQuery} onChangeText={setSubQuery} placeholder="Movie name / Show S01E01" onSubmitEditing={autoSubs} returnKeyType="search" />
                  <Btn title={subBusy ? t('searching') : t('autoSubs')} icon="sparkles" onPress={subBusy ? undefined : autoSubs} />
                  {subBusy && <ActivityIndicator color={ACCENT} style={{ marginVertical: 6 }} />}
                  {!!subMsg && <Hint color={embedded || cues.length ? C.green : C.sub}>{subMsg}</Hint>}
                  {subResults.length > 1 && (
                    <View style={{ marginTop: 4 }}>
                      <Text style={styles.listHead}>{t('otherSubs')}</Text>
                      {subResults.map((r) => (
                        <Pressable key={r.id} onPress={() => { tap(); loadFromResult(r); }} style={({ pressed }) => [styles.resRow, pressed && { opacity: 0.6 }]}>
                          <Ionicons name={subName === r.file ? 'checkmark-circle' : 'document-text-outline'} size={18} color={subName === r.file ? C.green : C.sub} />
                          <View style={{ flex: 1, [D.gap]: 10 }}>
                            <Text style={styles.resFile} numberOfLines={1}>{r.file}</Text>
                            <Text style={styles.resMeta}>{r.title}{r.season && r.season !== '0' ? ` · S${r.season}E${r.episode}` : ''} · {t('downloads', { n: r.downloads.toLocaleString('en') })}</Text>
                          </View>
                        </Pressable>
                      ))}
                    </View>
                  )}
                  <Hint>{t('autoHint')}</Hint>
                </Card>
                <Card title={t('subFile')} icon="text">
                  <View style={styles.statusRow}>
                    <Ionicons name={cues.length ? 'checkmark-circle' : 'ellipse-outline'} size={18} color={cues.length ? C.green : C.dim} />
                    <Text style={[styles.p, { flex: 1, marginBottom: 0, [D.gap]: 8 }]} numberOfLines={1}>
                      {cues.length ? `${subName} · ${t('lines', { n: cues.length })}` : t('noSub')}
                    </Text>
                  </View>
                  <Btn title={t('fromFiles')} icon="document-text" kind="ghost" onPress={pickSub} />
                  <Field value={subUrl} onChangeText={setSubUrl} placeholder="https://example.com/subtitle.srt" keyboardType="url" />
                  <Btn title={t('loadFromLink')} icon="cloud-download" onPress={() => {
                    const u = subUrl.trim();
                    if (!/^https?:\/\//i.test(u)) return Alert.alert(t('badLink'), t('badLinkMsg'));
                    loadSubs(u, decodeURIComponent(u.split('/').pop() || t('subtitle')));
                  }} />
                </Card>
                {cues.length > 0 && (
                  <Card title={t('adjust')} icon="options">
                    <Stepper label={t('timing')} value={`${subOffset > 0 ? '+' : ''}${subOffset.toFixed(1)} ${t('sec')}`}
                      onMinus={() => setSubOffset((o) => +(o - 0.5).toFixed(1))} onPlus={() => setSubOffset((o) => +(o + 0.5).toFixed(1))} onReset={() => setSubOffset(0)} />
                    <Stepper label={t('size')} value={subSize}
                      onMinus={() => setSubSize((x) => Math.max(10, x - 2))} onPlus={() => setSubSize((x) => Math.min(40, x + 2))} />
                    <View style={styles.row}>
                      <Btn style={{ flex: 1 }} title={subsOn ? t('hide') : t('show')} icon={subsOn ? 'eye-off' : 'eye'} kind="ghost" onPress={() => setSubsOn((v) => !v)} />
                      <Btn style={{ flex: 1 }} title={t('remove')} icon="trash" kind="danger" onPress={() => { setCues([]); setSubName(''); }} />
                    </View>
                    <Hint>{t('timingHint')}</Hint>
                  </Card>
                )}
                <Hint>{t('subsHint')}</Hint>
              </>
            )}

            {tab === 'together' && (
              <>
                {!room ? (
                  <Card title={t('watchTogether')} icon="people">
                    <Btn title={t('newRoom')} icon="add-circle" onPress={createRoom} />
                    <View style={styles.divider}><View style={styles.line} /><Text style={styles.or}>{t('or')}</Text><View style={styles.line} /></View>
                    <Field value={roomInput} onChangeText={setRoomInput} placeholder={t('friendCode')} autoCapitalize="characters" style={{ textAlign: 'center', letterSpacing: 4, fontSize: 18 }} />
                    <Btn title={t('join')} icon="enter" kind="ghost" onPress={joinRoom} />
                  </Card>
                ) : (
                  <Card>
                    <Text style={styles.codeLabel}>{t('roomCode')}</Text>
                    <Text style={styles.code} selectable>{room}</Text>
                    <View style={[styles.statusRow, { justifyContent: 'center' }]}>
                      <View style={[styles.dot, { backgroundColor: connState === 'on' ? C.green : connState === 'connecting' ? C.yellow : C.red }]} />
                      <Text style={styles.statusTxt}>
                        {connState === 'on' ? t('connected') : connState === 'connecting' ? t('connecting') : t('disconnected')} · {t('withYou', { n: onlinePeers })}
                      </Text>
                    </View>
                    <View style={styles.row}>
                      <Btn style={{ flex: 1 }} title={t('sync')} icon="sync" onPress={() => publish({ type: 'req' })} />
                      <Btn style={{ flex: 1 }} title={t('sendMine')} icon="paper-plane" kind="ghost" onPress={() => sendState('manual')} />
                    </View>
                    <Btn title={t('leaveRoom')} icon="exit" kind="danger" onPress={() => { setRoom(null); setConnState('off'); }} />
                    {log.map((l, i) => (
                      <View key={i} style={styles.logRow}><Text style={styles.logTime}>{l.at}</Text><Text style={styles.logTxt}>{l.s}</Text></View>
                    ))}
                  </Card>
                )}
                <Hint color={C.yellow}>{t('linksOnly')}</Hint>
                <Hint>{t('togetherHint')}</Hint>
              </>
            )}

            {tab === 'tv' && (
              <Card title={t('showOnTv')} icon="tv">
                <View style={styles.statusRow}>
                  <Ionicons name={player.isExternalPlaybackActive ? 'checkmark-circle' : 'phone-portrait'} size={18} color={player.isExternalPlaybackActive ? C.green : C.sub} />
                  <Text style={[styles.statusTxt, { [D.gap]: 8 }]}>{player.isExternalPlaybackActive ? t('onTv') : t('onPhone')}</Text>
                </View>
                <Step n={1} t={t('tv1')} />
                <Step n={2} t={t('tv2')} />
                <Step n={3} t={t('tv3')} />
                <Btn title={nativeMode ? t('nativeOff') : t('nativeOn')} icon="radio" kind={nativeMode ? 'ghost' : 'primary'} onPress={() => setNativeMode((v) => !v)} />
                <Hint>{t('mirrorHint')}</Hint>
              </Card>
            )}

            {tab === 'screen' && (
              <Card title={t('screenTitle')} icon="phone-portrait">
                <Step n="•" t={t('screenTv')} />
                <Step n="•" t={t('screenFace')} />
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
    ['play-circle', t('feat1')],
    ['text', t('feat2')],
    ['people', t('feat3')],
    ['tv', t('feat4')],
    ['albums', t('feat5')],
  ];
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.aboutWrap}>
        <View style={styles.aboutTop}>
          <IconBtn name="close" size={24} color={C.sub} onPress={onClose} />
        </View>
        <View style={styles.aboutIcon}><Ionicons name="film" size={44} color="#fff" /></View>
        <Text style={styles.aboutName}>{t('appName')}</Text>
        <Text style={styles.aboutVer}>{t('version', { x: APP_VERSION })}</Text>
        <Text style={[styles.p, { textAlign: 'center', color: C.sub, marginVertical: 14 }]}>
          {t('aboutDesc')}
        </Text>
        <View style={[styles.card, { backgroundColor: C.card }]}>
          {feats.map(([ic, t]) => (
            <View key={t} style={styles.featRow}>
              <Ionicons name={ic} size={18} color={ACCENT} />
              <Text style={[styles.p, { flex: 1, marginBottom: 0, [D.gap]: 10 }]}>{t}</Text>
            </View>
          ))}
        </View>
        <Pressable onPress={() => Linking.openURL('https://github.com/za7ef')} style={({ pressed }) => [styles.devRow, pressed && { opacity: 0.6 }]}>
          <Ionicons name="logo-github" size={20} color={C.text} />
          <Text style={styles.devTxt}>{t('developer', { x: 'za7ef' })}</Text>
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


/* ---------- Settings ---------- */
function SRow({ label, children, last }) {
  return (
    <View style={[styles.sRow, last && { borderBottomWidth: 0 }]}>
      <Text style={styles.sLabel}>{label}</Text>
      {children}
    </View>
  );
}
function SToggle({ label, value, onChange, last }) {
  return (
    <SRow label={label} last={last}>
      <Switch value={value} onValueChange={(v) => { tap(); onChange(v); }} trackColor={{ true: ACCENT }} />
    </SRow>
  );
}
function Chips({ options, value, onChange, wrap }) {
  const inner = options.map(([v, label]) => {
    const on = v === value;
    return (
      <Pressable key={String(v)} onPress={() => { tap(); onChange(v); }} style={[styles.chip, on && styles.chipOn]}>
        <Text style={[styles.chipTxt, on && { color: '#fff' }]}>{label}</Text>
      </Pressable>
    );
  });
  return <View style={styles.chipWrap}>{inner}</View>;
}
function SSection({ title, children }) {
  return (
    <>
      <Text style={styles.sHead}>{title}</Text>
      <View style={styles.sCard}>{children}</View>
    </>
  );
}
function SChoice({ label, children }) {
  return (
    <View style={styles.sChoice}>
      <Text style={[styles.sLabel, { marginBottom: 8 }]}>{label}</Text>
      {children}
    </View>
  );
}
function SLink({ icon, label, onPress, danger, last }) {
  return (
    <Pressable onPress={() => { tap(); onPress(); }} style={({ pressed }) => [styles.sRow, last && { borderBottomWidth: 0 }, pressed && { opacity: 0.6 }]}>
      <Text style={[styles.sLabel, danger && { color: C.red }]}>{label}</Text>
      <Ionicons name={icon} size={18} color={danger ? C.red : C.dim} />
    </Pressable>
  );
}

function LegalView({ kind, onBack }) {
  const lang = getLang();
  const items = LEGAL(lang)[kind];
  const labels = legalLabels(lang);
  const ar = lang === 'ar';
  const dir = { textAlign: ar ? 'right' : 'left', writingDirection: ar ? 'rtl' : 'ltr' };
  return (
    <View style={{ flex: 1 }}>
      <View style={[styles.sTop, { flexDirection: D.R }]}>
        <IconBtn name={D.rtl ? 'chevron-forward' : 'chevron-back'} size={24} color={ACCENT} onPress={onBack} />
        <Text style={styles.sTitle}>{kind === 'terms' ? labels[0] : labels[1]}</Text>
        <View style={{ width: 36 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
        {items.map(([h, body], i) => (
          <View key={i} style={{ marginBottom: 14 }}>
            {!!h && <Text style={[styles.legalH, dir]}>{h}</Text>}
            <Text style={[styles.legalP, dir, !h && { color: C.sub }]}>{body}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

function SettingsSheet({ visible, onClose, cfg, setOpt, onClear, onAbout }) {
  const [page, setPage] = useState(null);
  const labels = legalLabels(cfg.lang);
  const langName = (c) => (LANGS.find((l) => l[0] === c) || [c, c])[1];
  const subLangs = LANGS.map(([c, n]) => [c, n]);
  const changeLang = (l) => {
    const wasRtl = ['ar', 'ur', 'fa'].includes(cfg.lang);
    setOpt('lang', l);
    void wasRtl;
  };
  const close = () => { setPage(null); onClose(); };
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={close}>
      <View style={styles.aboutWrap0}>
        {page ? <LegalView kind={page} onBack={() => setPage(null)} /> : (
          <>
            <View style={[styles.sTop, { flexDirection: D.R }]}>
              <View style={{ width: 60 }} />
              <Text style={styles.sTitle}>{t('settings')}</Text>
              <Pressable onPress={close} hitSlop={10} style={{ width: 60, alignItems: D.rtl ? 'flex-start' : 'flex-end' }}>
                <Text style={styles.sDone}>{t('done')}</Text>
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }}>
              <SSection title={t('language')}>
                <View style={styles.sChoice}><Chips wrap options={LANGS} value={cfg.lang} onChange={changeLang} /></View>
              </SSection>

              <SSection title={t('playback')}>
                <SChoice label={t('defaultSpeed')}>
                  <Chips options={SPEEDS.map((v) => [v, `${v}×`])} value={cfg.speed} onChange={(v) => setOpt('speed', v)} />
                </SChoice>
                <SChoice label={t('skipInterval')}>
                  <Chips options={[5, 10, 15, 30].map((v) => [v, `${v} ${t('sec')}`])} value={cfg.skip} onChange={(v) => setOpt('skip', v)} />
                </SChoice>
                <SChoice label={t('videoFit')}>
                  <Chips options={[['contain', t('fit')], ['cover', t('fill')]]} value={cfg.fit} onChange={(v) => setOpt('fit', v)} />
                </SChoice>
                <SToggle label={t('autoplay')} value={cfg.autoplay} onChange={(v) => setOpt('autoplay', v)} />
                <SToggle label={t('resume')} value={cfg.resume} onChange={(v) => setOpt('resume', v)} />
                <SToggle label={t('rememberVolume')} value={cfg.rememberVolume} onChange={(v) => setOpt('rememberVolume', v)} />
                <SToggle label={t('backgroundAudio')} value={cfg.background} onChange={(v) => setOpt('background', v)} />
                <SToggle label={t('pipAuto')} value={cfg.pipAuto} onChange={(v) => setOpt('pipAuto', v)} />
                <SToggle label={t('doubleTap')} value={cfg.doubleTap} onChange={(v) => setOpt('doubleTap', v)} />
                <SToggle label={t('keepAwake')} value={cfg.keepAwake} onChange={(v) => setOpt('keepAwake', v)} />
                <SToggle label={t('haptics')} value={cfg.haptics} onChange={(v) => setOpt('haptics', v)} last />
              </SSection>

              <SSection title={t('subSettings')}>
                <SChoice label={t('subLang')}>
                  <Chips options={subLangs} value={cfg.subLang} onChange={(v) => setOpt('subLang', v)} />
                </SChoice>
                <SChoice label={t('subFallback')}>
                  <Chips options={[['none', t('none')], ...subLangs]} value={cfg.subFallback} onChange={(v) => setOpt('subFallback', v)} />
                </SChoice>
                <SChoice label={`${t('size')} · ${cfg.subSize}`}>
                  <Chips options={[13, 15, 17, 20, 24, 28].map((v) => [v, String(v)])} value={cfg.subSize} onChange={(v) => setOpt('subSize', v)} />
                </SChoice>
                <SChoice label={t('subColor')}>
                  <View style={styles.chipRow}>
                    {SUB_COLORS.map((c) => (
                      <Pressable key={c} onPress={() => { tap(); setOpt('subColor', c); }}
                        style={[styles.swatch, { backgroundColor: c }, cfg.subColor === c && styles.swatchOn]} />
                    ))}
                  </View>
                </SChoice>
                <SChoice label={t('subBg')}>
                  <Chips options={[['dark', t('bgDark')], ['light', t('bgLight')], ['none', t('bgNone')]]} value={cfg.subBg} onChange={(v) => setOpt('subBg', v)} />
                </SChoice>
                <SChoice label={t('subPos')}>
                  <Chips options={[['bottom', t('bottom')], ['top', t('top')]]} value={cfg.subPos} onChange={(v) => setOpt('subPos', v)} />
                </SChoice>
                <View style={styles.subPreviewWrap}>
                  <Text style={[styles.subPreview, { fontSize: cfg.subSize, color: cfg.subColor, backgroundColor: SUB_BGS[cfg.subBg] }]}>
                    {langName(cfg.subLang)} · Aa ١٢٣
                  </Text>
                </View>
              </SSection>

              <SSection title={t('data')}>
                <SLink icon="trash-outline" label={t('clearHistory')} danger last onPress={() =>
                  Alert.alert(t('clearHistory'), '', [{ text: '✕', style: 'cancel' }, { text: t('remove'), style: 'destructive', onPress: onClear }])} />
              </SSection>

              <SSection title={labels[2]}>
                <SLink icon={D.rtl ? 'chevron-back' : 'chevron-forward'} label={labels[0]} onPress={() => setPage('terms')} />
                <SLink icon={D.rtl ? 'chevron-back' : 'chevron-forward'} label={labels[1]} onPress={() => setPage('privacy')} />
                <SLink icon="information-circle-outline" label={t('about')} onPress={onAbout} last />
              </SSection>
              <Text style={styles.sFoot}>{t('appName')} · {t('version', { x: APP_VERSION })}</Text>
            </ScrollView>
          </>
        )}
      </View>
    </Modal>
  );
}

let styles;
let D = {};
export function applyDir(rtlOn) {
  const R = rtlOn ? 'row-reverse' : 'row';
  const TA = rtlOn ? 'right' : 'left';
  const WD = rtlOn ? 'rtl' : 'ltr';
  const IM = rtlOn ? 'marginLeft' : 'marginRight';
  const TXT = { textAlign: TA, writingDirection: WD };
  D = { rtl: rtlOn, R, TA, WD, iconM: IM, gap: rtlOn ? 'marginRight' : 'marginLeft' };
  styles = makeStyles(R, TA, WD, IM, TXT);
}
function makeStyles(R, TA, WD, IM, TXT) { return StyleSheet.create({
  glass: { overflow: 'hidden' },
  header: { flexDirection: R, alignItems: 'center', paddingHorizontal: 20, paddingTop: 6, paddingBottom: 12 },
  headerBadge: { width: 30, height: 30, borderRadius: 9, backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center', [IM]: 10 },
  headerTitle: { color: C.text, fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  playerCard: { marginHorizontal: 14, borderRadius: 22, overflow: 'hidden', backgroundColor: '#000', borderWidth: StyleSheet.hairlineWidth, borderColor: C.stroke,
    shadowColor: ACCENT, shadowOpacity: 0.25, shadowRadius: 24, shadowOffset: { width: 0, height: 8 } },
  surface: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000' },
  surfaceFull: { flex: 1, aspectRatio: undefined },
  subWrap: { position: 'absolute', left: 16, right: 16, alignItems: 'center' },
  subText: { color: '#fff', textAlign: 'center', writingDirection: WD, fontWeight: '700', lineHeight: undefined,
    backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8, overflow: 'hidden',
    textShadowColor: '#000', textShadowRadius: 4 },
  topBar: { position: 'absolute', top: 0, left: 0, right: 0, height: 56, flexDirection: 'row', direction: 'ltr', alignItems: 'center', padding: 10, gap: 6 },
  topTitle: { color: '#fff', fontSize: 14, fontWeight: '600', flexShrink: 1, maxWidth: '60%', ...TXT },
  livePill: { flexDirection: R, alignItems: 'center', backgroundColor: 'rgba(48,209,88,0.2)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, [IM]: 8 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.green, [IM]: 5 },
  liveTxt: { color: C.green, fontSize: 11, fontWeight: '700' },
  iconBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18 },
  center: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, flexDirection: 'row', direction: 'ltr', alignItems: 'center', justifyContent: 'center', gap: 34 },
  roundLg: { width: 68, height: 68, borderRadius: 34, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.25)' },
  roundSm: { width: 46, height: 46, borderRadius: 23 },
  fillCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', direction: 'ltr', alignItems: 'center', paddingHorizontal: 14, paddingBottom: 10, gap: 10 },
  time: { color: '#fff', fontSize: 12, fontVariant: ['tabular-nums'], fontWeight: '600', minWidth: 40, textAlign: 'center' },
  trackHit: { flex: 1, height: 36, justifyContent: 'center' },
  bubble: { position: 'absolute', bottom: 34, width: 64, paddingVertical: 4, borderRadius: 10, backgroundColor: 'rgba(30,30,32,0.92)', alignItems: 'center' },
  bubbleTxt: { color: '#fff', fontSize: 13, fontWeight: '700', fontVariant: ['tabular-nums'] },
  track: { height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.25)', overflow: 'hidden' },
  trackFill: { height: 4, backgroundColor: '#fff' },
  knob: { position: 'absolute', width: 12, height: 12, borderRadius: 6, backgroundColor: '#fff', marginLeft: -6, top: 12 },
  body: { padding: 14, paddingTop: 16, paddingBottom: 140 },
  fullLayer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#000', zIndex: 50 },
  listHead: { color: C.sub, fontSize: 12, fontWeight: '600', marginBottom: 4, textAlign: TA },
  resRow: { flexDirection: R, alignItems: 'center', paddingVertical: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.stroke },
  resFile: { color: C.text, fontSize: 13, textAlign: 'left', writingDirection: 'ltr' },
  resMeta: { color: C.dim, fontSize: 11, marginTop: 2, textAlign: TA },
  aboutWrap0: { flex: 1, backgroundColor: '#0d0d10' },
  sTop: { alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  sTitle: { color: C.text, fontSize: 17, fontWeight: '700' },
  sDone: { color: ACCENT, fontSize: 17, fontWeight: '600' },
  sHead: { color: C.sub, fontSize: 13, fontWeight: '600', marginTop: 18, marginBottom: 6, paddingHorizontal: 12, ...TXT },
  sCard: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, overflow: 'hidden' },
  sRow: { flexDirection: R, alignItems: 'center', justifyContent: 'space-between', minHeight: 48, paddingHorizontal: 14, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.stroke },
  sLabel: { color: C.text, fontSize: 15, flexShrink: 1, ...TXT },
  sChoice: { paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.stroke },
  chipRow: { flexDirection: R, gap: 8, alignItems: 'center' },
  chipWrap: { flexDirection: R, flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.08)' },
  chipOn: { backgroundColor: ACCENT },
  chipTxt: { color: C.sub, fontSize: 14, fontWeight: '600' },
  swatch: { width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: 'transparent' },
  swatchOn: { borderColor: ACCENT, transform: [{ scale: 1.1 }] },
  subPreviewWrap: { height: 70, margin: 12, borderRadius: 10, backgroundColor: '#1c2b44', alignItems: 'center', justifyContent: 'center' },
  subPreview: { fontWeight: '700', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8, overflow: 'hidden' },
  sFoot: { color: C.dim, fontSize: 12, textAlign: 'center', marginTop: 24 },
  legalH: { color: C.text, fontSize: 16, fontWeight: '700', marginBottom: 4 },
  legalP: { color: C.text, fontSize: 14.5, lineHeight: 23 },
  flash: { position: 'absolute', top: '40%', flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.45)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  flashTxt: { color: '#fff', fontSize: 15, fontWeight: '700' },
  speedPill: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.16)', marginLeft: 4 },
  speedTxt: { color: '#fff', fontSize: 13, fontWeight: '700' },
  aboutWrap: { flex: 1, backgroundColor: '#0d0d10', padding: 20, alignItems: 'stretch' },
  aboutTop: { flexDirection: 'row', justifyContent: 'flex-start' },
  aboutIcon: { alignSelf: 'center', width: 88, height: 88, borderRadius: 22, backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  aboutName: { color: C.text, fontSize: 28, fontWeight: '800', textAlign: 'center', marginTop: 14 },
  aboutVer: { color: C.dim, fontSize: 13, textAlign: 'center', marginTop: 4 },
  featRow: { flexDirection: R, alignItems: 'center', paddingVertical: 8 },
  devRow: { flexDirection: R, alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, marginTop: 6 },
  devTxt: { color: C.text, fontSize: 15, fontWeight: '600' },
  glassTag: { color: C.dim, fontSize: 11, fontWeight: '600' },
  card: { backgroundColor: LIQUID ? 'transparent' : C.card, borderRadius: 20, padding: 16, marginBottom: 12, borderWidth: StyleSheet.hairlineWidth, borderColor: C.stroke },
  cardHead: { flexDirection: R, alignItems: 'center', marginBottom: 12 },
  cardIcon: { width: 28, height: 28, borderRadius: 8, backgroundColor: 'rgba(10,132,255,0.15)', alignItems: 'center', justifyContent: 'center', [IM]: 10 },
  cardTitle: { color: C.text, fontSize: 17, fontWeight: '700', ...TXT },
  btn: { flexDirection: R, alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 14, marginBottom: 8 },
  btnText: { fontSize: 15, fontWeight: '700' },
  input: { textAlign: 'left', writingDirection: 'ltr', backgroundColor: 'rgba(255,255,255,0.06)', color: C.text, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13, marginBottom: 10, fontSize: 15, borderWidth: StyleSheet.hairlineWidth, borderColor: C.stroke },
  p: { color: C.text, fontSize: 15, lineHeight: 23, marginBottom: 8, ...TXT },
  hint: { color: C.sub, fontSize: 13, lineHeight: 20, marginTop: 4, marginBottom: 8, paddingHorizontal: 4, ...TXT },
  row: { flexDirection: R, gap: 8 },
  statusRow: { flexDirection: R, alignItems: 'center', marginBottom: 12 },
  statusTxt: { color: C.sub, fontSize: 14, ...TXT },
  dot: { width: 8, height: 8, borderRadius: 4, [IM]: 8 },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 10 },
  line: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: C.stroke },
  or: { color: C.dim, marginHorizontal: 10, fontSize: 13 },
  codeLabel: { color: C.sub, textAlign: 'center', fontSize: 13 },
  code: { color: C.text, fontSize: 42, fontWeight: '800', textAlign: 'center', letterSpacing: 8, marginVertical: 6, fontVariant: ['tabular-nums'] },
  logRow: { flexDirection: R, justifyContent: 'space-between', paddingVertical: 6, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.stroke },
  logTxt: { color: C.sub, fontSize: 13, ...TXT },
  logTime: { color: C.dim, fontSize: 12 },
  stepper: { flexDirection: R, alignItems: 'center', marginBottom: 12 },
  stepLabel: { color: C.text, fontSize: 15, fontWeight: '600' },
  stepCtl: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12 },
  stepBtn: { width: 40, height: 36 },
  stepVal: { color: C.text, minWidth: 62, textAlign: 'center', fontSize: 14, fontWeight: '700', fontVariant: ['tabular-nums'] },
  stepRow: { flexDirection: R, alignItems: 'flex-start', marginBottom: 10 },
  stepNum: { width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(10,132,255,0.18)', alignItems: 'center', justifyContent: 'center', [IM]: 10, marginTop: 0 },
  stepNumTxt: { color: ACCENT, fontWeight: '800', fontSize: 12 },
  tabWrap: { position: 'absolute', left: 0, right: 0, bottom: 24, alignItems: 'center' },
  tabBar: { flexDirection: R, borderRadius: 28, paddingHorizontal: 8, paddingVertical: 8, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.15)', width: '92%' },
  tabItem: { flex: 1, alignItems: 'center', paddingVertical: 2 },
  tabTxt: { color: C.sub, fontSize: 10, fontWeight: '600', marginTop: 3 },
}); }
applyDir(true);
