import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { projectService, taskService, userService, activityService } from '../../services';
import {
  ROLE_LABELS, TASK_STAGES, TASK_STAGE_COLORS,
  TASK_PRIORITIES, TASK_PRIORITY_COLORS,
  PROJECT_STATUSES, PROJECT_STATUS_COLORS,
} from '../../utils/constants';
import { Button, Avatar, Badge, Skeleton } from '../../components/ui';
import useOnboarding from '../../hooks/useOnboarding';
import OnboardingWizard from '../onboarding/OnboardingWizard';

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------
const ArrowIcon = ({ className = '' }) => (
  <svg className={`w-4 h-4 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
  </svg>
);

function StatCard({ label, value, hint, accent, link, loading, navigate }) {
  return (
    <div
      className={`card p-5 cursor-pointer transition-all hover:shadow-sm ${accent ? 'bg-primary-600 border-primary-600' : ''}`}
      onClick={() => navigate(link)}
    >
      <div className="flex items-center justify-between mb-4">
        <span className={`text-sm font-medium ${accent ? 'text-primary-100' : 'text-slate-500 dark:text-slate-400'}`}>
          {label}
        </span>
        <div className={`p-1.5 rounded-xl transition-colors ${accent ? 'bg-white/10 hover:bg-white/20' : 'bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
          <ArrowIcon className={accent ? 'text-white/70' : 'text-slate-400'} />
        </div>
      </div>
      {loading ? (
        <Skeleton variant="text" className={`w-16 h-10 ${accent ? 'bg-white/20' : ''}`} />
      ) : (
        <p className={`text-4xl font-extrabold tracking-tight ${accent ? 'text-white' : 'text-slate-900 dark:text-slate-100'}`}>
          {value}
        </p>
      )}
      <p className={`text-xs mt-2 ${accent ? 'text-primary-200' : 'text-slate-400'}`}>{hint}</p>
    </div>
  );
}

function SectionCard({ title, action, children, colSpan = '' }) {
  return (
    <div className={`card ${colSpan}`}>
      <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-700">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function EmptySection({ icon, text }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center mb-3">
        {icon}
      </div>
      <p className="text-xs text-slate-400">{text}</p>
    </div>
  );
}

function TaskList({ tasks, loading, navigate, emptyText = 'No tasks found' }) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton variant="button" className="w-16" />
            <Skeleton variant="text" className="flex-1" />
            <Skeleton variant="button" className="w-16" />
          </div>
        ))}
      </div>
    );
  }
  if (tasks.length === 0) {
    return (
      <EmptySection
        icon={<svg className="w-5 h-5 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        text={emptyText}
      />
    );
  }
  return (
    <div className="space-y-2">
      {tasks.map((task) => (
        <div
          key={task._id}
          className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          onClick={() => navigate('/tasks')}
        >
          <div className="min-w-0 flex-1">
            <span className="font-mono text-xs text-slate-400 mr-2">{task.taskId}</span>
            <span className="text-sm text-slate-700 dark:text-slate-300">{task.title}</span>
          </div>
          <Badge color={TASK_STAGE_COLORS[task.stage]} size="sm">
            {TASK_STAGES[task.stage] || task.stage}
          </Badge>
        </div>
      ))}
    </div>
  );
}

function ActivityList({ activities, loading }) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton variant="circle" className="w-7 h-7" />
            <Skeleton variant="text" className="flex-1" />
          </div>
        ))}
      </div>
    );
  }
  if (activities.length === 0) {
    return (
      <EmptySection
        icon={<svg className="w-5 h-5 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        text="No recent activity"
      />
    );
  }
  return (
    <div className="space-y-3">
      {activities.map((a) => (
        <div key={a._id} className="flex items-start gap-3">
          <Avatar name={a.actor?.name} size="xs" />
          <div className="min-w-0 flex-1">
            <p className="text-sm text-slate-700 dark:text-slate-300">
              <span className="font-medium">{a.actor?.name}</span>{' '}
              <span className="text-slate-500 dark:text-slate-400">{a.action}</span>{' '}
              <span className="font-medium">{a.targetTitle}</span>
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              {new Date(a.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// SUPER ADMIN Dashboard
// ---------------------------------------------------------------------------
function AdminDashboard({ navigate, loading, data }) {
  const statCards = [
    { label: 'Total Projects', value: data.totalProjects, hint: `${data.activeProjects} active`, accent: true, link: '/projects' },
    { label: 'Total Users', value: data.totalUsers, hint: `${data.activeUsers} active members`, link: '/users' },
    { label: 'Open Tasks', value: data.openTasks, hint: `${data.inProgressTasks ?? 0} in progress`, link: '/tasks' },
    { label: 'Open Bugs', value: data.openBugs, hint: data.openBugs ? `${data.criticalBugs} critical` : 'All clear', link: '/tasks' },
  ];

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((s) => <StatCard key={s.label} {...s} loading={loading} navigate={navigate} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Projects by Status */}
        <SectionCard title="Projects by Status" action={<Button variant="ghost" size="sm" onClick={() => navigate('/projects')}>View all</Button>}>
          {loading ? (
            <div className="space-y-2">{[1, 2, 3, 4].map((i) => <Skeleton key={i} variant="text" />)}</div>
          ) : (
            <div className="space-y-2.5">
              {Object.entries(PROJECT_STATUSES).map(([key, label]) => (
                <div key={key} className="flex items-center justify-between">
                  <Badge size="sm" color={PROJECT_STATUS_COLORS[key]} dot>{label}</Badge>
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{data.projectsByStatus?.[key] || 0}</span>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* Bug Summary by Priority */}
        <SectionCard title="Bug Summary" action={<Button variant="ghost" size="sm" onClick={() => navigate('/tasks')}>View all</Button>}>
          {loading ? (
            <div className="space-y-2">{[1, 2, 3, 4].map((i) => <Skeleton key={i} variant="text" />)}</div>
          ) : data.openBugs > 0 ? (
            <div className="space-y-2.5">
              {Object.entries(TASK_PRIORITIES).map(([key, label]) => (
                <div key={key} className="flex items-center justify-between">
                  <Badge size="sm" color={TASK_PRIORITY_COLORS[key]}>{label}</Badge>
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{data.bugByPriority?.[key] || 0}</span>
                </div>
              ))}
            </div>
          ) : (
            <EmptySection icon={<svg className="w-5 h-5 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} text="No bugs reported" />
          )}
        </SectionCard>

        {/* Team Members */}
        <SectionCard title="Team Members" action={<Button variant="ghost" size="sm" onClick={() => navigate('/users')}>Manage</Button>}>
          {loading ? (
            <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="flex items-center gap-3"><Skeleton variant="circle" className="w-8 h-8" /><Skeleton variant="text" className="flex-1" /></div>)}</div>
          ) : data.users?.length > 0 ? (
            <div className="space-y-2.5">
              {data.users.slice(0, 6).map((u) => (
                <div key={u._id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar name={u.name} size="xs" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{u.name}</p>
                      <p className="text-xs text-slate-400 truncate">{u.designation || u.email}</p>
                    </div>
                  </div>
                  <Badge size="sm" color={u.role === 'super_admin' ? 'warning' : u.role === 'project_manager' ? 'primary' : 'default'}>
                    {ROLE_LABELS[u.role]}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <EmptySection icon={<svg className="w-5 h-5 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>} text="No team members" />
          )}
        </SectionCard>
      </div>

      {/* Recent Activity */}
      <SectionCard title="Recent Activity" colSpan="lg:col-span-full">
        <ActivityList activities={data.activities} loading={loading} />
      </SectionCard>
    </>
  );
}

// ---------------------------------------------------------------------------
// PROJECT MANAGER Dashboard
// ---------------------------------------------------------------------------
function PMDashboard({ navigate, loading, data }) {
  const statCards = [
    { label: 'My Projects', value: data.myProjects, hint: `${data.activeProjects} active`, accent: true, link: '/projects' },
    { label: 'Open Tasks', value: data.teamTasks, hint: `${data.inProgressTasks ?? 0} in progress`, link: '/tasks' },
    { label: 'Open Bugs', value: data.openBugs, hint: data.criticalBugs ? `${data.criticalBugs} critical` : 'In your projects', link: '/tasks' },
  ];

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {statCards.map((s) => <StatCard key={s.label} {...s} loading={loading} navigate={navigate} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Team Workload */}
        <SectionCard title="Team Workload" action={<Button variant="ghost" size="sm" onClick={() => navigate('/tasks')}>Details</Button>}>
          {loading ? (
            <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="flex items-center gap-3"><Skeleton variant="circle" className="w-8 h-8" /><Skeleton variant="text" className="flex-1" /><Skeleton variant="text" className="w-8" /></div>)}</div>
          ) : data.workload?.length > 0 ? (() => {
            const maxTasks = Math.max(...data.workload.map((x) => x.totalTasks), 1);
            return (
              <div className="space-y-3">
                {data.workload.map((w) => (
                  <div key={w._id} className="flex items-center gap-3">
                    <Avatar name={w.user.name} size="xs" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{w.user.name}</p>
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 ml-2">{w.totalTasks} tasks</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-700">
                        <div className="h-1.5 rounded-full bg-primary-500 transition-all" style={{ width: `${(w.totalTasks / maxTasks) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })() : (
            <EmptySection icon={<svg className="w-5 h-5 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>} text="No active assignments" />
          )}
        </SectionCard>

        {/* Bug Summary by Priority */}
        <SectionCard title="Bug Summary" action={<Button variant="ghost" size="sm" onClick={() => navigate('/tasks')}>View all</Button>}>
          {loading ? (
            <div className="space-y-2">{[1, 2, 3, 4].map((i) => <Skeleton key={i} variant="text" />)}</div>
          ) : data.openBugs > 0 ? (
            <div className="space-y-2.5">
              {Object.entries(TASK_PRIORITIES).map(([key, label]) => (
                <div key={key} className="flex items-center justify-between">
                  <Badge size="sm" color={TASK_PRIORITY_COLORS[key]}>{label}</Badge>
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{data.bugByPriority?.[key] || 0}</span>
                </div>
              ))}
            </div>
          ) : (
            <EmptySection icon={<svg className="w-5 h-5 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} text="No bugs reported" />
          )}
        </SectionCard>
      </div>

      {/* Recent Activity */}
      <SectionCard title="Recent Activity" colSpan="lg:col-span-full">
        <ActivityList activities={data.activities} loading={loading} />
      </SectionCard>
    </>
  );
}

// ---------------------------------------------------------------------------
// DEVELOPER Dashboard
// ---------------------------------------------------------------------------
function DevDashboard({ user, navigate, loading, data }) {
  const statCards = [
    { label: 'My Tasks', value: data.myTaskCount, hint: `${data.inProgressTasks} in progress`, accent: true, link: '/my-tasks' },
    { label: 'Bugs Assigned', value: data.myBugs, hint: data.myBugs ? 'Need your attention' : 'All clear', link: '/tasks' },
    { label: 'Upcoming Deadlines', value: data.upcomingDeadlines, hint: data.upcomingDeadlines ? 'Due within 7 days' : 'No upcoming deadlines', link: '/tasks' },
  ];

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {statCards.map((s) => <StatCard key={s.label} {...s} loading={loading} navigate={navigate} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* My Active Tasks */}
        <SectionCard title="My Active Tasks" action={<Button variant="ghost" size="sm" onClick={() => navigate('/my-tasks')}>View all</Button>}>
          <TaskList tasks={data.myTasks || []} loading={loading} navigate={navigate} emptyText="No tasks assigned yet" />
        </SectionCard>

        {/* My Bugs */}
        <SectionCard title="My Bugs" action={<Button variant="ghost" size="sm" onClick={() => navigate('/bugs')}>View all</Button>}>
          {loading ? (
            <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="flex items-center gap-3"><Skeleton variant="button" className="w-16" /><Skeleton variant="text" className="flex-1" /><Skeleton variant="button" className="w-16" /></div>)}</div>
          ) : data.myBugsList?.length > 0 ? (
            <div className="space-y-2">
              {data.myBugsList.map((bug) => (
                <div
                  key={bug._id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  onClick={() => navigate('/bugs')}
                >
                  <div className="min-w-0 flex-1">
                    <span className="font-mono text-xs text-slate-400 mr-2">{bug.taskId}</span>
                    <span className="text-sm text-slate-700 dark:text-slate-300">{bug.title}</span>
                  </div>
                  <Badge color={TASK_PRIORITY_COLORS[bug.priority]} size="sm">
                    {TASK_PRIORITIES[bug.priority] || bug.priority}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <EmptySection icon={<svg className="w-5 h-5 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} text="No bugs assigned to you" />
          )}
        </SectionCard>
      </div>

      {/* Priority breakdown + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <SectionCard title="My Task Priorities">
          {loading ? (
            <div className="space-y-2">{[1, 2, 3, 4].map((i) => <Skeleton key={i} variant="text" />)}</div>
          ) : (
            <div className="space-y-2.5">
              {Object.entries(TASK_PRIORITIES).map(([key, label]) => (
                <div key={key} className="flex items-center justify-between">
                  <Badge size="sm" color={TASK_PRIORITY_COLORS[key]}>{label}</Badge>
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{data.priorityBreakdown?.[key] || 0}</span>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Recent Activity" colSpan="lg:col-span-2">
          <ActivityList activities={data.activities} loading={loading} />
        </SectionCard>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Main Dashboard Page
// ---------------------------------------------------------------------------
export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showOnboarding, completeOnboarding } = useOnboarding();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({});

  const role = user?.role;
  const isAdmin = role === 'super_admin';
  const isPM = role === 'project_manager';

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const openStages = ['backlog', 'todo', 'in_progress', 'in_review', 'testing'];

        if (isAdmin) {
          const [projectRes, userRes, bugTasksRes, activityRes, ...stageCounts] = await Promise.all([
            projectService.getAll({ limit: 100 }).catch(e => (console.error('Dashboard: projects', e), { data: [], meta: { total: 0 } })),
            userService.getAll({ limit: 100 }).catch(e => (console.error('Dashboard: users', e), { data: [], meta: { total: 0 } })),
            taskService.getAll({ limit: 200, type: 'bug' }).catch(e => (console.error('Dashboard: bugs', e), { data: [] })),
            activityService.getGlobal({ limit: 8 }).catch(e => (console.error('Dashboard: activity', e), { data: [] })),
            ...openStages.map(stage => taskService.getAll({ limit: 1, stage }).catch(() => ({ meta: { total: 0 } }))),
          ]);

          const projectsByStatus = {};
          (projectRes?.data || []).forEach((p) => { projectsByStatus[p.status] = (projectsByStatus[p.status] || 0) + 1; });

          const openTasks = stageCounts.reduce((sum, r) => sum + (r?.meta?.total ?? 0), 0);
          const inProgressTasks = stageCounts[2]?.meta?.total ?? 0;

          const openBugTasks = (bugTasksRes?.data || []).filter(t => openStages.includes(t.stage));
          const bugByPriority = {};
          openBugTasks.forEach(t => { bugByPriority[t.priority] = (bugByPriority[t.priority] || 0) + 1; });

          setData({
            totalProjects: projectRes?.meta?.total ?? 0,
            activeProjects: projectsByStatus.active || 0,
            projectsByStatus,
            totalUsers: userRes?.meta?.total ?? 0,
            activeUsers: (userRes?.data || []).filter((u) => u.status === 'active').length,
            users: userRes?.data || [],
            openTasks,
            inProgressTasks,
            openBugs: openBugTasks.length,
            criticalBugs: bugByPriority.critical || 0,
            bugByPriority,
            activities: activityRes?.data || [],
          });
        } else if (isPM) {
          const [projectRes, bugTasksRes, workloadRes, activityRes, ...stageCounts] = await Promise.all([
            projectService.getAll({ limit: 100 }).catch(e => (console.error('Dashboard: projects', e), { data: [], meta: { total: 0 } })),
            taskService.getAll({ limit: 200, type: 'bug' }).catch(e => (console.error('Dashboard: bugs', e), { data: [] })),
            taskService.getWorkload().catch(e => (console.error('Dashboard: workload', e), { data: [] })),
            activityService.getGlobal({ limit: 8 }).catch(e => (console.error('Dashboard: activity', e), { data: [] })),
            ...openStages.map(stage => taskService.getAll({ limit: 1, stage }).catch(() => ({ meta: { total: 0 } }))),
          ]);

          const teamTasks = stageCounts.reduce((sum, r) => sum + (r?.meta?.total ?? 0), 0);
          const inProgressTasks = stageCounts[2]?.meta?.total ?? 0;

          const openBugTasks = (bugTasksRes?.data || []).filter(t => openStages.includes(t.stage));
          const bugByPriority = {};
          openBugTasks.forEach(t => { bugByPriority[t.priority] = (bugByPriority[t.priority] || 0) + 1; });

          setData({
            myProjects: projectRes?.meta?.total ?? 0,
            activeProjects: (projectRes?.data || []).filter((p) => p.status === 'active').length,
            teamTasks,
            inProgressTasks,
            openBugs: openBugTasks.length,
            criticalBugs: bugByPriority.critical || 0,
            bugByPriority,
            workload: workloadRes?.data || [],
            activities: activityRes?.data || [],
          });
        } else {
          // Developer
          const [myTasksRes, myBugsRes, activityRes] = await Promise.all([
            taskService.getAll({ limit: 50, assignee: user?._id }).catch(e => (console.error('Dashboard: myTasks', e), { data: [], meta: { total: 0 } })),
            taskService.getAll({ limit: 10, assignee: user?._id, type: 'bug' }).catch(e => (console.error('Dashboard: myBugs', e), { data: [], meta: { total: 0 } })),
            activityService.getGlobal({ limit: 8 }).catch(e => (console.error('Dashboard: activity', e), { data: [] })),
          ]);

          const myTasks = myTasksRes?.data || [];
          const activeTasks = myTasks.filter((t) => !['done', 'archived'].includes(t.stage));
          const inProgressTasks = myTasks.filter((t) => t.stage === 'in_progress').length;

          const now = new Date();
          const in7Days = new Date(now.getTime() + 7 * 86400000);
          const upcomingDeadlines = activeTasks.filter((t) => t.dueDate && new Date(t.dueDate) <= in7Days && new Date(t.dueDate) >= now).length;

          const priorityBreakdown = {};
          activeTasks.forEach((t) => { priorityBreakdown[t.priority] = (priorityBreakdown[t.priority] || 0) + 1; });

          setData({
            myTaskCount: activeTasks.length,
            inProgressTasks,
            myTasks: activeTasks.slice(0, 5),
            myBugs: (myBugsRes?.data || []).filter(t => !['done', 'archived'].includes(t.stage)).length,
            myBugsList: (myBugsRes?.data || []).filter(t => !['done', 'archived'].includes(t.stage)).slice(0, 5),
            upcomingDeadlines,
            priorityBreakdown,
            activities: activityRes?.data || [],
          });
        }
      } catch {
        // Dashboard is best-effort
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user?._id, isAdmin, isPM]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const headerActions = isAdmin ? (
    <>
      <Button size="sm" onClick={() => navigate('/projects')}>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
        New Project
      </Button>
      <Button variant="secondary" size="sm" onClick={() => navigate('/users')}>Manage Users</Button>
    </>
  ) : isPM ? (
    <>
      <Button size="sm" onClick={() => navigate('/projects')}>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
        New Project
      </Button>
      <Button variant="secondary" size="sm" onClick={() => navigate('/tasks')}>Create Task</Button>
    </>
  ) : (
    <>
      <Button size="sm" onClick={() => navigate('/my-tasks')}>My Tasks</Button>
      <Button variant="secondary" size="sm" onClick={() => navigate('/bugs')}>My Bugs</Button>
    </>
  );

  const subtitle = isAdmin
    ? 'System overview across all projects and teams.'
    : isPM
      ? 'Track your projects, team, and deliverables.'
      : 'Your tasks, bugs, and progress at a glance.';

  return (
    <div className="space-y-6 max-w-7xl animate-fade-in">
      {showOnboarding && <OnboardingWizard onComplete={completeOnboarding} />}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            {greeting}, {user?.name?.split(' ')[0]}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>
        </div>
        <div className="hidden sm:flex items-center gap-2">{headerActions}</div>
      </div>

      {isAdmin && <AdminDashboard navigate={navigate} loading={loading} data={data} />}
      {isPM && <PMDashboard navigate={navigate} loading={loading} data={data} />}
      {!isAdmin && !isPM && <DevDashboard user={user} navigate={navigate} loading={loading} data={data} />}
    </div>
  );
}
