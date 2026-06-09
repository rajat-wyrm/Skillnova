import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { Card, SectionHeader } from "./UI";

const THEME_PROPS = {
  baseColor: "var(--skeleton-base)",
  highlightColor: "var(--skeleton-highlight)",
};

// Applies the app-wide skeleton color tokens so every page loader feels consistent.
const SkeletonFrame = ({ children }) => (
  <SkeletonTheme {...THEME_PROPS}>{children}</SkeletonTheme>
);

// Recreates the normal page header with a skeleton action area when a page has one.
const HeaderSkeleton = ({ title, subtitle, actionWidth = null }) => (
  <SectionHeader
    title={title}
    subtitle={subtitle}
    action={actionWidth ? <Skeleton height={40} width={actionWidth} borderRadius={12} /> : null}
  />
);

// Reusable chip row for summary pills, quick filters, and compact stat badges.
const PillRowSkeleton = ({ count = 4, widths = [] }) => (
  <div className="flex gap-3 flex-wrap">
    {Array.from({ length: count }).map((_, index) => (
      <Skeleton
        key={`${count}-${index}`}
        height={34}
        width={widths[index] || 108}
        borderRadius={999}
      />
    ))}
  </div>
);

// Mimics a search or search-plus-filter control row.
const SearchBarSkeleton = ({ compact = false, filterCount = 0 }) => (
  <div className={`flex ${filterCount ? "flex-col sm:flex-row" : ""} gap-3`}>
    <Skeleton height={compact ? 42 : 46} className="flex-1" borderRadius={12} />
    {filterCount ? (
      <div className="flex gap-2 flex-wrap">
        {Array.from({ length: filterCount }).map((_, index) => (
          <Skeleton key={`filter-${index}`} height={40} width={88} borderRadius={12} />
        ))}
      </div>
    ) : null}
  </div>
);

// Shared summary card grid used by dashboard, analytics, and management-style screens.
const StatGridSkeleton = ({ count = 4, subtitle = false }) => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
    {Array.from({ length: count }).map((_, index) => (
      <Card key={`stat-${index}`} className="p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <Skeleton height={14} width="62%" />
            <Skeleton height={30} width="44%" className="mt-3" />
            {subtitle ? <Skeleton height={12} width="52%" className="mt-4" /> : null}
          </div>
          <Skeleton height={44} width={44} borderRadius={12} />
        </div>
      </Card>
    ))}
  </div>
);

// Generic table shell used across management, reports, and knowledge admin views.
const TableSkeleton = ({ columns = 6, rows = 5 }) => (
  <Card className="overflow-hidden p-0">
    <div className="sn-table-scroll">
      <table className="w-full text-sm min-w-[44rem]">
        <thead>
          <tr style={{ background: "var(--bg)", borderBottom: "1px solid var(--border)" }}>
            {Array.from({ length: columns }).map((_, index) => (
              <th key={`head-${index}`} className="px-5 py-3 text-left">
                <Skeleton height={10} width="70%" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={`row-${rowIndex}`} style={{ borderBottom: "1px solid var(--border)" }}>
              {Array.from({ length: columns }).map((_, columnIndex) => (
                <td key={`cell-${rowIndex}-${columnIndex}`} className="px-5 py-4">
                  {columnIndex === 0 ? (
                    <div className="flex items-center gap-3">
                      <Skeleton circle height={34} width={34} />
                      <div className="flex-1">
                        <Skeleton height={12} width="55%" />
                        <Skeleton height={10} width="72%" className="mt-2" />
                      </div>
                    </div>
                  ) : columnIndex === columns - 1 ? (
                    <div className="flex items-center justify-center gap-2">
                      {Array.from({ length: 3 }).map((_, actionIndex) => (
                        <Skeleton
                          key={`action-${rowIndex}-${actionIndex}`}
                          height={32}
                          width={32}
                          borderRadius={10}
                        />
                      ))}
                    </div>
                  ) : (
                    <Skeleton height={12} width={columnIndex % 2 === 0 ? "60%" : "78%"} />
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </Card>
);

// Card list used by announcement feeds and report stacks.
const CardListSkeleton = ({ count = 3, showActions = true }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, index) => (
      <Card key={`list-${index}`} className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <Skeleton height={22} width={68} borderRadius={999} />
              <Skeleton height={22} width={84} borderRadius={999} />
            </div>
            <Skeleton height={18} width={index % 2 === 0 ? "52%" : "64%"} />
            <Skeleton count={2} className="mt-3" />
            <Skeleton height={11} width={110} className="mt-3" />
          </div>
          {showActions ? (
            <div className="flex gap-2 flex-shrink-0">
              <Skeleton height={34} width={34} borderRadius={10} />
              <Skeleton height={34} width={34} borderRadius={10} />
            </div>
          ) : null}
        </div>
      </Card>
    ))}
  </div>
);

// Compact grid for user-facing article cards.
const ArticleGridSkeleton = ({ count = 6 }) => (
  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
    {Array.from({ length: count }).map((_, index) => (
      <Card key={`article-${index}`} className="p-5 flex flex-col">
        <div className="flex items-start justify-between mb-4">
          <Skeleton height={36} width={36} borderRadius={12} />
          <Skeleton height={18} width={72} />
        </div>
        <Skeleton height={18} width={index % 2 === 0 ? "72%" : "58%"} />
        <Skeleton height={12} width="48%" className="mt-3" />
        <div className="flex gap-2 flex-wrap mt-4">
          {Array.from({ length: 3 }).map((_, tagIndex) => (
            <Skeleton key={`tag-${index}-${tagIndex}`} height={22} width={56} borderRadius={999} />
          ))}
        </div>
        <div className="mt-5 pt-4 flex items-center justify-between" style={{ borderTop: "1px solid var(--border)" }}>
          <Skeleton height={12} width={40} />
          <Skeleton height={12} width={40} />
          <Skeleton height={12} width={48} />
        </div>
      </Card>
    ))}
  </div>
);

// Reusable chart panel shell so data pages keep a believable structure while loading.
const ChartCardSkeleton = ({ titleWidth = 160, height = 220 }) => (
  <Card className="p-5">
    <Skeleton height={18} width={titleWidth} />
    <Skeleton height={height} className="mt-4" borderRadius={16} />
  </Card>
);

// Settings pages share stacked preference cards with short descriptions and controls.
const SettingsCardsSkeleton = ({ sectionCount = 4 }) => (
  <div className="space-y-4">
    {Array.from({ length: sectionCount }).map((_, sectionIndex) => (
      <Card key={`settings-${sectionIndex}`} className="p-5">
        <Skeleton height={16} width="34%" />
        <div className="space-y-4 mt-5">
          {Array.from({ length: sectionIndex === 0 ? 2 : 1 }).map((_, rowIndex) => (
            <div key={`settings-row-${sectionIndex}-${rowIndex}`} className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <Skeleton height={13} width="42%" />
                <Skeleton height={11} width="76%" className="mt-2" />
              </div>
              <Skeleton height={28} width={52} borderRadius={999} />
            </div>
          ))}
        </div>
      </Card>
    ))}
  </div>
);

// Large hero block used by dashboard-style pages and branded user surfaces.
const HeroSkeleton = ({ chips = 3 }) => (
  <div
    className="relative rounded-xl overflow-hidden p-6 sm:p-8"
    style={{ background: "linear-gradient(135deg, #1a1f20 0%, #2D3436 100%)" }}
  >
    <div
      className="absolute top-0 left-0 right-0 h-1"
      style={{ background: "linear-gradient(90deg, #ff6d34, #00bea3)" }}
    />
    <div className="relative">
      <Skeleton height={14} width="28%" />
      <Skeleton height={34} width="48%" className="mt-4" />
      <Skeleton height={15} width="62%" className="mt-4" />
      <div className="flex gap-3 mt-6 flex-wrap">
        {Array.from({ length: chips }).map((_, index) => (
          <Skeleton key={`hero-chip-${index}`} height={64} width={120} borderRadius={18} />
        ))}
      </div>
    </div>
  </div>
);

// Used by the AI page to mimic the split chat + sidebar workspace.
const AssistantLayoutSkeleton = () => (
  <div className="flex flex-col lg:flex-row gap-4 lg:gap-5 min-h-0 lg:h-[calc(100dvh-13rem)]">
    <div
      className="flex-1 flex flex-col rounded-2xl overflow-hidden min-h-[min(70dvh,32rem)] lg:min-h-0"
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        boxShadow: "var(--card-shadow)",
      }}
    >
      <div className="px-5 py-4 flex items-center gap-3" style={{ borderBottom: "1px solid var(--border)" }}>
        <Skeleton height={40} width={40} borderRadius={12} />
        <div className="flex-1">
          <Skeleton height={14} width={140} />
          <Skeleton height={10} width={120} className="mt-2" />
        </div>
        <Skeleton height={24} width={64} borderRadius={999} />
      </div>

      <div className="flex-1 px-5 py-5 space-y-5">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={`chat-${index}`} className={`flex items-end gap-2 ${index % 2 === 0 ? "" : "justify-end"}`}>
            {index % 2 === 0 ? <Skeleton circle height={32} width={32} /> : null}
            <Skeleton height={index % 2 === 0 ? 62 : 54} width={index % 2 === 0 ? "58%" : "46%"} borderRadius={18} />
            {index % 2 === 1 ? <Skeleton circle height={32} width={32} /> : null}
          </div>
        ))}
      </div>

      <div className="px-4 py-3" style={{ borderTop: "1px solid var(--border)" }}>
        <Skeleton height={48} borderRadius={14} />
        <Skeleton height={10} width={150} className="mx-auto mt-3" />
      </div>
    </div>

    <div className="w-64 hidden lg:flex flex-col gap-4 flex-shrink-0">
      {Array.from({ length: 3 }).map((_, index) => (
        <Card key={`assistant-side-${index}`} className="p-4">
          <Skeleton height={14} width="48%" />
          <div className="space-y-3 mt-4">
            {Array.from({ length: index === 2 ? 2 : 4 }).map((__, rowIndex) => (
              <Skeleton key={`assistant-side-row-${index}-${rowIndex}`} height={index === 2 ? 24 : 34} borderRadius={10} />
            ))}
          </div>
        </Card>
      ))}
    </div>
  </div>
);

// Matches the admin dashboard's hero, metric grid, and chart stack.
export const AdminDashboardSkeleton = () => (
  <SkeletonFrame>
    <div className="space-y-6">
      <HeroSkeleton chips={4} />
      <StatGridSkeleton count={4} />
      <div className="grid lg:grid-cols-3 gap-4">
        <ChartCardSkeleton titleWidth={180} height={210} />
        <Card className="p-5">
          <Skeleton height={18} width={130} />
          <div className="space-y-4 mt-5">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={`recent-${index}`} className="flex items-start gap-3">
                <Skeleton circle height={8} width={8} className="mt-1" />
                <div className="flex-1">
                  <Skeleton height={12} width="78%" />
                  <Skeleton height={10} width="56%" className="mt-2" />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
      <ChartCardSkeleton titleWidth={190} height={150} />
    </div>
  </SkeletonFrame>
);

// Mirrors the admin analytics layout with four stat cards, chart grid, and summary table.
export const AdminAnalyticsSkeleton = () => (
  <SkeletonFrame>
    <div className="space-y-6">
      <HeaderSkeleton
        title="Platform Analytics"
        subtitle="Insights across all interns, reports and platform activity"
      />
      <StatGridSkeleton count={4} subtitle />
      <div className="grid lg:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <ChartCardSkeleton key={`admin-analytics-chart-${index}`} titleWidth={190} height={220} />
        ))}
      </div>
      <TableSkeleton columns={5} rows={4} />
    </div>
  </SkeletonFrame>
);

// Keeps the admin panel feeling like a data table page instead of a spinner-only waiting screen.
export const AdminPanelSkeleton = () => (
  <SkeletonFrame>
    <div className="space-y-6">
      <HeaderSkeleton
        title="User Management"
        subtitle="Manage intern roles, status and platform access"
        actionWidth={118}
      />
      <PillRowSkeleton count={4} widths={[108, 90, 98, 84]} />
      <SearchBarSkeleton />
      <TableSkeleton columns={6} rows={6} />
    </div>
  </SkeletonFrame>
);

// Covers the admin announcements form area, filters, and announcement list.
export const AdminAnnouncementsSkeleton = () => (
  <SkeletonFrame>
    <div className="space-y-6">
      <HeaderSkeleton
        title="Announcements"
        subtitle="Create and manage platform-wide announcements"
        actionWidth={152}
      />
      <Card className="p-5 border-blue-200 bg-blue-50/40">
        <Skeleton height={18} width={170} />
        <Skeleton height={42} className="mt-4" borderRadius={12} />
        <Skeleton height={96} className="mt-3" borderRadius={12} />
        <div className="flex gap-2 flex-wrap mt-4">
          <PillRowSkeleton count={3} widths={[68, 82, 60]} />
        </div>
      </Card>
      <PillRowSkeleton count={4} widths={[64, 72, 84, 66]} />
      <CardListSkeleton count={3} showActions />
    </div>
  </SkeletonFrame>
);

// Matches the intern management page with summary chips, a search row, and a wide table.
export const AdminManagementSkeleton = () => (
  <SkeletonFrame>
    <div className="space-y-6">
      <HeaderSkeleton
        title="Intern Management"
        subtitle="Manage intern attendance, tasks, status and ratings"
        actionWidth={112}
      />
      <StatGridSkeleton count={4} />
      <SearchBarSkeleton />
      <TableSkeleton columns={7} rows={5} />
    </div>
  </SkeletonFrame>
);

// Covers the admin knowledge page with summary chips, inline article form, filters, and table.
export const AdminKnowledgeBaseSkeleton = () => (
  <SkeletonFrame>
    <div className="space-y-6">
      <HeaderSkeleton
        title="Knowledge Base"
        subtitle="Manage articles, verify content and track engagement"
        actionWidth={110}
      />
      <PillRowSkeleton count={3} widths={[128, 102, 116]} />
      <Card className="p-5 border-blue-200 bg-blue-50/40">
        <Skeleton height={18} width={120} />
        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <Skeleton height={42} className="flex-1" borderRadius={12} />
          <Skeleton height={42} width={150} borderRadius={12} />
          <Skeleton height={42} width={88} borderRadius={12} />
        </div>
      </Card>
      <SearchBarSkeleton filterCount={4} />
      <TableSkeleton columns={7} rows={5} />
    </div>
  </SkeletonFrame>
);

// Gives the admin reports page a realistic reports-list loading state.
export const AdminReportsSkeleton = () => (
  <SkeletonFrame>
    <div className="space-y-6">
      <HeaderSkeleton
        title="Intern Reports"
        subtitle="Review, approve and manage weekly progress reports"
      />
      <PillRowSkeleton count={3} widths={[126, 136, 106]} />
      <SearchBarSkeleton filterCount={3} />
      <CardListSkeleton count={4} showActions />
    </div>
  </SkeletonFrame>
);

// Stacks settings cards so the admin preferences screen still reads as a form page while loading.
export const AdminSettingsSkeleton = () => (
  <SkeletonFrame>
    <div className="max-w-2xl space-y-4">
      <HeaderSkeleton
        title="Admin Settings"
        subtitle="Configure platform-wide settings and permissions"
      />
      <SettingsCardsSkeleton sectionCount={4} />
      <Card className="p-5 border-red-200 bg-red-50">
        <Skeleton height={16} width={120} />
        <Skeleton height={12} width="82%" className="mt-3" />
        <div className="flex gap-3 flex-wrap mt-5">
          <Skeleton height={38} width={154} borderRadius={10} />
          <Skeleton height={38} width={128} borderRadius={10} />
        </div>
      </Card>
    </div>
  </SkeletonFrame>
);

// Matches the current user dashboard's branded hero, stats, charts, and split bottom row.
export const UserDashboardSkeleton = () => (
  <SkeletonFrame>
    <div className="space-y-6 relative pb-16">
      <HeroSkeleton chips={3} />
      <StatGridSkeleton count={4} subtitle />
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <ChartCardSkeleton titleWidth={150} height={200} />
        <Card className="p-5 lg:col-span-2">
          <Skeleton height={16} width={130} />
          <div className="flex justify-center my-5">
            <Skeleton circle height={110} width={110} />
          </div>
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={`skill-${index}`} height={10} />
            ))}
          </div>
        </Card>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <Skeleton height={16} width={120} />
          <div className="space-y-4 mt-5">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={`activity-${index}`} className="flex items-center gap-3">
                <Skeleton height={18} width={18} borderRadius={6} />
                <Skeleton height={12} className="flex-1" />
                <Skeleton height={10} width={46} />
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-5">
          <Skeleton height={16} width={120} />
          <div className="space-y-3 mt-5">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={`task-${index}`} className="flex items-center gap-3">
                <Skeleton circle height={8} width={8} />
                <Skeleton height={12} className="flex-1" />
                <Skeleton height={20} width={56} borderRadius={999} />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  </SkeletonFrame>
);

// Mirrors the analytics page with a hero banner, metric cards, and several chart panels.
export const UserAnalyticsSkeleton = () => (
  <SkeletonFrame>
    <div className="space-y-6">
      <HeroSkeleton chips={3} />
      <StatGridSkeleton count={4} subtitle />
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <ChartCardSkeleton titleWidth={180} height={220} />
        <ChartCardSkeleton titleWidth={120} height={220} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCardSkeleton titleWidth={170} height={220} />
        <ChartCardSkeleton titleWidth={180} height={220} />
      </div>
      <Card className="p-5">
        <Skeleton height={16} width={210} />
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 mt-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={`strength-${index}`} className="p-4 rounded-xl" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
              <div className="flex justify-center">
                <Skeleton circle height={56} width={56} />
              </div>
              <Skeleton height={12} width="70%" className="mx-auto mt-4" />
            </div>
          ))}
        </div>
      </Card>
      <ChartCardSkeleton titleWidth={170} height={200} />
    </div>
  </SkeletonFrame>
);

// User announcements need filters plus a lighter card feed than the admin editor view.
export const UserAnnouncementsSkeleton = () => (
  <SkeletonFrame>
    <div className="space-y-6">
      <HeaderSkeleton
        title="Announcements"
        subtitle="Stay updated with platform and internship news"
        actionWidth={72}
      />
      <PillRowSkeleton count={4} widths={[64, 72, 84, 66]} />
      <CardListSkeleton count={4} showActions={false} />
    </div>
  </SkeletonFrame>
);

// The user knowledge page loads as a hero search surface followed by article cards.
export const UserKnowledgeBaseSkeleton = () => (
  <SkeletonFrame>
    <div className="space-y-6">
      <div className="rounded-xl p-5 sm:p-8 text-center" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <Skeleton height={30} width={220} className="mx-auto" />
        <Skeleton height={14} width={280} className="mx-auto mt-3" />
        <Skeleton height={48} className="max-w-lg mx-auto mt-6" borderRadius={16} />
      </div>
      <PillRowSkeleton count={6} widths={[56, 68, 96, 72, 74, 82]} />
      <Skeleton height={12} width={90} />
      <ArticleGridSkeleton count={6} />
    </div>
  </SkeletonFrame>
);

// Matches the profile banner card and two-column form layout.
export const UserProfileSkeleton = () => (
  <SkeletonFrame>
    <div className="max-w-3xl space-y-6 w-full min-w-0">
      <HeaderSkeleton title="My Profile" subtitle="Manage your profile information" />
      <Card className="overflow-hidden">
        <Skeleton height={96} />
        <div className="px-6 pb-6">
          <div className="flex flex-col items-center sm:flex-row sm:items-end gap-4 -mt-10 mb-6 text-center sm:text-left">
            <Skeleton circle height={80} width={80} />
            <div className="flex-1 min-w-0 pt-6 sm:pt-0">
              <Skeleton height={24} width="42%" />
              <Skeleton height={14} width="34%" className="mt-3" />
            </div>
            <Skeleton height={40} width={128} borderRadius={10} />
          </div>
          <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={`profile-field-${index}`}>
                <Skeleton height={10} width="28%" />
                <Skeleton height={42} className="mt-2" borderRadius={10} />
              </div>
            ))}
            <div style={{ gridColumn: "1 / -1" }}>
              <Skeleton height={10} width="16%" />
              <Skeleton height={76} className="mt-2" borderRadius={10} />
            </div>
          </div>
        </div>
      </Card>
    </div>
  </SkeletonFrame>
);

// Keeps the project flow page close to its real timeline + charts arrangement.
export const UserProjectFlowSkeleton = () => (
  <SkeletonFrame>
    <div className="space-y-6">
      <HeaderSkeleton title="Project Flow" subtitle="Track progress using your real report activity" />
      <HeroSkeleton chips={1} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <Skeleton height={20} width={160} />
          <div className="space-y-5 mt-6">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={`milestone-${index}`} className="flex items-start gap-4">
                <Skeleton circle height={40} width={40} />
                <div className="flex-1 pt-1">
                  <Skeleton height={14} width="70%" />
                  <Skeleton height={11} width="32%" className="mt-2" />
                </div>
              </div>
            ))}
          </div>
        </Card>
        <div className="space-y-6">
          <ChartCardSkeleton titleWidth={170} height={220} />
          <ChartCardSkeleton titleWidth={190} height={190} />
        </div>
      </div>
    </div>
  </SkeletonFrame>
);

// Mirrors the Q&A hero, ask form, category row, and stacked questions.
export const UserQASkeleton = () => (
  <SkeletonFrame>
    <div className="space-y-6">
      <div className="relative rounded-2xl overflow-hidden p-5 sm:p-8 text-white shadow-xl mb-6" style={{ background: "linear-gradient(135deg, #ff6d34 0%, #ff8c5f 100%)" }}>
        <Skeleton height={32} width="40%" />
        <Skeleton height={14} width="58%" className="mt-4" />
        <Skeleton height={28} width={96} borderRadius={999} className="mt-5" />
      </div>
      <Card className="p-5">
        <Skeleton height={16} width={110} />
        <div className="flex flex-col gap-3 sm:flex-row mt-4">
          <Skeleton height={44} className="flex-1" borderRadius={12} />
          <Skeleton height={44} width={104} borderRadius={12} />
        </div>
      </Card>
      <SearchBarSkeleton filterCount={4} />
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={`qa-${index}`} className="p-5">
            <div className="flex items-start gap-4">
              <div className="flex flex-col items-center gap-2 flex-shrink-0">
                <Skeleton height={28} width={28} borderRadius={10} />
                <Skeleton height={12} width={18} />
              </div>
              <div className="flex-1 min-w-0">
                <Skeleton height={16} width={index % 2 === 0 ? "72%" : "58%"} />
                <div className="flex gap-2 flex-wrap mt-3">
                  <Skeleton height={20} width={72} borderRadius={999} />
                  <Skeleton height={12} width={50} />
                  <Skeleton height={12} width={48} />
                  <Skeleton height={12} width={76} />
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  </SkeletonFrame>
);

// Keeps the reports page aligned with the current list + upload affordance layout.
export const UserReportsSkeleton = () => (
  <SkeletonFrame>
    <div className="space-y-6">
      <HeaderSkeleton
        title="My Reports"
        subtitle="View and manage your weekly progress reports"
        actionWidth={126}
      />
      <SearchBarSkeleton />
      <CardListSkeleton count={4} showActions />
    </div>
  </SkeletonFrame>
);

// Mirrors the stacked preference cards plus account danger zone on the user settings page.
export const UserSettingsSkeleton = () => (
  <SkeletonFrame>
    <div className="max-w-2xl space-y-4">
      <HeaderSkeleton title="Settings" subtitle="Manage your account and preferences" />
      <SettingsCardsSkeleton sectionCount={5} />
      <Card className="p-5" style={{ borderColor: "rgba(220,38,38,0.2)" }}>
        <Skeleton height={16} width={120} />
        <div className="space-y-4 mt-5">
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={`account-card-${index}`} className="p-4 rounded-xl" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <Skeleton height={14} width="40%" />
                  <Skeleton height={11} width="72%" className="mt-2" />
                </div>
                <Skeleton height={38} width={110} borderRadius={10} />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  </SkeletonFrame>
);

// The assistant benefits from a full layout skeleton instead of a small loader card.
export const AIAssistantSkeleton = () => (
  <SkeletonFrame>
    <div className="space-y-6">
      <HeaderSkeleton
        title="AI Assistant"
        subtitle="Ask questions, summarize knowledge, and draft content with the assistant"
      />
      <AssistantLayoutSkeleton />
    </div>
  </SkeletonFrame>
);
