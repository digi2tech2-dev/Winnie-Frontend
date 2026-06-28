import { useLocation } from "react-router-dom";
import { iconMap } from "../../components/icons";
import { adminStats, adminTables, notifications, orders, walletTransactions } from "../../data/catalog";

const toolConfig = {
  dashboard: {
    title: "لوحة أدوات الأدمن",
    subtitle: "مركز مختصر لمتابعة المستخدمين والطلبات والإيرادات وحالة المنصة.",
    icon: "Gauge",
  },
  users: {
    title: "إدارة المستخدمين",
    subtitle: "متابعة الحسابات، الحالة، الرصيد، وبيانات التواصل.",
    icon: "Users",
  },
  orders: {
    title: "إدارة الطلبات",
    subtitle: "مراجعة الطلبات الحالية وحالات التسليم والتنفيذ.",
    icon: "ClipboardList",
  },
  products: {
    title: "إدارة المنتجات",
    subtitle: "مراجعة المنتجات والهوامش وحالة الإتاحة.",
    icon: "ShoppingBag",
  },
  categories: {
    title: "إدارة الأقسام",
    subtitle: "تنظيم الأقسام وعدد المنتجات والمسؤولين عنها.",
    icon: "ListChecks",
  },
  wallet: {
    title: "تقارير المحفظة",
    subtitle: "حركة الرصيد، الإيداعات، الطلبات، والاستردادات.",
    icon: "WalletCards",
  },
  notifications: {
    title: "مركز الإشعارات",
    subtitle: "مراجعة رسائل النظام والتنبيهات المهمة.",
    icon: "Bell",
  },
  settings: {
    title: "إعدادات النظام",
    subtitle: "خيارات مؤقتة لإدارة صلاحيات الأدمن وسلوك الواجهة.",
    icon: "Settings",
  },
  about: {
    title: "صفحة الشركة",
    subtitle: "ملخص بيانات الظهور والمحتوى المؤسسي داخل المنصة.",
    icon: "Building2",
  },
};

const tableData = {
  users: {
    columns: ["الاسم", "البريد", "الحالة", "الرصيد"],
    rows: adminTables.users.map((item) => [item.name, item.email, item.status, item.balance]),
  },
  orders: {
    columns: ["الطلب", "المنتج", "الحالة", "القيمة"],
    rows: orders.map((item) => [item.id, item.product, item.status, item.price]),
  },
  products: {
    columns: ["المنتج", "القسم", "الحالة", "الهامش"],
    rows: adminTables.products.map((item) => [item.name, item.category, item.status, item.margin]),
  },
  categories: {
    columns: ["القسم", "المنتجات", "الحالة", "المسؤول"],
    rows: adminTables.categories.map((item) => [item.name, item.products, item.status, item.owner]),
  },
  wallet: {
    columns: ["المعاملة", "النوع", "القيمة", "التاريخ"],
    rows: walletTransactions.map((item) => [item.id, item.type, item.amount, item.date]),
  },
  notifications: {
    columns: ["العنوان", "النوع", "المستوى", "الوقت"],
    rows: notifications.map((item) => [item.title, item.type, item.level, item.time]),
  },
  settings: {
    columns: ["الإعداد", "الحالة", "الملاحظة", "النوع"],
    rows: [
      ["حماية أدوات الأدمن", "مفعلة", "رمز PIN المؤقت 1111", "واجهة"],
      ["عزل صفحات المستخدم", "مفعل", "/admin/user منفصل عن /admin/tools", "تنقل"],
      ["صلاحيات الأدمن", "مؤقتة", "ينبغي ربطها بالباك إند لاحقاً", "أمان"],
    ],
  },
  about: {
    columns: ["العنصر", "الحالة", "المسار", "الملاحظة"],
    rows: [
      ["من نحن", "متاح", "/admin/user/about", "معروض بنسخة المستخدم"],
      ["الروابط المهمة", "متاحة", "الفوتر", "مرتبطة حسب المسار الحالي"],
      ["هوية Winnie Fun", "نشطة", "كل الصفحات", "الشعار والألوان الأساسية"],
    ],
  },
};

const statTones = ["violet", "cyan", "emerald", "amber"];

export default function AdminToolsPage() {
  const location = useLocation();
  const sectionId = getSectionId(location.pathname);
  const config = toolConfig[sectionId] || toolConfig.dashboard;
  const Icon = iconMap[config.icon] || iconMap.Gauge;
  const table = tableData[sectionId] || tableData.users;

  return (
    <div dir="rtl" className="admin-tools-page">
      <section className="admin-tools-hero">
        <span className="admin-tools-hero-orb admin-tools-hero-orb-one" aria-hidden="true" />
        <span className="admin-tools-hero-orb admin-tools-hero-orb-two" aria-hidden="true" />
        <div className="admin-tools-hero-content">
          <span className="admin-tools-hero-icon">
            <Icon className="h-7 w-7" />
          </span>
          <div className="min-w-0">
            <div className="admin-tools-kicker-row">
              <p>Admin Control Center</p>
              <span><i /> النظام يعمل بكفاءة</span>
            </div>
            <h1>{config.title}</h1>
            <p className="admin-tools-subtitle">{config.subtitle}</p>
          </div>
        </div>
      </section>

      <section className="admin-tools-stats">
        {adminStats.map((item, index) => {
          const StatIcon = iconMap[item.icon] || iconMap.Activity;
          return (
            <article key={item.label} className={`admin-tools-stat admin-tools-stat-${statTones[index % statTones.length]}`}>
              <div className="admin-tools-stat-top">
                <span className="admin-tools-stat-icon">
                  <StatIcon className="h-5 w-5" />
                </span>
                <span className="admin-tools-stat-trend">مباشر</span>
              </div>
              <strong dir="ltr">{item.value}</strong>
              <p>{item.label}</p>
            </article>
          );
        })}
      </section>

      <section className="admin-tools-table-card">
        <div className="admin-tools-table-head">
          <div>
            <span className="admin-tools-table-head-icon"><Icon className="h-4.5 w-4.5" /></span>
            <div>
              <h2>{config.title}</h2>
              <p>نظرة سريعة على أحدث البيانات</p>
            </div>
          </div>
          <span className="admin-tools-count">{table.rows.length} عناصر</span>
        </div>
        <div className="admin-tools-table-scroll">
          <table>
            <thead>
              <tr>
                {table.columns.map((column) => (
                  <th key={column}>{column}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((row, rowIndex) => (
                <tr key={row.join("-")}>
                  {row.map((cell, cellIndex) => (
                    <td key={cell}>
                      {cellIndex === 0 && <span className={`admin-tools-row-dot admin-tools-row-dot-${statTones[rowIndex % statTones.length]}`} />}
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function getSectionId(pathname) {
  const sectionId = pathname.split("/").filter(Boolean).pop();
  return sectionId && sectionId !== "tools" ? sectionId : "dashboard";
}
