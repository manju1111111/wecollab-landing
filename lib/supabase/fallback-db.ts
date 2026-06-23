import fs from 'fs';
import path from 'path';

const fallbackFilePath = path.join(process.cwd(), 'data/fallback-db.json');

// Helper to initialize fallback file
function initFallbackFile() {
  if (!fs.existsSync(fallbackFilePath)) {
    // Create directory if not exists
    const dir = path.dirname(fallbackFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(
      fallbackFilePath,
      JSON.stringify({ 
        employee_tasks: [], 
        employee_activity: [], 
        notifications: [],
        newsletters: [],
        newsletter_subscribers: []
      }, null, 2),
      'utf8'
    );
  }
}

// Read JSON fallback
function readFallback() {
  initFallbackFile();
  try {
    const data = fs.readFileSync(fallbackFilePath, 'utf8');
    const parsed = JSON.parse(data);
    parsed.employee_tasks = parsed.employee_tasks || [];
    parsed.employee_activity = parsed.employee_activity || [];
    parsed.notifications = parsed.notifications || [];
    parsed.newsletters = parsed.newsletters || [];
    parsed.newsletter_subscribers = parsed.newsletter_subscribers || [];
    return parsed;
  } catch (e) {
    return { 
      employee_tasks: [], 
      employee_activity: [], 
      notifications: [],
      newsletters: [],
      newsletter_subscribers: []
    };
  }
}

// Write JSON fallback
function writeFallback(data: any) {
  initFallbackFile();
  try {
    fs.writeFileSync(fallbackFilePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error("Failed to write to fallback DB:", e);
  }
}

// -------------------------------------------------------------
// DUAL WRITE / DUAL READ INTERFACES
// -------------------------------------------------------------

// 1. Employee Tasks
export async function getTasks(supabase: any, employeeId?: string) {
  try {
    let query = supabase.from("employee_tasks").select("*");
    if (employeeId) {
      query = query.eq("employee_id", employeeId);
    }
    const { data, error } = await query.order("created_at", { ascending: false });
    if (error && (error.code === 'PGRST205' || error.message.includes('schema cache'))) {
      throw error;
    }
    return data || [];
  } catch (e) {
    const db = readFallback();
    let tasks = db.employee_tasks || [];
    if (employeeId) {
      tasks = tasks.filter((t: any) => t.employee_id === employeeId);
    }
    // Sort descending by created_at
    return tasks.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }
}

export async function insertTask(supabase: any, task: any) {
  const newTask = {
    id: task.id || crypto.randomUUID(),
    employee_id: task.employee_id,
    creator_id: task.creator_id || null,
    title: task.title,
    due_date: task.due_date || null,
    completed_at: task.completed_at || null,
    created_at: task.created_at || new Date().toISOString()
  };

  try {
    const { data, error } = await supabase.from("employee_tasks").insert(newTask).select().single();
    if (error && (error.code === 'PGRST205' || error.message.includes('schema cache'))) {
      throw error;
    }
    return { data: data || newTask, error: null };
  } catch (e) {
    const db = readFallback();
    db.employee_tasks = db.employee_tasks || [];
    db.employee_tasks.push(newTask);
    writeFallback(db);
    return { data: newTask, error: null };
  }
}

export async function updateTaskCompletion(supabase: any, taskId: string, completedAt: string | null) {
  try {
    const { data, error } = await supabase
      .from("employee_tasks")
      .update({ completed_at: completedAt })
      .eq("id", taskId)
      .select()
      .single();
    if (error && (error.code === 'PGRST205' || error.message.includes('schema cache'))) {
      throw error;
    }
    return { data, error: null };
  } catch (e) {
    const db = readFallback();
    db.employee_tasks = (db.employee_tasks || []).map((t: any) => 
      t.id === taskId ? { ...t, completed_at: completedAt } : t
    );
    writeFallback(db);
    const updated = db.employee_tasks.find((t: any) => t.id === taskId);
    return { data: updated, error: null };
  }
}

export async function updateTask(supabase: any, taskId: string, updates: any) {
  try {
    const { data, error } = await supabase
      .from("employee_tasks")
      .update(updates)
      .eq("id", taskId)
      .select()
      .single();
    if (error && (error.code === 'PGRST205' || error.message.includes('schema cache'))) {
      throw error;
    }
    return { data, error: null };
  } catch (e) {
    const db = readFallback();
    db.employee_tasks = (db.employee_tasks || []).map((t: any) => 
      t.id === taskId ? { ...t, ...updates } : t
    );
    writeFallback(db);
    const updated = db.employee_tasks.find((t: any) => t.id === taskId);
    return { data: updated, error: null };
  }
}

export async function deleteTask(supabase: any, taskId: string) {
  try {
    const { error } = await supabase.from("employee_tasks").delete().eq("id", taskId);
    if (error && (error.code === 'PGRST205' || error.message.includes('schema cache'))) {
      throw error;
    }
    return { error: null };
  } catch (e) {
    const db = readFallback();
    db.employee_tasks = (db.employee_tasks || []).filter((t: any) => t.id !== taskId);
    writeFallback(db);
    return { error: null };
  }
}

// 2. Employee Activity (Online status)
export async function getActivities(supabase: any) {
  try {
    const { data: employees, error: empErr } = await supabase
      .from("employees")
      .select("id, full_name, role, status")
      .eq("status", "active");

    if (empErr) throw empErr;

    const { data: acts, error: actErr } = await supabase
      .from("employee_activity")
      .select("employee_id, status, session_start, last_active, current_activity");

    if (actErr && (actErr.code === 'PGRST205' || actErr.message.includes('schema cache'))) {
      throw actErr;
    }

    const activityMap = new Map();
    (acts || []).forEach((act: any) => {
      activityMap.set(act.employee_id, act);
    });

    const enriched = (employees || []).map((emp: any) => {
      const act = activityMap.get(emp.id) || {
        status: "offline",
        session_start: null,
        last_active: null,
        current_activity: null
      };
      return {
        id: emp.id,
        name: emp.full_name,
        role: emp.role,
        status: act.status,
        session_start: act.session_start,
        last_active: act.last_active,
        current_activity: act.current_activity
      };
    });

    return enriched;
  } catch (e) {
    const db = readFallback();
    const fallbackActs = db.employee_activity || [];

    // Get active employees from DB
    try {
      const { data: employees } = await supabase
        .from("employees")
        .select("id, full_name, role, status")
        .eq("status", "active");

      if (employees) {
        const activityMap = new Map();
        fallbackActs.forEach((act: any) => {
          activityMap.set(act.employee_id, act);
        });

        return employees.map((emp: any) => {
          const act = activityMap.get(emp.id) || {
            status: "offline",
            session_start: null,
            last_active: null,
            current_activity: null
          };
          return {
            id: emp.id,
            name: emp.full_name,
            role: emp.role,
            status: act.status,
            session_start: act.session_start,
            last_active: act.last_active,
            current_activity: act.current_activity
          };
        });
      }
    } catch (dbErr) {
      // ignore
    }

    return fallbackActs;
  }
}

export async function updateActivityStatus(
  supabase: any, 
  employeeId: string, 
  status: "online" | "offline" | "away" | "break", 
  currentActivity?: string | null
) {
  const now = new Date().toISOString();
  const updatePayload = {
    employee_id: employeeId,
    status,
    last_active: now,
    ...(status === "online" ? { session_start: now } : {}),
    ...(currentActivity !== undefined ? { current_activity: currentActivity } : {})
  };

  try {
    const { data, error } = await supabase
      .from("employee_activity")
      .upsert(updatePayload, { onConflict: "employee_id" })
      .select()
      .single();
    if (error && (error.code === 'PGRST205' || error.message.includes('schema cache'))) {
      throw error;
    }
    return { data, error: null };
  } catch (e) {
    const db = readFallback();
    db.employee_activity = db.employee_activity || [];
    const index = db.employee_activity.findIndex((a: any) => a.employee_id === employeeId);
    
    const existing = index !== -1 ? db.employee_activity[index] : {
      session_start: null,
      current_activity: null
    };

    const updated = {
      ...existing,
      employee_id: employeeId,
      status,
      last_active: now,
      ...(status === "online" ? { session_start: now } : {}),
      ...(currentActivity !== undefined ? { current_activity: currentActivity } : {})
    };

    if (index === -1) {
      db.employee_activity.push(updated);
    } else {
      db.employee_activity[index] = updated;
    }

    writeFallback(db);
    return { data: updated, error: null };
  }
}

// 3. Notifications
export async function getNotifications(supabase: any, userId: string, userType: 'admin' | 'employee') {
  try {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .eq("user_type", userType)
      .order("created_at", { ascending: false })
      .limit(30);

    if (error && (error.code === 'PGRST205' || error.message.includes('schema cache'))) {
      throw error;
    }
    return data || [];
  } catch (e) {
    const db = readFallback();
    const notifs = db.notifications || [];
    return notifs
      .filter((n: any) => n.user_id === userId && n.user_type === userType)
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }
}

export async function insertNotification(supabase: any, notification: any) {
  const newNotif = {
    id: notification.id || crypto.randomUUID(),
    user_id: notification.userId,
    user_type: notification.userType,
    type: notification.type,
    title: notification.title,
    body: notification.body || null,
    link: notification.link || null,
    read: false,
    created_at: new Date().toISOString()
  };

  try {
    const { data, error } = await supabase.from("notifications").insert(newNotif).select().single();
    if (error && (error.code === 'PGRST205' || error.message.includes('schema cache'))) {
      throw error;
    }
    return { data: data || newNotif, error: null };
  } catch (e) {
    const db = readFallback();
    db.notifications = db.notifications || [];
    db.notifications.push(newNotif);
    writeFallback(db);
    return { data: newNotif, error: null };
  }
}

export async function markNotificationRead(supabase: any, notificationId: string) {
  try {
    const { data, error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", notificationId)
      .select()
      .single();
    if (error && (error.code === 'PGRST205' || error.message.includes('schema cache'))) {
      throw error;
    }
    return { data, error: null };
  } catch (e) {
    const db = readFallback();
    db.notifications = (db.notifications || []).map((n: any) => 
      n.id === notificationId ? { ...n, read: true } : n
    );
    writeFallback(db);
    return { error: null };
  }
}

// -------------------------------------------------------------
// 4. Newsletter & Subscribers
// -------------------------------------------------------------

export async function getNewsletters(supabase: any, includeDrafts: boolean = false) {
  try {
    let query = supabase.from("newsletters").select("*");
    if (!includeDrafts) {
      query = query.eq("is_published", true);
    }
    const { data, error } = await query.order("published_at", { ascending: false });
    if (error && (error.code === 'PGRST205' || error.message.includes('schema cache'))) {
      throw error;
    }
    return data || [];
  } catch (e) {
    const db = readFallback();
    let list = db.newsletters || [];
    if (!includeDrafts) {
      list = list.filter((n: any) => n.is_published);
    }
    return list.sort((a: any, b: any) => {
      const timeA = a.published_at ? new Date(a.published_at).getTime() : new Date(a.created_at).getTime();
      const timeB = b.published_at ? new Date(b.published_at).getTime() : new Date(b.created_at).getTime();
      return timeB - timeA;
    });
  }
}

export async function getNewsletterById(supabase: any, id: string) {
  try {
    const { data, error } = await supabase.from("newsletters").select("*").eq("id", id).single();
    if (error && (error.code === 'PGRST205' || error.message.includes('schema cache'))) {
      throw error;
    }
    return data;
  } catch (e) {
    const db = readFallback();
    const list = db.newsletters || [];
    return list.find((n: any) => n.id === id) || null;
  }
}

export async function getNewsletterBySlug(supabase: any, slug: string) {
  try {
    const { data, error } = await supabase.from("newsletters").select("*").eq("slug", slug).single();
    if (error && (error.code === 'PGRST205' || error.message.includes('schema cache'))) {
      throw error;
    }
    return data;
  } catch (e) {
    const db = readFallback();
    const list = db.newsletters || [];
    return list.find((n: any) => n.slug === slug || n.id === slug) || null;
  }
}

export async function insertNewsletter(supabase: any, newsletter: any) {
  const newNewsletter = {
    id: newsletter.id || crypto.randomUUID(),
    title: newsletter.title,
    slug: newsletter.slug || newsletter.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
    summary: newsletter.summary || "",
    content: newsletter.content || "",
    cover_image: newsletter.cover_image || "",
    category: newsletter.category || "Creator Economy",
    tags: newsletter.tags || [],
    author_name: newsletter.author_name || "WeCollab Team",
    author_avatar: newsletter.author_avatar || "/assets/logo.jpg",
    is_published: newsletter.is_published || false,
    published_at: newsletter.is_published ? (newsletter.published_at || new Date().toISOString()) : null,
    seo_title: newsletter.seo_title || null,
    seo_description: newsletter.seo_description || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  try {
    const { data, error } = await supabase.from("newsletters").insert(newNewsletter).select().single();
    if (error && (error.code === 'PGRST205' || error.message.includes('schema cache'))) {
      throw error;
    }
    return { data: data || newNewsletter, error: null };
  } catch (e) {
    const db = readFallback();
    db.newsletters = db.newsletters || [];
    db.newsletters.push(newNewsletter);
    writeFallback(db);
    return { data: newNewsletter, error: null };
  }
}

export async function updateNewsletter(supabase: any, id: string, updates: any) {
  const updatedFields = {
    ...updates,
    updated_at: new Date().toISOString(),
    ...(updates.is_published !== undefined ? {
      published_at: updates.is_published ? (updates.published_at || new Date().toISOString()) : null
    } : {})
  };

  try {
    const { data, error } = await supabase
      .from("newsletters")
      .update(updatedFields)
      .eq("id", id)
      .select()
      .single();
    if (error && (error.code === 'PGRST205' || error.message.includes('schema cache'))) {
      throw error;
    }
    return { data, error: null };
  } catch (e) {
    const db = readFallback();
    db.newsletters = (db.newsletters || []).map((n: any) => 
      n.id === id ? { ...n, ...updatedFields } : n
    );
    writeFallback(db);
    const updated = db.newsletters.find((n: any) => n.id === id);
    return { data: updated, error: null };
  }
}

export async function deleteNewsletter(supabase: any, id: string) {
  try {
    const { error } = await supabase.from("newsletters").delete().eq("id", id);
    if (error && (error.code === 'PGRST205' || error.message.includes('schema cache'))) {
      throw error;
    }
    return { error: null };
  } catch (e) {
    const db = readFallback();
    db.newsletters = (db.newsletters || []).filter((n: any) => n.id !== id);
    writeFallback(db);
    return { error: null };
  }
}

export async function getNewsletterSubscribers(supabase: any) {
  try {
    const { data, error } = await supabase
      .from("newsletter_subscribers")
      .select("*")
      .order("created_at", { ascending: false });
    if (error && (error.code === 'PGRST205' || error.message.includes('schema cache'))) {
      throw error;
    }
    return data || [];
  } catch (e) {
    const db = readFallback();
    const list = db.newsletter_subscribers || [];
    return list.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }
}

export async function insertNewsletterSubscriber(supabase: any, email: string) {
  const newSub = {
    id: crypto.randomUUID(),
    email: email.toLowerCase().trim(),
    created_at: new Date().toISOString()
  };

  try {
    const { data, error } = await supabase.from("newsletter_subscribers").insert(newSub).select().single();
    if (error && (error.code === 'PGRST205' || error.message.includes('schema cache'))) {
      throw error;
    }
    return { data: data || newSub, error: null };
  } catch (e) {
    const db = readFallback();
    db.newsletter_subscribers = db.newsletter_subscribers || [];
    const exists = db.newsletter_subscribers.some((s: any) => s.email === newSub.email);
    if (!exists) {
      db.newsletter_subscribers.push(newSub);
      writeFallback(db);
    }
    return { data: newSub, error: null };
  }
}
