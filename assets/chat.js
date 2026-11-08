const PROXY_ENDPOINT = "https://orenis-proxy.leezinu1980.workers.dev"; // your Cloudflare Worker URL
const LIM = { day: 100, win: 25, winMs: 5 * 3600e3 }, MAXF = 4, MAXB = 10 * 2 ** 20, MAXTOTAL = 12 * 2 ** 20; // base64 adds a third; the model API caps a request near 20 MB
const OKTYPE = /^(image\/(png|jpe?g|webp|heic|heif)|audio\/(wav|x-wav|wave|mpeg|mp3|aiff|x-aiff|aac|ogg|flac|x-flac)|video\/(mp4|mpeg|quicktime|x-msvideo|x-flv|webm|x-ms-wmv|3gpp)|application\/pdf)$/i;
const TEXTEXT = /\.(txt|md|csv|json|js|ts|py|html|css|log|xml|ya?ml)$/i;
const $ = s => document.querySelector(s), ls = (k, v) => v === undefined ? localStorage.getItem(k) : localStorage.setItem(k, v);
let db, chatId = null, busy = false, pending = [], busyChat = null, thEl = null, ctl = null, curSkip = null, activeSkill = null, curMode = "general", effort = ["medium", "high", "max"].includes(ls("orenis_effort")) ? ls("orenis_effort") : "medium";
const sleep = ms => new Promise(r => setTimeout(r, ms));
const EFF = [["medium", "effM", "Medium", "effMd", "Balanced speed and quality"], ["high", "effH", "High", "effHd", "Thinks deeper, step by step"], ["max", "effX", "Max", "effXd", "Most thorough, slowest"]];
const effName = id => { const e = EFF.find(x => x[0] === id); return T(e[1], e[2]); };
const uid = () => crypto.randomUUID?.() || Date.now().toString(36) + Math.random().toString(36).slice(2);

/* ---------- i18n: English is the in-code default; other languages live here ---------- */
const L = {
ko: { newChat: "새 채팅", today: "오늘", prev: "지난 7일", older: "이전", plan: "무료 플랜", settings: "설정", usage: "남은 사용량", win: "최근 5시간", mem: "개인화 메모리", memd: "다른 최근 대화의 짧은 내용을 공유해 더 개인화된 답변을 받습니다.", ren: "이름 변경", wipe: "이 기기의 모든 대화 삭제", language: "언어", wt: "Orenis에 오신 것을 환영합니다", wq: "어떻게 불러 드릴까요?", wph: "이름", cont: "계속", pt: "내 플랜", pfd: "하루 100개 메시지, 5시간당 25개, 웹 검색과 파일 입력.", pro: "프로 플랜", soon: "출시 예정", ppd: "더 높은 한도와 우선 처리 속도.", unav: "이용 불가", act: "사용 중", cfree: "무료로 계속", cancel: "취소", del: "삭제", ph: "Orenis에게 무엇이든 물어보세요", fine: "Orenis는 베타 버전이며 실수할 수 있습니다. 중요한 정보는 확인하세요.", hello: "안녕하세요, {n}님", how: "무엇을 도와드릴까요?", drop: "파일을 놓아 첨부", copy: "복사", copied: "복사됨", searched: "웹 검색 사용", working: "처리 중", s1: "오늘의 IT 뉴스 요약해줘", s2: "양자 컴퓨팅을 쉽게 설명해줘", s3: "파이썬 스크립트 작성 도와줘", s4: "첨부한 문서를 검토해줘", eDay: "일일 한도에 도달했습니다. {t}에 초기화됩니다.", eWin: "5시간 한도에 도달했습니다. {t}에 한 칸이 풀립니다.", eSize: "첨부 파일이 총 12MB를 넘습니다. 하나를 제거하고 다시 시도하세요.", eStore: "이 브라우저에서는 로컬 저장소를 사용할 수 없어 대화를 저장할 수 없습니다.", eTo: "요청 시간이 초과되었습니다. 다시 시도해 주세요.", eNet: "Orenis에 연결할 수 없습니다. 연결을 확인하고 다시 시도하세요.", e413: "첨부 파일이 너무 큽니다.", e429: "Orenis가 혼잡합니다. 잠시 후 다시 시도해 주세요.", eGen: "지금은 Orenis가 응답할 수 없습니다. 잠시 후 다시 시도해 주세요.", maxf: "메시지당 최대 {n}개 파일", big: "{f}: 10MB 초과", uns: "{f}: 지원하지 않는 형식", delq: "\"{t}\" 대화를 삭제할까요?", wipeq: "이 기기에 저장된 모든 대화를 삭제할까요? 되돌릴 수 없습니다.", resets: "{t}에 초기화 ({z})", slot: "다음 한 칸: {t}", full: "전체 한도 사용 가능", left: "{p}% · {n}개 남음", search: "대화 검색", export: "대화 내보내기", regen: "다시 생성", edit: "수정", retry: "다시 시도", mic: "음성 입력", down: "맨 아래로", exported: "대화를 내보냈습니다", stop: "중지", send: "보내기", renameChat: "이름 변경", pinned: "고정됨", pin: "고정", unpin: "고정 해제", menu: "옵션", think: "생각하는 중", thought: "{s}초 동안 생각함", writing: "답변 작성 중", searchQ: "검색 중: {q}", reading: "출처 {n}개 읽는 중", drafting: "문서 작성 중", tGen: "일반", tPers: "맞춤 설정", tSkills: "스킬", tData: "사용량·데이터", nameLbl: "이름", instr: "맞춤 지침", instrD: "Orenis가 어떻게 답할지 알려주세요. 모든 대화에 적용됩니다.", instrPh: "예: 글머리 기호를 사용해 줘. 간결하게 답해줘. 모르면 추측하지 말고 모른다고 말해줘.", pr1: "글머리 기호 사용", pr2: "간결하게", pr3: "모르면 모른다고 말하기", pr4: "단계별로 설명", skWeb: "웹 검색", skWebD: "Orenis가 온라인에서 정보를 찾아볼 수 있게 합니다.", skDoc: "문서 만들기", skDocD: "Orenis가 PDF, Word, Markdown 파일을 만들 수 있게 합니다.", sk_search: "웹 검색", sk_pdf: "PDF 만들기", sk_word: "Word 문서 만들기", sk_sum: "요약", sk_tr: "번역", skills: "스킬", plus: "파일·스킬 추가", addFiles: "사진·파일 추가", effort: "추론 강도", effM: "보통", effH: "높음", effX: "최대", effMd: "속도와 품질의 균형", effHd: "단계별로 더 깊이 생각", effXd: "가장 철저하게, 가장 느림", analyzing: "결과 분석 중", searching: "웹 검색 중", retrying: "다시 시도하는 중", offline: "오프라인입니다", online: "다시 연결되었습니다", m_general: "일반", md_general: "일상적인 모든 도움", m_research: "리서처", md_research: "출처를 찾아 비교하고 인용", m_study: "공부 도우미", md_study: "단계별 설명 후 퀴즈", m_code: "코더", md_code: "깔끔한 코드와 설명", m_write: "작가", md_write: "초안·교정, 내 말투 유지", m_plan: "플래너", md_plan: "목표를 단계별 계획으로", mode: "모드", manageModes: "모드 관리…", tModes: "모드", tMem: "메모리", modesD: "모드는 대화에서 Orenis의 역할과 말투를 바꿉니다. 직접 만들 수도 있어요.", newMode: "새 모드", mNamePh: "이름 (예: 운동 코치)", mInsPh: "이 모드에서 Orenis는 어떻게 행동해야 하나요?", saveMode: "모드 저장", noModes: "직접 만든 모드가 없습니다.", saved: "저장됨", memOn: "나에 대해 기억하기", memOnD: "기억해 달라고 한 내용을 Orenis가 저장합니다. 목록은 직접 관리하세요.", memList: "저장된 메모리", noFacts: "아직 저장된 내용이 없습니다.", factPh: "Orenis가 기억할 내용 추가", add: "추가", clearAll: "모두 지우기", recent: "최근 대화 참고", recentD: "다른 최근 대화의 짧은 내용을 참고해 더 개인화된 답변을 받습니다.", remembered: "기억함: {f}", saving: "메모리에 저장 중", imaging: "이미지 만드는 중", skImg: "이미지 만들기", skImgD: "Orenis가 이미지를 그릴 수 있게 합니다 (무료, 하루 몇 장).", download: "다운로드", preview: "미리보기", listen: "듣기", backup: "모든 대화 내보내기 (JSON)", restore: "백업 불러오기", imported: "대화 {n}개를 가져왔습니다", badFile: "Orenis 백업 파일이 아닙니다", backupD: "대화는 이 브라우저에만 저장됩니다. 정기적으로 백업하세요.", sk_research: "심층 리서치", sk_image: "이미지 만들기", imgUse: "오늘 이미지: {n}/{m}", cvTitle: "캔버스", cvPreview: "미리보기", cvCode: "코드", cvUndo: "실행 취소", cvRedo: "다시 실행", cvCopy: "코드 복사", cvDownload: "다운로드", cvNewTab: "새 탭에서 열기", cvFull: "확대", cvClose: "캔버스 닫기", cvAsk: "Orenis에게 수정 요청…", cvSend: "보내기", cvDesktop: "데스크톱", cvTablet: "태블릿", cvPhone: "휴대폰", cvErrors: "오류", cvNew: "새 캔버스", openCanvas: "캔버스 열기", inCanvas: "캔버스에서 열기", canvasing: "캔버스 작업 중", skCanvas: "캔버스", skCanvasD: "HTML과 코드를 옆 패널에서 바로 보고 직접 수정합니다.", theme: "테마", thLight: "라이트", thDark: "다크", statDay: "오늘 메시지", statOf: "총 {m}개 · {t} 초기화", statFull: "총 {m}개 · 전부 사용 가능", imgL: "오늘 이미지", statImg: "오늘 총 {m}장", noChats: "아직 대화가 없어요", noChatsD: "시작하면 여기에 표시됩니다.", startChat: "대화 시작", noMatch: "일치하는 대화가 없어요", clearSearch: "검색 지우기", factsEmptyT: "아직 기억한 게 없어요", factsEmptyD: "대화에서 “…를 기억해 줘”라고 말하거나 아래에서 직접 추가하세요.", addFirst: "메모리 추가", modesEmptyT: "직접 만든 모드가 없어요", modesEmptyD: "자주 하는 일에 맞는 모드를 만들어 보세요.", createMode: "모드 만들기", yourMode: "나의 모드", yourModeD: "여기에 설명이 표시됩니다.", live: "실시간 단계", liveD: "각 단계를 실시간으로 보여줍니다. 연결 문제가 있으면 끄세요.", liveOff: "네트워크가 실시간 전송을 막아 실시간 단계를 껐습니다. 설정에서 다시 켤 수 있어요.", testConn: "연결 테스트", testing: "테스트 중…", connOk: "연결됨 ({ms}ms).", liveOk: "실시간 단계가 정상 작동합니다.", liveBad: "이 네트워크에서는 실시간 단계가 막히거나 지연됩니다. 일반 설정에서 끄세요.", connFail: "서버에 연결할 수 없습니다 ({e}). 인터넷, VPN, 광고 차단기를 확인하세요.", eApp: "앱에서 문제가 발생했습니다.", eCut: "Orenis가 작업하는 중 연결이 끊겼습니다.", pdfTip: "인쇄 창에서 'PDF로 저장'을 선택하세요." },
es: { newChat: "Nuevo chat", today: "Hoy", prev: "Últimos 7 días", older: "Anteriores", plan: "Plan gratuito", settings: "Ajustes", usage: "Uso restante", win: "Últimas 5 horas", mem: "Memoria personalizada", memd: "Comparte fragmentos cortos de tus otros chats recientes para respuestas más personales.", ren: "Cambiar mi nombre", wipe: "Borrar todos los chats de este dispositivo", language: "Idioma", wt: "Te damos la bienvenida a Orenis", wq: "¿Cómo quieres que te llamemos?", wph: "Tu nombre", cont: "Continuar", pt: "Tu plan", pfd: "100 mensajes al día, 25 cada 5 horas, búsqueda web y archivos.", pro: "Plan Pro", soon: "Próximamente", ppd: "Límites más altos y mayor velocidad.", unav: "No disponible", act: "Activo", cfree: "Continuar con el plan gratuito", cancel: "Cancelar", del: "Eliminar", ph: "Pregunta lo que quieras a Orenis", fine: "Orenis está en beta y puede cometer errores. Verifica la información importante.", hello: "Hola, {n}", how: "¿En qué puedo ayudarte hoy?", drop: "Suelta archivos para adjuntar", copy: "Copiar", copied: "Copiado", searched: "Buscó en la web", working: "Trabajando", s1: "Resume las noticias tech de hoy", s2: "Explica la computación cuántica fácil", s3: "Ayúdame con un script de Python", s4: "Revisa un documento que adjuntaré", eDay: "Alcanzaste el límite diario. Se reinicia {t}.", eWin: "Alcanzaste el límite de 5 horas. Se libera un cupo {t}.", eSize: "Los adjuntos superan 12 MB. Quita uno e inténtalo de nuevo.", eStore: "El almacenamiento local no está disponible, así que no se pueden guardar los chats.", eTo: "La solicitud tardó demasiado. Inténtalo de nuevo.", eNet: "No se puede conectar con Orenis. Revisa tu conexión e inténtalo de nuevo.", e413: "Los adjuntos son demasiado grandes.", e429: "Orenis está ocupado. Inténtalo de nuevo en unos minutos.", eGen: "Orenis no pudo responder ahora. Inténtalo de nuevo en breve.", maxf: "Hasta {n} archivos por mensaje", big: "{f} supera 10 MB", uns: "{f}: tipo no compatible", delq: "¿Eliminar \"{t}\"?", wipeq: "¿Borrar todos los chats de este dispositivo? No se puede deshacer.", resets: "Se reinicia {t} ({z})", slot: "Próximo cupo: {t}", full: "Cupo completo disponible", left: "{p}% · quedan {n}", search: "Buscar chats", export: "Exportar chat", regen: "Regenerar", edit: "Editar", retry: "Reintentar", mic: "Entrada de voz", down: "Ir al final", exported: "Chat exportado", stop: "Detener", send: "Enviar", renameChat: "Renombrar", pinned: "Fijados", pin: "Fijar", unpin: "Desfijar", menu: "Opciones", think: "Pensando", thought: "Pensó {s} s", writing: "Redactando la respuesta", searchQ: "Buscando: {q}", reading: "Leyendo {n} fuentes", drafting: "Redactando el documento", tGen: "General", tPers: "Personalización", tSkills: "Habilidades", tData: "Uso y datos", nameLbl: "Nombre", instr: "Instrucciones personalizadas", instrD: "Dile a Orenis cómo responder. Se aplica a todos los chats.", instrPh: "Ej.: Usa viñetas. Sé conciso. Si no estás seguro, dilo en vez de adivinar.", pr1: "Usar viñetas", pr2: "Ser conciso", pr3: "No adivinar: decir si no sabes", pr4: "Explicar paso a paso", skWeb: "Búsqueda web", skWebD: "Permite que Orenis busque información en línea.", skDoc: "Crear documentos", skDocD: "Permite que Orenis cree archivos PDF, Word o Markdown.", sk_search: "Buscar en la web", sk_pdf: "Crear un PDF", sk_word: "Crear un documento Word", sk_sum: "Resumir", sk_tr: "Traducir", skills: "Habilidades", plus: "Añadir archivos y habilidades", addFiles: "Añadir fotos y archivos", effort: "Esfuerzo de razonamiento", effM: "Media", effH: "Alta", effX: "Máxima", effMd: "Equilibrio entre velocidad y calidad", effHd: "Razona paso a paso con más profundidad", effXd: "Lo más exhaustivo, más lento", analyzing: "Analizando los resultados", searching: "Buscando en la web", retrying: "Reintentando", offline: "Sin conexión", online: "De nuevo en línea", m_general: "General", md_general: "Ayuda para el día a día", m_research: "Investigador", md_research: "Busca, compara y cita fuentes", m_study: "Compañero de estudio", md_study: "Explica paso a paso y te evalúa", m_code: "Programador", md_code: "Código limpio y explicado", m_write: "Escritor", md_write: "Redacta y edita con tu tono", m_plan: "Planificador", md_plan: "Convierte metas en planes", mode: "Modo", manageModes: "Gestionar modos…", tModes: "Modos", tMem: "Memoria", modesD: "Los modos cambian el rol y el estilo de Orenis en un chat. Crea los tuyos.", newMode: "Nuevo modo", mNamePh: "Nombre (p. ej. Entrenador)", mInsPh: "¿Cómo debe comportarse Orenis en este modo?", saveMode: "Guardar modo", noModes: "Aún no tienes modos propios.", saved: "Guardado", memOn: "Recordar cosas sobre mí", memOnD: "Orenis puede guardar datos que le pidas recordar. Tú controlas la lista.", memList: "Recuerdos guardados", noFacts: "Aún no hay nada guardado.", factPh: "Añade algo para que Orenis recuerde", add: "Añadir", clearAll: "Borrar todo", recent: "Usar mis chats recientes", recentD: "Comparte fragmentos cortos de tus otros chats recientes para respuestas más personales.", remembered: "Recordado: {f}", saving: "Guardando en la memoria", imaging: "Creando una imagen", skImg: "Crear imágenes", skImgD: "Permite que Orenis cree imágenes (gratis, unas pocas al día).", download: "Descargar", preview: "Vista previa", listen: "Escuchar", backup: "Exportar todo (JSON)", restore: "Importar copia", imported: "Se importaron {n} chats", badFile: "Ese archivo no es una copia de Orenis", backupD: "Los chats solo se guardan en este navegador. Haz copias de vez en cuando.", sk_research: "Investigación profunda", sk_image: "Crear una imagen", imgUse: "Imágenes hoy: {n}/{m}", cvTitle: "Lienzo", cvPreview: "Vista previa", cvCode: "Código", cvUndo: "Deshacer", cvRedo: "Rehacer", cvCopy: "Copiar código", cvDownload: "Descargar", cvNewTab: "Abrir en pestaña nueva", cvFull: "Ampliar", cvClose: "Cerrar lienzo", cvAsk: "Pídele a Orenis un cambio…", cvSend: "Enviar", cvDesktop: "Escritorio", cvTablet: "Tableta", cvPhone: "Teléfono", cvErrors: "Errores", cvNew: "Nuevo lienzo", openCanvas: "Abrir lienzo", inCanvas: "Abrir en el lienzo", canvasing: "Trabajando en el lienzo", skCanvas: "Lienzo", skCanvasD: "Ve y edita HTML y código en un panel lateral.", theme: "Tema", thLight: "Claro", thDark: "Oscuro", statDay: "Mensajes hoy", statOf: "de {m} · se reinicia {t}", statFull: "de {m} · todo disponible", imgL: "Imágenes hoy", statImg: "de {m} hoy", noChats: "Aún no hay chats", noChatsD: "Empieza uno y aparecerá aquí.", startChat: "Empezar un chat", noMatch: "Ningún chat coincide", clearSearch: "Borrar búsqueda", factsEmptyT: "Aún no recuerdo nada", factsEmptyD: "Dile «recuerda que…» en un chat o añade algo abajo.", addFirst: "Añadir un recuerdo", modesEmptyT: "Aún no tienes modos propios", modesEmptyD: "Diseña un modo para algo que haces seguido.", createMode: "Crear un modo", yourMode: "Tu modo", yourModeD: "Aquí aparecerá la descripción.", live: "Pasos en vivo", liveD: "Muestra cada paso al instante. Desactívalo si tienes problemas de conexión.", liveOff: "Se desactivaron los pasos en vivo porque tu red los bloquea. Puedes reactivarlos en Ajustes.", testConn: "Probar conexión", testing: "Probando…", connOk: "Conectado ({ms} ms).", liveOk: "Los pasos en vivo funcionan.", liveBad: "En esta red los pasos en vivo se bloquean o se retrasan; desactívalos en General.", connFail: "No se puede conectar con el servidor ({e}). Revisa tu conexión, VPN o bloqueador de anuncios.", eApp: "Algo salió mal en la app.", eCut: "Se cortó la conexión mientras Orenis trabajaba.", pdfTip: "En la ventana de impresión, elige «Guardar como PDF»." } };
Object.assign(L.ko, { eBlocked: "Orenis가 저장소를 업데이트하는 중입니다. 다른 Orenis 탭을 닫으면 이 페이지가 자동으로 이어집니다.", cvTitle: "페탈", cvNew: "새 페탈", openCanvas: "페탈 열기", inCanvas: "페탈로 열기", canvasing: "페탈 작성 중", skCanvas: "페탈", skCanvasD: "페이지·문서·코드 파일이 파일로 나을 때 Orenis가 알아서 페탈로 만들어 줍니다. 옆 패널에서 보고 수정할 수 있어요.", cvAsk: "Orenis에게 수정 요청…",
  tChats: "채팅", tPetals: "페탈", petals: "페탈", addPetal: "페탈을 입력으로 추가", newPetal: "빈 페탈 만들기", pickT: "페탈 추가", pickD: "Orenis가 읽고, 원하면 수정해 줍니다.", noPetals: "아직 페탈이 없어요", noPetalsD: "Orenis가 페이지, 문서, 코드 파일을 만들면 여기에 모입니다.", makePetal: "페탈 만들기", noMatchP: "일치하는 페탈이 없어요", searchP: "페탈 검색", petalGone: "삭제된 페탈입니다", openP: "열기", delqP: "\"{t}\" 페탈을 삭제할까요?", petaling: "페탈 작성 중", pying: "파이썬 실행 중", asking: "질문 준비 중",
  askOther: "직접 입력…", askGo: "계속", askSkip: "알아서 정해 주세요", askDone: "답변함", ranPy: "파이썬", noOut: "(출력 없음)", ranFail: "오류", skPy: "파이썬 실행", skPyD: "안전한 샌드박스에서 코드를 실행해 계산, 데이터 분석, 그래프를 그립니다.", skAsk: "되묻기", skAskD: "요청이 불분명하면 시작하기 전에 짧은 질문을 몇 가지 합니다.", sk_petal: "페탈로 만들기", sk_python: "파이썬 실행",
  cvEmpty: "비어 있는 페탈입니다. Orenis에게 채워 달라고 하거나 코드 탭에 직접 입력하세요.", cvSlow: "미리보기를 불러오는 데 오래 걸리고 있어요.", cvBlank: "미리보기가 비어 보입니다. 잠시 걸리거나 코드에 오류가 있을 수 있어요.", cvReload: "새로고침", cvViewCode: "코드 보기" });
Object.assign(L.es, { eBlocked: "Orenis está actualizando su almacenamiento. Cierra tus otras pestañas de Orenis y esta página continuará sola.", cvTitle: "Pétalo", cvNew: "Nuevo pétalo", openCanvas: "Abrir pétalo", inCanvas: "Abrir como pétalo", canvasing: "Escribiendo un pétalo", skCanvas: "Pétalos", skCanvasD: "Orenis decide cuándo una página, un documento o un archivo de código es mejor como pétalo: un archivo que ves, editas y reutilizas en un panel lateral.", cvAsk: "Pídele a Orenis un cambio…",
  tChats: "Chats", tPetals: "Pétalos", petals: "Pétalos", addPetal: "Añadir un pétalo como entrada", newPetal: "Nuevo pétalo en blanco", pickT: "Añadir un pétalo", pickD: "Orenis lo leerá y puede modificarlo por ti.", noPetals: "Aún no hay pétalos", noPetalsD: "Cuando Orenis cree una página, un documento o un archivo de código, aparecerá aquí.", makePetal: "Crear un pétalo", noMatchP: "Ningún pétalo coincide", searchP: "Buscar pétalos", petalGone: "Este pétalo fue eliminado", openP: "Abrir", delqP: "¿Eliminar el pétalo «{t}»?", petaling: "Escribiendo un pétalo", pying: "Ejecutando Python", asking: "Preparando unas preguntas",
  askOther: "Escribe otra…", askGo: "Continuar", askSkip: "Decide tú", askDone: "Respondido", ranPy: "Python", noOut: "(sin salida)", ranFail: "Error", skPy: "Ejecutar Python", skPyD: "Deja que Orenis ejecute código en un entorno seguro para calcular, analizar datos y dibujar gráficos.", skAsk: "Hacer preguntas", skAskD: "Si una petición no está clara, Orenis hace unas preguntas rápidas antes de empezar.", sk_petal: "Crear un pétalo", sk_python: "Ejecutar Python",
  cvEmpty: "Este pétalo está vacío. Pídele a Orenis que lo rellene o escribe en la pestaña Código.", cvSlow: "La vista previa tarda mucho en cargar.", cvBlank: "La vista previa parece vacía. Puede tardar un momento o el código tiene un error.", cvReload: "Recargar", cvViewCode: "Ver código" });
let lang = ls("orenis_lang") || (/^ko/i.test(navigator.language) ? "ko" : /^es/i.test(navigator.language) ? "es" : "en");
const T = (k, en, v = {}) => { let s = L[lang]?.[k] ?? en; for (const x in v) s = s.replace("{" + x + "}", v[x]); return s; };
function applyLang() {
  document.documentElement.lang = lang; $("#lang").value = lang;
  document.querySelectorAll("[data-t]").forEach(e => { e.dataset.en ??= e.textContent; e.textContent = L[lang]?.[e.dataset.t] ?? e.dataset.en; });
  document.querySelectorAll("[data-tp]").forEach(e => { e.dataset.en ??= e.placeholder; e.placeholder = L[lang]?.[e.dataset.tp] ?? e.dataset.en; });
  document.querySelectorAll("[data-ta]").forEach(e => { e.dataset.en ??= e.getAttribute("aria-label"); e.setAttribute("aria-label", L[lang]?.[e.dataset.ta] ?? e.dataset.en); });
}

const I = { layout: "M3 4h18v16H3zM3 9h18M9 9v11", sparkle: "M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z", search: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM21 21l-4.3-4.3", book: "M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 21V5M9 7h6", code: "M8 8l-4 4 4 4M16 8l4 4-4 4M14 5l-4 14", pen: "M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z", cal: "M5 6h14v14H5zM5 10h14M9 3v4M15 3v4", image: "M4 5h16v14H4zM4 15l5-5 4 4 3-3 4 4M9 9h.01", brain: "M9 4a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3 3 0 0 0 3 5 3 3 0 0 0 5 0V4a3 3 0 0 0-3 0zM15 4a3 3 0 0 1 3 3 3 3 0 0 1 2 5 3 3 0 0 1-3 5 3 3 0 0 1-5 0", speaker: "M4 9v6h4l5 4V5L8 9zM16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11", bolt: "M13 2 4 14h7l-1 8 9-12h-7z", petal: "M12 3c3.5 3 3.5 8 0 11-3.5-3-3.5-8 0-11zM4.5 10.5c4-1 7 1 8 5.5-4 1-7-1-8-5.5zM19.5 10.5c-4-1-7 1-8 5.5 4 1 7-1 8-5.5zM12 17v4", pin: "M12 17v5M9 3h6l-1 7 3 3H7l3-3z", trash: "M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3", dots: "M5 12h.01M12 12h.01M19 12h.01", wand: "M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8zM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z", file: "M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5", download: "M12 4v11M7 11l5 5 5-5M5 20h14", mic: "M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3zM5 11a7 7 0 0 0 14 0M12 18v3", stop: "M7 7h10v10H7z", edit: "M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4", refresh: "M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7", down: "M6 9l6 6 6-6", plus: "M12 5v14M5 12h14", up: "M12 19V5M5 12l7-7 7 7", x: "M6 6l12 12M18 6 6 18", copy: "M9 9h10v10H9zM5 15V5h10", check: "M5 12.5l4.5 4.5L19 7", globe: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18",
  panel: "M4 5h16v14H4zM9 5v14", clip: "M21 12.5 12.5 21a5 5 0 0 1-7-7L14 5.5a3.4 3.4 0 0 1 5 5L10.5 19a1.8 1.8 0 0 1-2.5-2.5L15 9.5",
  sliders: "M4 7h9M17 7h3M4 17h3M11 17h9M15 5v4M9 15v4", moon: "M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z", sun: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" };
const ic = n => `<path d="${I[n]}"/>`;
document.querySelectorAll("[data-i]").forEach(e => e.innerHTML = ic(e.dataset.i));
const bloom = (s = 24) => { const e = document.createElement("img"); e.src = "assets/orenis-logo.svg"; e.alt = ""; e.width = e.height = s; e.className = "logo"; e.draggable = false; return e; };
document.querySelectorAll("[data-bloom]").forEach(e => e.replaceWith(bloom(+e.dataset.bloom)));

/* ---------- IndexedDB: chats + messages (attachments kept as Blobs) ---------- */
const openDB = () => new Promise((ok, no) => {
  const r = indexedDB.open("orenis", 2);
  r.onupgradeneeded = e => {
    const d = r.result, t = r.transaction;
    if (!d.objectStoreNames.contains("chats")) d.createObjectStore("chats", { keyPath: "id" });
    if (!d.objectStoreNames.contains("messages")) d.createObjectStore("messages", { keyPath: "id", autoIncrement: true }).createIndex("chatId", "chatId");
    if (!d.objectStoreNames.contains("petals")) {
      const ps = d.createObjectStore("petals", { keyPath: "id" }); ps.createIndex("chatId", "chatId");
      if (e.oldVersion >= 1) t.objectStore("chats").openCursor().onsuccess = ev => { // the single canvas each chat used to have becomes a Petal
        const c = ev.target.result; if (!c) return; const ch = c.value;
        if (ch.canvas && typeof ch.canvas.content === "string") { const id = "p" + String(ch.id).replace(/[^\w-]/g, "").slice(0, 30); ps.put({ id, chatId: ch.id, title: ch.canvas.title || "Petal", type: ch.canvas.type || "html", language: ch.canvas.language || "", content: ch.canvas.content, created: ch.created || Date.now(), updated: ch.updated || Date.now(), rev: 1 }); c.update({ ...ch, canvas: null }); }
        c.continue();
      };
    }
  };
  r.onblocked = () => window.dispatchEvent(new Event("orenis-db-blocked")); // another tab still holds the old database
  r.onsuccess = () => { r.result.onversionchange = () => r.result.close(); ok(r.result); }; // lets a newer tab upgrade instead of blocking it r.onerror = () => no(r.error);
});
const tx = (s, mode, fn) => new Promise((ok, no) => { const t = db.transaction(s, mode), q = fn(t.objectStore(s)); t.oncomplete = () => ok(q && q.result); t.onerror = () => no(t.error); });
const msgsOf = id => tx("messages", "readonly", o => o.index("chatId").getAll(id));
const allChats = async () => (await tx("chats", "readonly", o => o.getAll())).sort((a, b) => b.updated - a.updated);
const delChat = async id => { const k = await tx("messages", "readonly", o => o.index("chatId").getAllKeys(id)); await tx("messages", "readwrite", o => k.forEach(x => o.delete(x))); const pk = await tx("petals", "readonly", o => o.index("chatId").getAllKeys(id)); await tx("petals", "readwrite", o => pk.forEach(x => o.delete(x))); await tx("chats", "readwrite", o => o.delete(id)); };
const petalsOf = id => id ? tx("petals", "readonly", o => o.index("chatId").getAll(id)).then(a => a.sort((x, y) => y.updated - x.updated)) : Promise.resolve([]);
const allPetals = async () => (await tx("petals", "readonly", o => o.getAll())).sort((a, b) => b.updated - a.updated);
const putPetalRec = p => tx("petals", "readwrite", o => o.put(p)), delPetalRec = id => tx("petals", "readwrite", o => o.delete(id)), getPetal = id => tx("petals", "readonly", o => o.get(id));

/* ---------- Quota: 100/day (local midnight) + 25 per rolling 5h ---------- */
const hits = () => JSON.parse(ls("orenis_hits") || "[]").filter(t => t > Date.now() - 2 * 864e5);
function usage() {
  const now = Date.now(), mid = new Date(); mid.setHours(0, 0, 0, 0);
  const h = hits(), d = h.filter(t => t >= mid.getTime()), w = h.filter(t => t > now - LIM.winMs), next = new Date(mid); next.setDate(next.getDate() + 1);
  return { d, w, dReset: next, wReset: w.length ? new Date(Math.min(...w) + LIM.winMs) : null };
}
const fmt = d => d.toLocaleString([lang], { weekday: "short", hour: "numeric", minute: "2-digit" });
function renderUsage() {
  const u = usage(), dl = Math.max(0, LIM.day - u.d.length), wl = Math.max(0, LIM.win - u.w.length), il = imgLeft();
  $("#dNum").textContent = dl; $("#wNum").textContent = wl; $("#iNum").textContent = il;
  $("#dBar").style.width = 100 * dl / LIM.day + "%"; $("#wBar").style.width = 100 * wl / LIM.win + "%"; $("#iBar").style.width = 100 * il / IMG_CAP + "%";
  $("#dSub").textContent = T("statOf", "of {m} · resets {t}", { m: LIM.day, t: fmt(u.dReset) });
  $("#wSub").textContent = u.wReset ? T("statOf", "of {m} · resets {t}", { m: LIM.win, t: fmt(u.wReset) }) : T("statFull", "of {m} · all available", { m: LIM.win });
  $("#iSub").textContent = T("statImg", "of {m} today", { m: IMG_CAP });
}

/* ---------- Helpers ---------- */
const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt !== undefined) e.textContent = txt; return e; };
const svg = (n, cls = "icon") => { const s = document.createElementNS("http://www.w3.org/2000/svg", "svg"); s.setAttribute("class", cls); s.setAttribute("viewBox", "0 0 24 24"); s.innerHTML = ic(n); return s; };
const show = id => $(id).classList.add("on"), hide = id => $(id).classList.remove("on");
let tt; const toast = t => { const e = $("#toast"); e.textContent = t; e.classList.add("on"); clearTimeout(tt); tt = setTimeout(() => e.classList.remove("on"), 1800); };
const ask = text => new Promise(ok => { $("#askTxt").textContent = text; show("#askModal"); $("#askYes").onclick = () => { hide("#askModal"); ok(true); }; $("#askNo").onclick = () => { hide("#askModal"); ok(false); }; });
const b64 = f => new Promise((ok, no) => { const r = new FileReader(); r.onload = () => ok(r.result.split(",")[1]); r.onerror = no; r.readAsDataURL(f); });
const b64ToBlob = (data, mime) => { const bin = atob(data), a = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i); return new Blob([a], { type: mime || "image/png" }); };
const isText = f => f.type.startsWith("text/") || TEXTEXT.test(f.name);
const feed = $("#feed"), nearBottom = () => feed.scrollHeight - feed.scrollTop - feed.clientHeight < 120;
const scroll = (force = true) => { if (force || nearBottom()) feed.scrollTo({ top: feed.scrollHeight, behavior: "smooth" }); }; // streaming never yanks you away from what you're reading
feed.addEventListener("scroll", () => { $("#jump").hidden = nearBottom(); });
const setEmpty = b => $("#stage").classList.toggle("empty", b);
const setTitle = t => { $("#title").textContent = t; document.title = (t && t !== "Orenis" ? t + " · " : "") + "Orenis"; };
async function copyText(t) { try { await navigator.clipboard.writeText(t); toast(T("copied", "Copied")); return true; } catch { const a = el("textarea"); a.value = t; document.body.append(a); a.select(); document.execCommand("copy"); a.remove(); toast(T("copied", "Copied")); return true; } }
DOMPurify.addHook("afterSanitizeAttributes", n => { if (n.tagName === "A") { n.target = "_blank"; n.rel = "noopener noreferrer"; } });
/* Markdown + LaTeX: math is pulled out before markdown runs (so _ and \\ survive), rendered by KaTeX, then put back after sanitizing. Code is left alone. */
function md(src) {
  const store = [], keep = (disp, tex) => `@@M${store.push([disp, tex]) - 1}@@`;
  const s = src.split(/(```[\s\S]*?```|`[^`\n]+`)/).map((seg, i) => i % 2 ? seg : seg
    .replace(/\$\$([\s\S]+?)\$\$/g, (_, t) => keep(true, t)).replace(/\\\[([\s\S]+?)\\\]/g, (_, t) => keep(true, t))
    .replace(/\\\(([\s\S]+?)\\\)/g, (_, t) => keep(false, t))
    .replace(/(?<![\\$\w])\$(?!\s)([^$\n]+?)(?<!\s)\$(?![\d$])/g, (_, t) => keep(false, t))
    .replace(/\*\*(?=\S)([^*\n]+?)(?<=\S)\*\*/g, "<strong>$1</strong>")
    .replace(/(?<![*\w])\*(?=[^\s*])([^*\n]+?)(?<=[^\s*])\*(?![*\w])/g, "<em>$1</em>")).join("");
  return DOMPurify.sanitize(marked.parse(s, { breaks: true })).replace(/@@M(\d+)@@/g, (_, i) => {
    const [d, t] = store[i];
    try { return katex.renderToString(t.trim(), { displayMode: d, throwOnError: false, output: "htmlAndMathml" }); }
    catch { return t.replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c])); }
  });
}
function plain(node) { // readable copy: math becomes its TeX source, code-copy buttons dropped
  const c = node.cloneNode(true); c.querySelectorAll(".cp").forEach(x => x.remove());
  c.querySelectorAll(".katex").forEach(k => { const a = k.querySelector("annotation"); k.replaceWith(a ? a.textContent : k.textContent); });
  c.style.cssText = "position:fixed;left:-9999px;top:0;width:40rem"; document.body.append(c); const t = c.innerText.trim(); c.remove(); return t;
}
function setTheme(t) { document.documentElement.dataset.theme = t; ls("orenis_theme", t); if (typeof renderOpts === "function") renderOpts(); $("#themeIcon").innerHTML = ic(t === "dark" ? "sun" : "moon"); }
$("#theme").onclick = () => setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");

/* ---------- Rendering ---------- */
function fileChip(f) {
  f = { ...f, type: f.type || "" };
  if (f.petal) { const c = el("span", "fchip"); c.append(svg("petal"), f.name); return c; }
  if (f.type.startsWith("image/") && f.blob) { const i = el("img", "thumb"); i.src = URL.createObjectURL(f.blob); i.alt = f.name; return i; }
  return el("span", "fchip", (f.type.startsWith("audio/") ? "🎧 " : f.type.startsWith("video/") ? "🎬 " : "📄 ") + f.name);
}
function actBtn(label, icon, fn, aria) { const b = el("button", "act"); b.append(svg(icon), label); if (aria) b.setAttribute("aria-label", aria); b.onclick = fn; return b; }
/* Typewriter-style reveal of an already-rendered answer (cosmetic). Math renders whole when reached. Returns skip(). */
function revealText(root, onDone) {
  const BLK = "li,pre,blockquote,table,th,td", ATOM = ".katex,hr,img";
  const units = [], w = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, { acceptNode: n => n.nodeType === 3 ? (n.parentElement.closest(".katex") ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT) : n.matches(ATOM) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP });
  const blocks = n => { const b = []; for (let p = n.parentElement; p && p !== root; p = p.parentElement) if (p.matches(BLK)) b.push(p); return b; };
  for (let n; (n = w.nextNode());) units.push(n.nodeType === 3 ? { n, t: n.data, b: blocks(n) } : { n, k: 1, b: blocks(n) });
  const hide = [...root.querySelectorAll(BLK)]; let done = false, raf, ui = 0, ci = 0;
  const finish = () => { if (done) return; done = true; cancelAnimationFrame(raf); units.forEach(u => u.k ? u.n.style.visibility = "" : u.n.data = u.t); hide.forEach(x => x.style.visibility = ""); onDone(); };
  if (!units.length || matchMedia("(prefers-reduced-motion: reduce)").matches) { finish(); return finish; }
  hide.forEach(x => x.style.visibility = "hidden"); units.forEach(u => u.k ? u.n.style.visibility = "hidden" : u.n.data = ""); // markers, bars and boxes stay hidden until their text is reached
  const per = Math.max(2, Math.ceil(units.reduce((a, u) => a + (u.k ? 6 : u.t.length), 0) / 150)); // always done in about 2.5 s
  const tick = () => {
    let b = per;
    while (b > 0 && ui < units.length) {
      const u = units[ui]; u.b.forEach(x => x.style.visibility = "");
      if (u.k) { u.n.style.visibility = ""; ui++; b -= 6; } else { const take = Math.min(b, u.t.length - ci); ci += take; u.n.data = u.t.slice(0, ci); b -= take; if (ci >= u.t.length) { ui++; ci = 0; } }
    }
    scroll(false); ui < units.length ? raf = requestAnimationFrame(tick) : finish();
  };
  raf = requestAnimationFrame(tick); return finish;
}
const esc = t => String(t).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const SK = [["research", "search", "sk_research", "Deep research"], ["search", "globe", "sk_search", "Search the web"], ["pdf", "file", "sk_pdf", "Create a PDF"], ["word", "file", "sk_word", "Create a Word document"], ["image", "image", "sk_image", "Create an image"], ["petal", "petal", "sk_petal", "Make a Petal"], ["python", "code", "sk_python", "Run Python"], ["sum", "copy", "sk_sum", "Summarize"], ["tr", "globe", "sk_tr", "Translate"]];
const skName = id => { const k = SK.find(x => x[0] === id); return k ? T(k[2], k[3]) : id; };
function saveBlob(name, type, data) { const a = el("a"); a.href = URL.createObjectURL(new Blob([data], { type })); a.download = name; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1500); }
function docHtml(title, body, word) {
  return `<!doctype html><html lang="${lang}"${word ? ' xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"' : ""}><head><meta charset="utf-8"><title>${esc(title)}</title>${word ? "" : '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.11/katex.min.css">'}<style>@page{margin:18mm}body{font:11pt/1.6 "Segoe UI",system-ui,"Noto Sans KR","Malgun Gothic",sans-serif;color:#111;max-width:46rem;margin:2rem auto;padding:0 1rem}h1,h2,h3{line-height:1.25}h1{font-size:22pt}h2{font-size:15pt;margin-top:1.4em}table{border-collapse:collapse}td,th{border:1px solid #bbb;padding:4px 8px}pre{background:#f4f4f6;padding:10px;border-radius:6px;white-space:pre-wrap}code{font-family:Consolas,monospace;font-size:.9em}a{color:#5b3a8e}blockquote{border-left:3px solid #ccc;margin-left:0;padding-left:1em;color:#555}</style></head><body><h1>${esc(title)}</h1>${body}</body></html>`;
}
function saveDoc(d, fmt) {
  const base = d.title.replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "").slice(0, 50) || "orenis";
  if (fmt === "markdown") return saveBlob(base + ".md", "text/markdown", `# ${d.title}\n\n${d.markdown}`);
  const html = docHtml(d.title, md(d.markdown), fmt === "word");
  if (fmt === "html") return saveBlob(base + ".html", "text/html", html);
  if (fmt === "word") return saveBlob(base + ".doc", "application/msword", html);
  const f = el("iframe"); f.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0"; f.srcdoc = html; document.body.append(f); // PDF = print a clean copy: selectable text, any language
  f.onload = () => setTimeout(() => { f.contentWindow.onafterprint = () => f.remove(); f.contentWindow.focus(); f.contentWindow.print(); setTimeout(() => f.remove(), 120000); }, 700);
  toast(T("pdfTip", "In the print window, choose “Save as PDF”."));
}
function docCard(d) {
  const c = el("div", "docc"), h = el("div", "dh"), b = el("div", "dbs"); h.append(svg("file"), el("span", "", d.title));
  [["pdf", "PDF"], ["word", "Word"], ["markdown", "Markdown"], ["html", "HTML"]].forEach(([k, n]) => { const x = el("button", "dbtn" + (k === d.format ? " p" : ""), n); x.onclick = () => saveDoc(d, k); b.append(x); });
  c.append(h, b); return c;
}
function bubble(m, o = {}) {
  const row = el("div", "m pop");
  if (m.role === "user") {
    row.classList.add("mu"); if (m.skill) row.append(el("span", "fchip", "✦ " + skName(m.skill)));
    (m.files || []).forEach(f => row.append(fileChip(f))); if (m.text) row.append(el("div", "ub", m.text));
    const ua = el("div", "uacts"); ua.append(actBtn("", "copy", () => copyText(m.text), T("copy", "Copy")), actBtn("", "edit", () => editFrom(m), T("edit", "Edit"))); row.append(ua); return row;
  }
  row.classList.add("ma"); const lg = bloom(26); lg.style.marginTop = ".2rem"; row.append(lg);
  const body = el("div", "body"), txt = el("div", "md"); txt.innerHTML = md(m.text);
  if (m.steps?.length) { // collapsed "Thought for 4s": only the step titles, never the reasoning text
    const dt = el("details", "thought"), dv = el("div"); dt.append(el("summary", "", T("thought", "Thought for {s}s", { s: m.secs || 1 })));
    m.steps.forEach(x => { const o = typeof x === "string" ? { t: x } : x; dv.append(el("div", "", "✓ " + o.t)); }); dt.append(dv); body.append(dt);
  }
  txt.querySelectorAll("pre").forEach(p => {
    const code = p.querySelector("code"), c = code?.textContent ?? p.textContent, lg2 = (code?.className.match(/language-([\w+#-]+)/) || [])[1] || "";
    if (code) { try { hljs.highlightElement(code); } catch {} if (lg2) p.append(el("span", "lg", lg2)); }
    const b = el("button", "cp", T("copy", "Copy")); b.onclick = () => copyText(c); p.append(b);
    if (/^(html|svg|xml)$/i.test(lg2) || /^\s*(<!doctype html|<html|<svg)/i.test(c) || c.split("\n").length >= 15) { // any HTML/SVG block, or a longer piece of code, can become a Petal
      const pv = el("button", "cp", T("inCanvas", "Open as Petal")); pv.style.right = "4.8rem";
      pv.onclick = () => makePetal({ title: (c.match(/<title>([^<]{1,60})/i) || [])[1] || (lg2 ? lg2 + " " : "") + T("cvNew", "New Petal"), type: petalTypeOf(lg2, c), language: lg2, content: c });
      p.append(pv);
    }
  });
  const extra = el("div"); // images, documents, memory notes, sources and actions appear once the reveal finishes
  (m.imgs || []).forEach(im => { const f = el("figure", "gimg"), i = el("img"), a = el("div", "acts"); i.src = URL.createObjectURL(im.blob); i.alt = "Image"; a.append(actBtn(T("download", "Download"), "download", () => saveBlob("orenis-image." + ((im.mime || "image/png").split("/")[1] || "png"), im.mime, im.blob))); f.append(i, a); extra.append(f); });
  (m.docs || []).forEach(d => extra.append(docCard(d)));
  (m.runs || []).forEach(r => extra.append(runCard(r)));
  (m.petals || []).forEach(r => extra.append(petalCard(r)));
  if (m.canvas) extra.append(petalCard({ id: "lg" + (m.id ?? ""), title: m.canvas.title || "Petal", type: m.canvas.type, legacy: m.canvas }));
  if (m.ask) extra.append(askCard(m));
  if (m.mem?.length) { const bar = el("div", "srcs"); m.mem.forEach(f => { const n = el("span", "note"); n.append(svg("brain"), T("remembered", "Remembered: {f}", { f })); bar.append(n); }); extra.append(bar); }
  if (m.searched || m.sources?.length) {
    const bar = el("div", "srcs");
    if (m.searched) { const n = el("span", "note"); n.append(svg("globe"), T("searched", "Searched the web")); bar.append(n); }
    (m.sources || []).slice(0, 5).forEach(x => { let h = x.url; try { h = new URL(x.url).hostname.replace(/^www\./, ""); } catch {} const a = el("a", "pill"); a.href = x.url; a.target = "_blank"; a.rel = "noopener noreferrer"; a.title = x.title; a.append(el("span", "dot", h[0]), h); bar.append(a); });
    extra.append(bar);
  }
  const acts = el("div", "acts");
  acts.append(actBtn(T("copy", "Copy"), "copy", () => copyText(plain(txt))), actBtn("Markdown", "copy", () => copyText(m.text)));
  if ("speechSynthesis" in window) acts.append(actBtn(T("listen", "Listen"), "speaker", () => { if (speechSynthesis.speaking) return speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(plain(txt)); u.lang = { en: "en-US", ko: "ko-KR", es: "es-PE" }[lang]; speechSynthesis.speak(u); }));
  if (o.isLast) { const r = actBtn(T("regen", "Regenerate"), "refresh", regenerate); r.classList.add("regen"); acts.append(r); }
  extra.append(acts); body.append(txt, extra); row.append(body);
  if (o.animate) { extra.hidden = true; row._done = new Promise(res => { row._skip = revealText(txt, () => { extra.hidden = false; res(); }); }); }
  return row;
}
/* Live thinking indicator: spinning bloom + the real steps as the Worker reports them (thought summaries, searches, reads). */
function thinking() {
  const r = el("div", "m th pop"), l = bloom(26), st = el("div", "steps"); l.classList.add("lg2"); l.style.marginTop = ".15rem"; r.append(l, st);
  r._steps = []; r._t0 = Date.now(); r._def = false;
  r.step = (t, label = false) => {
    t = String(t || "").trim(); if (!t) return;
    if (label) { if (r._def && r._steps.length === 1) { st.lastChild.textContent = t; r._steps[0].t = t; r._def = false; } return; } // the optional label only replaces the default first line
    const last = r._steps[r._steps.length - 1];
    if (last && last.t === t) return;
    r._def = false; if (st.lastChild) st.lastChild.className = "ok"; r._steps.push({ t }); st.append(el("div", "now", t));
    while (st.children.length > 5) st.firstChild.remove(); // live view shows the latest steps; the full list is kept for "Thought for Ns"
  };
  r.step(T("think", "Thinking")); r._def = true; return r;
}
function banner(text, retry = false, detail = "") {
  const b = el("div", "err pop", text); b.setAttribute("role", "alert");
  if (detail) { const d = el("div", "small", detail); d.style.cssText = "width:100%;word-break:break-word"; b.append(d); } // technical detail for client-side failures, so reports are diagnosable
  if (retry) { const r = el("button", "act", T("retry", "Retry")); r.style.border = "1px solid var(--line)"; r.onclick = () => { b.remove(); if (!busy && gate()) submit(null, null, true); }; b.append(r); }
  feed.append(b); scroll();
}
/* ---- Modes: built-in roles plus the user's own; stored on the chat, sent as instructions ---- */
const MODES = [
  ["general", "sparkle", "m_general", "General", "md_general", "Help with everyday things", ""],
  ["research", "search", "m_research", "Researcher", "md_research", "Searches, compares and cites sources", "Researcher mode: search proactively, compare sources and viewpoints, flag disagreement and uncertainty, and cite everything."],
  ["study", "book", "m_study", "Study buddy", "md_study", "Explains step by step, then quizzes you", "Study buddy mode: teach step by step with simple analogies, check understanding with a short question, and offer a mini quiz at the end."],
  ["code", "code", "m_code", "Coder", "md_code", "Clean code, explained trade-offs", "Coder mode: write clean, idiomatic, working code, state assumptions, explain trade-offs briefly, and mention edge cases and how to test."],
  ["write", "pen", "m_write", "Writer", "md_write", "Drafts and edits in your voice", "Writer mode: help draft and edit, match the user's tone, offer one or two alternative phrasings, and keep the user's voice."],
  ["plan", "cal", "m_plan", "Planner", "md_plan", "Turns goals into step-by-step plans", "Planner mode: turn goals into concrete steps with timelines, priorities and checkpoints; ask at most one clarifying question, and only if essential."],
];
const getJSON = (k, d) => { try { return JSON.parse(ls(k) || d); } catch { return JSON.parse(d); } };
const customModes = () => getJSON("orenis_modes", "[]");
/* Images are free but come from a shared daily pool, so each person gets a few a day */
const IMG_CAP = 6, imgTimes = () => { const mid = new Date(); mid.setHours(0, 0, 0, 0); return getJSON("orenis_imgs", "[]").filter(t => t >= mid.getTime()); }, imgLeft = () => Math.max(0, IMG_CAP - imgTimes().length);
const allModes = () => [...MODES.map(m => ({ id: m[0], icon: m[1], k: m[2], en: m[3], dk: m[4], den: m[5], ins: m[6] })), ...customModes().map(m => ({ id: m.id, icon: "sparkle", name: m.name, ins: m.ins }))];
const modeOf = id => allModes().find(m => m.id === id) || allModes()[0];
const modeName = m => m.name || T(m.k, m.en), modeDesc = m => m.name ? (m.ins || "").slice(0, 70) : T(m.dk, m.den);
function setMode(id, save = true) {
  curMode = modeOf(id).id; const m = modeOf(curMode); $("#modeIc").innerHTML = ic(m.icon); $("#modeLbl").textContent = modeName(m);
  document.querySelectorAll(".mcard").forEach(b => b.classList.toggle("on", b.dataset.id === curMode)); if (save && chatId) putChat(chatId, { mode: curMode });
}
/* ---- Memory: short facts the model saved (or you added); fully visible and deletable ---- */
const getFacts = () => getJSON("orenis_facts", "[]"), setFacts = a => ls("orenis_facts", JSON.stringify(a.slice(-40)));
function emptyState(t, d, cta, fn) { // empty state: illustration, a line of guidance, one clear action
  const w = el("div", "empty-st"), i = bloom(40); w.append(i, el("b", "", t)); if (d) w.append(el("p", "", d));
  if (cta) { const b = el("button", "btn p", cta); b.onclick = fn; w.append(b); } return w;
}
function renderFacts() {
  const box = $("#facts"); box.innerHTML = ""; const f = getFacts(); if (!f.length) return void box.append(emptyState(T("factsEmptyT", "Nothing remembered yet"), T("factsEmptyD", "Say \u201cremember that\u2026\u201d in a chat, or add something below."), T("addFirst", "Add a memory"), () => $("#factIn").focus()));
  f.forEach((x, i) => { const r = el("div", "fact"), d = el("button"); d.append(svg("x")); d.setAttribute("aria-label", T("del", "Delete")); d.onclick = () => { const a = getFacts(); a.splice(i, 1); setFacts(a); renderFacts(); }; r.append(el("span", "", x), d); box.append(r); });
}
function addFact(t) { t = String(t).trim().slice(0, 200); const a = getFacts(); if (!t || a.some(x => x.toLowerCase() === t.toLowerCase())) return false; a.push(t); setFacts(a); renderFacts(); return true; }
function renderModesList() {
  const box = $("#modeList"); box.innerHTML = ""; const c = customModes(); if (!c.length) box.append(emptyState(T("modesEmptyT", "No custom modes yet"), T("modesEmptyD", "Design a mode for a job you do often."), T("createMode", "Create a mode"), () => $("#mName").focus()));
  c.forEach((m, i) => { const r = el("div", "fact"), d = el("button"); d.append(svg("x")); d.setAttribute("aria-label", T("del", "Delete")); d.onclick = () => { const a = customModes(); a.splice(i, 1); ls("orenis_modes", JSON.stringify(a)); if (curMode === m.id) setMode("general"); renderModesList(); if ($("#stage").classList.contains("empty")) welcome(); }; r.append(el("span", "", m.name), d); box.append(r); });
}
function welcome() {
  feed.innerHTML = ""; const w = el("div", "hello pop");
  w.append(bloom(44), el("h2", "", ls("orenis_name") ? T("hello", "Hello, {n}", { n: ls("orenis_name") }) : T("hello", "Hello, {n}", { n: "" }).replace(/,?\s*님?\s*$/, "")), el("p", "", T("how", "How can I help you today?")));
  const g = el("div", "mcards"); // pick a mode: it sets Orenis's role and style for this chat
  allModes().forEach(m => { const b = el("button", "mcard" + (m.id === curMode ? " on" : "")); b.dataset.id = m.id; b.append(svg(m.icon), el("b", "", modeName(m)), el("span", "", modeDesc(m))); b.onclick = () => { setMode(m.id); $("#input").focus(); }; g.append(b); });
  w.append(g); feed.append(w);
  const s = $("#sugg"); s.innerHTML = "";
  [["s1", "Summarize today's tech news"], ["s2", "Explain quantum computing simply"], ["s3", "Help me write a Python script"], ["s4", "Review a document I attach"]].forEach(([k, en]) => { const t = T(k, en), b = el("button", "", t); b.onclick = () => { $("#input").value = t; autosize(); updSend(); $("#input").focus(); }; s.append(b); });
}
async function openChat(id) {
  const same = id !== null && id === chatId; chatId = id; feed.innerHTML = "";
  const ms = id ? await msgsOf(id) : [], c = id ? await tx("chats", "readonly", o => o.get(id)) : null;
  setTitle(c ? c.title : "Orenis"); setMode(c?.mode || "general", false); $("#export").hidden = !ms.length;
  if (!same) Petals.close(); chatPetals = await petalsOf(id); $("#cvBtn").hidden = !chatPetals.length;
  setEmpty(!ms.length); if (!ms.length) welcome(); else ms.forEach((m, i) => feed.append(bubble(m, { isLast: m.role === "assistant" && i === ms.length - 1 })));
  if (busy && id === busyChat && thEl) feed.append(thEl); // reply still on its way for this chat
  feed.scrollTop = feed.scrollHeight; $("#jump").hidden = true; renderList(); closeSide();
}
const grp = t => { const d = new Date(); d.setHours(0, 0, 0, 0); const a = d.getTime(); return t >= a ? T("today", "Today") : t >= a - 6 * 864e5 ? T("prev", "Previous 7 days") : T("older", "Older"); };
function showCtx(items, x, y, above = false) {
  const m = $("#ctx"); m.innerHTML = "";
  items.forEach(it => {
    if (it.head) return m.append(el("div", "hd", it.head));
    const b = el("button", it.danger ? "dg" : ""), t = el("span"); t.append(el("span", "", it.label)); if (it.desc) t.append(el("small", "", it.desc));
    b.append(svg(it.icon), t); if (it.on) { const c = svg("check"); c.style.marginLeft = "auto"; b.append(c); }
    b.onclick = () => { hideCtx(); it.fn(); }; m.append(b);
  });
  m.hidden = false; const w = m.offsetWidth, h = m.offsetHeight, top = above ? y - h - 8 : y;
  m.style.left = Math.max(8, Math.min(x, innerWidth - w - 8)) + "px"; m.style.top = Math.max(8, Math.min(top, innerHeight - h - 8)) + "px";
}
function hideCtx() { $("#ctx").hidden = true; }
const putChat = (id, patch) => tx("chats", "readwrite", o => { const g = o.get(id); g.onsuccess = () => g.result && o.put({ ...g.result, ...patch }); });
async function togglePin(c) { await putChat(c.id, { pinned: !c.pinned }); renderList(); }
async function delAsk(c) { if (await ask(T("delq", 'Delete "{t}"?', { t: c.title }))) { await delChat(c.id); if (c.id === chatId) openChat(null); else renderList(); } }
function startRename(c) {
  const b = $(`.row[data-id="${c.id}"] .tt`); if (!b) return;
  const i = el("input", "edt"); i.value = c.title; b.replaceWith(i); i.focus(); i.select(); let done = false;
  const end = async ok => { if (done) return; done = true; const t = i.value.trim().slice(0, 60); if (ok && t) { await putChat(c.id, { title: t, auto: false }); if (c.id === chatId) setTitle(t); } renderList(); };
  i.onkeydown = e => { if (e.key === "Enter") end(true); if (e.key === "Escape") end(false); }; i.onblur = () => end(true);
}
const chatMenu = (c, x, y) => showCtx([
  { icon: "pin", label: c.pinned ? T("unpin", "Unpin") : T("pin", "Pin"), fn: () => togglePin(c) },
  { icon: "edit", label: T("renameChat", "Rename"), fn: () => startRename(c) },
  { icon: "trash", label: T("del", "Delete"), danger: true, fn: () => delAsk(c) }], x, y);
function chatRow(c) {
  const r = el("div", "row" + (c.id === chatId ? " on" : "")), b = el("button", "tt"), m = el("button"); r.dataset.id = c.id;
  if (c.pinned) { const p = svg("pin"); p.classList.add("pn"); b.append(p); } b.append(c.title);
  m.append(svg("dots")); m.setAttribute("aria-label", T("menu", "Options"));
  b.onclick = () => openChat(c.id); m.onclick = () => { const k = m.getBoundingClientRect(); chatMenu(c, k.left, k.bottom + 4); };
  r.oncontextmenu = e => { e.preventDefault(); chatMenu(c, e.clientX, e.clientY); }; // right click; long-press does the same on touch
  let tm; r.ontouchstart = e => { tm = setTimeout(() => { const t = e.touches[0]; chatMenu(c, t.clientX, t.clientY); }, 520); }; r.ontouchend = r.ontouchmove = () => clearTimeout(tm);
  r.append(b, m); return r;
}
async function renderList() {
  const list = $("#list"), q = $("#sq").value.trim().toLowerCase(); list.innerHTML = "";
  const all = (await allChats()).filter(c => !q || c.title.toLowerCase().includes(q)), pins = all.filter(c => c.pinned);
  if (!all.length) return void list.append(q ? emptyState(T("noMatch", "No chats match"), "", T("clearSearch", "Clear search"), () => { $("#sq").value = ""; renderList(); }) : emptyState(T("noChats", "No chats yet"), T("noChatsD", "Start one and it will show up here."), T("startChat", "Start a chat"), () => { openChat(null); $("#input").focus(); }));
  if (pins.length) { list.append(el("div", "lbl", T("pinned", "Pinned"))); pins.forEach(c => list.append(chatRow(c))); }
  let last = ""; for (const c of all.filter(c => !c.pinned)) { const g = grp(c.updated); if (g !== last) { list.append(el("div", "lbl", g)); last = g; } list.append(chatRow(c)); }
}
async function autoTitle(cid, user, assistant) { // short topic title in the user's language, e.g. "Initial Greetings"
  try {
    const r = await fetch(PROXY_ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ task: "title", user, assistant }) });
    const { title } = await r.json(); if (!title) return;
    const c = await tx("chats", "readonly", o => o.get(cid)); if (!c?.auto) return; // renamed by the user in the meantime
    await putChat(cid, { title }); if (chatId === cid) setTitle(title); renderList();
  } catch {}
}

/* ---------- Attachments ---------- */
function addFiles(list) {
  for (const f of list) {
    if (pending.length >= MAXF) return toast(T("maxf", "Up to {n} files per message", { n: MAXF }));
    if (f.size > MAXB) { toast(T("big", "{f} is over 10 MB", { f: f.name })); continue; }
    if (!(OKTYPE.test(f.type) || isText(f))) { toast(T("uns", "{f}: unsupported type", { f: f.name })); continue; }
    pending.push(f);
  }
  renderTray();
}
function renderTray() {
  const t = $("#tray"); t.innerHTML = "";
  if (activeSkill) { const c = el("span", "skchip", "✦ " + skName(activeSkill)), x = el("button", "", "✕"); x.setAttribute("aria-label", "Remove"); x.onclick = () => { activeSkill = null; renderTray(); }; c.append(x); t.append(c); }
  pending.forEach((f, i) => { const w = el("div", "pop"); w.style.position = "relative"; w.append(fileChip({ name: f.name, type: f.type, blob: f, petal: f.petalId })); const x = el("button", "rm", "✕"); x.setAttribute("aria-label", "Remove " + f.name); x.onclick = () => { pending.splice(i, 1); renderTray(); }; w.append(x); t.append(w); });
  updSend();
}
const updSend = () => {
  const b = $("#send"), m = busy ? "stop" : "send"; b.disabled = !busy && !($("#input").value.trim() || pending.length);
  if (b.dataset.m !== m) { b.dataset.m = m; b.querySelector("svg").innerHTML = ic(busy ? "stop" : "up"); b.setAttribute("aria-label", busy ? T("stop", "Stop") : T("send", "Send")); }
};

/* ---------- Sending ---------- */
async function memorySnippet() {
  const out = []; for (const c of (await allChats()).filter(c => c.id !== chatId).slice(0, 5)) (await msgsOf(c.id)).filter(m => m.role === "user" && m.text).slice(-2).forEach(m => out.push("- " + m.text.slice(0, 160)));
  return out.join("\n");
}
function gate(files = []) { // quota + size checks shared by send, retry and regenerate
  const u = usage();
  if (u.d.length >= LIM.day) return banner(T("eDay", "Daily limit reached. It resets {t}.", { t: fmt(u.dReset) })), false;
  if (u.w.length >= LIM.win) return banner(T("eWin", "5-hour limit reached. A slot frees {t}.", { t: fmt(u.wReset) })), false;
  if (files.reduce((a, f) => a + f.size, 0) > MAXTOTAL) return banner(T("eSize", "Attachments total over 12 MB. Remove one and try again.")), false;
  return true;
}
async function send() {
  const text = $("#input").value.trim(); if (busy || (!text && !pending.length)) return;
  const files = pending.slice(); if (!gate(files)) return;
  const sk = activeSkill; activeSkill = null; ls("orenis_draft", ""); $("#input").value = ""; pending = []; renderTray(); autosize(); await submit(text, files, false, sk);
}
function stop() { if (ctl) { ctl.userAborted = true; ctl.abort(); } else curSkip?.(); } // cancel the request, or finish the reveal instantly
function onThought(th, text) { for (const m of String(text).matchAll(/\*\*(.+?)\*\*/g)) th.step(m[1]); } // legacy Worker: headings only, never the body
function onStep(th, ev) { // real progress events streamed by the Worker
  if (ev.s === "thought") ev.h ? ev.h.forEach(h => th.step(h)) : onThought(th, ev.t || "");
  else if (ev.s === "label") th.step(ev.t, true);
  else if (ev.s === "analyze") th.step(T("analyzing", "Analyzing the results"));
  else if (ev.s === "search") th.step(ev.t ? T("searchQ", "Searching: {q}", { q: ev.t }) : T("searching", "Searching the web"));
  else if (ev.s === "read") th.step(T("reading", "Reading {n} sources", { n: ev.t }));
  else if (ev.s === "doc") th.step(T("drafting", "Drafting the document"));
  else if (ev.s === "memory") th.step(T("saving", "Saving to memory"));
  else if (ev.s === "image") th.step(T("imaging", "Creating an image"));
  else if (ev.s === "petal") th.step(T("petaling", "Writing a Petal"));
  else if (ev.s === "python") th.step(T("pying", "Running Python"));
  else if (ev.s === "ask") th.step(T("asking", "Preparing a few questions"));
  else if (ev.s === "write") th.step(T("writing", "Writing the answer"));
}
async function readStream(r, th) {
  const rd = r.body.getReader(), dec = new TextDecoder(); let buf = "", out = null;
  for (;;) {
    const { value, done } = await rd.read(); if (done) break;
    buf += dec.decode(value, { stream: true }); let i;
    while ((i = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1); if (!line) continue;
      let ev; try { ev = JSON.parse(line); } catch { continue; }
      if (ev.s) onStep(th, ev); else if (ev.done) out = ev.done; else if (ev.error) out = { error: ev.error, code: ev.code };
    }
  }
  return out || { error: T("eCut", "The connection dropped while Orenis was working."), code: "ECUT" }; // stream ended with no result: treated as transient
}
async function submit(text, files, regen = false, skill = null) {
  busy = true; updSend(); const now = Date.now();
  if (!chatId) { chatId = uid(); const title = (text || files[0].name).slice(0, 40); await tx("chats", "readwrite", o => o.put({ id: chatId, title, created: now, updated: now, auto: true, mode: curMode })); setTitle(title); }
  if ($("#stage").classList.contains("empty")) { feed.innerHTML = ""; setEmpty(false); } // also covers an existing-but-empty chat (e.g. after Edit); it used to keep the welcome screen
  const cid = chatId; busyChat = cid; $("#export").hidden = false;
  feed.querySelectorAll(".err,.regen").forEach(e => e.remove());
  if (!regen) { const um = { chatId, role: "user", text, ts: now, skill, files: files.map(f => ({ name: f.name, type: f.type, blob: f, petal: f.petalId || null })) }; um.id = await tx("messages", "readwrite", o => o.add(um)); feed.append(bubble(um)); }
  await syncOpenPetal(); Petals.busy(true);
  const th = thEl = thinking(); feed.append(th); scroll();
  ls("orenis_hits", JSON.stringify([...hits(), now])); // counted at send, refunded on failure
  $("#live").hidden = false; const c = ctl = new AbortController(), to = setTimeout(() => c.abort(), effort === "max" || skill === "research" ? 420000 : 240000);
  try {
    const all = await msgsOf(cid), last = all[all.length - 1]; // always rebuilt from storage, so retry and regenerate resend the same message
    const prior = all.slice(-13, -1).map(m => ({ role: m.role, text: m.text + (m.ask ? "\n\n[I asked: " + m.ask.questions.map(q => q.question + " (" + q.options.join(" / ") + ")").join(" | ") + "]" : ""), files: (m.files || []).map(f => ({ name: f.name })) })), asked = !!all[all.length - 2]?.ask; // never interrogate twice in a row
    let t = last.text, media = [];
    for (const f of last.files || []) { if (!f.blob) continue; if (isText(f)) t += `\n\n[${f.petal ? `Petal: ${f.name} (id ${f.petal})` : `File: ${f.name}`}]\n\`\`\`\n${(await f.blob.text()).slice(0, f.petal ? 60000 : 20000)}\n\`\`\``; else media.push({ name: f.name, mime: f.type, data: await b64(f.blob) }); }
    const payload = { messages: [...prior, { role: "user", text: t, files: media }], name: ls("orenis_name"), lang, effort: last.skill === "research" ? "max" : effort, mode: modeOf(curMode).ins || "", facts: ls("orenis_sk_mem") !== "0" ? getFacts() : [], remember: ls("orenis_sk_mem") !== "0", petalTool: ls("orenis_sk_canvas") !== "0", python: ls("orenis_sk_py") !== "0", ask: ls("orenis_sk_ask") !== "0", noAsk: asked, petals: chatPetals.map(p => ({ id: p.id, title: p.title, type: p.type, language: p.language })), petalCtx: petalCtx(), images: ls("orenis_sk_img") !== "0" && imgLeft() > 0, imgCapped: imgLeft() <= 0, instructions: ls("orenis_instr") || "", skill: last.skill || null, search: ls("orenis_sk_web") !== "0", docs: ls("orenis_sk_doc") !== "0" };
    if (ls("orenis_mem") === "1") payload.memory = await memorySnippet();
    let d, attempt = 0;
    for (;;) { // transient failures are retried quietly; the last attempt is a plain request/response, which survives networks that break streaming
      const live = ls("orenis_live") !== "0" && attempt < 2;
      try {
        const r = await fetch(PROXY_ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...payload, stream: live }), signal: c.signal });
        d = (r.headers.get("content-type") || "").includes("ndjson") ? await readStream(r, th) : await r.json().catch(() => ({}));
        if (d.reply) { if (attempt >= 2 && ls("orenis_live") !== "0") { ls("orenis_live", "0"); $("#skLive").checked = false; toast(T("liveOff", "Live steps were turned off because your network breaks them. You can re-enable them in Settings.")); } break; }
        const er = new Error((d.error || (r.status === 413 ? T("e413", "Those attachments are too large.") : r.status === 429 ? T("e429", "Orenis is busy. Please try again in a few minutes.") : T("eGen", "Orenis couldn't respond right now. Please try again shortly."))) + (d.code ? ` (${d.code})` : ""));
        er.code = d.code || (r.status >= 500 ? "E" + r.status : ""); er.server = d.code !== "ECUT"; throw er;
      } catch (e) {
        if (!e.code) e.code = e.name === "AbortError" ? "" : e instanceof TypeError ? (/fetch|network|load failed|stream|connection|terminated/i.test(e.message) ? "ENET" : "EAPP") : ""; // only real network errors are called network errors
        const transient = e.name !== "AbortError" && /^(E5\d\d|ENET|EEMPTY|EJSON|E429|ECUT)$/.test(e.code);
        if (!transient || attempt >= 2 || c.signal.aborted) throw e;
        attempt++; th.step(T("retrying", "Retrying…")); await sleep(1500 * attempt);
      }
    }
    clearTimeout(to); ctl = null;
    if (d.images?.length) ls("orenis_imgs", JSON.stringify([...imgTimes(), ...d.images.map(() => Date.now())]));
    const imgs = (d.images || []).map(i => ({ mime: i.mime, blob: b64ToBlob(i.data, i.mime) })), mem = (d.memories || []).filter(addFact);
    if (mem.length) toast(T("remembered", "Remembered: {f}", { f: mem[0] }));
    const pr = d.petals?.length ? await applyPetals(cid, d.petals) : { refs: [], last: null }, runs = (d.runs || []).map(r => ({ code: r.code, output: r.output, ok: r.ok, imgs: (r.images || []).map(i => ({ mime: i.mime, blob: b64ToBlob(i.data, i.mime) })) }));
    const am = { chatId: cid, role: "assistant", text: d.reply, ts: Date.now(), searched: !!d.searched, sources: d.sources || [], docs: d.files || [], imgs, mem, petals: pr.refs, runs, ask: d.ask || null, steps: th._steps.map(x => ({ t: x.t })), secs: Math.max(1, Math.round((Date.now() - th._t0) / 1000)) };
    am.id = await tx("messages", "readwrite", o => o.add(am));
    if (pr.last && chatId === cid) { chatPetals = await petalsOf(cid); showPetal(chatPetals.find(x => x.id === pr.last.id) || pr.last); $("#cvBtn").hidden = false; }
    if (all.length <= 1) autoTitle(cid, last.text || "", d.reply);
    if (chatId === cid) { // a rendering problem must never be reported as a connection problem, and must never lose the answer
      thEl?.remove(); let row; try { row = bubble(am, { animate: true, isLast: true }); } catch { row = el("div", "m md"); row.textContent = am.text; }
      feed.append(row); curSkip = row._skip; scroll(); await row._done;
    } // only paint into the chat that asked
  } catch (e) {
    ls("orenis_hits", JSON.stringify(hits().filter(x => x !== now))); // failed or stopped requests don't use quota
    const quiet = e.name === "AbortError" && c.userAborted;
    if (chatId === cid) { thEl?.remove(); if (!quiet) { const to2 = e.name === "AbortError", detail = to2 || (e.server && e.code !== "ECUT") ? "" : `${e.name}: ${e.message}`.slice(0, 160);
      banner(to2 ? T("eTo", "The request timed out. Please try again.") : e.code === "ENET" ? T("eNet", "Can't reach Orenis. Check your connection, VPN or ad blocker, then try again.") + " (ENET)" : e.code === "EAPP" ? T("eApp", "Something went wrong in the app.") + " (EAPP)" : e.message, true, detail); } }
  } finally {
    clearTimeout(to); Petals.busy(false); busy = false; busyChat = null; thEl = null; ctl = null; curSkip = null; $("#live").hidden = true; updSend();
    await tx("chats", "readwrite", o => { const g = o.get(cid); g.onsuccess = () => g.result && o.put({ ...g.result, updated: Date.now() }); });
    renderList(); if (view === "petals") renderPetalList(); renderUsage(); if (!mobile()) $("#input").focus();
  }
}
async function regenerate() {
  if (busy || !chatId || !gate()) return; const ms = await msgsOf(chatId), l = ms[ms.length - 1];
  if (l?.role === "assistant") await tx("messages", "readwrite", o => o.delete(l.id)); await openChat(chatId); submit(null, null, true);
}
async function editFrom(m) { // ChatGPT-style edit: drop this message and everything after it, put it back in the composer
  if (busy || m.id == null) return; const ms = await msgsOf(chatId);
  await tx("messages", "readwrite", o => ms.filter(x => x.id >= m.id).forEach(x => o.delete(x.id))); await openChat(chatId);
  $("#input").value = m.text; activeSkill = m.skill || null; pending = (m.files || []).map(f => { const x = new File([f.blob], f.name, { type: f.type }); if (f.petal) x.petalId = f.petal; return x; }); renderTray(); autosize(); updSend(); $("#input").focus();
}

/* ---------- Wiring ---------- */
const mobile = () => innerWidth < 768;
const closeSide = () => { $("#side").classList.remove("open"); $("#scrim").classList.remove("on"); };
$("#menu").onclick = () => { if (mobile()) { $("#side").classList.toggle("open"); $("#scrim").classList.toggle("on"); } else $("#side").classList.toggle("hide"); };
$("#scrim").onclick = closeSide;
function autosize() { const t = $("#input"); t.style.height = "auto"; t.style.height = Math.min(t.scrollHeight, 192) + "px"; }
$("#input").addEventListener("input", () => { autosize(); updSend(); });
$("#input").addEventListener("keydown", e => { if (e.key === "Enter" && !e.shiftKey && !e.isComposing && !matchMedia("(pointer: coarse)").matches) { e.preventDefault(); send(); } /* on phones Enter adds a new line; the send button sends */ });
$("#input").addEventListener("paste", e => { const f = [...e.clipboardData.files]; if (f.length) { e.preventDefault(); addFiles(f); } });
$("#send").onclick = () => busy ? stop() : send();
$("#file").onchange = e => { addFiles(e.target.files); e.target.value = ""; };
let dragN = 0;
addEventListener("dragenter", e => { if (e.dataTransfer?.types.includes("Files")) { dragN++; $("#drop").classList.add("on"); } });
addEventListener("dragleave", () => { if (--dragN <= 0) { dragN = 0; $("#drop").classList.remove("on"); } });
addEventListener("dragover", e => e.preventDefault());
addEventListener("drop", e => { e.preventDefault(); dragN = 0; $("#drop").classList.remove("on"); addFiles(e.dataTransfer.files); });
$("#newChat").onclick = () => openChat(null);
$("#gear").onclick = () => openSettings(); $("#closeGear").onclick = () => $("#setModal").classList.remove("on");
$("#memTog").onchange = e => ls("orenis_mem", e.target.checked ? "1" : "0");
$("#lang").onchange = e => { lang = e.target.value; ls("orenis_lang", lang); applyLang(); $("#effortLbl").textContent = effName(effort); renderUsage(); renderOpts(); Petals.relabel(); setView(view); openChat(chatId); };
$("#planBadge").onclick = () => show("#planModal"); $("#planOk").onclick = () => { ls("orenis_plan", "free"); hide("#planModal"); };

$("#wipeBtn").onclick = async () => { if (await ask(T("wipeq", "Delete all chats stored on this device? This can't be undone."))) { for (const c of await allChats()) await delChat(c.id); $("#setModal").classList.remove("on"); openChat(null); } };
const setName = () => { const n = ls("orenis_name") || ""; $("#meName").textContent = n; $("#ava").textContent = (n[0] || "?").toUpperCase(); $("#nameEdit").value = n; };
$("#nameOk").onclick = () => { const n = $("#nameIn").value.trim(); if (!n) return $("#nameIn").focus(); ls("orenis_name", n); setName(); hide("#nameModal"); if (!ls("orenis_plan")) show("#planModal"); if (!chatId) welcome(); };
$("#nameIn").addEventListener("keydown", e => { if (e.key === "Enter") $("#nameOk").click(); });
addEventListener("keydown", e => { if (e.key === "Escape") { $("#setModal").classList.remove("on"); hide("#planModal"); closeSide(); } });

document.querySelectorAll(".tab").forEach(t => t.onclick = () => { document.querySelectorAll(".tab").forEach(x => x.classList.toggle("on", x === t)); document.querySelectorAll(".pane").forEach(p => p.classList.toggle("on", p.dataset.pane === t.dataset.tab)); });
$("#setModal").addEventListener("pointerdown", e => { if (e.target.id === "setModal") $("#setModal").classList.remove("on"); });
$("#instr").value = ls("orenis_instr") || ""; $("#instr").oninput = e => ls("orenis_instr", e.target.value.slice(0, 1500));
document.querySelectorAll("[data-pre]").forEach(b => b.onclick = () => { const i = $("#instr"), v = i.value.trim(); i.value = (v ? v + "\n" : "") + "- " + b.textContent; ls("orenis_instr", i.value); });
[["#skWeb", "orenis_sk_web"], ["#skDoc", "orenis_sk_doc"], ["#skImg", "orenis_sk_img"], ["#skCanvas", "orenis_sk_canvas"], ["#skPy", "orenis_sk_py"], ["#skAsk", "orenis_sk_ask"], ["#skLive", "orenis_live"], ["#skMem", "orenis_sk_mem"]].forEach(([id, k]) => { $(id).checked = ls(k) !== "0"; $(id).onchange = e => ls(k, e.target.checked ? "1" : "0"); });
$("#nameEdit").onchange = e => { const n = e.target.value.trim(); if (!n) return setName(); ls("orenis_name", n); setName(); if (!chatId) welcome(); };
$("#plusBtn").onclick = e => { const r = e.currentTarget.getBoundingClientRect(); showCtx([
  { icon: "clip", label: T("addFiles", "Add photos & files"), fn: () => $("#file").click() }, { head: T("petals", "Petals") },
  { icon: "petal", label: T("addPetal", "Add a Petal as input"), fn: openPicker },
  { icon: "plus", label: T("newPetal", "New blank Petal"), fn: () => makePetal({ title: T("cvNew", "New Petal"), type: "html", content: Petals.starter("html") }) }, { head: T("skills", "Skills") },
  ...SK.map(([id, icon, k, en]) => ({ icon, label: T(k, en), on: activeSkill === id, fn: () => { activeSkill = id; renderTray(); $("#input").focus(); } }))], r.left, r.top, true); };
$("#effortLbl").textContent = effName(effort);
$("#effortBtn").onclick = e => { const r = e.currentTarget.getBoundingClientRect(); showCtx([{ head: T("effort", "Reasoning effort") },
  ...EFF.map(([id, k, en, dk, den]) => ({ icon: "bolt", label: T(k, en), desc: T(dk, den), on: effort === id, fn: () => { effort = id; ls("orenis_effort", id); $("#effortLbl").textContent = effName(id); } }))], r.right - 240, r.top, true); };
$("#input").value = ls("orenis_draft") || ""; autosize(); updSend(); $("#input").addEventListener("input", () => ls("orenis_draft", $("#input").value)); // unsent text survives a reload
addEventListener("offline", () => toast(T("offline", "You're offline"))); addEventListener("online", () => toast(T("online", "Back online")));
addEventListener("pointerdown", e => { if (!e.target.closest("#ctx")) hideCtx(); }, true);
addEventListener("keydown", e => { if (e.key === "Escape") hideCtx(); });
/* ---- Petals: files the model (or you) make. Shown in a side panel, saved with the chat, listed in the sidebar, and attachable as input. ---- */
let chatPetals = [], petalId = null, view = "chats";
Petals.init({ t: (k, en) => T(k, en), toast, saveFile: saveBlob });
const petalTypeOf = (l, c) => /^svg$/i.test(l) || /^\s*<svg/i.test(c) ? "svg" : /^(html|xml)$/i.test(l) || /^\s*(<!doctype html|<html)/i.test(c) ? "html" : /^(md|markdown)$/i.test(l) ? "markdown" : "code";
const PEXT = { markdown: "md", html: "html", svg: "svg", python: "py", javascript: "js", typescript: "ts", java: "java", c: "c", cpp: "cpp", go: "go", rust: "rs", ruby: "rb", php: "php", bash: "sh", shell: "sh", json: "json", css: "css", sql: "sql", yaml: "yml", kotlin: "kt", swift: "swift" };
const petalExt = p => PEXT[p.type] || PEXT[(p.language || "").toLowerCase()] || "txt";
const petalName = p => ((p.title || "petal").replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "").slice(0, 40) || "petal") + "." + petalExt(p);
const petalMime = p => ({ html: "text/html", svg: "image/svg+xml", markdown: "text/markdown" }[p.type] || "text/plain");
const petalTag = p => ({ html: "HTML", svg: "SVG", markdown: "Markdown" }[p.type] || (p.language ? p.language : "Code"));
const petalIcon = p => ({ html: "globe", svg: "image", markdown: "file" }[p.type] || "code");
async function ensureChat() { // a Petal needs a chat to live in
  if (chatId) return chatId; const now = Date.now(); chatId = uid(); const t = T("cvNew", "New Petal");
  await tx("chats", "readwrite", o => o.put({ id: chatId, title: t, created: now, updated: now, auto: true, mode: curMode })); setTitle(t); renderList(); return chatId;
}
async function makePetal(o) { // a new Petal made by the user (blank, or from a code block)
  const cid = await ensureChat(), now = Date.now(), rec = { id: uid(), chatId: cid, title: String(o.title || T("cvNew", "New Petal")).slice(0, 80), type: o.type || "html", language: o.language || "", content: String(o.content ?? ""), created: now, updated: now, rev: 1 };
  await putPetalRec(rec); chatPetals = await petalsOf(cid); openPetal(rec); if (view === "petals") renderPetalList(); return rec;
}
function openPetal(p) {
  petalId = p.id;
  Petals.open({ ...p, onChange: savePetalEdit,
    onAsk: q => { $("#input").value = q; autosize(); updSend(); send(); },
    onClose: () => { petalId = null; $("#cvBtn").classList.remove("on"); $("#cvBtn").hidden = !chatPetals.length; if (view === "petals") renderPetalList(); } });
  $("#cvBtn").hidden = false; $("#cvBtn").classList.add("on"); if (view === "petals") renderPetalList();
}
const showPetal = p => Petals.isOpen() && Petals.get()?.id === p.id ? Petals.update(p) : openPetal(p); // the model wrote or changed it
async function savePetalEdit(c) { // your hand edits and title changes
  if (!c || !c.id) return; const old = chatPetals.find(x => x.id === c.id) || await getPetal(c.id); if (!old) return;
  const rec = { ...old, title: c.title, type: c.type, language: c.language, content: c.content, updated: Date.now() }; await putPetalRec(rec);
  chatPetals = chatPetals.map(x => x.id === rec.id ? rec : x); if (view === "petals") renderPetalList();
}
async function syncOpenPetal() { if (Petals.isOpen()) await savePetalEdit(Petals.get()); }
function petalCtx() { // the open Petal (or the latest one) goes to the model, hand edits included
  const p = chatPetals.find(x => x.id === petalId) || chatPetals[0]; return p ? { id: p.id, title: p.title, type: p.type, language: p.language, content: p.content.slice(0, 40000) } : null;
}
async function applyPetals(cid, list) { // the model's Petals: a known id replaces that Petal, anything else is a new one
  const have = await petalsOf(cid), refs = []; let last = null;
  for (const p of list) {
    const old = p.id && have.find(x => x.id === p.id), now = Date.now();
    const rec = { id: old ? old.id : uid(), chatId: cid, title: String(p.title || "Petal").slice(0, 80), type: p.type, language: p.language || "", content: String(p.content ?? ""), created: old?.created || now, updated: now, rev: (old?.rev || 0) + 1 };
    await putPetalRec(rec); refs.push({ id: rec.id, title: rec.title, type: rec.type, language: rec.language }); last = rec;
  }
  return { refs, last };
}
function petalCard(ref) { // the card inside a message
  const c = el("div", "docc"), h = el("div", "dh"), b = el("div", "dbs"), x = el("button", "dbtn p", T("openP", "Open")), d = el("button", "dbtn", T("download", "Download"));
  const t = el("span", "pt"); t.append(el("b", "", ref.title), el("small", "", petalTag(ref))); h.append(svg("petal"), t);
  const load = async () => { let p = chatPetals.find(q => q.id === ref.id) || await getPetal(ref.id); if (!p && ref.legacy) { const cid = await ensureChat(); p = { id: ref.id, chatId: cid, title: ref.title, type: ref.legacy.type || "html", language: ref.legacy.language || "", content: String(ref.legacy.content ?? ""), created: Date.now(), updated: Date.now(), rev: 1 }; await putPetalRec(p); chatPetals = await petalsOf(cid); } return p; };
  x.onclick = async () => { const p = await load(); p ? openPetal(p) : toast(T("petalGone", "This Petal was deleted")); };
  d.onclick = async () => { const p = await load(); p ? saveBlob(petalName(p), petalMime(p), p.content) : toast(T("petalGone", "This Petal was deleted")); };
  b.append(x, d); c.append(h, b); return c;
}
/* ---- Python runs made by the model: code, output, charts ---- */
function runCard(r) {
  const c = el("div", "runc"), h = el("div", "runh"), pre = el("pre", "runcode"), code = el("code", "language-python"); code.textContent = r.code || "";
  const cp = el("button", "act", T("copy", "Copy")); cp.onclick = () => copyText(r.code || ""); cp.style.marginLeft = "auto";
  h.append(svg("code"), el("b", "", T("ranPy", "Python")), el("span", "runb" + (r.ok ? "" : " bad"), r.ok ? "OK" : T("ranFail", "Error")), cp); pre.append(code); try { hljs.highlightElement(code); } catch {}
  const out = el("pre", "runout" + (r.ok ? "" : " bad")); out.textContent = (r.output || "").trim() || T("noOut", "(no output)"); c.append(h, pre, out);
  (r.imgs || []).forEach(im => { const i = el("img", "runimg"); i.src = URL.createObjectURL(im.blob); i.alt = "Chart"; c.append(i); });
  return c;
}
/* ---- Q&A: Orenis asks a few quick questions when a request is unclear ---- */
function askCard(m) {
  const a = m.ask, box = el("div", "askc"), sel = a.questions.map(() => new Set()), oth = [];
  if (a.answered) { box.classList.add("done"); const h = el("div", "askh"); h.append(svg("check"), T("askDone", "Answered")); box.append(h, el("div", "askans", a.answered)); return box; }
  const go = el("button", "btn p", T("askGo", "Continue")), skip = el("button", "btn", T("askSkip", "Decide for me")), paint = () => { box.querySelectorAll(".aopt").forEach(b => b.classList.toggle("on", sel[b._q].has(b._o))); go.disabled = !a.questions.some((q, i) => sel[i].size || oth[i].value.trim()); };
  a.questions.forEach((q, qi) => {
    const blk = el("div", "aq"), row = el("div", "aopts"), inp = el("input", "aother"); oth[qi] = inp; blk.append(el("b", "", q.question));
    q.options.forEach(o => { const b = el("button", "aopt", o); b.type = "button"; b._q = qi; b._o = o; b.setAttribute("aria-pressed", "false"); b.onclick = () => { if (q.multi) { sel[qi].has(o) ? sel[qi].delete(o) : sel[qi].add(o); } else { sel[qi].has(o) ? sel[qi].delete(o) : (sel[qi].clear(), sel[qi].add(o), inp.value = ""); } paint(); }; row.append(b); });
    inp.placeholder = T("askOther", "Something else…"); inp.maxLength = 200; inp.oninput = () => { if (!q.multi && inp.value) sel[qi].clear(); paint(); }; blk.append(row, inp); box.append(blk);
  });
  const acts = el("div", "askact"); acts.append(go, skip); box.append(acts); paint();
  const reply = async text => { if (busy || !gate()) return; m.ask = { ...a, answered: text }; await tx("messages", "readwrite", o => o.put(m)); box.replaceWith(askCard(m)); submit(text, [], false, null); };
  go.onclick = () => reply(a.questions.map((q, i) => { const v = [...sel[i]]; if (oth[i].value.trim()) v.push(oth[i].value.trim()); return `${q.question} → ${v.length ? v.join(", ") : T("askSkip", "Decide for me")}`; }).join("\n"));
  skip.onclick = () => reply(T("askSkip", "Decide for me") + ".");
  return box;
}
/* ---- picking a Petal to attach to the next message ---- */
async function openPicker() {
  const box = $("#pickList"); box.innerHTML = ""; const [ps, chats] = await Promise.all([allPetals(), allChats()]), cm = new Map(chats.map(c => [c.id, c])), list = ps.filter(p => cm.has(p.chatId));
  if (!list.length) box.append(emptyState(T("noPetals", "No Petals yet"), T("noPetalsD", "When Orenis makes a page, document or code file for you, it shows up here."), T("makePetal", "Make a Petal"), () => { hide("#pickModal"); startPetalChat(); }));
  list.forEach(p => { const b = el("button", "pickrow"), t = el("span", "pt"); b.type = "button"; t.append(el("b", "", p.title), el("small", "", petalTag(p) + " · " + cm.get(p.chatId).title)); b.append(svg(petalIcon(p)), t); if (pending.some(f => f.petalId === p.id)) { const k = svg("check"); k.style.marginLeft = "auto"; b.append(k); } b.onclick = () => { attachPetal(p); hide("#pickModal"); }; box.append(b); });
  show("#pickModal");
}
function attachPetal(p) {
  if (pending.some(f => f.petalId === p.id)) return; if (pending.length >= MAXF) return toast(T("maxf", "Up to {n} files per message", { n: MAXF }));
  const f = new File([p.content], petalName(p), { type: "text/plain" }); f.petalId = p.id; pending.push(f); renderTray(); $("#input").focus();
}
async function startPetalChat() { await openChat(null); activeSkill = "petal"; renderTray(); $("#input").focus(); }
$("#pickX").onclick = () => hide("#pickModal"); $("#pickModal").addEventListener("pointerdown", e => { if (e.target.id === "pickModal") hide("#pickModal"); });
/* ---- sidebar: Chats | Petals ---- */
function setView(v) {
  view = v; $("#tabChats").classList.toggle("on", v === "chats"); $("#tabPetals").classList.toggle("on", v === "petals"); $("#tabChats").setAttribute("aria-selected", v === "chats"); $("#tabPetals").setAttribute("aria-selected", v === "petals");
  $("#list").hidden = v !== "chats"; $("#plist").hidden = v !== "petals"; const ph = v === "chats" ? T("search", "Search chats") : T("searchP", "Search Petals"); $("#sq").placeholder = ph; $("#sq").setAttribute("aria-label", ph);
  if (db) v === "chats" ? renderList() : renderPetalList();
}
$("#tabChats").onclick = () => setView("chats"); $("#tabPetals").onclick = () => setView("petals");
const petalMenu = (p, x, y) => showCtx([
  { icon: "petal", label: T("openP", "Open"), fn: () => openChatPetal(p) },
  { icon: "download", label: T("download", "Download"), fn: () => saveBlob(petalName(p), petalMime(p), p.content) },
  { icon: "edit", label: T("renameChat", "Rename"), fn: () => startRenamePetal(p) },
  { icon: "trash", label: T("del", "Delete"), danger: true, fn: () => delPetalAsk(p) }], x, y);
async function openChatPetal(p) { if (chatId !== p.chatId) await openChat(p.chatId); openPetal(chatPetals.find(x => x.id === p.id) || p); closeSide(); }
async function delPetalAsk(p) { if (!(await ask(T("delqP", 'Delete "{t}"?', { t: p.title })))) return; await delPetalRec(p.id); if (petalId === p.id) Petals.close(); if (p.chatId === chatId) { chatPetals = await petalsOf(chatId); $("#cvBtn").hidden = !chatPetals.length; } renderPetalList(); }
function startRenamePetal(p) {
  const b = $(`.prow[data-pid="${p.id}"] .pt b`); if (!b) return; const i = el("input", "edt"); i.value = p.title; b.replaceWith(i); i.focus(); i.select(); let done = false;
  const end = async ok => { if (done) return; done = true; const t = i.value.trim().slice(0, 80); if (ok && t) { const rec = { ...(await getPetal(p.id)), title: t, updated: Date.now() }; await putPetalRec(rec); chatPetals = chatPetals.map(x => x.id === rec.id ? rec : x); if (petalId === rec.id && Petals.isOpen()) Petals.update({ ...rec, content: Petals.get().content }); } renderPetalList(); };
  i.onkeydown = e => { if (e.key === "Enter") end(true); if (e.key === "Escape") end(false); }; i.onblur = () => end(true);
}
function petalRow(p, chat) {
  const r = el("div", "row prow" + (p.id === petalId ? " on" : "")), b = el("button", "tt"), t = el("span", "pt"), m = el("button"); r.dataset.pid = p.id;
  t.append(el("b", "", p.title), el("small", "", petalTag(p) + " · " + chat.title)); b.append(svg(petalIcon(p)), t); m.append(svg("dots")); m.setAttribute("aria-label", T("menu", "Options"));
  b.onclick = () => openChatPetal(p); m.onclick = () => { const k = m.getBoundingClientRect(); petalMenu(p, k.left, k.bottom + 4); };
  r.oncontextmenu = e => { e.preventDefault(); petalMenu(p, e.clientX, e.clientY); }; let tm; r.ontouchstart = e => { tm = setTimeout(() => { const q = e.touches[0]; petalMenu(p, q.clientX, q.clientY); }, 520); }; r.ontouchend = r.ontouchmove = () => clearTimeout(tm);
  r.append(b, m); return r;
}
async function renderPetalList() {
  const box = $("#plist"), q = $("#sq").value.trim().toLowerCase(); const [ps, chats] = await Promise.all([allPetals(), allChats()]), cm = new Map(chats.map(c => [c.id, c])); box.innerHTML = "";
  const list = ps.filter(p => cm.has(p.chatId) && (!q || p.title.toLowerCase().includes(q)));
  if (!list.length) return void box.append(q ? emptyState(T("noMatchP", "No Petals match"), "", T("clearSearch", "Clear search"), () => { $("#sq").value = ""; renderPetalList(); }) : emptyState(T("noPetals", "No Petals yet"), T("noPetalsD", "When Orenis makes a page, document or code file for you, it shows up here."), T("makePetal", "Make a Petal"), () => { startPetalChat(); closeSide(); }));
  let last = ""; for (const p of list) { const g = grp(p.updated); if (g !== last) { box.append(el("div", "lbl", g)); last = g; } box.append(petalRow(p, cm.get(p.chatId))); }
}
/* ---- Selectable cards (language, theme) instead of a dropdown ---- */
function renderOpts() {
  const lb = $("#langOpts"); lb.innerHTML = "";
  [["en", "English", "EN"], ["ko", "한국어", "KO"], ["es", "Español", "ES"]].forEach(([id, name, code]) => { const b = el("button", "opt" + (lang === id ? " on" : "")); b.setAttribute("role", "radio"); b.setAttribute("aria-checked", lang === id); b.append(el("span", "optc", code), el("b", "", name)); b.onclick = () => { $("#lang").value = id; $("#lang").dispatchEvent(new Event("change")); }; lb.append(b); });
  const tb = $("#themeOpts"), cur = document.documentElement.dataset.theme; tb.innerHTML = "";
  [["light", "sun", T("thLight", "Light")], ["dark", "moon", T("thDark", "Dark")]].forEach(([id, ico, name]) => { const b = el("button", "opt" + (cur === id ? " on" : "")), c = el("span", "optc"); c.append(svg(ico)); b.setAttribute("role", "radio"); b.setAttribute("aria-checked", cur === id); b.append(c, el("b", "", name)); b.onclick = () => setTheme(id); tb.append(b); });
}
function renderPrev() { // the mode form previews the card it will become
  const box = $("#mPrev"); box.innerHTML = ""; const b = el("div", "mcard on");
  b.append(svg("sparkle"), el("b", "", $("#mName").value.trim() || T("yourMode", "Your mode")), el("span", "", $("#mIns").value.trim().slice(0, 70) || T("yourModeD", "What it does appears here."))); box.append(b);
}
function openSettings(tab = "gen") {
  renderUsage(); renderFacts(); renderModesList(); renderOpts(); renderPrev(); $("#nameEdit").value = ls("orenis_name") || "";
  document.querySelectorAll(".tab").forEach(x => x.classList.toggle("on", x.dataset.tab === tab)); document.querySelectorAll(".pane").forEach(x => x.classList.toggle("on", x.dataset.pane === tab));
  $("#setModal").classList.add("on"); closeSide();
}
$("#cvBtn").onclick = () => { if (Petals.isOpen()) Petals.close(); else if (chatPetals.length) openPetal(chatPetals[0]); };
$("#mName").addEventListener("input", renderPrev); $("#mIns").addEventListener("input", renderPrev);
$("#modeBtn").onclick = e => { const r = e.currentTarget.getBoundingClientRect(); showCtx([...allModes().map(m => ({ icon: m.icon, label: modeName(m), desc: modeDesc(m), on: m.id === curMode, fn: () => setMode(m.id) })), { icon: "sliders", label: T("manageModes", "Manage modes…"), fn: () => openSettings("modes") }], r.left, r.bottom + 6); };
$("#factAdd").onclick = () => { if (addFact($("#factIn").value)) $("#factIn").value = ""; };
$("#factIn").addEventListener("keydown", e => { if (e.key === "Enter") $("#factAdd").click(); });
$("#factsClear").onclick = () => { setFacts([]); renderFacts(); };
$("#mAdd").onclick = () => {
  const name = $("#mName").value.trim(), ins = $("#mIns").value.trim(); if (!name || !ins) return;
  const a = customModes(), id = "c" + Date.now(); a.push({ id, name: name.slice(0, 30), ins: ins.slice(0, 1200) }); ls("orenis_modes", JSON.stringify(a));
  $("#mName").value = $("#mIns").value = ""; renderModesList(); if ($("#stage").classList.contains("empty")) welcome(); toast(T("saved", "Saved"));
};
/* Backup: chats (text only) plus your instructions, memories and custom modes */
$("#exportAll").onclick = async () => {
  const data = { v: 1, at: Date.now(), settings: { instr: ls("orenis_instr") || "", facts: getFacts(), modes: customModes() }, chats: [], petals: await allPetals() };
  for (const c of await allChats()) data.chats.push({ ...c, messages: (await msgsOf(c.id)).map(({ id, files, imgs, runs, ...m }) => ({ ...m, runs: (runs || []).map(({ imgs: _i, ...r }) => r), files: (files || []).map(f => ({ name: f.name })) })) });
  saveBlob(`orenis-backup-${new Date().toISOString().slice(0, 10)}.json`, "application/json", JSON.stringify(data)); toast(T("exported", "Chat exported"));
};
$("#importAll").onclick = () => $("#impFile").click();
$("#impFile").onchange = async e => {
  const f = e.target.files[0]; e.target.value = ""; if (!f) return;
  try {
    const d = JSON.parse(await f.text()); if (!Array.isArray(d.chats)) throw 0; const have = new Set((await allChats()).map(c => c.id)); let n = 0;
    for (const c of d.chats) { if (!c.id || have.has(c.id)) continue; const { messages = [], ...ch } = c; await tx("chats", "readwrite", o => o.put(ch)); for (const m of messages) await tx("messages", "readwrite", o => o.add({ ...m, chatId: c.id })); n++; }
    const st = d.settings || {}; if (st.instr && !ls("orenis_instr")) { ls("orenis_instr", st.instr); $("#instr").value = st.instr; } (st.facts || []).forEach(addFact);
    if (Array.isArray(st.modes)) { const cur = customModes(); st.modes.forEach(m => { if (m.id && m.name && !cur.some(x => x.id === m.id)) cur.push(m); }); ls("orenis_modes", JSON.stringify(cur)); renderModesList(); }
    for (const p of d.petals || []) if (p.id && p.chatId && !have.has(p.chatId) && d.chats.some(c => c.id === p.chatId)) await putPetalRec(p);
    renderList(); toast(T("imported", "Imported {n} chats", { n }));
  } catch { toast(T("badFile", "That file isn't an Orenis backup")); }
};
function deepLink() { // chat.html?q=...&skill=research&mode=study pre-fills the composer (used by the landing page)
  const u = new URLSearchParams(location.search); if (![...u.keys()].length) return;
  if (u.get("mode") && allModes().some(m => m.id === u.get("mode"))) { setMode(u.get("mode"), false); welcome(); }
  if (SK.some(k => k[0] === u.get("skill"))) activeSkill = u.get("skill");
  if (u.get("q")) { $("#input").value = u.get("q").slice(0, 2000); autosize(); }
  renderTray(); history.replaceState(null, "", location.pathname);
}
$("#testConn").onclick = async () => { // diagnoses "can't connect": reachability, then whether streamed steps arrive live on this network
  const out = $("#connOut"), t0 = Date.now(); out.textContent = T("testing", "Testing…");
  const post = b => fetch(PROXY_ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b) });
  try {
    const d = await (await post({ task: "ping" })).json(); if (!d.ok) throw new Error("bad response"); const ms = Date.now() - t0; let live = false;
    try { const t1 = Date.now(), s = await post({ task: "ping", stream: true }), rd = s.body.getReader(), dec = new TextDecoder(); let tf = 0, txt = ""; for (;;) { const { value, done } = await rd.read(); if (done) break; if (!tf) tf = Date.now(); txt += dec.decode(value, { stream: true }); } live = /"done"/.test(txt) && tf - t1 < 1200; } catch {}
    out.textContent = T("connOk", "Connected ({ms} ms).", { ms }) + " " + (live ? T("liveOk", "Live steps work.") : T("liveBad", "Live steps are blocked or buffered on this network; turn them off in General."));
  } catch (e) { out.textContent = T("connFail", "Can't reach the server ({e}). Check your connection, VPN or ad blocker.", { e: e.message || e.name }); }
};
$("#sq").oninput = () => view === "chats" ? renderList() : renderPetalList(); $("#jump").onclick = () => scroll();
$("#export").onclick = async () => {
  const ms = await msgsOf(chatId), c = (await allChats()).find(x => x.id === chatId), name = ls("orenis_name") || "You";
  const out = `# ${c?.title || "Orenis"}\n\n` + ms.map(m => `**${m.role === "user" ? name : "Orenis"}:**\n\n${m.text}${m.files?.length ? "\n\n_Attachments: " + m.files.map(f => f.name).join(", ") + "_" : ""}`).join("\n\n---\n\n");
  const a = el("a"); a.href = URL.createObjectURL(new Blob([out], { type: "text/markdown" })); a.download = (c?.title || "orenis").replace(/[^\p{L}\p{N}]+/gu, "-").slice(0, 40) + ".md"; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1500); toast(T("exported", "Chat exported"));
};
const SR = window.SpeechRecognition || window.webkitSpeechRecognition; let rec = null;
if (SR) { $("#mic").hidden = false; $("#mic").onclick = () => {
  if (rec) return rec.stop();
  rec = new SR(); rec.lang = { en: "en-US", ko: "ko-KR", es: "es-PE" }[lang]; rec.interimResults = true; rec.continuous = true; const base = $("#input").value;
  rec.onresult = e => { $("#input").value = (base ? base + " " : "") + [...e.results].map(r => r[0].transcript).join(""); autosize(); updSend(); };
  rec.onend = () => { rec = null; $("#mic").classList.remove("on"); }; rec.onerror = () => rec && rec.stop(); rec.start(); $("#mic").classList.add("on");
}; }
addEventListener("keydown", e => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); openChat(null); $("#input").focus(); }
  else if (e.key === "/" && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) { e.preventDefault(); $("#input").focus(); }
});
if (window.visualViewport) visualViewport.addEventListener("resize", () => { // keep the composer above the iOS keyboard
  const kb = innerHeight - visualViewport.height > 120 && mobile(); document.querySelector(".app").style.height = kb ? visualViewport.height + "px" : ""; if (kb) scrollTo(0, 0);
});
(async () => {
  setTheme(document.documentElement.dataset.theme); setName(); applyLang(); setView("chats"); $("#memTog").checked = ls("orenis_mem") === "1";
  let waited = 0; const wait = () => { feed.innerHTML = ""; welcome(); banner(T("eBlocked", "Orenis is updating its storage. Close your other Orenis tabs and this page will continue by itself.")); };
  addEventListener("orenis-db-blocked", wait, { once: true }); waited = setTimeout(wait, 2500);
  try { db = await openDB(); clearTimeout(waited); } catch { clearTimeout(waited); welcome(); return banner(T("eStore", "Local storage is unavailable in this browser, so chats can't be saved.")); }
  await openChat(null);
  deepLink();
  if (!ls("orenis_name")) show("#nameModal"); else if (!ls("orenis_plan")) show("#planModal");
})();
