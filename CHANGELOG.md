# سجل التغييرات · Changelog

تُبنى جميع الإصدارات بوصفها ملف IPA غير موقّع عبر GitHub Actions، وتُثبَّت باستخدام SideStore.
All versions are built as an unsigned IPA by GitHub Actions and installed with SideStore.

---

## 1.3.2 — 2026-11-11

**العربية**
- تحويل جميع النصوص العربية في التطبيق إلى العربية الفصحى: الواجهة، وأسماء التبويبات، والإعدادات، وشاشة «حول التطبيق»، وشروط الاستخدام، وسياسة الخصوصية.

**English**
- All Arabic text in the app now uses Modern Standard Arabic: the interface, tab names, settings, About screen, Terms of Use and Privacy Policy.

## 1.3.1 — 2026-11-11

**العربية**
- إصلاح تخطيط الواجهة العربية (من اليمين إلى اليسار): كانت الترويسة والبطاقات والأزرار وزر «تم» تظهر متراصّة عموديًا، وعادت صفوفًا مرتّبة.
- أصبحت خيارات الإعدادات (اللغات والسرعة وغيرها) تلتفّ على أكثر من سطر وتبدأ من الجهة الصحيحة.
- إضافة مسافة أسفل المحتوى كي لا يختفي خلف شريط التبويبات.
- تحديث مدة الفيديو فور تحميله بدلًا من بقائها 0:00.
- ضبط اتجاه النص المختلط (عربي وإنجليزي) لتظهر علامات الترقيم في موضعها الصحيح.

**English**
- Fixed the Arabic (RTL) layout: header, cards, buttons and the Done button were stacking vertically; they are proper rows again.
- Settings chips (languages, speed, etc.) now wrap and start from the correct side.
- Extra bottom padding so content scrolls above the tab bar.
- Video duration updates as soon as the video loads instead of staying at 0:00.
- Bidi fix for mixed Arabic/Latin text so punctuation lands in the right place.

## 1.3.0 — 2026-11-11

**العربية**
- شاشة إعدادات جديدة (زر الترس)، تُحفظ جميع خياراتها على الجهاز.
- واجهة بخمس عشرة لغة: العربية (افتراضيًا)، والإنجليزية، والفرنسية، والإسبانية، والتركية، والأردية، والإندونيسية، والهندية، والألمانية، والروسية، والصينية، واليابانية، والكورية، والبرتغالية، والفارسية، مع تغيّر اتجاه الواجهة تلقائيًا.
- سرعة تشغيل افتراضية وزر للسرعة داخل المشغّل (من 0.5× إلى 2×).
- مدة التقديم والترجيع 5 / 10 / 15 / 30 ثانية، والنقر المزدوج على يمين الفيديو أو يساره للتقديم أو الترجيع.
- التشغيل التلقائي، والاستئناف من آخر موضع، وحفظ مستوى الصوت، وتشغيل الصوت في الخلفية، وصورة داخل صورة تلقائيًا، وإبقاء الشاشة مضاءة، وملاءمة الفيديو أو ملء الشاشة، وتفعيل الاهتزاز اللمسي أو إيقافه.
- لغة للترجمة التلقائية مع لغة احتياطية، وتخصيص مظهر الترجمة (الحجم واللون والخلفية والموضع) مع معاينة مباشرة.
- مسح السجل والذاكرة المؤقتة.
- شروط الاستخدام وسياسة الخصوصية داخل التطبيق وفي المستودع.

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

**العربية**
- شريط تبويبات أصلي من iOS بتصميم Liquid Glass (المشغّل، والترجمة، والمشاهدة الجماعية، والتلفاز، والشاشة).
- إعادة تنظيم الشيفرة باستخدام expo-router.
- شريط تقديم يتبع الإصبع مع فقاعة للوقت واهتزاز خفيف.
- تحسين المزامنة في المشاهدة الجماعية أثناء التقديم.

**English**
- Native iOS tab bar with Liquid Glass (Player, Subtitles, Together, TV, Screen).
- Code restructured with expo-router.
- Draggable scrubber with a time bubble and light haptics.
- Smoother watch-together sync while seeking.

## 1.1.0 — 2026-11-11

**العربية**
- توسيط أزرار التشغيل بدقة، مع الترجيع يسارًا والتقديم يمينًا.
- إصلاح الشاشة الكاملة والعودة إلى الوضع العمودي.
- الترجمة التلقائية: البحث داخل الفيديو أولًا، ثم في OpenSubtitles.
- أيقونة جديدة وشاشة «حول التطبيق».

**English**
- Playback controls perfectly centered; rewind on the left, forward on the right.
- Fixed fullscreen and returning to portrait.
- Automatic subtitles: checks embedded tracks first, then OpenSubtitles.
- New app icon and an About screen.

## 1.0.0 — 2026-11-11

**العربية**
- الإصدار الأول: تشغيل الفيديو من رابط أو من ملفات الجهاز، وأزرار تحكّم تختفي تلقائيًا، وشاشة كاملة، ووضع صورة داخل صورة.
- ترجمة من ملفات srt / vtt (بترميزَي UTF-8 و Windows-1256) مع ضبط التوقيت والحجم.
- العرض على التلفاز عبر AirPlay.
- المشاهدة الجماعية: غرفة برمز تُزامِن التشغيل بين جهازين.
- بناء ملف IPA غير موقّع عبر GitHub Actions.

**English**
- First release: play video from a link or from Files, auto-hiding controls, fullscreen, picture-in-picture.
- Subtitles from srt / vtt files (UTF-8 and Windows-1256) with timing and size controls.
- AirPlay to TV.
- Watch together: a room code syncs playback between two phones.
- Unsigned IPA build via GitHub Actions.
