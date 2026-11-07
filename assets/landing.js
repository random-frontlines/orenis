/* Landing page behaviour: language, theme, logo replay, the live canvas demo and the mobile CTA dock. */
const L = {
ko: { nf: "할 수 있는 일", nh: "작동 방식", nq: "자주 묻는 질문", open: "채팅 열기", badge: "공개 베타 · 무료", h1: "한 번만 물어보세요. 조사하고, 읽고, 만들어 드립니다.",
  lead: "단계별로 일하며 라이브 웹을 검색하고, 파일을 읽고, 문서를 쓰고, 이미지를 그리고, 바로 수정할 수 있는 웹페이지까지 만듭니다. 출처를 보여주고, 대화는 내 기기에만 남습니다.",
  cta: "Orenis 채팅 시작", see: "할 수 있는 일 보기", pr1: "베타 기간 무료", pr2: "계정 필요 없음", pr3: "대화는 내 기기에만 저장",
  mUser: "뽀모도로 타이머 만들어줘", mS1: "레이아웃 구상", mS2: "페이지 작성", mS3: "동작 확인", mAns: "완성했어요. 25분 타이머예요. 오른쪽에서 써보시고, 바꾸고 싶은 건 말씀하세요.", mChip: "뽀모도로 타이머 · 캔버스", mTitle: "뽀모도로 타이머", mTabP: "미리보기", mTabC: "코드",
  ft: "하나의 어시스턴트, 여섯 가지 일.", fs: "카드를 누르면 그 요청이 입력된 상태로 Orenis가 열립니다.",
  c1t: "심층 리서치", c1d: "큰 질문을 나눠서 각각 검색하고, 출처를 교차 검증해 인용이 달린 보고서를 씁니다.", c2t: "파일 읽기", c2d: "PDF, 사진, 오디오, 영상, 텍스트, 코드를 올리고 무엇이든 물어보세요.",
  c3t: "문서 만들기", c3d: "이력서, 보고서, 편지, 학습 자료를 PDF나 Word 파일로 받으세요.", c4t: "라이브 캔버스", c4d: "웹페이지와 앱을 만들고, 채팅 옆에서 바로 실행해 보고, 코드를 직접 고치세요.",
  c5t: "이미지 만들기", c5d: "설명하면 그려 드립니다. 한 번에 다운로드.", c6t: "모드와 메모리", c6d: "공부 도우미, 코더, 작가, 플래너, 또는 직접 만든 모드. 편집·삭제 가능한 메모리 목록까지.", try: "써보기 →",
  dt: "여기서 캔버스를 직접 써보세요.", ds: "왼쪽 코드를 고치면 오른쪽 페이지가 입력하는 대로 바뀝니다. Orenis에서는 말로 수정을 요청할 수도 있어요.", dCode: "코드", dEdit: "수정 가능", dPrev: "미리보기",
  ht: "답만이 아니라 과정도 보여줍니다.", s1t: "어떤 언어로든 질문", s1d: "입력하거나 파일을 올리세요. 얼마나 깊이 생각할지 보통·높음·최대로 고르세요.", s2t: "일하는 모습 보기", s2d: "검색, 읽기, 교차 확인, 제작 등 각 단계가 실시간으로 보입니다. 언제든 멈추거나 다시 할 수 있어요.", s3t: "확인하고 다듬기", s3d: "모든 답에 인용과 출처 링크가 붙고, 캔버스 작업은 계속 수정할 수 있습니다.",
  bb: "공식 베타 테스터", pt: "설계부터 프라이빗. 베타 동안 무료.", p1: "대화와 파일은 서버가 아닌 내 브라우저에 저장됩니다", p2: "계정도 가입도 필요 없음", p3: "클릭 한 번으로 백업·이전", p4: "프로 플랜 구성에 먼저 의견 반영",
  free: "무료", f1: "하루 100개 메시지", f2: "5시간당 25개", f3: "검색, 파일, 문서, 이미지, 캔버스", soon: "출시 예정", q1: "더 높은 한도", q2: "우선 처리 속도", q3: "더 큰 파일",
  qt: "궁금한 점, 솔직하게 답합니다.", a1q: "정말 무료인가요?", a1: "베타 기간에는 무료입니다. 하루 100개 메시지, 5시간 창당 최대 25개. 한도가 더 높은 유료 프로 플랜을 준비 중입니다.",
  a2q: "대화는 어디에 저장되나요?", a2: "이 기기의 브라우저에만 저장됩니다. 브라우저 데이터를 지우면 사라지니 설정 → 사용량·데이터에서 백업하세요.", a3q: "틀릴 수도 있나요?", a3: "네. 모든 AI처럼 실수할 수 있습니다. 출처를 함께 제공하니 확인하시고, 중요한 내용은 꼭 검증하세요.",
  a4q: "아직 못 하는 건 무엇인가요?", a4: "계정과 기기 간 동기화, 음성 대화는 아직 없습니다. 이미지 생성은 무료지만 하루 몇 장으로 제한됩니다.", fin: "진짜 궁금한 걸 물어보세요.",
  foot: "Orenis by OrenCraft Labs · 집중력 있는 사용자 중심 AI 도구. 베타 소프트웨어이므로 답변에 오류가 있을 수 있으니 중요한 내용은 확인하세요." },
es: { nf: "Qué hace", nh: "Cómo funciona", nq: "Preguntas", open: "Abrir chat", badge: "Beta pública · Gratis", h1: "Pregunta una vez. Orenis investiga, lee y crea.",
  lead: "Trabaja paso a paso, busca en la web en vivo, lee tus archivos, escribe documentos, dibuja imágenes y construye páginas web que puedes editar al instante. Muestra sus fuentes y tus chats se quedan en tu dispositivo.",
  cta: "Abrir Orenis Chat", see: "Ver qué puede hacer", pr1: "Gratis durante la beta", pr2: "Sin necesidad de cuenta", pr3: "Chats solo en tu dispositivo",
  mUser: "Hazme un temporizador pomodoro", mS1: "Planificando el diseño", mS2: "Escribiendo la página", mS3: "Comprobando que funciona", mAns: "Listo: un temporizador limpio de 25 minutos. Pruébalo a la derecha o pídeme cualquier cambio.", mChip: "Temporizador pomodoro · Lienzo", mTitle: "Temporizador pomodoro", mTabP: "Vista previa", mTabC: "Código",
  ft: "Un asistente, seis trabajos.", fs: "Toca una tarjeta para abrir Orenis con esa petición lista para enviar.",
  c1t: "Investigación profunda", c1d: "Divide una pregunta grande en partes, busca cada una, contrasta fuentes y escribe un informe con citas.", c2t: "Lee tus archivos", c2d: "Sube PDFs, fotos, audio, video, texto o código y pregunta lo que quieras.",
  c3t: "Crea documentos", c3d: "Obtén un PDF o Word listo: currículums, informes, cartas, guías de estudio.", c4t: "Lienzo en vivo", c4d: "Construye páginas y apps, míralas funcionar junto al chat y edita el código a mano.",
  c5t: "Crea imágenes", c5d: "Descríbela y la obtienes. Descarga con un clic.", c6t: "Modos y memoria", c6d: "Compañero de estudio, programador, escritor, planificador o el tuyo, más una memoria que puedes editar o borrar.", try: "Probar →",
  dt: "Prueba el lienzo aquí mismo.", ds: "Edita el código de la izquierda y la página de la derecha se actualiza mientras escribes. En Orenis también puedes pedir cambios con palabras normales.", dCode: "Código", dEdit: "Editable", dPrev: "Vista previa",
  ht: "Ves el trabajo, no solo la respuesta.", s1t: "Pregunta en cualquier idioma", s1d: "Escribe o sube un archivo. Elige cuánto debe pensar: Media, Alta o Máxima.", s2t: "Míralo trabajar", s2d: "Cada paso aparece en vivo: buscar, leer, contrastar, construir. Detén o repite cuando quieras.", s3t: "Comprueba y mejora", s3d: "Cada respuesta trae citas y enlaces a las fuentes, y el trabajo del lienzo sigue siendo editable.",
  bb: "Beta tester oficial", pt: "Privado por diseño. Gratis durante la beta.", p1: "Chats y archivos se quedan en tu navegador, no en nuestros servidores", p2: "Sin cuenta ni registro", p3: "Copia o traslada todo con un clic", p4: "Voz temprana sobre qué incluirá Pro",
  free: "Gratis", f1: "100 mensajes / día", f2: "25 cada 5 horas", f3: "Búsqueda, archivos, documentos, imágenes, lienzo", soon: "Pronto", q1: "Límites más altos", q2: "Mayor velocidad", q3: "Archivos más grandes",
  qt: "Preguntas, respondidas sin rodeos.", a1q: "¿De verdad es gratis?", a1: "Sí durante la beta: 100 mensajes al día, hasta 25 en cualquier ventana de 5 horas. Se planea un plan Pro de pago con límites más altos.",
  a2q: "¿Dónde se guardan mis chats?", a2: "Solo en tu navegador, en este dispositivo. Borrar los datos del navegador los elimina, así que exporta una copia en Ajustes → Uso y datos.", a3q: "¿Puede equivocarse?", a3: "Sí. Como toda IA puede cometer errores. Cita sus fuentes para que verifiques, pero comprueba lo importante.",
  a4q: "¿Qué no puede hacer todavía?", a4: "No hay cuentas ni sincronización entre dispositivos, ni conversaciones por voz. La creación de imágenes es gratuita pero limitada a unas pocas al día.", fin: "Hazle una pregunta de verdad.",
  foot: "Orenis by OrenCraft Labs · Herramientas de IA enfocadas y centradas en el usuario. Software en beta: las respuestas pueden tener errores, verifica lo importante." },
};
const $ = s => document.querySelector(s), ls = (k, v) => v === undefined ? localStorage.getItem(k) : localStorage.setItem(k, v);
let lang = ls("orenis_lang") || (/^ko/i.test(navigator.language) ? "ko" : /^es/i.test(navigator.language) ? "es" : "en");
function applyLang() {
  document.documentElement.lang = lang; $("#lang").value = lang;
  document.querySelectorAll("[data-t]").forEach(e => { e.dataset.en ??= e.textContent; e.textContent = L[lang]?.[e.dataset.t] ?? e.dataset.en; });
}
$("#lang").onchange = e => { lang = e.target.value; ls("orenis_lang", lang); applyLang(); };

const ICON = { moon: "M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z", sun: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" };
function setTheme(t) { document.documentElement.dataset.theme = t; ls("orenis_theme", t); $("#ti").innerHTML = `<path d="${ICON[t === "dark" ? "sun" : "moon"]}"/>`; }
$("#theme").onclick = () => setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");

/* click the logo to replay the petal reveal */
$("#lockup").onclick = () => { const l = $("#lockup"), c = l.cloneNode(true); l.replaceWith(c); c.onclick = $("#lockup").onclick; };

/* live canvas demo: the same idea as the real Canvas, in 15 lines */
const DEMO = `<div class="card">
  <h2>Hello, Orenis 👋</h2>
  <p>Edit me. The preview updates as you type.</p>
  <button onclick="this.textContent = 'Nice!'">Click me</button>
</div>
<style>
  body { margin: 0; display: grid; place-items: center; min-height: 100vh;
         font-family: system-ui, sans-serif;
         background: linear-gradient(135deg, #6C63FF, #D45BC0, #FF8A78); }
  .card { background: #fff; padding: 1.6rem 2rem; border-radius: 1.2rem;
          text-align: center; box-shadow: 0 20px 50px #0003; }
  h2 { margin: 0 0 .4rem; color: #15142A; }
  p { color: #4A4A5E; margin: 0 0 1rem; }
  button { border: 0; padding: .7rem 1.2rem; border-radius: .7rem;
           background: #5547F0; color: #fff; font-size: 1rem; cursor: pointer; }
</style>`;
const code = $("#demoCode"), frame = $("#demoFrame"); let tmr;
code.value = DEMO; frame.srcdoc = DEMO;
code.addEventListener("input", () => { clearTimeout(tmr); tmr = setTimeout(() => { frame.srcdoc = code.value; }, 250); });
code.addEventListener("keydown", e => { if (e.key === "Tab") { e.preventDefault(); code.setRangeText("  ", code.selectionStart, code.selectionEnd, "end"); code.dispatchEvent(new Event("input")); } });

/* header border on scroll; the mobile CTA dock appears once the hero is out of view */
const hdr = $("#top"), dock = $("#dock"), hero = $(".hero");
const onScroll = () => { hdr.classList.toggle("stuck", scrollY > 8); dock.classList.toggle("on", scrollY > hero.offsetHeight * 0.7); };
addEventListener("scroll", onScroll, { passive: true }); onScroll();

setTheme(document.documentElement.dataset.theme); applyLang();
