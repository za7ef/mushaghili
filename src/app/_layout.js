import { NativeTabs } from 'expo-router/native-tabs';
import { PlayerProvider, useFullscreen } from '../core';
import { t, isRTL } from '../i18n';

export const unstable_settings = { initialRouteName: 'index' };

export default function Layout() {
  return (
    <PlayerProvider>
      <Tabs />
    </PlayerProvider>
  );
}

const TABS = [
  ['index', 'tabPlayer', { default: 'play.circle', selected: 'play.circle.fill' }, 'play_circle'],
  ['subs', 'tabSubs', { default: 'captions.bubble', selected: 'captions.bubble.fill' }, 'subtitles'],
  ['together', 'tabTogether', { default: 'person.2', selected: 'person.2.fill' }, 'group'],
  ['tv', 'tabTv', 'tv', 'tv'],
  ['screen', 'tabScreen', 'iphone', 'smartphone'],
];

function Tabs() {
  const full = useFullscreen();
  // RTL languages: player tab sits on the right, so list it last.
  const list = isRTL() ? [...TABS].reverse() : TABS;
  return (
    <NativeTabs tintColor="#0A84FF" minimizeBehavior="never" hidden={full}>
      {list.map(([name, key, sf, md]) => (
        <NativeTabs.Trigger key={name} name={name}>
          <NativeTabs.Trigger.Icon sf={sf} md={md} />
          <NativeTabs.Trigger.Label>{t(key)}</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
      ))}
    </NativeTabs>
  );
}
