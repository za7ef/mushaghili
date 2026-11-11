import { NativeTabs } from 'expo-router/native-tabs';
import { PlayerProvider, useFullscreen } from '../core';

export const unstable_settings = { initialRouteName: 'index' };

// Listed right-to-left visually: the first trigger sits on the left,
// so the player tab ("المشغل") is last to land on the right for Arabic.
export default function Layout() {
  return (
    <PlayerProvider>
      <Tabs />
    </PlayerProvider>
  );
}

function Tabs() {
  const full = useFullscreen();
  return (
      <NativeTabs tintColor="#0A84FF" minimizeBehavior="never" hidden={full}>
        <NativeTabs.Trigger name="screen">
          <NativeTabs.Trigger.Icon sf="iphone" md="smartphone" />
          <NativeTabs.Trigger.Label>الشاشة</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="tv">
          <NativeTabs.Trigger.Icon sf="tv" md="tv" />
          <NativeTabs.Trigger.Label>التلفزيون</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="together">
          <NativeTabs.Trigger.Icon sf={{ default: 'person.2', selected: 'person.2.fill' }} md="group" />
          <NativeTabs.Trigger.Label>سوا</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="subs">
          <NativeTabs.Trigger.Icon sf={{ default: 'captions.bubble', selected: 'captions.bubble.fill' }} md="subtitles" />
          <NativeTabs.Trigger.Label>الترجمة</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="index">
          <NativeTabs.Trigger.Icon sf={{ default: 'play.circle', selected: 'play.circle.fill' }} md="play_circle" />
          <NativeTabs.Trigger.Label>المشغل</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
      </NativeTabs>
  );
}
