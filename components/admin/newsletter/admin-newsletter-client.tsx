"use client";

import { useState, useTransition, useRef } from "react";
import Link from "next/link";
import { 
  Mail, 
  FileText, 
  Send, 
  Trash2, 
  Edit, 
  Plus, 
  Download, 
  CheckCircle, 
  AlertCircle,
  Eye,
  Loader2,
  Undo,
  TrendingUp,
  TrendingDown,
  Users,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  Sparkles,
  Bold,
  Italic,
  List,
  Heading,
  Quote,
  Code,
  Image as ImageIcon,
  Link as LinkIcon,
  Activity,
  Calendar,
  ArrowUpRight,
  LayoutDashboard,
  Layers,
  MessageSquare,
  Settings,
  Search,
  Bell,
  Sun,
  Moon,
  Menu,
  X,
  ChevronDown
} from "lucide-react";
import { 
  createNewsletterAction, 
  updateNewsletterAction, 
  deleteNewsletterAction, 
  togglePublishNewsletterAction,
  subscribeAction
} from "@/app/admin/newsletter/actions";

interface Newsletter {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  cover_image?: string | null;
  category: string;
  tags?: string[] | null;
  author_name?: string | null;
  author_avatar?: string | null;
  is_published: boolean;
  published_at?: string | null;
  created_at: string;
  seo_title?: string | null;
  seo_description?: string | null;
  // New fields for SEO enrichment
  featured_image_prompt?: string | null;
  excerpt?: string | null;
  faq?: any;
  internal_links?: any;
  schema_markup?: any;
}

interface Subscriber {
  id: string;
  email: string;
  created_at: string;
}

interface AdminNewsletterClientProps {
  initialNewsletters: Newsletter[];
  initialSubscribers: Subscriber[];
}

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  collapsed: boolean;
  active: boolean;
  href?: string;
  onClick?: () => void;
  hasSubmenu?: boolean;
  submenu?: { label: string; active: boolean; href?: string; onClick?: () => void }[];
  isOpenDefault?: boolean;
}

function SidebarItem({ icon, label, collapsed, active, href, onClick, hasSubmenu, submenu, isOpenDefault = false }: SidebarItemProps) {
  const [isOpen, setIsOpen] = useState(isOpenDefault);

  const buttonContent = (
    <div className="flex items-center gap-3">
      <div className={`shrink-0 flex items-center justify-center h-[20px] w-[20px] ${active ? "text-[#6D4AFF] dark:text-violet-400" : "text-slate-500 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-200"}`}>
        {icon}
      </div>
      {!collapsed && <span>{label}</span>}
    </div>
  );

  const elementClassName = `w-full flex items-center justify-between h-[44px] rounded-[12px] transition-all duration-200 group relative text-[14px] font-medium
    ${active 
      ? "bg-[#F3EFFF] dark:bg-violet-950/40 text-[#6D4AFF] dark:text-violet-400" 
      : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/60 dark:hover:bg-slate-800/40"
    }
    ${collapsed ? "justify-center px-0" : "px-3.5"}
  `;

  return (
    <div className="space-y-2">
      {href ? (
        <Link href={href} className={elementClassName}>
          {buttonContent}
          {collapsed && (
            <div className="absolute left-16 scale-0 group-hover:scale-100 bg-slate-950 text-white text-[10px] font-bold px-2 py-1 rounded-md transition-all shadow-md z-50 whitespace-nowrap">
              {label}
            </div>
          )}
        </Link>
      ) : (
        <button
          onClick={() => {
            if (onClick) onClick();
            if (hasSubmenu) setIsOpen(!isOpen);
          }}
          className={elementClassName}
        >
          {buttonContent}
          {!collapsed && hasSubmenu && (
            <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
          )}
          {collapsed && (
            <div className="absolute left-16 scale-0 group-hover:scale-100 bg-slate-950 text-white text-[10px] font-bold px-2 py-1 rounded-md transition-all shadow-md z-50 whitespace-nowrap">
              {label}
            </div>
          )}
        </button>
      )}

      {!collapsed && hasSubmenu && isOpen && submenu && (
        <div className="pl-6 border-l border-slate-100 dark:border-slate-800 ml-5 space-y-2 mt-2 text-[13px] font-medium">
          {submenu.map((sub) => {
            const subElement = (
              <span className={`w-full flex items-center py-1.5 px-2 hover:text-[#6D4AFF] dark:hover:text-violet-400 rounded-md text-left transition ${
                sub.active 
                  ? "text-[#6D4AFF] dark:text-violet-400 font-semibold bg-[#F3EFFF] dark:bg-violet-950/30" 
                  : "text-slate-400 hover:bg-slate-100/40 dark:hover:bg-slate-850"
              }`}>
                {sub.label}
              </span>
            );

            return sub.href ? (
              <Link key={sub.label} href={sub.href} className="block w-full">
                {subElement}
              </Link>
            ) : (
              <button key={sub.label} onClick={sub.onClick} className="w-full block">
                {subElement}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function AdminNewsletterClient({ initialNewsletters, initialSubscribers }: AdminNewsletterClientProps) {
  const [newsletters, setNewsletters] = useState<Newsletter[]>(initialNewsletters);
  const [subscribers, setSubscribers] = useState<Subscriber[]>(initialSubscribers);

  // Layout states
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Tab and sub-feature states
  const [activeTab, setActiveTab] = useState<"all-blogs" | "create-blog" | "categories" | "tags">("all-blogs");
  const [activeSection, setActiveSection] = useState<"blogs" | "newsletter">("blogs");
  const [categoriesList, setCategoriesList] = useState([
    { name: "Creator Economy", desc: "Covers newsletters on monetization, platform algorithms, and audience growth." },
    { name: "Platform Insights", desc: "Breakdowns of new features and API shifts on TikTok, Reels, YouTube, X, etc." },
    { name: "Business", desc: "In-depth strategies on negotiating brand deals, contracts, and legal frameworks." },
    { name: "Industry Trends", desc: "Macro data reports and analysis on content consumption habits and industry forecasts." }
  ]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryDesc, setNewCategoryDesc] = useState("");
  const [tagsList, setTagsList] = useState(["SEO", "Marketing", "Sponsorships", "Legal", "Tech", "Briefing", "Growth"]);
  const [newTagName, setNewTagName] = useState("");

  // Edit Mode state
  const [editId, setEditId] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [category, setCategory] = useState("Creator Economy");
  const [tags, setTags] = useState("");
  const [slug, setSlug] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");

  // AI Smart Import states
  const [aiInput, setAiInput] = useState("");
  const [aiMode, setAiMode] = useState<"auto" | "news" | "creator" | "standard">("auto");
  const [aiImporting, setAiImporting] = useState(false);
  const [aiStep, setAiStep] = useState(0); // 0: Idle, 1: Analyzing, 2: Structuring, 3: Cleaning, 4: Metadata, 5: Done
  const [showAiImport, setShowAiImport] = useState(true);
  const [showSeoSettings, setShowSeoSettings] = useState(false);

  // Status message states
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Add Subscriber modal states
  const [isAddSubOpen, setIsAddSubOpen] = useState(false);
  const [newSubEmail, setNewSubEmail] = useState("");
  const [addSubPending, setAddSubPending] = useState(false);

  // Tabs states
  const [blogFilterTab, setBlogFilterTab] = useState<"All" | "Published" | "Drafts">("All");
  
  // Pagination states (set to 3 for ultra-compact visibility on 1440px viewport)
  const [blogPage, setBlogPage] = useState(1);
  const [subscriberPage, setSubscriberPage] = useState(1);
  const itemsPerPage = 3;

  const [isPending, startTransition] = useTransition();
  const titleInputRef = useRef<HTMLInputElement>(null);
  const [editorTab, setEditorTab] = useState<"write" | "preview">("write");
  const contentTextAreaRef = useRef<HTMLTextAreaElement>(null);

  const toggleTheme = () => {
    const nextDark = !isDarkMode;
    setIsDarkMode(nextDark);
    if (nextDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const handleEditClick = (post: Newsletter) => {
    setEditId(post.id);
    setTitle(post.title);
    setSummary(post.summary);
    setContent(post.content);
    setCoverImage(post.cover_image || "");
    setCategory(post.category);
    setTags(post.tags ? post.tags.join(", ") : "");
    setSlug(post.slug || "");
    setSeoTitle(post.seo_title || "");
    setSeoDescription(post.seo_description || "");
    
    setSuccessMsg("");
    setErrorMsg("");
    
    // Focus title input
    setTimeout(() => titleInputRef.current?.focus(), 100);
  };

  const handleCancelEdit = () => {
    resetForm();
    setActiveTab("all-blogs");
  };

  const resetForm = () => {
    setEditId(null);
    setTitle("");
    setSummary("");
    setContent("");
    setCoverImage("");
    setCategory("Creator Economy");
    setTags("");
    setSlug("");
    setSeoTitle("");
    setSeoDescription("");
    setAiInput("");
    setEditorTab("write");
    setShowSeoSettings(false);
  };

  const handleSaveDraft = async () => {
    await handleSubmitForm(false);
  };

  const handlePublishNow = async () => {
    await handleSubmitForm(true);
  };

  const handleSubmitForm = async (publish: boolean) => {
    if (!title || !title.trim()) {
      setErrorMsg("Please enter a blog title.");
      return;
    }
    setSuccessMsg("");
    setErrorMsg("");

    const formData = new FormData();
    formData.append("title", title);
    formData.append("summary", summary || `Weekly breakdown on ${category}.`);
    formData.append("content", content || "Blog content coming soon...");
    formData.append("cover_image", coverImage);
    formData.append("category", category);
    formData.append("tags", tags);
    formData.append("is_published", String(publish));
    formData.append("slug", slug);
    formData.append("seo_title", seoTitle);
    formData.append("seo_description", seoDescription);

    startTransition(async () => {
      try {
        if (editId) {
          const updated = await updateNewsletterAction(editId, formData);
          setNewsletters(prev => prev.map(n => n.id === editId ? updated : n));
          setSuccessMsg(`Newsletter issue successfully ${publish ? "published" : "saved as draft"}!`);
        } else {
          const created = await createNewsletterAction(formData);
          setNewsletters(prev => [created, ...prev]);
          setSuccessMsg(`New newsletter issue successfully ${publish ? "published" : "created as draft"}!`);
        }
        resetForm();
        setActiveTab("all-blogs");
        setTimeout(() => setSuccessMsg(""), 3000);
      } catch (err: any) {
        setErrorMsg(err.message || "An error occurred while saving the newsletter.");
      }
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this newsletter issue?")) return;

    try {
      await deleteNewsletterAction(id);
      setNewsletters(prev => prev.filter(n => n.id !== id));
      setSuccessMsg("Issue deleted successfully!");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to delete issue.");
      setTimeout(() => setErrorMsg(""), 3000);
    }
  };

  const handleTogglePublish = async (id: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus;
    try {
      const updated = await togglePublishNewsletterAction(id, nextStatus);
      setNewsletters(prev => prev.map(n => n.id === id ? updated : n));
      setSuccessMsg(`Issue successfully ${nextStatus ? "published" : "drafted"}!`);
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update publish status.");
      setTimeout(() => setErrorMsg(""), 3000);
    }
  };

  // New handler to generate drafts via API
  const handleGenerateDrafts = async () => {
    if (isPending) return;
    try {
      const res = await fetch('/api/generate-drafts', { method: 'POST' });
      const result = await res.json();
      if (result.success) {
        setSuccessMsg(`Generated ${result.inserted} draft articles. Reloading...`);
        setTimeout(() => {
          setSuccessMsg('');
          window.location.reload();
        }, 1500);
      } else {
        throw new Error(result.error || 'Failed to generate drafts');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error generating drafts');
      setTimeout(() => setErrorMsg(''), 4000);
    }
  };

  const handleExportCSV = () => {
    if (subscribers.length === 0) return;
    const headers = "ID,Email,Date Subscribed\n";
    const rows = subscribers.map(s => `"${s.id}","${s.email}","${s.created_at}"`).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `wecollab_newsletter_subscribers_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleAddSubscriberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubEmail || !newSubEmail.includes("@")) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }
    setAddSubPending(true);
    try {
      const res = await subscribeAction(newSubEmail);
      if (res.success) {
        setSuccessMsg("Subscriber added successfully!");
        setSubscribers(prev => [{
          id: Math.random().toString(),
          email: newSubEmail,
          created_at: new Date().toISOString()
        }, ...prev]);
        setNewSubEmail("");
        setIsAddSubOpen(false);
      } else {
        setErrorMsg(res.error || "Failed to add subscriber.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred.");
    } finally {
      setAddSubPending(false);
      setTimeout(() => {
        setSuccessMsg("");
        setErrorMsg("");
      }, 3000);
    }
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName) return;
    if (categoriesList.some(c => c.name.toLowerCase() === newCategoryName.toLowerCase())) {
      setErrorMsg("Category already exists.");
      setTimeout(() => setErrorMsg(""), 3000);
      return;
    }
    setCategoriesList(prev => [...prev, { name: newCategoryName, desc: newCategoryDesc || "No description provided." }]);
    setNewCategoryName("");
    setNewCategoryDesc("");
    setSuccessMsg("Category created successfully!");
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const handleDeleteCategory = (name: string) => {
    if (["Creator Economy", "Platform Insights", "Business", "Industry Trends"].includes(name)) {
      setErrorMsg("Cannot delete system default categories.");
      setTimeout(() => setErrorMsg(""), 3000);
      return;
    }
    setCategoriesList(prev => prev.filter(c => c.name !== name));
    setSuccessMsg("Category deleted successfully.");
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName) return;
    const formattedTag = newTagName.trim();
    if (tagsList.some(t => t.toLowerCase() === formattedTag.toLowerCase())) {
      setErrorMsg("Tag already exists.");
      setTimeout(() => setErrorMsg(""), 3000);
      return;
    }
    setTagsList(prev => [...prev, formattedTag]);
    setNewTagName("");
    setSuccessMsg("Tag created successfully!");
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const handleDeleteTag = (tag: string) => {
    setTagsList(prev => prev.filter(t => t !== tag));
    setSuccessMsg("Tag deleted successfully.");
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const parseMarkdownToHtml = (md: string): string => {
    if (!md) return "";
    let html = md
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Headers (must be at start of lines)
    html = html.replace(/^### (.*?)$/gm, "<h5 class='text-sm font-extrabold text-slate-800 dark:text-white mt-4 mb-2'>$1</h5>");
    html = html.replace(/^## (.*?)$/gm, "<h4 class='text-base font-extrabold text-slate-800 dark:text-white mt-4 mb-2'>$1</h4>");
    html = html.replace(/^# (.*?)$/gm, "<h3 class='text-lg font-extrabold text-slate-900 dark:text-white mt-5 mb-2.5 pb-1 border-b border-slate-100 dark:border-slate-800'>$1</h3>");

    // Blockquotes
    html = html.replace(/^&gt; (.*?)$/gm, "<blockquote class='border-l-4 border-violet-500 pl-4 py-1.5 my-2.5 bg-slate-50 dark:bg-slate-955/40 text-slate-600 dark:text-slate-400 italic rounded-r-lg'>$1</blockquote>");

    // Code Blocks
    html = html.replace(/```([\s\S]*?)```/g, "<pre class='bg-slate-100 dark:bg-slate-950 p-3 rounded-[12px] my-3 overflow-x-auto font-mono text-[11px] border border-slate-200/50 dark:border-slate-800/80'><code class='text-slate-800 dark:text-slate-350'>$1</code></pre>");

    // Inline Code
    html = html.replace(/`([^`]+)`/g, "<code class='bg-slate-100 dark:bg-slate-950 px-1.5 py-0.5 rounded font-mono text-[10px] text-violet-650 dark:text-violet-400 border border-slate-200/35 dark:border-slate-800/40'>$1</code>");

    // Images
    html = html.replace(/!\[(.*?)\]\((.*?)\)/g, "<img src='$2' alt='$1' class='rounded-[16px] my-4 max-h-[200px] object-cover shadow-xs' />");

    // Links
    html = html.replace(/\[(.*?)\]\((.*?)\)/g, "<a href='$2' target='_blank' class='text-[#6D4AFF] dark:text-violet-400 font-bold hover:underline'>$1</a>");

    // Bold
    html = html.replace(/\*\*([\s\S]*?)\*\*/g, "<strong class='font-extrabold text-slate-900 dark:text-white'>$1</strong>");

    // Italic
    html = html.replace(/\*([\s\S]*?)\*/g, "<em class='italic text-slate-700 dark:text-slate-350'>$1</em>");

    // Bullet Lists (basic line matches)
    html = html.replace(/^- (.*?)$/gm, "<li class='list-disc ml-5 my-1 text-slate-650 dark:text-slate-350'>$1</li>");

    // Paragraphs / Linebreaks
    html = html.split("\n\n").map(p => {
      if (p.trim().startsWith("<h") || p.trim().startsWith("<blockquote") || p.trim().startsWith("<pre") || p.trim().startsWith("<li")) {
        return p;
      }
      return `<p class='my-2.5 text-xs text-slate-650 dark:text-slate-350 leading-relaxed font-semibold'>${p.replace(/\n/g, "<br/>")}</p>`;
    }).join("\n");

    return html;
  };

  const insertMarkdown = (syntax: string) => {
    const textarea = contentTextAreaRef.current;
    if (!textarea) {
      setContent(prev => prev + syntax);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;

    const before = text.substring(0, start);
    const after = text.substring(end, text.length);
    const selectedText = text.substring(start, end);

    let replacement = syntax;
    let newCursorPos = start + syntax.length;

    if (selectedText) {
      if (syntax === "**bold**") {
        replacement = `**${selectedText}**`;
        newCursorPos = start + replacement.length;
      } else if (syntax === "*italic*") {
        replacement = `*${selectedText}*`;
        newCursorPos = start + replacement.length;
      } else if (syntax === "\n`code`\n") {
        replacement = `\`${selectedText}\``;
        newCursorPos = start + replacement.length;
      } else if (syntax === "\n# Heading\n") {
        replacement = `\n# ${selectedText}\n`;
        newCursorPos = start + replacement.length;
      } else if (syntax === "\n> Quote\n") {
        replacement = `\n> ${selectedText}\n`;
        newCursorPos = start + replacement.length;
      } else if (syntax === "[link](url)") {
        replacement = `[${selectedText}](url)`;
        newCursorPos = start + replacement.length;
      } else if (syntax === "![alt text](image-url)") {
        replacement = `![${selectedText}](image-url)`;
        newCursorPos = start + replacement.length;
      }
    } else {
      // Empty selection: insert empty syntax tags and position the cursor inside them
      if (syntax === "**bold**") {
        replacement = "****";
        newCursorPos = start + 2;
      } else if (syntax === "*italic*") {
        replacement = "**";
        newCursorPos = start + 1;
      } else if (syntax === "\n`code`\n") {
        replacement = "``";
        newCursorPos = start + 1;
      } else if (syntax === "\n# Heading\n") {
        replacement = "# ";
        newCursorPos = start + 2;
      } else if (syntax === "\n> Quote\n") {
        replacement = "> ";
        newCursorPos = start + 2;
      } else if (syntax === "\n- Item\n") {
        replacement = "- ";
        newCursorPos = start + 2;
      } else if (syntax === "[link](url)") {
        replacement = "[](url)";
        newCursorPos = start + 1;
      } else if (syntax === "![alt text](image-url)") {
        replacement = "![](url)";
        newCursorPos = start + 2;
      }
    }

    const newContent = before + replacement + after;
    setContent(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 50);
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "Draft";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  const getSubscriberName = (email: string) => {
    const parts = email.split('@')[0];
    return parts.charAt(0).toUpperCase() + parts.slice(1).replace(/[._-]/g, ' ');
  };

  const getCategoryBadgeColor = (cat: string) => {
    switch (cat) {
      case "Creator Economy": return "bg-violet-50 text-violet-700 border border-violet-100 dark:bg-violet-950/40 dark:text-violet-400 dark:border-violet-800/40";
      case "Platform Insights": return "bg-blue-50 text-blue-700 border border-blue-100 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/40";
      case "Business": return "bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40";
      case "Industry Trends": return "bg-amber-50 text-amber-700 border border-amber-100 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/40";
      default: return "bg-slate-50 text-slate-700 border border-slate-100 dark:bg-slate-800/40 dark:text-slate-400 dark:border-slate-700/40";
    }
  };

  // Filtered lists
  const filteredBlogs = newsletters.filter(n => {
    if (blogFilterTab === "Published") return n.is_published;
    if (blogFilterTab === "Drafts") return !n.is_published;
    return true;
  });

  // Paginated slices
  const totalBlogResults = filteredBlogs.length;
  const paginatedBlogs = filteredBlogs.slice((blogPage - 1) * itemsPerPage, blogPage * itemsPerPage);
  const totalBlogPages = Math.ceil(totalBlogResults / itemsPerPage) || 1;

  const totalSubscribersResults = subscribers.length;
  const paginatedSubscribers = subscribers.slice((subscriberPage - 1) * itemsPerPage, subscriberPage * itemsPerPage);
  const totalSubscriberPages = Math.ceil(totalSubscribersResults / itemsPerPage) || 1;

  const wordCount = content ? content.trim().split(/\s+/).filter(Boolean).length : 0;
  const readTime = Math.ceil(wordCount / 225) || 0;

  const handleAiImport = async () => {
    if (!aiInput || !aiInput.trim()) {
      setErrorMsg("Please paste some content or a URL first.");
      return;
    }
    
    setAiImporting(true);
    setSuccessMsg("");
    setErrorMsg("");
    
    setAiStep(1); // 🔍 Analyzing content type...
    
    const stepTimers = [
      setTimeout(() => setAiStep(2), 1500),  // ✍️ Structuring sections & Headings...
      setTimeout(() => setAiStep(3), 3200),  // 🧹 Cleaning content & grammar...
      setTimeout(() => setAiStep(4), 5000),  // 🏷️ Generating Category, Tags & SEO...
    ];

    try {
      const response = await fetch("/api/admin/import-article", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          content: aiInput,
          mode: aiMode
        })
      });
      
      const result = await response.json();
      
      stepTimers.forEach(clearTimeout);
      
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to process content");
      }
      
      const { data, isScrapedUrl } = result;
      
      setAiStep(5); // 📝 Populating Editor...
      
      setTimeout(() => {
        setTitle(data.title || "");
        setSummary(data.summary || "");
        setContent(data.content || "");
        setCategory(data.category || "Creator Economy");
        setTags(data.tags ? data.tags.join(", ") : "");
        setSlug(data.slug || "");
        setSeoTitle(data.seoTitle || "");
        setSeoDescription(data.seoDescription || "");
        
        setAiImporting(false);
        setAiInput("");
        setAiStep(0);
        setSuccessMsg(
          isScrapedUrl 
            ? "✨ URL content fetched, structured and imported successfully!" 
            : "✨ Content structured, formatted and imported successfully!"
        );
        setTimeout(() => setSuccessMsg(""), 4000);
      }, 800);
      
    } catch (err: any) {
      stepTimers.forEach(clearTimeout);
      console.error(err);
      setErrorMsg(err.message || "An error occurred during AI import.");
      setAiImporting(false);
      setAiStep(0);
    }
  };

  const renderBlogEditor = (isFullWidth: boolean) => {
    return (
      <div className={`bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 rounded-[20px] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.05)] flex flex-col min-h-[440px] justify-between ${isFullWidth ? "max-w-4xl mx-auto w-full" : "w-full"}`}>
        
        {/* Header and Action Buttons */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800 mb-4">
          <div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">Blog Editor</h3>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-0.5">Compose blog posts & newsletters.</p>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={isPending}
              className="border border-slate-200 dark:border-slate-800 hover:bg-slate-55/40 rounded-[12px] px-3.5 py-1.5 text-xs font-bold text-slate-650 dark:text-slate-450 transition disabled:opacity-50"
            >
              Save Draft
            </button>
            <button
              type="button"
              onClick={handlePublishNow}
              disabled={isPending}
              className="bg-violet-600 hover:bg-violet-700 text-white rounded-[12px] px-3.5 py-1.5 text-xs font-bold transition shadow-sm disabled:opacity-50"
            >
              {isPending ? "Saving..." : "Publish"}
            </button>
            {/* Generate Drafts Button */}
            <button
              type="button"
              onClick={handleGenerateDrafts}
              disabled={isPending}
              className="ml-2 bg-slate-200 hover:bg-slate-300 text-slate-800 dark:bg-slate-700 dark:text-slate-200 rounded-[12px] px-3.5 py-1.5 text-xs font-medium transition disabled:opacity-50"
            >
              Generate 50 Drafts
            </button>
          </div>
        </div>
        
        {/* AI Smart Import Panel */}
        <div className="bg-gradient-to-br from-violet-50/70 to-indigo-50/50 dark:from-violet-950/20 dark:to-indigo-950/10 border border-violet-100/80 dark:border-violet-850/50 p-4 rounded-[16px] mb-4 shadow-sm">
          <button
            type="button"
            onClick={() => setShowAiImport(!showAiImport)}
            className="w-full flex items-center justify-between text-left focus:outline-none"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="h-4.5 w-4.5 text-violet-600 dark:text-violet-400" />
              <span className="font-extrabold text-slate-900 dark:text-white text-xs">AI Smart Article Import ("Paste Anything")</span>
            </div>
            <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${showAiImport ? "rotate-180" : ""}`} />
          </button>

          {showAiImport && (
            <div className="mt-3 space-y-3">
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal font-semibold">
                Paste news articles, research, press releases, notes, WhatsApp messages, Reddit discussions, transcripts, URLs, or raw content and let AI convert it into a professional blog post.
              </p>
              
              <textarea
                rows={3}
                placeholder="Paste content or a URL here..."
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                disabled={aiImporting}
                className="w-full rounded-[12px] border border-slate-200 dark:border-slate-800 px-3 py-2 text-xs text-slate-750 dark:text-slate-300 outline-none bg-white dark:bg-slate-950 font-semibold focus:border-violet-500 placeholder-slate-400 transition min-h-[90px] resize-y"
              />

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
                <div>
                  <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-1">Target Template Mode</label>
                  <select
                    value={aiMode}
                    onChange={(e) => setAiMode(e.target.value as any)}
                    disabled={aiImporting}
                    className="rounded-[10px] border border-slate-200 dark:border-slate-800 px-2.5 py-1.5 text-[11px] text-slate-650 dark:text-slate-350 bg-white dark:bg-slate-955 outline-none font-bold cursor-pointer"
                  >
                    <option value="auto">✨ Auto-Detect (Recommended)</option>
                    <option value="news">📰 News / Press Release Mode</option>
                    <option value="creator">🚀 Creator Economy Mode</option>
                    <option value="standard">📝 Standard Professional Mode</option>
                  </select>
                </div>

                <div className="flex justify-end items-end h-full">
                  <button
                    type="button"
                    onClick={handleAiImport}
                    disabled={aiImporting || !aiInput.trim()}
                    className="bg-violet-600 hover:bg-violet-700 text-white rounded-[12px] px-4 py-2 text-xs font-bold transition shadow-xs flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {aiImporting ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Processing AI Pipeline...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3.5 w-3.5 text-amber-300 animate-pulse" />
                        <span>✨ Generate Article</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {aiImporting && (
                <div className="mt-3 bg-white/60 dark:bg-slate-955/40 border border-violet-100/50 dark:border-violet-900/30 rounded-[12px] p-3 space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-bold text-violet-600 dark:text-violet-400">
                    <span>AI Smart Pipeline is active</span>
                    <span className="animate-pulse">Step {aiStep} of 5</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-violet-500 to-indigo-600 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${(aiStep / 5) * 100}%` }}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[9px] font-bold text-slate-400 dark:text-slate-500">
                    <span className={aiStep >= 1 ? "text-violet-600 dark:text-violet-400 flex items-center gap-1" : "flex items-center gap-1"}>
                      {aiStep > 1 ? "✓" : "🔍"} 1. Content Analysis
                    </span>
                    <span className={aiStep >= 2 ? "text-violet-600 dark:text-violet-400 flex items-center gap-1" : "flex items-center gap-1"}>
                      {aiStep > 2 ? "✓" : "✍️"} 2. Dynamic Structuring
                    </span>
                    <span className={aiStep >= 3 ? "text-violet-600 dark:text-violet-400 flex items-center gap-1" : "flex items-center gap-1"}>
                      {aiStep > 3 ? "✓" : "🧹"} 3. Grammar & Text Cleaning
                    </span>
                    <span className={aiStep >= 4 ? "text-violet-600 dark:text-violet-400 flex items-center gap-1" : "flex items-center gap-1"}>
                      {aiStep > 4 ? "✓" : "🏷️"} 4. Metadata Generation
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <form onSubmit={(e) => e.preventDefault()} className="space-y-3 flex-1 flex flex-col">
          {/* Title Field */}
          <div>
            <label className="block text-[9px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider mb-1">Title</label>
            <input
              type="text"
              required
              ref={titleInputRef}
              placeholder="Enter blog title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-[12px] border border-slate-200 dark:border-slate-800 px-3 py-1.5 text-xs text-slate-750 dark:text-slate-300 outline-none bg-white dark:bg-slate-955 font-bold focus:border-violet-500 placeholder-slate-400 dark:placeholder-slate-550 transition"
            />
          </div>

          {/* Category & Tags Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[9px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-[12px] border border-slate-200 dark:border-slate-800 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 outline-none bg-white dark:bg-slate-955 font-semibold focus:border-violet-500 cursor-pointer"
              >
                {categoriesList.map(cat => (
                  <option key={cat.name} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[9px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider mb-1">Tags</label>
              <input
                type="text"
                placeholder="SEO, Legal, Tech"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full rounded-[12px] border border-slate-200 dark:border-slate-800 px-3 py-1.5 text-xs text-slate-750 dark:text-slate-300 outline-none bg-white dark:bg-slate-955 font-semibold focus:border-violet-500"
              />
            </div>
          </div>

          {/* Featured Image Row */}
          <div>
            <label className="block text-[9px] font-bold text-slate-400 dark:text-slate-550 tracking-wider uppercase mb-1">Featured Image URL</label>
            <input
              type="text"
              placeholder="https://images.unsplash.com/photo-..."
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
              className="w-full rounded-[12px] border border-slate-200 dark:border-slate-800 px-3 py-1.5 text-xs text-slate-705 dark:text-slate-300 outline-none bg-white dark:bg-slate-955 font-semibold focus:border-violet-500"
            />
          </div>

          {/* Summary Field */}
          <div>
            <label className="block text-[9px] font-bold text-slate-400 dark:text-slate-550 tracking-wider uppercase mb-1">Summary</label>
            <textarea
              rows={1}
              placeholder="A short snippet explaining the issue..."
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full rounded-[12px] border border-slate-200 dark:border-slate-800 px-3 py-1.5 text-xs text-slate-705 dark:text-slate-300 outline-none bg-white dark:bg-slate-955 font-semibold focus:border-violet-500 resize-none"
            />
          </div>

          {/* SEO & Metadata Settings */}
          <div className="border border-slate-150 dark:border-slate-800 rounded-[12px] overflow-hidden">
            <button
              type="button"
              onClick={() => setShowSeoSettings(!showSeoSettings)}
              className="w-full flex items-center justify-between px-3 py-2 bg-slate-50 dark:bg-slate-950/20 text-slate-700 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-850 transition text-[9px] font-extrabold uppercase tracking-wider select-none"
            >
              <div className="flex items-center gap-1.5">
                <Settings className="h-3.5 w-3.5 text-slate-500" />
                <span>SEO & Metadata Settings</span>
              </div>
              <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${showSeoSettings ? "rotate-180" : ""}`} />
            </button>

            {showSeoSettings && (
              <div className="p-3 space-y-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800/80">
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 dark:text-slate-555 uppercase tracking-wider mb-1">URL Slug</label>
                  <input
                    type="text"
                    placeholder="custom-url-slug (auto-generated if empty)"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="w-full rounded-[12px] border border-slate-200 dark:border-slate-800 px-3 py-1.5 text-xs text-slate-755 dark:text-slate-300 outline-none bg-white dark:bg-slate-955 font-semibold focus:border-violet-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-[9px] font-bold text-slate-400 dark:text-slate-555 uppercase tracking-wider">SEO Meta Title</label>
                    <span className={`text-[8px] font-bold ${seoTitle.length > 60 ? "text-amber-500" : "text-slate-400"}`}>{seoTitle.length}/60 chars</span>
                  </div>
                  <input
                    type="text"
                    placeholder="SEO-optimized meta title (auto-generated if empty)"
                    value={seoTitle}
                    onChange={(e) => setSeoTitle(e.target.value)}
                    className="w-full rounded-[12px] border border-slate-200 dark:border-slate-800 px-3 py-1.5 text-xs text-slate-755 dark:text-slate-300 outline-none bg-white dark:bg-slate-955 font-semibold focus:border-violet-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-[9px] font-bold text-slate-400 dark:text-slate-555 uppercase tracking-wider">SEO Meta Description</label>
                    <span className={`text-[8px] font-bold ${seoDescription.length > 160 ? "text-amber-500" : "text-slate-400"}`}>{seoDescription.length}/160 chars</span>
                  </div>
                  <textarea
                    rows={2}
                    placeholder="SEO meta description (auto-generated if empty)"
                    value={seoDescription}
                    onChange={(e) => setSeoDescription(e.target.value)}
                    className="w-full rounded-[12px] border border-slate-200 dark:border-slate-800 px-3 py-1.5 text-xs text-slate-755 dark:text-slate-300 outline-none bg-white dark:bg-slate-955 font-semibold focus:border-violet-500 resize-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Rich Text Editor Toolbars & Editor Textarea */}
          <div className="flex-1 flex flex-col border border-slate-200/80 dark:border-slate-800 rounded-[12px] overflow-hidden min-h-[160px]">
            <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-950 border-b border-slate-200/80 dark:border-slate-800 py-1.5 px-2 text-slate-450 dark:text-slate-550 shrink-0 select-none">
              
              {/* Tab toggles: Write and Preview */}
              <div className="flex gap-1 p-0.5 bg-slate-100/80 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[8px] mr-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setEditorTab("write")}
                  className={`px-2 py-0.5 rounded-[6px] text-[10px] font-bold transition ${
                    editorTab === "write" ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs" : "text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
                >
                  Write
                </button>
                <button
                  type="button"
                  onClick={() => setEditorTab("preview")}
                  className={`px-2 py-0.5 rounded-[6px] text-[10px] font-bold transition ${
                    editorTab === "preview" ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs" : "text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
                >
                  Preview
                </button>
              </div>

              {/* Only show formatting options in "write" tab */}
              {editorTab === "write" && (
                <>
                  <button type="button" onClick={() => insertMarkdown("\n# Heading\n")} className="p-1 hover:text-slate-800 dark:hover:text-slate-200 transition" title="Heading"><Heading className="h-3.5 w-3.5" /></button>
                  <button type="button" onClick={() => insertMarkdown("**bold**")} className="p-1 hover:text-slate-800 dark:hover:text-slate-200 transition" title="Bold"><Bold className="h-3.5 w-3.5" /></button>
                  <button type="button" onClick={() => insertMarkdown("*italic*")} className="p-1 hover:text-slate-800 dark:hover:text-slate-200 transition" title="Italic"><Italic className="h-3.5 w-3.5" /></button>
                  <button type="button" onClick={() => insertMarkdown("\n- Item\n")} className="p-1 hover:text-slate-800 dark:hover:text-slate-200 transition" title="Bullet List"><List className="h-3.5 w-3.5" /></button>
                  <button type="button" onClick={() => insertMarkdown("\n> Quote\n")} className="p-1 hover:text-slate-800 dark:hover:text-slate-200 transition" title="Quote"><Quote className="h-3.5 w-3.5" /></button>
                  <button type="button" onClick={() => insertMarkdown("\n`code`\n")} className="p-1 hover:text-slate-800 dark:hover:text-slate-200 transition" title="Code"><Code className="h-3.5 w-3.5" /></button>
                  <button type="button" onClick={() => insertMarkdown("[link](url)")} className="p-1 hover:text-slate-800 dark:hover:text-slate-200 transition" title="Insert Link"><LinkIcon className="h-3.5 w-3.5" /></button>
                  <button type="button" onClick={() => insertMarkdown("![alt text](image-url)")} className="p-1 hover:text-slate-800 dark:hover:text-slate-200 transition" title="Insert Image"><ImageIcon className="h-3.5 w-3.5" /></button>
                  <div className="h-3.5 w-px bg-slate-200 dark:bg-slate-800 mx-1.5" />
                </>
              )}
              <span className="text-[8px] font-extrabold uppercase tracking-wider text-slate-350 ml-auto">Markdown</span>
            </div>

            {editorTab === "write" ? (
              <textarea
                ref={contentTextAreaRef}
                placeholder="Write your blog content here... (Markdown supported)"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full flex-1 bg-transparent p-3 text-xs text-slate-755 dark:text-slate-300 font-mono leading-relaxed outline-none border-none resize-none focus:ring-0 min-h-[120px] overflow-y-auto"
              />
            ) : (
              <div 
                className="w-full flex-1 bg-transparent p-4 overflow-y-auto min-h-[120px] max-w-none text-xs text-slate-700 dark:text-slate-300 border-none outline-none font-semibold leading-relaxed"
                dangerouslySetInnerHTML={{ __html: parseMarkdownToHtml(content) || "<p class='text-slate-400 italic text-center py-8'>Nothing to preview. Start writing content...</p>" }}
              />
            )}
          </div>

          {/* Character/Words Counts */}
          <div className="flex items-center justify-between text-[9px] font-bold text-slate-355 dark:text-slate-600 pt-1 shrink-0">
            <span>Active Editor Mode ({editorTab === "write" ? "Editing" : "Previewing"})</span>
            <span>{wordCount} words | {readTime} min read</span>
          </div>
        </form>

        {editId && (
          <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-850 flex justify-end shrink-0">
            <button
              onClick={handleCancelEdit}
              className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-250 transition"
            >
              <Undo className="h-3.5 w-3.5" /> Cancel Editing
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex w-full bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 transition-colors duration-300 gap-6">
      
      {/* Global Toast Messages */}
      {(successMsg || errorMsg) && (
        <div className="fixed top-24 right-8 z-50 animate-bounce">
          {successMsg && (
            <div className="flex items-center gap-2 px-5 py-3 rounded-[12px] bg-emerald-600 text-white text-xs font-bold shadow-lg shadow-emerald-600/20">
              <CheckCircle className="h-4 w-4" /> {successMsg}
            </div>
          )}
          {errorMsg && (
            <div className="flex items-center gap-2 px-5 py-3 rounded-[12px] bg-rose-600 text-white text-xs font-bold shadow-lg shadow-rose-600/20">
              <AlertCircle className="h-4 w-4" /> {errorMsg}
            </div>
          )}
        </div>
      )}

      {/* Mobile Menu Drawer Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside 
        className={`flex flex-col bg-white dark:bg-slate-900 border-r border-[#EAEAEA] dark:border-slate-800 transition-all duration-300 shrink-0
          ${isMobileMenuOpen ? "absolute inset-y-0 left-0 z-50 w-[240px] p-6 shadow-xl" : "hidden lg:flex"}
          ${isSidebarCollapsed ? "lg:w-[60px]" : "lg:w-[240px] lg:pr-6"}
        `}
      >
        <div className="flex flex-col flex-1 py-2 overflow-y-auto">
          {/* Collapse Button Header */}
          <div className="flex items-center justify-between mb-6">
            {!isSidebarCollapsed && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Newsletter Navigation</span>
            )}
            <button 
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="hidden lg:flex p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-655 transition mx-auto lg:mx-0"
            >
              {isSidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
          </div>

          {/* Navigation Items (stacked with 8px/space-y-2 spacing) */}
          <nav className="flex-1 space-y-2">
            <SidebarItem 
              icon={<LayoutDashboard className="h-[18px] w-[18px]" />} 
              label="Dashboard" 
              collapsed={isSidebarCollapsed} 
              active={false} 
              href="/admin"
            />
            <SidebarItem 
              icon={<FileText className="h-[18px] w-[18px]" />} 
              label="Blogs" 
              collapsed={isSidebarCollapsed} 
              active={activeSection === "blogs"} 
              hasSubmenu={true}
              submenu={[
                { label: "All Blogs", active: activeTab === "all-blogs" && activeSection === "blogs", onClick: () => { setActiveTab("all-blogs"); setActiveSection("blogs"); } },
                { label: "Create Blog", active: activeTab === "create-blog" && activeSection === "blogs", onClick: () => { setActiveTab("create-blog"); setActiveSection("blogs"); resetForm(); } },
                { label: "Categories", active: activeTab === "categories" && activeSection === "blogs", onClick: () => { setActiveTab("categories"); setActiveSection("blogs"); } },
                { label: "Tags", active: activeTab === "tags" && activeSection === "blogs", onClick: () => { setActiveTab("tags"); setActiveSection("blogs"); } },
              ]}
            />
            <SidebarItem 
              icon={<Mail className="h-[18px] w-[18px]" />} 
              label="Newsletter" 
              collapsed={isSidebarCollapsed} 
              active={activeSection === "newsletter"} 
              hasSubmenu={true}
              isOpenDefault={true}
              submenu={[
                { label: "All Newsletters", active: activeTab === "all-blogs" && activeSection === "newsletter" && blogFilterTab !== "Drafts", onClick: () => { setActiveTab("all-blogs"); setActiveSection("newsletter"); setBlogFilterTab("All"); } },
                { label: "Create Newsletter", active: activeTab === "create-blog" && activeSection === "newsletter", onClick: () => { setActiveTab("create-blog"); setActiveSection("newsletter"); resetForm(); } },
                { label: "Scheduled Campaigns", active: activeTab === "all-blogs" && activeSection === "newsletter" && blogFilterTab === "Drafts", onClick: () => { setActiveTab("all-blogs"); setActiveSection("newsletter"); setBlogFilterTab("Drafts"); } },
                { label: "Templates", active: false, onClick: () => { setActiveTab("all-blogs"); setActiveSection("newsletter"); } },
              ]}
            />
            <SidebarItem 
              icon={<Users className="h-[18px] w-[18px]" />} 
              label="Subscribers" 
              collapsed={isSidebarCollapsed} 
              active={false} 
              hasSubmenu={true}
              submenu={[
                { label: "All Subscribers", active: false, onClick: () => { setActiveTab("all-blogs"); setTimeout(() => document.getElementById("subscribers-section")?.scrollIntoView({ behavior: "smooth" }), 100); } },
                { label: "Segments", active: false, onClick: () => setActiveTab("all-blogs") },
                { label: "Growth Analytics", active: false, onClick: () => setActiveTab("all-blogs") },
              ]}
            />
            <SidebarItem 
              icon={<Activity className="h-[18px] w-[18px]" />} 
              label="Analytics" 
              collapsed={isSidebarCollapsed} 
              active={false} 
              hasSubmenu={true}
              submenu={[
                { label: "Content Analytics", active: false, onClick: () => { setActiveTab("all-blogs"); setTimeout(() => document.getElementById("analytics-section")?.scrollIntoView({ behavior: "smooth" }), 100); } },
                { label: "Newsletter Analytics", active: false, onClick: () => { setActiveTab("all-blogs"); setTimeout(() => document.getElementById("analytics-section")?.scrollIntoView({ behavior: "smooth" }), 100); } },
                { label: "Audience Analytics", active: false, onClick: () => { setActiveTab("all-blogs"); setTimeout(() => document.getElementById("analytics-section")?.scrollIntoView({ behavior: "smooth" }), 100); } },
              ]}
            />
            <SidebarItem 
              icon={<BookOpen className="h-[18px] w-[18px]" />} 
              label="Media Library" 
              collapsed={isSidebarCollapsed} 
              active={false} 
            />
            <SidebarItem 
              icon={<Layers className="h-[18px] w-[18px]" />} 
              label="Pages" 
              collapsed={isSidebarCollapsed} 
              active={false} 
            />
            <SidebarItem 
              icon={<MessageSquare className="h-[18px] w-[18px]" />} 
              label="Comments" 
              collapsed={isSidebarCollapsed} 
              active={false} 
            />
          </nav>

          {/* Bottom Sections: Settings and Upgrade Card */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
            <SidebarItem 
              icon={<Settings className="h-[18px] w-[18px]" />} 
              label="Settings" 
              collapsed={isSidebarCollapsed} 
              active={false} 
              hasSubmenu={true}
              submenu={[
                { label: "General Settings", active: false, href: "/admin/settings" },
                { label: "SEO Settings", active: false, href: "/admin/settings" },
                { label: "Email Settings", active: false, href: "/admin/settings" },
                { label: "Team Management", active: false, href: "/admin/settings" },
              ]}
            />
            {!isSidebarCollapsed && (
              <div className="bg-gradient-to-br from-violet-600 to-indigo-700 p-4 rounded-[20px] shadow-[0_4px_12px_rgba(124,58,237,0.15)] relative overflow-hidden group">
                <div className="absolute top-[-20%] right-[-10%] w-24 h-24 bg-white/10 rounded-full blur-xl group-hover:scale-110 transition duration-300" />
                <div className="relative z-10 space-y-2.5">
                  <div className="flex items-center gap-1.5 text-white">
                    <Sparkles className="h-4 w-4 text-amber-300 animate-pulse" />
                    <span className="text-[11px] font-bold uppercase tracking-wider">🚀 Upgrade to Pro</span>
                  </div>
                  <div className="text-[10px] text-violet-100 font-semibold leading-normal space-y-1">
                    <p className="font-bold">Unlock:</p>
                    <ul className="list-disc pl-3.5 space-y-0.5 text-[9px]">
                      <li>Advanced Analytics</li>
                      <li>Email Automation</li>
                      <li>AI Content Generation</li>
                      <li>Custom Branding</li>
                      <li>Team Collaboration</li>
                      <li>Priority Support</li>
                    </ul>
                  </div>
                  <button className="w-full bg-white hover:bg-slate-50 text-violet-700 text-[10px] font-extrabold py-2 px-3 rounded-[12px] transition shadow-xs">
                    Upgrade Now
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Panel */}
      <div className="flex-1 min-w-0 space-y-6">
        
        {/* Mobile secondary menu trigger */}
        <div className="lg:hidden flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 p-3 rounded-[12px]">
          <span className="text-xs font-bold text-slate-600 dark:text-slate-350">Newsletter Navigation</span>
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 transition"
          >
            <Menu className="h-4 w-4" />
          </button>
        </div>

        {/* Content Wrapper */}
        <div className="space-y-6">
          {/* Overview Statistics (Exactly 140px high cards, 24px gap spacing) */}
          {activeTab === "all-blogs" && (
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* KPI Card 1 */}
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 p-4 h-[140px] rounded-[20px] shadow-[0_4px_20px_rgba(0,0,0,0.05)] hover:shadow-[0_12px_30px_rgba(0,0,0,0.08)] transition-all duration-300 flex flex-col justify-between group">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-[10px] bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
                    <FileText className="h-4.5 w-4.5" />
                  </div>
                  <span className="text-slate-400 dark:text-slate-500 font-bold text-xs uppercase tracking-wider truncate">Total Blogs</span>
                </div>
                <div className="text-2xl font-extrabold text-slate-900 dark:text-white leading-none">
                  {newsletters.filter(n => n.is_published).length}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-emerald-500 font-bold text-[10px] flex items-center gap-0.5 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded-[6px]">
                    <TrendingUp className="h-3 w-3" /> +18.2%
                  </span>
                  <div className="w-18 h-8">
                    <svg viewBox="0 0 100 30" className="w-full h-full stroke-violet-500 fill-none" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M 0 25 Q 15 20, 30 18 T 60 10 T 80 15 T 100 5" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* KPI Card 2 */}
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 p-4 h-[140px] rounded-[20px] shadow-[0_4px_20px_rgba(0,0,0,0.05)] hover:shadow-[0_12px_30px_rgba(0,0,0,0.08)] transition-all duration-300 flex flex-col justify-between group">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-[10px] bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <FileText className="h-4.5 w-4.5" />
                  </div>
                  <span className="text-slate-400 dark:text-slate-500 font-bold text-xs uppercase tracking-wider truncate">Draft Articles</span>
                </div>
                <div className="text-2xl font-extrabold text-slate-900 dark:text-white leading-none">
                  {newsletters.filter(n => !n.is_published).length}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-rose-500 font-bold text-[10px] flex items-center gap-0.5 bg-rose-50 dark:bg-rose-950/40 px-1.5 py-0.5 rounded-[6px]">
                    <TrendingDown className="h-3 w-3" /> -6.4%
                  </span>
                  <div className="w-18 h-8">
                    <svg viewBox="0 0 100 30" className="w-full h-full stroke-amber-500 fill-none" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M 0 20 Q 20 25, 40 22 T 70 15 T 100 25" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* KPI Card 3 */}
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 p-4 h-[140px] rounded-[20px] shadow-[0_4px_20px_rgba(0,0,0,0.05)] hover:shadow-[0_12px_30px_rgba(0,0,0,0.08)] transition-all duration-300 flex flex-col justify-between group">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-[10px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Users className="h-4.5 w-4.5" />
                  </div>
                  <span className="text-slate-400 dark:text-slate-500 font-bold text-xs uppercase tracking-wider truncate">Subscribers</span>
                </div>
                <div className="text-2xl font-extrabold text-slate-900 dark:text-white leading-none">
                  {(12548 + subscribers.length).toLocaleString()}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-emerald-500 font-bold text-[10px] flex items-center gap-0.5 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded-[6px]">
                    <TrendingUp className="h-3 w-3" /> +21.3%
                  </span>
                  <div className="w-18 h-8">
                    <svg viewBox="0 0 100 30" className="w-full h-full stroke-emerald-500 fill-none" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M 0 28 Q 15 26, 30 20 T 60 12 T 80 10 T 100 2" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* KPI Card 4 */}
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 p-4 h-[140px] rounded-[20px] shadow-[0_4px_20px_rgba(0,0,0,0.05)] hover:shadow-[0_12px_30px_rgba(0,0,0,0.08)] transition-all duration-300 flex flex-col justify-between group">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-[10px] bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <BookOpen className="h-4.5 w-4.5" />
                  </div>
                  <span className="text-slate-400 dark:text-slate-500 font-bold text-xs uppercase tracking-wider truncate">Monthly Readers</span>
                </div>
                <div className="text-2xl font-extrabold text-slate-900 dark:text-white leading-none">
                  89,302
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-emerald-500 font-bold text-[10px] flex items-center gap-0.5 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded-[6px]">
                    <TrendingUp className="h-3 w-3" /> +14.7%
                  </span>
                  <div className="w-18 h-8">
                    <svg viewBox="0 0 100 30" className="w-full h-full stroke-blue-500 fill-none" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M 0 25 Q 15 28, 30 20 T 60 18 T 80 5 T 100 12" />
                    </svg>
                  </div>
                </div>
              </div>

            </section>
          )}

          {/* Middle Section: Split Layout (55% / 45% columns, 24px spacing) */}
          {activeTab === "all-blogs" && (
            <section className="flex flex-col lg:flex-row gap-6">
              
              {/* Left Column = 55% (Blog Management Table) */}
              <div className="w-full lg:w-[55%] flex flex-col gap-6">
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 rounded-[20px] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.05)] flex flex-col justify-between min-h-[440px]">
                  
                  {/* Header Actions */}
                  <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800 mb-4">
                    <div>
                      <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">Blog Management</h3>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-0.5">Manage, filter, and publish articles.</p>
                    </div>
                    <button
                      onClick={() => { setActiveTab("create-blog"); resetForm(); setTimeout(() => titleInputRef.current?.focus(), 100); }}
                      className="inline-flex items-center gap-1 bg-violet-600 hover:bg-violet-700 text-white rounded-[12px] px-3.5 py-1.5 text-xs font-bold transition shadow-sm"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add Blog
                    </button>
                  </div>

                  {/* Filter Tabs */}
                  <div className="flex gap-1.5 mb-4 bg-slate-55 dark:bg-slate-950 p-1 rounded-[12px] w-fit border border-slate-200/40 dark:border-slate-850">
                    <button
                      onClick={() => { setBlogFilterTab("All"); setBlogPage(1); }}
                      className={`px-3.5 py-1.5 rounded-[8px] text-[10px] font-bold transition ${
                        blogFilterTab === "All" ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs" : "text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                      }`}
                    >
                      All ({newsletters.length})
                    </button>
                    <button
                      onClick={() => { setBlogFilterTab("Published"); setBlogPage(1); }}
                      className={`px-3.5 py-1.5 rounded-[8px] text-[10px] font-bold transition ${
                        blogFilterTab === "Published" ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs" : "text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                      }`}
                    >
                      Published ({newsletters.filter(n => n.is_published).length})
                    </button>
                    <button
                      onClick={() => { setBlogFilterTab("Drafts"); setBlogPage(1); }}
                      className={`px-3.5 py-1.5 rounded-[8px] text-[10px] font-bold transition ${
                        blogFilterTab === "Drafts" ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs" : "text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                      }`}
                    >
                      Drafts ({newsletters.filter(n => !n.is_published).length})
                    </button>
                  </div>

                  {/* Data Table */}
                  <div className="overflow-x-auto border border-slate-100 dark:border-slate-800 rounded-[12px] flex-1">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50/80 dark:bg-slate-800/40 text-slate-400 dark:text-slate-500 font-bold border-b border-slate-100 dark:border-slate-800 uppercase tracking-wider text-[9px]">
                          <th className="px-4 py-3 text-left">Title</th>
                          <th className="px-4 py-3 text-center">Category</th>
                          <th className="px-4 py-3 text-center">Status</th>
                          <th className="px-4 py-3 text-center">Date</th>
                          <th className="px-4 py-3 text-right">Views</th>
                          <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold text-slate-700 dark:text-slate-300">
                        {paginatedBlogs.map((post, postIdx) => {
                          const views = post.is_published ? Math.floor((post.title.length * 137) % 5000) + 1200 : 0;
                          return (
                            <tr key={post.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/10">
                              <td className="px-4 py-3 max-w-[150px] text-left">
                                <div className="font-bold text-slate-900 dark:text-white text-[11px] truncate">{post.title}</div>
                                <div className="text-[9px] text-slate-400 dark:text-slate-500 font-medium truncate mt-0.5">{post.summary}</div>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${getCategoryBadgeColor(post.category)}`}>
                                  {post.category}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <button
                                  onClick={() => handleTogglePublish(post.id, post.is_published)}
                                  className={`rounded-full px-2 py-0.5 text-[9px] font-bold border transition
                                    ${post.is_published 
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40" 
                                      : "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                                    }
                                  `}
                                >
                                  {post.is_published ? "Published" : "Draft"}
                                </button>
                              </td>
                              <td className="px-4 py-3 text-center text-slate-400 dark:text-slate-500 text-[10px] font-bold">
                                {post.is_published ? formatDate(post.published_at) : "—"}
                              </td>
                              <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-400 text-[10px] font-bold">
                                {views > 0 ? `${(views / 1000).toFixed(1)}K` : "—"}
                              </td>
                              <td className="px-4 py-3 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => handleEditClick(post)}
                                    className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                                    title="Edit"
                                  >
                                    <Edit className="h-3.5 w-3.5" />
                                  </button>
                                  <Link
                                    href={`/newsletter/${post.id}`}
                                    target="_blank"
                                    className="p-1.5 text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                                    title="Preview"
                                  >
                                    <Eye className="h-3.5 w-3.5" />
                                  </Link>
                                  <button
                                    onClick={() => handleDelete(post.id)}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:text-rose-450 dark:hover:bg-rose-950/30 rounded-lg transition"
                                    title="Delete"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  <div className="flex items-center justify-between pt-3.5 mt-3 border-t border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-450">
                    <div>
                      Showing {(blogPage - 1) * itemsPerPage + 1} to {Math.min(blogPage * itemsPerPage, totalBlogResults)} of {totalBlogResults}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        disabled={blogPage === 1}
                        onClick={() => setBlogPage(p => p - 1)}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-650 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition"
                      >
                        <ChevronLeft className="h-3 w-3" />
                      </button>
                      {Array.from({ length: totalBlogPages }).map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setBlogPage(i + 1)}
                          className={`h-6 w-6 rounded-lg flex items-center justify-center border text-[9px] transition ${
                            blogPage === i + 1 
                              ? "bg-violet-600 border-violet-600 text-white shadow-xs" 
                              : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                          }`}
                        >
                          {i + 1}
                        </button>
                      ))}
                      <button
                        disabled={blogPage === totalBlogPages}
                        onClick={() => setBlogPage(p => p + 1)}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-650 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition"
                      >
                        <ChevronRight className="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                </div>
              </div>

              {/* Right Column = 45% (Blog Editor) */}
              <div className="w-full lg:w-[45%] flex flex-col gap-6">
                {renderBlogEditor(false)}
              </div>

            </section>
          )}

          {/* Bottom Section: Split Columns (50% / 25% / 25%, 24px spacing) */}
          {activeTab === "all-blogs" && (
            <section className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              
              {/* Left: Subscribers Section (50% width = 2/4 columns in grid) */}
              <div className="lg:col-span-2 flex flex-col gap-6">
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 rounded-[20px] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.05)] flex flex-col justify-between h-[360px]">
                  
                  {/* Section Header */}
                  <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800 mb-4">
                    <div>
                      <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">Subscribers</h3>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-0.5">Manage your newsletter mailing lists.</p>
                    </div>
                    <button
                      onClick={handleExportCSV}
                      className="inline-flex items-center gap-1 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-[12px] px-3.5 py-1.5 text-xs font-bold text-slate-650 dark:text-slate-400 transition"
                    >
                      <Download className="h-3.5 w-3.5" /> Export CSV
                    </button>
                  </div>

                  {/* Table */}
                  <div className="overflow-x-auto border border-slate-100 dark:border-slate-800 rounded-[12px] flex-1">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50/80 dark:bg-slate-800/40 text-slate-400 dark:text-slate-500 font-bold border-b border-slate-100 dark:border-slate-800 uppercase tracking-wider text-[9px]">
                          <th className="px-4 py-2.5 text-left">Email</th>
                          <th className="px-4 py-2.5 text-left">Name</th>
                          <th className="px-4 py-2.5 text-left">Join Date</th>
                          <th className="px-4 py-2.5 text-center">Source</th>
                          <th className="px-4 py-2.5 text-center">Status</th>
                          <th className="px-4 py-2.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold text-slate-700 dark:text-slate-300">
                        {paginatedSubscribers.map((sub, sIdx) => (
                          <tr key={sub.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/10">
                            <td className="px-4 py-2.5 font-bold text-slate-900 dark:text-white text-[11px] truncate max-w-[120px] text-left">{sub.email}</td>
                            <td className="px-4 py-2.5 text-left text-[11px] truncate max-w-[80px]">{getSubscriberName(sub.email)}</td>
                            <td className="px-4 py-2.5 text-slate-400 dark:text-slate-500 text-[10px] font-bold text-left">
                              {formatDate(sub.created_at)}
                            </td>
                            <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400 text-[10px] text-center font-medium">
                              {sIdx % 3 === 0 ? "Web Signup" : sIdx % 3 === 1 ? "Footer Form" : "Article CTA"}
                            </td>
                            <td className="px-4 py-2.5 text-center">
                              <span className="rounded-full bg-emerald-50 text-emerald-700 px-2 py-0.5 text-[9px] font-bold border border-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40">
                                Active
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-right text-slate-450 dark:text-slate-600">
                              —
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination footer */}
                  <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-450">
                    <div>
                      Showing {(subscriberPage - 1) * itemsPerPage + 1} to {Math.min(subscriberPage * itemsPerPage, totalSubscribersResults)} of {totalSubscribersResults}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        disabled={subscriberPage === 1}
                        onClick={() => setSubscriberPage(p => p - 1)}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-650 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition"
                      >
                        <ChevronLeft className="h-3 w-3" />
                      </button>
                      {Array.from({ length: totalSubscriberPages }).map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setSubscriberPage(i + 1)}
                          className={`h-6 w-6 rounded-lg flex items-center justify-center border text-[9px] transition ${
                            subscriberPage === i + 1 
                              ? "bg-violet-600 border-violet-600 text-white shadow-xs" 
                              : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                          }`}
                        >
                          {i + 1}
                        </button>
                      ))}
                      <button
                        disabled={subscriberPage === totalSubscriberPages}
                        onClick={() => setSubscriberPage(p => p + 1)}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-650 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition"
                      >
                        <ChevronRight className="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                </div>
              </div>

              {/* Center: Analytics Section (25% width = 1/4 column in grid) */}
              <div className="flex flex-col gap-6">
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 rounded-[20px] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.05)] flex flex-col justify-between h-[360px]" id="analytics-section">
                  
                  {/* Title */}
                  <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">Analytics Overview</h3>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-0.5">Key audience metrics (30 days).</p>
                  </div>

                  {/* 2x2 KPI Grid */}
                  <div className="grid grid-cols-2 gap-3 flex-1 mt-3">
                    
                    <div className="border border-slate-100 dark:border-slate-850 p-2.5 rounded-[12px] flex flex-col justify-between bg-slate-50/50 dark:bg-slate-950/20">
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Blog Views</span>
                      <span className="text-sm font-extrabold text-slate-900 dark:text-white mt-1">128.7K</span>
                      <div className="flex items-center justify-between text-[8px] font-bold mt-1">
                        <span className="text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 px-1 py-0.5 rounded">+16.3%</span>
                        <svg viewBox="0 0 100 20" className="w-10 h-4 stroke-blue-500 fill-none" strokeWidth="2">
                          <path d="M 0 18 Q 20 15, 40 16 T 80 5 T 100 10" />
                        </svg>
                      </div>
                    </div>

                    <div className="border border-slate-100 dark:border-slate-855 p-2.5 rounded-[12px] flex flex-col justify-between bg-slate-50/50 dark:bg-slate-950/20">
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Unique Visitors</span>
                      <span className="text-sm font-extrabold text-slate-900 dark:text-white mt-1">72.4K</span>
                      <div className="flex items-center justify-between text-[8px] font-bold mt-1">
                        <span className="text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 px-1 py-0.5 rounded">+11.8%</span>
                        <svg viewBox="0 0 100 20" className="w-10 h-4 stroke-blue-500 fill-none" strokeWidth="2">
                          <path d="M 0 15 Q 15 17, 35 10 T 70 8 T 100 2" />
                        </svg>
                      </div>
                    </div>

                    <div className="border border-slate-100 dark:border-slate-855 p-2.5 rounded-[12px] flex flex-col justify-between bg-slate-50/50 dark:bg-slate-955/20">
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Open Rate</span>
                      <span className="text-sm font-extrabold text-slate-900 dark:text-white mt-1">42.8%</span>
                      <div className="flex items-center justify-between text-[8px] font-bold mt-1">
                        <span className="text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 px-1 py-0.5 rounded">+6.2%</span>
                        <svg viewBox="0 0 100 20" className="w-10 h-4 stroke-emerald-500 fill-none" strokeWidth="2">
                          <path d="M 0 18 Q 25 15, 50 12 T 100 5" />
                        </svg>
                      </div>
                    </div>

                    <div className="border border-slate-100 dark:border-slate-855 p-2.5 rounded-[12px] flex flex-col justify-between bg-slate-50/50 dark:bg-slate-950/20">
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">CTR</span>
                      <span className="text-sm font-extrabold text-slate-900 dark:text-white mt-1">12.6%</span>
                      <div className="flex items-center justify-between text-[8px] font-bold mt-1">
                        <span className="text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 px-1 py-0.5 rounded">+3.4%</span>
                        <svg viewBox="0 0 100 20" className="w-10 h-4 stroke-amber-500 fill-none" strokeWidth="2">
                          <path d="M 0 18 Q 30 18, 60 14 T 100 8" />
                        </svg>
                      </div>
                    </div>

                  </div>

                </div>
              </div>

              {/* Right: Recent Activity & Quick Actions (25% width = 1/4 column in grid) */}
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-6 h-[360px] justify-between">
                  
                  {/* Recent Activity Card */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 rounded-[20px] p-4 shadow-[0_4px_20px_rgba(0,0,0,0.05)] flex-1 overflow-hidden flex flex-col justify-between">
                    <div className="pb-2 border-b border-slate-100 dark:border-slate-800 mb-2 shrink-0">
                      <h3 className="font-extrabold text-slate-900 dark:text-white text-xs">Recent Activity</h3>
                    </div>

                    {/* Activity List */}
                    <div className="space-y-3 flex-1 overflow-y-auto pr-1 py-1">
                      <div className="flex gap-2.5 items-start text-[10px]">
                        <div className="h-5 w-5 rounded-[6px] bg-violet-50 dark:bg-violet-950/40 text-violet-600 flex items-center justify-center shrink-0 mt-0.5">
                          <CheckCircle className="h-3 w-3" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-850 dark:text-slate-300 truncate">Blog "AI Tools Every Creator" published</p>
                          <p className="text-[8px] text-slate-400 font-bold">2 hours ago</p>
                        </div>
                      </div>

                      <div className="flex gap-2.5 items-start text-[10px]">
                        <div className="h-5 w-5 rounded-[6px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                          <Send className="h-3 w-3" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-850 dark:text-slate-300 truncate">Newsletter "Weekly Update" sent</p>
                          <p className="text-[8px] text-slate-400 font-bold">3 hours ago</p>
                        </div>
                      </div>

                      <div className="flex gap-2.5 items-start text-[10px]">
                        <div className="h-5 w-5 rounded-[6px] bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                          <Users className="h-3 w-3" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-850 dark:text-slate-300 truncate">Subscriber jessica@example.com joined</p>
                          <p className="text-[8px] text-slate-400 font-bold">4 hours ago</p>
                        </div>
                      </div>

                      <div className="flex gap-2.5 items-start text-[10px]">
                        <div className="h-5 w-5 rounded-[6px] bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
                          <Undo className="h-3 w-3" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-855 dark:text-slate-300 truncate">Draft "Negotiating Contracts" updated</p>
                          <p className="text-[8px] text-slate-400 font-bold">5 hours ago</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions Card (Grid 2 col x 3 row) */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 rounded-[20px] p-4 shadow-[0_4px_20px_rgba(0,0,0,0.05)] h-[170px] flex flex-col justify-between shrink-0">
                    <div className="pb-1.5 border-b border-slate-100 dark:border-slate-800 mb-2 shrink-0">
                      <h3 className="font-extrabold text-slate-900 dark:text-white text-xs">Quick Actions</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-2 flex-1 items-center">
                      <button
                        onClick={() => { setActiveTab("create-blog"); setActiveSection("blogs"); resetForm(); setTimeout(() => titleInputRef.current?.focus(), 100); }}
                        className="flex items-center gap-2 border border-slate-100 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 px-2.5 py-1.5 rounded-[12px] transition text-left"
                      >
                        <PlusCircle className="h-4 w-4 text-violet-600" />
                        <span className="text-[9px] font-bold text-slate-700 dark:text-slate-300">Create Blog</span>
                      </button>

                      <button
                        onClick={() => { setActiveTab("create-blog"); setActiveSection("newsletter"); resetForm(); setTimeout(() => titleInputRef.current?.focus(), 100); }}
                        className="flex items-center gap-2 border border-slate-100 dark:border-slate-855 hover:bg-slate-50 dark:hover:bg-slate-800 px-2.5 py-1.5 rounded-[12px] transition text-left"
                      >
                        <Send className="h-4 w-4 text-emerald-600" />
                        <span className="text-[9px] font-bold text-slate-700 dark:text-slate-300">Create Letter</span>
                      </button>

                      <button
                        onClick={() => setIsAddSubOpen(true)}
                        className="flex items-center gap-2 border border-slate-100 dark:border-slate-855 hover:bg-slate-50 dark:hover:bg-slate-800 px-2.5 py-1.5 rounded-[12px] transition text-left"
                      >
                        <Users className="h-4 w-4 text-indigo-600" />
                        <span className="text-[9px] font-bold text-slate-700 dark:text-slate-300">Add Subscriber</span>
                      </button>

                      <button
                        onClick={() => {
                          setSuccessMsg("Scheduled briefing for tomorrow 9:00 AM.");
                          setTimeout(() => setSuccessMsg(""), 3000);
                        }}
                        className="flex items-center gap-2 border border-slate-100 dark:border-slate-855 hover:bg-slate-50 dark:hover:bg-slate-800 px-2.5 py-1.5 rounded-[12px] transition text-left"
                      >
                        <Calendar className="h-4 w-4 text-amber-600" />
                        <span className="text-[9px] font-bold text-slate-700 dark:text-slate-300">Schedule Post</span>
                      </button>

                      <button
                        onClick={() => {
                          setSuccessMsg("Initiating CSV subscriber import process...");
                          setTimeout(() => setSuccessMsg(""), 3000);
                        }}
                        className="flex items-center gap-2 border border-slate-100 dark:border-slate-855 hover:bg-slate-50 dark:hover:bg-slate-800 px-2.5 py-1.5 rounded-[12px] transition text-left"
                      >
                        <Download className="h-4 w-4 text-blue-600" />
                        <span className="text-[9px] font-bold text-slate-700 dark:text-slate-300">Import Content</span>
                      </button>

                      <button
                        onClick={() => {
                          document.getElementById("analytics-section")?.scrollIntoView({ behavior: "smooth" });
                        }}
                        className="flex items-center gap-2 border border-slate-100 dark:border-slate-855 hover:bg-slate-50 dark:hover:bg-slate-800 px-2.5 py-1.5 rounded-[12px] transition text-left"
                      >
                        <ArrowUpRight className="h-4 w-4 text-rose-600" />
                        <span className="text-[9px] font-bold text-slate-700 dark:text-slate-300">View Stats</span>
                      </button>
                    </div>
                  </div>

                </div>
              </div>

            </section>
          )}

          {activeTab === "create-blog" && (
            <div className="max-w-4xl mx-auto w-full py-4 animate-fade-in">
              {renderBlogEditor(true)}
            </div>
          )}

          {activeTab === "categories" && (
            <div className="space-y-6 animate-fade-in">
              {/* Header banner */}
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 rounded-[20px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white">Category Management</h2>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold mt-1">
                  Organize your publications and blogs by defining system-wide categories.
                </p>
              </div>

              <div className="flex flex-col lg:flex-row gap-6">
                {/* Left Form (35%) */}
                <div className="w-full lg:w-[35%] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 rounded-[20px] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.05)] h-fit">
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-xs pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
                    Add New Category
                  </h3>
                  <form onSubmit={handleAddCategory} className="space-y-4">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider mb-1">
                        Category Name
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Finance, Technology"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[12px] px-3.5 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-violet-500 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider mb-1">
                        Description
                      </label>
                      <textarea
                        rows={3}
                        placeholder="A brief description of this category..."
                        value={newCategoryDesc}
                        onChange={(e) => setNewCategoryDesc(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-[12px] px-3.5 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-violet-500 font-semibold resize-none"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-violet-600 hover:bg-violet-700 text-white rounded-[12px] py-2 text-xs font-bold transition shadow-sm flex items-center justify-center gap-1.5"
                    >
                      <Plus className="h-4 w-4" /> Add Category
                    </button>
                  </form>
                </div>

                {/* Right List (65%) */}
                <div className="w-full lg:w-[65%] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 rounded-[20px] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-xs pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
                    Active Categories
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {categoriesList.map((cat) => {
                      const articleCount = newsletters.filter(n => n.category === cat.name).length;
                      const isSystemDefault = ["Creator Economy", "Platform Insights", "Business", "Industry Trends"].includes(cat.name);
                      return (
                        <div
                          key={cat.name}
                          className="border border-slate-100 dark:border-slate-850 p-4 rounded-[20px] bg-slate-50/50 dark:bg-slate-955/20 hover:shadow-[0_8px_25px_rgba(0,0,0,0.04)] transition-all duration-300 flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <span className={`rounded-full px-2.5 py-0.5 text-[9px] font-bold ${getCategoryBadgeColor(cat.name)}`}>
                                {cat.name}
                              </span>
                              <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold bg-white dark:bg-slate-900 px-2 py-0.5 rounded-full border border-slate-100 dark:border-slate-800">
                                {articleCount} {articleCount === 1 ? "article" : "articles"}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold mt-3 leading-relaxed min-h-[40px]">
                              {cat.desc}
                            </p>
                          </div>
                          <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-100/80 dark:border-slate-850/80">
                            <span className="text-[8px] text-slate-400 dark:text-slate-500 font-bold">
                              {isSystemDefault ? "System Default" : "Custom Category"}
                            </span>
                            {!isSystemDefault ? (
                              <button
                                onClick={() => handleDeleteCategory(cat.name)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:text-rose-450 dark:hover:bg-rose-950/30 rounded-lg transition"
                                title="Delete Category"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            ) : (
                              <span className="text-[8px] text-slate-350 dark:text-slate-600 font-bold italic">Locked</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "tags" && (
            <div className="space-y-6 animate-fade-in">
              {/* Header banner */}
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 rounded-[20px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white">Tag Management</h2>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold mt-1">
                  Manage search tags and keywords for articles to optimize content discovery and SEO.
                </p>
              </div>

              <div className="flex flex-col lg:flex-row gap-6">
                {/* Left Form (35%) */}
                <div className="w-full lg:w-[35%] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 rounded-[20px] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.05)] h-fit">
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-xs pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
                    Create New Tag
                  </h3>
                  <form onSubmit={handleAddTag} className="space-y-4">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider mb-1">
                        Tag Name
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs select-none">#</span>
                        <input
                          type="text"
                          required
                          placeholder="monetization"
                          value={newTagName}
                          onChange={(e) => setNewTagName(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[12px] pl-6 pr-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-violet-500 font-bold"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-violet-600 hover:bg-violet-700 text-white rounded-[12px] py-2 text-xs font-bold transition shadow-sm flex items-center justify-center gap-1.5"
                    >
                      <Plus className="h-4 w-4" /> Create Tag
                    </button>
                  </form>
                </div>

                {/* Right List (65%) */}
                <div className="w-full lg:w-[65%] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 rounded-[20px] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-xs pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
                    Active Tags Cloud
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {tagsList.map((tag) => {
                      const articleCount = newsletters.filter(n => {
                        if (!n.tags) return false;
                        return n.tags.some(t => t.toLowerCase() === tag.toLowerCase());
                      }).length;
                      
                      return (
                        <div
                          key={tag}
                          className="inline-flex items-center gap-2 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-700/80 rounded-full px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 transition-all shadow-xs group"
                        >
                          <span>#{tag}</span>
                          <span className="text-[9px] text-slate-400 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 px-1.5 py-0.5 rounded-full font-bold">
                            {articleCount}
                          </span>
                          <button
                            onClick={() => handleDeleteTag(tag)}
                            className="text-slate-400 hover:text-rose-500 dark:hover:text-rose-455 transition ml-0.5"
                            title={`Delete ${tag}`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Add Subscriber Modal */}
      {isAddSubOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 w-full max-w-md p-6 rounded-[24px] shadow-[0_12px_30px_rgba(0,0,0,0.15)] relative">
            <button 
              onClick={() => setIsAddSubOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            >
              <X className="h-4 w-4" />
            </button>
            <h4 className="font-extrabold text-slate-900 dark:text-white text-base mb-1">Add New Subscriber</h4>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold mb-4">
              Enter an email address to manually subscribe to the newsletter.
            </p>
            <form onSubmit={handleAddSubscriberSubmit} className="space-y-4">
              <input 
                type="email"
                required
                placeholder="email@example.com"
                value={newSubEmail}
                onChange={(e) => setNewSubEmail(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[12px] px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-violet-500 font-bold"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button 
                  type="button"
                  onClick={() => setIsAddSubOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-[12px] transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={addSubPending}
                  className="px-4 py-2 text-xs font-bold text-white bg-violet-600 hover:bg-violet-700 rounded-[12px] transition shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                >
                  {addSubPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                  Subscribe
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
