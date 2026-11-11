// Terms of Use & Privacy Policy. Full text in Arabic (primary) and English; other languages show English.
export const EFFECTIVE = '2026-11-11';

export const LEGAL_LABELS = {
  ar: ['شروط الاستخدام', 'سياسة الخصوصية', 'قانوني'], en: ['Terms of Use', 'Privacy Policy', 'Legal'],
  fr: ["Conditions d'utilisation", 'Politique de confidentialité', 'Mentions légales'], es: ['Términos de uso', 'Política de privacidad', 'Legal'],
  tr: ['Kullanım Koşulları', 'Gizlilik Politikası', 'Yasal'], ur: ['شرائطِ استعمال', 'پرائیویسی پالیسی', 'قانونی'],
  id: ['Ketentuan Penggunaan', 'Kebijakan Privasi', 'Legal'], hi: ['उपयोग की शर्तें', 'गोपनीयता नीति', 'कानूनी'],
  de: ['Nutzungsbedingungen', 'Datenschutzerklärung', 'Rechtliches'], ru: ['Условия использования', 'Политика конфиденциальности', 'Правовая информация'],
  zh: ['使用条款', '隐私政策', '法律信息'], ja: ['利用規約', 'プライバシーポリシー', '法的情報'],
  ko: ['이용약관', '개인정보 처리방침', '법적 고지'], pt: ['Termos de Uso', 'Política de Privacidade', 'Jurídico'],
  fa: ['شرایط استفاده', 'سیاست حریم خصوصی', 'حقوقی'],
};

const AR = {
  terms: [
    ['', 'آخر تحديث: ٢٠٢٦/١١/١١. باستخدامك تطبيق «مشغّلي» (المطوّر: za7ef) أنت موافق على هالشروط. لو مو موافق، لا تستخدم التطبيق.'],
    ['١. وش هو التطبيق', 'مشغّلي مشغّل فيديو يشغّل روابط الفيديو والملفات اللي تختارها أنت. التطبيق ما يستضيف ولا يرفع ولا يوزّع أي محتوى، وما يقدّم مكتبة أفلام أو مسلسلات.'],
    ['٢. مسؤوليتك عن المحتوى', 'أنت وحدك المسؤول عن أي فيديو أو ترجمة تشغّلها أو تبثها أو تشاركها، وعن إن عندك الحق النظامي تشغّلها. لا تستخدم التطبيق لمحتوى مقرصن أو مخالف للأنظمة أو لحقوق الآخرين.'],
    ['٣. خدمات خارجية', 'بعض المزايا تعتمد على خدمات طرف ثالث: OpenSubtitles للترجمة، وntfy.sh للمشاهدة الجماعية، وAirPlay من أبل للعرض على التلفزيون. هالخدمات مو تحت سيطرة المطوّر، وقد تتوقف أو تتغير أو تكون لها شروطها الخاصة.'],
    ['٤. بدون ضمان', 'التطبيق مقدّم «كما هو» و«حسب توفره» بدون أي ضمان، صريح أو ضمني، بما في ذلك صلاحيته لغرض معيّن أو خلوّه من الأخطاء أو استمرار عمله.'],
    ['٥. حدود المسؤولية', 'بأقصى حد يسمح فيه النظام، المطوّر مو مسؤول عن أي ضرر مباشر أو غير مباشر ينتج عن استخدامك للتطبيق أو عدم قدرتك على استخدامه أو عن أي محتوى تشغّله فيه.'],
    ['٦. تغيير الشروط', 'ممكن تتحدث هالشروط مع الإصدارات الجديدة. استمرارك في الاستخدام بعد التحديث يعني موافقتك على الشروط الجديدة.'],
    ['٧. النظام المطبّق', 'تخضع هالشروط لأنظمة المملكة العربية السعودية.'],
    ['٨. التواصل', 'github.com/za7ef'],
  ],
  privacy: [
    ['', 'آخر تحديث: ٢٠٢٦/١١/١١. هالسياسة توضح وش يصير لبياناتك في تطبيق «مشغّلي» (المطوّر: za7ef).'],
    ['١. بدون حسابات وبدون تتبّع', 'التطبيق ما يطلب منك تسجيل ولا حساب، وما فيه أي أدوات تحليلات أو إعلانات أو تتبّع، والمطوّر ما يجمع ولا يستلم أي بيانات عنك.'],
    ['٢. وش ينحفظ على جهازك', 'الإعدادات، وآخر مكان وصلت له في كل فيديو، وملفات الترجمة المؤقتة تنحفظ على جوالك بس. تقدر تمسحها من الإعدادات ← مسح السجل والكاش، أو بحذف التطبيق.'],
    ['٣. المشاهدة الجماعية (سوا)', 'لما تستخدم غرفة مشاهدة، التطبيق يرسل كود الغرفة ورابط الفيديو وحالة التشغيل (تشغيل/إيقاف والوقت) عن طريق خدمة ntfy.sh العامة. أي أحد يعرف كود الغرفة يقدر يشوف هالرسائل، فلا تستخدم روابط خاصة. ملفات جوالك ما تنرسل أبد.'],
    ['٤. البحث عن الترجمة', 'لما تبحث عن ترجمة تلقائي، التطبيق يرسل اسم الفيلم أو المسلسل (المأخوذ من اسم الملف أو اللي تكتبه) ولغة الترجمة إلى OpenSubtitles. الفيديو نفسه ما ينرسل.'],
    ['٥. تشغيل الروابط وAirPlay', 'لما تشغّل رابط، جوالك يتصل مباشرة بالموقع صاحب الرابط. وAirPlay يشتغل بين جوالك وتلفزيونك عن طريق أبل. هالجهات لها سياسات خصوصية خاصة فيها.'],
    ['٦. الأطفال', 'التطبيق ما يجمع بيانات من أي أحد، بما فيهم الأطفال.'],
    ['٧. التغييرات والتواصل', 'ممكن تتحدث هالسياسة مع الإصدارات الجديدة. للتواصل: github.com/za7ef'],
  ],
};
const EN = {
  terms: [
    ['', 'Effective: November 11, 2026. By using Mushaghili (developer: za7ef) you agree to these terms. If you do not agree, do not use the app.'],
    ['1. What the app is', 'Mushaghili is a video player that plays links and files you choose. The app does not host, upload, or distribute any content and does not provide a library of movies or shows.'],
    ['2. Your responsibility for content', 'You alone are responsible for any video or subtitle you play, stream, or share, and for having the legal right to do so. Do not use the app for pirated or unlawful content or content that infringes the rights of others.'],
    ['3. Third-party services', 'Some features rely on third-party services: OpenSubtitles for subtitles, ntfy.sh for watch-together, and Apple AirPlay for TV playback. These services are outside the developer’s control, may change or stop, and have their own terms.'],
    ['4. No warranty', 'The app is provided “as is” and “as available”, without warranty of any kind, express or implied, including fitness for a particular purpose, freedom from errors, or uninterrupted operation.'],
    ['5. Limitation of liability', 'To the maximum extent permitted by law, the developer is not liable for any direct or indirect damages arising from your use of, or inability to use, the app or from any content you play with it.'],
    ['6. Changes', 'These terms may be updated with new versions. Continuing to use the app after an update means you accept the updated terms.'],
    ['7. Governing law', 'These terms are governed by the laws of the Kingdom of Saudi Arabia.'],
    ['8. Contact', 'github.com/za7ef'],
  ],
  privacy: [
    ['', 'Effective: November 11, 2026. This policy explains what happens to your data in Mushaghili (developer: za7ef).'],
    ['1. No accounts, no tracking', 'The app requires no sign-up or account and contains no analytics, advertising, or tracking. The developer does not collect or receive any data about you.'],
    ['2. Stored on your device', 'Settings, your last position in each video, and temporary subtitle files are stored only on your phone. You can erase them in Settings → Clear history and cache, or by deleting the app.'],
    ['3. Watch together', 'When you use a watch room, the app sends the room code, the video link, and playback state (play/pause and time) through the public ntfy.sh service. Anyone who knows the room code can see these messages, so do not use private links. Files from your phone are never sent.'],
    ['4. Subtitle search', 'When you search for subtitles automatically, the app sends the movie or show title (taken from the file name or typed by you) and the subtitle language to OpenSubtitles. The video itself is not sent.'],
    ['5. Links and AirPlay', 'When you play a link, your phone connects directly to the site hosting it. AirPlay works between your phone and TV through Apple. These parties have their own privacy policies.'],
    ['6. Children', 'The app collects no data from anyone, including children.'],
    ['7. Changes and contact', 'This policy may be updated with new versions. Contact: github.com/za7ef'],
  ],
};
export const LEGAL = (lang) => (lang === 'ar' ? AR : EN);
export const legalLabels = (lang) => LEGAL_LABELS[lang] || LEGAL_LABELS.en;
