export const fa = {
  appName: "موتور داده",
  tagline: "PDF ← پارس ← ایندکس برداری ← بازیابی زنده از API",

  nav: {
    overview: "نمای کلی",
    upload: "بارگذاری",
    files: "فایل‌ها",
    review: "بازبینی",
    search: "API اسناد",
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
      "زیرساخت سند برای RAG — چانک‌ها در vector store می‌مانند و در زمان پرس‌وجو از API بازیابی می‌شوند",
    upload: "بارگذاری",
    openFiles: "فایل‌ها",
    openSearch: "API اسناد",
    stats: {
      files: "فایل‌ها",
      indexed: "ایندکس‌شده",
      chunks: "چانک‌ها",
      embeddings: "بردارها",
    },
    pipeline: "وضعیت پایپ‌لاین",
    parsing: "در حال پارس",
    parsed: "پارس‌شده",
    failed: "ناموفق",
    reviewed: "بازبینی‌شده",
    excludedChunks: "چانک حذف‌شده",
    inspectPipeline: "بازرسی JSON پایپ‌لاین",
  },

  pipelineStages: {
    overview: "نمای کلی",
    files: "بارگذاری",
    parse: "پارس",
    chunk: "چانک",
    embed: "تعبیه",
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
    REVIEWED: "بازبینی‌شده",
    INDEXED: "ایندکس‌شده",
  } as Record<string, string>,

  jobType: {
    PARSE: "پارس",
    CHUNK_EMBED: "چانک و تعبیه",
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
    desc: "وضعیت پارس و ایندکس هر فایل.",
    empty: "هنوز فایلی بارگذاری نشده.",
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
    saving: "در حال ذخیره…",
    saved: "ذخیره شد",
    delete: "حذف فایل",
    confirmDelete: "این فایل و تمام داده‌های پردازش‌شده حذف شود؟",
  },

  delivery: {
    title: "تحویل از طریق API",
    desc: "مثل Scale Dex — داده در vector store پلتفرم می‌ماند و در زمان پرس‌وجو از API برمی‌گردد (نه فایل نهایی).",
    storeInfo: "اطلاعات vector store",
    search: "جستجوی معنایی (تحویل اصلی)",
    chunks: "چانک فعال",
    embeddings: "بردار",
    indexedFiles: "فایل ایندکس‌شده",
    copyUrl: "کپی URL",
    exportNote:
      "خروجی JSONL فقط برای توسعه/پشتیبان است؛ مسیر اصلی تحویل همان API بازیابی است.",
  },

  search: {
    title: "API اسناد",
    desc: "همان endpoint تحویل Dex-style — POST به vector-store/search؛ چانک‌های ranked با score، file_id و parse_result_id.",
    placeholder: "مثلاً شرایط فسخ قرارداد چیست؟",
    run: "جستجو",
    searching: "در حال جستجو…",
    empty: "هنوز نتیجه‌ای نیست.",
    score: "امتیاز",
    page: "صفحه",
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
