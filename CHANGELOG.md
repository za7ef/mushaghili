# سجل التغييرات · Changelog

كل الإصدارات تنبني كـ IPA غير موقّع من GitHub Actions وتنثبّت بـ SideStore.
All versions are built as an unsigned IPA by GitHub Actions and installed with SideStore.

---

## 1.3.1 — 2026-11-11

**عربي**
- إصلاح تخطيط العربي (من اليمين لليسار): الهيدر والكروت والأزرار وزر «تم» كانت تطلع فوق بعض، ورجعت صفوف مرتبة.
- خيارات الإعدادات (اللغات والسرعة وغيرها) صارت تلتف على أكثر من سطر وتبدأ من الجهة الصحيحة.
- مسافة تحت المحتوى عشان ما يختفي تحت شريط التابات.
- مدة الفيديو تتحدث أول ما يتحمّل بدل ما تبقى 0:00.
- ضبط اتجاه النص المختلط (عربي + إنجليزي) عشان علامات الترقيم تجي في مكانها.

**English**
- Fixed the Arabic (RTL) layout: header, cards, buttons and the Done button were stacking vertically; they are proper rows again.
- Settings chips (languages, speed, etc.) now wrap and start from the correct side.
- Extra bottom padding so content scrolls above the tab bar.
- Video duration updates as soon as the video loads instead of staying at 0:00.
- Bidi fix for mixed Arabic/Latin text so punctuation lands in the right place.

## 1.3.0 — 2026-11-11

**عربي**
- شاشة إعدادات جديدة (زر الترس) وكل شي ينحفظ على الجهاز.
- التطبيق بـ 15 لغة: العربي (الأساسي)، الإنجليزي، الفرنسي، الإسباني، التركي، الأردو، الإندونيسي، الهندي، الألماني، الروسي، الصيني، الياباني، الكوري، البرتغالي، الفارسي. الاتجاه يتغير تلقائي.
- سرعة افتراضية وزر سرعة داخل المشغل (0.5× إلى 2×).
- مدة التقديم والترجيع 5 / 10 / 15 / 30 ثانية، ودبل تاب على يمين أو يسار الفيديو للتقديم.
- تشغيل تلقائي، يكمّل من آخر مكان وقفت فيه، يحفظ مستوى الصوت، صوت بالخلفية، صورة داخل صورة تلقائي، الشاشة تبقى شغالة، ملاءمة أو ملء الفيديو، اهتزاز.
- لغة الترجمة التلقائية مع لغة احتياطية، وشكل الترجمة (الحجم واللون والخلفية والمكان) مع معاينة.
- مسح السجل والكاش.
- شروط الاستخدام وسياسة الخصوصية داخل التطبيق وفي الريبو.

**English**
- New Settings screen (gear button), stored on device.
- App in 15 languages: Arabic (default), English, French, Spanish, Turkish, Urdu, Indonesian, Hindi, German, Russian, Chinese, Japanese, Korean, Portuguese, Persian, with automatic layout direction.
- Default speed plus an in-player speed button (0.5×–2×).
- Skip interval 5 / 10 / 15 / 30 s, and double-tap left/right to skip.
- Autoplay, resume where you left off, remember volume, background audio, auto picture-in-picture, keep screen awake, fit/fill, haptics toggle.
- Auto-subtitle language with a fallback language; subtitle size, color, background and position with a live preview.
- Clear history and cache.
- Terms of Use and Privacy Policy in the app and in the repo.

## 1.2.0 — 2026-11-11

**عربي**
- شريط تابات أصلي من iOS بتصميم Liquid Glass (المشغل، الترجمة، سوا، التلفزيون، الشاشة).
- إعادة تنظيم الكود بـ expo-router.
- شريط التقديم يتبع إصبعك مع فقاعة الوقت واهتزاز خفيف.
- تحسين مزامنة «سوا» وقت التقديم.

**English**
- Native iOS tab bar with Liquid Glass (Player, Subtitles, Together, TV, Screen).
- Code restructured with expo-router.
- Draggable scrubber with a time bubble and light haptics.
- Smoother watch-together sync while seeking.

## 1.1.0 — 2026-11-11

**عربي**
- أزرار التشغيل في النص بالضبط، والترجيع يسار والتقديم يمين.
- إصلاح الشاشة الكاملة والرجوع للوضع العمودي.
- ترجمة تلقائية: يدوّر داخل الفيديو أول، وبعدين في OpenSubtitles.
- أيقونة جديدة وشاشة «عن التطبيق».

**English**
- Playback controls perfectly centered; rewind on the left, forward on the right.
- Fixed fullscreen and returning to portrait.
- Automatic subtitles: checks embedded tracks first, then OpenSubtitles.
- New app icon and an About screen.

## 1.0.0 — 2026-11-11

**عربي**
- أول إصدار: تشغيل فيديو من رابط أو من ملفات الجوال، أزرار تختفي لحالها، شاشة كاملة، وصورة داخل صورة.
- ترجمة من ملفات srt / vtt (يدعم UTF-8 و Windows-1256) مع ضبط التوقيت والحجم.
- AirPlay للتلفزيون.
- «نتفرج سوا»: غرفة بكود تزامن التشغيل بين جوالين.
- بناء IPA غير موقّع عن طريق GitHub Actions.

**English**
- First release: play video from a link or from Files, auto-hiding controls, fullscreen, picture-in-picture.
- Subtitles from srt / vtt files (UTF-8 and Windows-1256) with timing and size controls.
- AirPlay to TV.
- Watch together: a room code syncs playback between two phones.
- Unsigned IPA build via GitHub Actions.
