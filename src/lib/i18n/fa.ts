export const fa = {
  appName: "موتور داده",
  tagline: "فایل‌های مستقل ← vector store یکپارچه ← یک API جستجو با citation",

  nav: {
    overview: "نمای کلی",
    upload: "بارگذاری",
    files: "فایل‌ها",
    review: "بازبینی",
    search: "آزمایش RAG",
    export: "خروجی (اختیاری)",
  },

  home: {
    title: "پروژه‌ها",
    noProjects: "هنوز پروژه‌ای ندارید. یک پروژه بسازید تا شروع کنید.",
    dbNotReady: "پایگاه داده آماده نیست",
    dbHint: "docker compose up -d && npx prisma migrate deploy",
    files: "فایل",
  },

  project: {
    documentSubtitle:
      "هر فایل جداگانه پردازش می‌شود؛ همه در یک vector store یکپارچه ایندکس می‌شوند. مشتری با یک API جستجو، نتیجهٔ دقیق با citation می‌گیرد.",
    upload: "بارگذاری",
    addFile: "افزودن فایل",
    openFiles: "فایل‌ها",
    openSearch: "آزمایش RAG",
    filesTitle: "اسناد پروژه",
    filesHint:
      "پردازش مستقل هر سند — ذخیره و تعبیه در محیط یکپارچه با متادیتای غنی",
    pipelineDetail: "جزئیات فنی",
    stats: {
      files: "فایل‌ها",
      indexed: "آماده بازیابی",
      chunks: "چانک‌ها",
      embeddings: "بردارها",
    },
    pipeline: "وضعیت پایپ‌لاین",
    parsing: "در حال پارس",
    parsed: "پارس‌شده",
    failed: "ناموفق",
    reviewed: "بازبینی‌شده",
    needsReview: "نیاز به بازبینی",
    excludedChunks: "چانک حذف‌شده",
    inspectPipeline: "بازرسی پایپ‌لاین",
  },

  pipelineStages: {
    overview: "نمای کلی",
    files: "بارگذاری",
    parse: "پارس",
    chunk: "چانک",
    embed: "تعبیه",
    qc: "کنترل کیفیت",
    vectorStore: "vector store",
    jobs: "کارها",
    export: "خروجی",
    loading: "در حال بارگذاری…",
    result: "نتیجه JSON",
    openApi: "باز کردن API",
    selectFile: "انتخاب سند",
    noFiles: "هنوز سندی بارگذاری نشده.",
    perFileScope: "نتایج پایپ‌لاین برای سند انتخاب‌شده",
    unifiedSearchNote:
      "API اسناد (جستجو) روی همهٔ اسناد پروژه یکپارچه است و با هر بارگذاری جدید به‌روز می‌شود.",
  },

  projectType: {
    DOCUMENT: "سند / PDF",
  } as Record<string, string>,

  fileStatus: {
    UPLOADED: "بارگذاری‌شده",
    PARSING: "در حال پارس",
    PARSED: "پارس‌شده",
    FAILED: "خطا",
    NEEDS_REVIEW: "نیاز به بازبینی",
    REVIEWED: "بازبینی‌شده",
    INDEXED: "ایندکس‌شده",
  } as Record<string, string>,

  jobType: {
    PARSE: "پارس",
    CHUNK_EMBED: "چانک و تعبیه",
    QC: "کنترل کیفیت",
    EXPORT: "خروجی",
  } as Record<string, string>,

  jobStatus: {
    PENDING: "در صف",
    RUNNING: "در حال اجرا",
    COMPLETED: "تمام شد",
    FAILED: "خطا",
    CANCELLED: "لغو شد",
  } as Record<string, string>,

  createProject: {
    title: "پروژه جدید",
    namePlaceholder: "نام پروژه",
    descriptionPlaceholder: "توضیحات (مثلاً دامنه حقوقی، قراردادها، …)",
    creating: "در حال ساخت…",
    create: "ساخت پروژه",
    documentOnly: "پروژه‌های سند (PDF) — پارس، بازبینی، جستجو و خروجی RAG",
  },

  jobs: {
    title: "کارهای پس‌زمینه",
  },

  upload: {
    title: "بارگذاری",
    documentDesc:
      "PDF بارگذاری کنید. سند به متن ساخت‌یافته تبدیل می‌شود، سپس چانک و تعبیه خودکار اجرا می‌شود.",
    documentHint: "تکراری‌های دقیق رد می‌شوند. پس از بارگذاری، پارس خودکار شروع می‌شود.",
    dropPdf: "PDF را بکشید یا کلیک کنید (چند فایل)",
    uploading: "در حال بارگذاری…",
    summary: "خلاصه بارگذاری",
    accepted: "پذیرفته‌شده",
    duplicates: "تکراری",
    rejected: "رد شده",
    uploadFailed: "بارگذاری ناموفق",
    existingFiles: "فایل‌های بارگذاری‌شده",
    duplicateHint:
      "فایل تکراری است. از لیست زیر «حذف فایل» را بزنید، سپس دوباره بارگذاری کنید.",
  },

  files: {
    title: "فایل‌ها",
    desc: "هر فایل پایپ‌لاین خودش را دارد؛ همه در یک store برای RAG مشترک‌اند.",
    empty: "هنوز فایلی بارگذاری نشده. با «افزودن فایل» شروع کنید.",
    pages: "صفحه",
    chunks: "چانک",
    openReview: "بازبینی",
    openPdf: "PDF",
    reparse: "پارس مجدد",
    rechunk: "چانک مجدد",
    markReviewed: "علامت بازبینی",
    delete: "حذف فایل",
    confirmDelete: "این فایل و تمام چانک‌ها و بردارهایش حذف شود؟ می‌توانید دوباره بارگذاری کنید.",
    deleting: "در حال حذف…",
    deleted: "فایل حذف شد",
  },

  review: {
    title: "بازبینی",
    desc: "متن چانک‌ها را اصلاح یا حذف کنید تا دادهٔ RAG قابل اعتماد بماند.",
    selectFile: "انتخاب فایل",
    noFile: "فایلی برای بازبینی نیست.",
    noChunks: "هنوز چانکی ساخته نشده. منتظر اتمام پارس/چانک بمانید.",
    page: "صفحه",
    save: "ذخیره",
    exclude: "حذف از ایندکس",
    restore: "بازگردانی",
    markReviewed: "اتمام بازبینی فایل",
    rechunk: "بازسازی چانک‌ها",
    parsePreview: "پیش‌نمایش پارس",
    chunks: "چانک‌ها",
    qcReport: "گزارش کنترل کیفیت",
    qcScore: "امتیاز",
    qcVerdict: "نتیجه",
    qcCoverage: "پوشش",
    qcNoReport: "هنوز گزارش QC ساخته نشده.",
    saving: "در حال ذخیره…",
    saved: "ذخیره شد",
    delete: "حذف فایل",
    confirmDelete: "این فایل و تمام داده‌های پردازش‌شده حذف شود؟",
  },

  delivery: {
    title: "API بازیابی (قلب محصول)",
    desc: "همهٔ اسناد پروژه در یک vector store — یک endpoint برای مشتری. نتایج ranked با file_id، صفحه و citation.",
    storeInfo: "اطلاعات vector store",
    search: "جستجوی معنایی با citation",
    chunks: "چانک فعال",
    embeddings: "بردار",
    indexedFiles: "فایل آماده",
    copyUrl: "کپی URL",
    trySearch: "آزمایش در UI",
    exportNote:
      "خروجی JSONL فقط برای توسعه است؛ تحویل production همان API جستجو است.",
  },

  search: {
    title: "آزمایش RAG",
    desc: "همان API که به مشتری می‌دهید — نتایج با citation: فایل، صفحه، score و شناسه‌ها.",
    placeholder: "مثلاً شرایط فسخ قرارداد چیست؟",
    run: "جستجو",
    searching: "در حال جستجو…",
    empty: "هنوز نتیجه‌ای نیست.",
    score: "امتیاز",
    page: "صفحه",
    citation: "استناد",
    fileId: "file_id",
    noEmbeddings: "ابتدا فایل بارگذاری و ایندکس کنید.",
  },

  export: {
    title: "خروجی اختیاری",
    desc: "فقط برای توسعه یا مهاجرت — در production از API بازیابی زنده استفاده کنید.",
    ragDesc: "هر خط یک چانک با متن، file_id، صفحه و متادیتا.",
    create: "ساخت خروجی",
    includeEmb: "شامل بردارهای تعبیه",
    includeExcluded: "شامل چانک‌های حذف‌شده",
    exporting: "در حال خروجی…",
    export: "خروجی",
    exportFailed: "خروجی ناموفق",
    history: "تاریخچه",
    noExports: "هنوز خروجی‌ای ساخته نشده.",
    items: "چانک",
    download: "دانلود",
  },

  errors: {
    failed: "ناموفق",
    dbUnavailable:
      "پایگاه داده در دسترس نیست. Postgres را با docker compose up -d اجرا کنید.",
  },
} as const;

export function fileStatusLabel(status: string) {
  return fa.fileStatus[status] ?? status;
}

export function jobTypeLabel(type: string) {
  return fa.jobType[type] ?? type;
}

export function jobStatusLabel(status: string) {
  return fa.jobStatus[status] ?? status;
}

export function formatFaDate(date: Date | string) {
  return new Date(date).toLocaleDateString("fa-IR");
}

export function formatFaDateTime(date: Date | string) {
  return new Date(date).toLocaleString("fa-IR");
}
