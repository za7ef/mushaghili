// Terms of Use & Privacy Policy. Full text in Arabic (primary) and English; other languages show English.
export const EFFECTIVE = '2026-11-11';

export const LEGAL_LABELS = {
  ar: ['شروط الاستخدام', 'سياسة الخصوصية', 'معلومات قانونية'], en: ['Terms of Use', 'Privacy Policy', 'Legal'],
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
    ["", "تاريخ السريان: 11 نوفمبر 2026. باستخدامك تطبيق «مشغّلي» (المطوّر: za7ef) فإنك توافق على هذه الشروط، فإن لم توافق عليها فلا تستخدم التطبيق."],
    ["١. التعريف بالتطبيق", "«مشغّلي» مشغّل فيديو يشغّل الروابط والملفات التي يختارها المستخدم. ولا يستضيف التطبيق أي محتوى ولا يرفعه ولا يوزّعه، ولا يقدّم مكتبة أفلام أو مسلسلات."],
    ["٢. مسؤولية المستخدم عن المحتوى", "يتحمّل المستخدم وحده المسؤولية عن أي فيديو أو ترجمة يشغّلها أو يبثّها أو يشاركها، وعن امتلاكه الحق النظامي في ذلك. ويُحظر استخدام التطبيق لمحتوى مقرصن أو مخالف للأنظمة أو منتهك لحقوق الغير."],
    ["٣. الخدمات الخارجية", "تعتمد بعض المزايا على خدمات أطراف ثالثة: OpenSubtitles للترجمة، وntfy.sh للمشاهدة الجماعية، وAirPlay من Apple للعرض على التلفاز. وهذه الخدمات خارجة عن سيطرة المطوّر، وقد تتغيّر أو تتوقف، ولكلٍّ منها شروطها الخاصة."],
    ["٤. إخلاء الضمان", "يُقدَّم التطبيق «كما هو» و«حسب توفّره» دون أي ضمان صريح أو ضمني، بما في ذلك ملاءمته لغرض معيّن أو خلوّه من الأخطاء أو استمرار عمله دون انقطاع."],
    ["٥. حدود المسؤولية", "إلى أقصى حدّ تسمح به الأنظمة، لا يتحمّل المطوّر المسؤولية عن أي ضرر مباشر أو غير مباشر ينشأ عن استخدام التطبيق أو تعذّر استخدامه أو عن أي محتوى يُشغَّل فيه."],
    ["٦. تعديل الشروط", "قد تُحدَّث هذه الشروط مع الإصدارات الجديدة، ويُعدّ استمرار استخدام التطبيق بعد التحديث موافقةً على الشروط المعدّلة."],
    ["٧. النظام الواجب التطبيق", "تخضع هذه الشروط لأنظمة المملكة العربية السعودية."],
    ["٨. التواصل", "github.com/za7ef"],
  ],
  privacy: [
    ["", "تاريخ السريان: 11 نوفمبر 2026. توضّح هذه السياسة كيفية التعامل مع بياناتك في تطبيق «مشغّلي» (المطوّر: za7ef)."],
    ["١. لا حسابات ولا تتبّع", "لا يتطلّب التطبيق تسجيلًا أو إنشاء حساب، ولا يتضمّن أي أدوات تحليلات أو إعلانات أو تتبّع، ولا يجمع المطوّر أي بيانات عنك ولا يتلقّاها."],
    ["٢. البيانات المحفوظة على جهازك", "تُحفظ الإعدادات وآخر موضع وصلت إليه في كل فيديو وملفات الترجمة المؤقتة على جهازك فقط، ويمكنك حذفها من الإعدادات ← مسح السجل والذاكرة المؤقتة، أو بحذف التطبيق."],
    ["٣. المشاهدة الجماعية", "عند استخدام غرفة مشاهدة، يرسل التطبيق رمز الغرفة ورابط الفيديو وحالة التشغيل (التشغيل أو الإيقاف والوقت) عبر خدمة ntfy.sh العامة. ويستطيع أي شخص يعرف رمز الغرفة الاطّلاع على هذه الرسائل، لذا لا تستخدم روابط خاصة. ولا تُرسَل ملفات جهازك مطلقًا."],
    ["٤. البحث عن الترجمة", "عند البحث التلقائي عن ترجمة، يرسل التطبيق اسم الفيلم أو المسلسل (المأخوذ من اسم الملف أو الذي تكتبه) ولغة الترجمة إلى OpenSubtitles، ولا يُرسَل الفيديو نفسه."],
    ["٥. تشغيل الروابط وAirPlay", "عند تشغيل رابط، يتصل جهازك مباشرةً بالموقع المستضيف له، ويعمل AirPlay بين جهازك وتلفازك عبر Apple. ولهذه الجهات سياسات خصوصية خاصة بها."],
    ["٦. الأطفال", "لا يجمع التطبيق بيانات من أي شخص، بمن في ذلك الأطفال."],
    ["٧. التعديلات والتواصل", "قد تُحدَّث هذه السياسة مع الإصدارات الجديدة. للتواصل: github.com/za7ef"],
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
