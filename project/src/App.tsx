import { useState, useEffect, useRef, type FormEvent } from 'react';
import {
  ArrowUpLeft, ImagePlus, LogIn, Menu, MoreHorizontal, Pencil, Plus,
  Send, ShieldAlert, Trash2, X, Bookmark, Search, Clock, BookOpen, Quote,
} from 'lucide-react';

type Author = { id: string; name: string; bio: string; avatar?: string };
type Media = { url: string; type: 'IMAGE' | 'VIDEO' };
type Post = {
  id: string;
  author: Author;
  text: string;
  image?: string;
  media?: Media[];
  date: string;
  deleted?: boolean;
  featured?: boolean;
  readTime?: number;
};
const logo = '/assets/logo/file_000000002f0082119227ffc726e1b962.png';
const you: Author = { id: 'you', name: 'سلمان الرفاعي', bio: 'أكتب لأتأمل، وأتأمل لأحسن النظر.' };
const people: Author[] = [
  { id: 'layla', name: 'ليلى منصور', bio: 'قارئة وباحثة في المعنى اليومي.' },
  { id: 'omar', name: 'عمر النجار', bio: 'مهتم باللغة، المكان، وما بينهما.' },
  { id: 'nour', name: 'نور الخطيب', bio: 'محررة ومهتمة بتاريخ الأفكار.' },
];
const initialPosts: Post[] = [
  {
    id: '1', author: people[0], date: '٢٢ أكتوبر ٢٠٢٦', featured: true, readTime: 3,
    text: 'ليست الحكمة في كثرة ما نعرف، بل في أن نعرف ما يستحق أن نمنحه من وقتنا. بعض المعاني لا تُفتح إلا حين نهدأ قليلًا، ونترك للكلمة مساحة لتستقر قبل أن نحكم عليها. في زمن يُقاس فيه كل شيء بالسرعة، يبقى التأمل أصدق ما نملك.',
  },
  {
    id: '2', author: people[1], date: '٢١ أكتوبر ٢٠٢٦', readTime: 2,
    text: 'في الطريق الطويل، لا نحتاج دائمًا إلى خطوة أكبر؛ نحتاج إلى اتجاه أوضح. الطريق الذي يبدأ بيقين نادرًا ما ينتهي بهدوء، لكن الطريق الذي يبدأ بسؤال غالبًا ما يقود إلى حيث لم نكن نتوقع.',
    image: 'https://images.pexels.com/photos/31415641/pexels-photo-31415641.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  },
  {
    id: '3', author: people[2], date: '٢٠ أكتوبر ٢٠٢٦', readTime: 2,
    text: 'أعود إلى الكتب لا لأهرب من العالم، بل لأراه بعيون أكثر اتساعًا. كل صفحة أقرؤها تضيف طبقة إلى نافذتي الصغيرة، وبعضها يفتح نافذة جديدة لم أكن أعرف أنها موجودة.',
    image: 'https://images.pexels.com/photos/33350433/pexels-photo-33350433.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  },
  {
    id: '4', author: you, date: '١٨ أكتوبر ٢٠٢٦', readTime: 1,
    text: 'الوضوح شكل من أشكال الرحمة: أن تقول ما تقصده، وأن تترك للآخر مساحة ليفهمه.',
  },
];

function readTimeOf(text: string): number {
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 60));
}

function Avatar({ author, large = false }: { author: Author; large?: boolean }) {
  return (
    <div className={`avatar ${large ? 'large' : ''}`}>
      {author.avatar ? <img src={author.avatar} alt="" /> : author.name[0]}
    </div>
  );
}

function Modal({ title, close, children }: { title: string; close: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && close();
    window.addEventListener('keydown', esc);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', esc); document.body.style.overflow = ''; };
  }, [close]);
  return (
    <div className="backdrop" onMouseDown={e => e.target === e.currentTarget && close()}>
      <div className="modal">
        <header><h2>{title}</h2><button className="icon" onClick={close} aria-label="إغلاق"><X size={19} /></button></header>
        {children}
      </div>
    </div>
  );
}

function useScrollTop(dep: unknown) {
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, [dep]);
}

export default function App() {
  const [posts, setPosts] = useState(initialPosts);
  const [user, setUser] = useState<Author | null>(null);
  const [view, setView] = useState<'feed' | 'profile' | 'detail' | 'saved'>('feed');
  const [profile, setProfile] = useState<Author | null>(null);
  const [modal, setModal] = useState<'compose' | 'signin' | 'profile' | 'edit' | 'report' | 'delete' | null>(null);
  const [target, setTarget] = useState<Post | null>(null);
  const [detail, setDetail] = useState<Post | null>(null);
  const [notice, setNotice] = useState('');
  const [mobileMenu, setMobileMenu] = useState(false);
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [saved, setSaved] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [navHistory, setNavHistory] = useState<{ view: typeof view; profile: Author | null; detail: Post | null } | null>(null);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => { const t = setTimeout(() => setLoading(false), 900); return () => clearTimeout(t); }, []);
  useEffect(() => { if (searchOpen) searchRef.current?.focus(); }, [searchOpen]);

  const show = (message: string) => { setNotice(message); window.setTimeout(() => setNotice(''), 3200); };
  const requireUser = (action: () => void) => { if (user) action(); else { setPendingAction(() => action); setModal('signin'); } };
  const openProfile = (author: Author) => {
    setNavHistory({ view, profile, detail });
    setProfile(author); setView('profile'); setDetail(null); setMobileMenu(false);
  };
  const openDetail = (post: Post) => {
    setNavHistory({ view, profile, detail });
    setDetail(post); setView('detail'); setMobileMenu(false);
  };
  const goBack = () => {
    if (navHistory) {
      setView(navHistory.view); setProfile(navHistory.profile); setDetail(navHistory.detail);
      setNavHistory(null);
    } else { setView('feed'); setProfile(null); setDetail(null); }
  };
  useScrollTop(view);
  const toggleSave = (id: string) => {
    if (!user) { setModal('signin'); return; }
    setSaved(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
    show(saved.includes(id) ? 'أُزيل من المحفوظات' : 'حُفظ للقراءة لاحقًا');
  };
  const matchesView = (p: Post): boolean => {
    if (view === 'feed') return true;
    if (view === 'profile') return p.author.id === profile?.id;
    if (view === 'saved') return saved.includes(p.id);
    return true;
  };
  const matchesQuery = (p: Post): boolean => !query || p.text.includes(query) || p.author.name.includes(query);
  const currentView = view as string;
  const visible = posts.filter(p => !p.deleted && matchesView(p) && matchesQuery(p));

  const featuredPost = posts.find(p => p.featured && !p.deleted && !query);
  const restPosts = visible.filter(p => !p.featured);

  return <div className="shell" dir="rtl">
    <header className="topbar">
      <div className="topbar-inner">
        <button className="icon mobile" onClick={() => setMobileMenu(!mobileMenu)} aria-label="القائمة"><Menu size={21} /></button>
        <button className="brand" onClick={() => { setView('feed'); setProfile(null); setDetail(null); setQuery(''); }}>
          <img src={logo} alt="عقاب" /><span><b>عُقاب</b><small>EQAB</small></span>
        </button>
        <nav className={mobileMenu ? 'open' : ''}>
          <button className={view === 'feed' ? 'active' : ''} onClick={() => { setView('feed'); setProfile(null); setDetail(null); setMobileMenu(false); setQuery(''); }}>الرئيسية</button>
          {user && <button className={view === 'saved' ? 'active' : ''} onClick={() => { setView('saved'); setProfile(null); setDetail(null); setMobileMenu(false); }}>المحفوظات{saved.length > 0 && <i>{saved.length}</i>}</button>}
          {user && <button className={view === 'profile' && profile?.id === user.id ? 'active' : ''} onClick={() => openProfile(user)}>ملفي</button>}
          <i /><small>المشهد العام</small>
        </nav>
        <div className="actions">
          <button className="icon" onClick={() => setSearchOpen(!searchOpen)} aria-label="بحث"><Search size={18} /></button>
          {user
            ? <button className="user-chip" onClick={() => openProfile(user)}><Avatar author={user} />{user.name}</button>
            : <button className="signin-link" onClick={() => setModal('signin')}><LogIn size={16} /> دخول</button>}
          <button className="write" onClick={() => requireUser(() => setModal('compose'))}><Plus size={17} /> <span>اكتب</span></button>
        </div>
      </div>
      {searchOpen && (
        <div className="search-bar">
          <Search size={16} />
          <input ref={searchRef} value={query} onChange={e => setQuery(e.target.value)} placeholder="ابحث في المنشورات والأسماء..." />
          {query && <button onClick={() => { setQuery(''); setSearchOpen(false); }}><X size={16} /></button>}
        </div>
      )}
    </header>

    <main>
      {view === 'feed' && <>
        <section className="hero">
          <div className="hero-content">
            <p className="eyebrow"><Quote size={13} /> مساحة للقول الهادئ</p>
            <h1>ما يُكتب هنا<br /><em>يُقرأ على مهل.</em></h1>
            <p className="lead">منشورات عامة مرتبة زمنيًا. لا إعجابات، لا ضجيج؛ فقط كلمات وصور تستحق أن تجد طريقها.</p>
          </div>
          <div className="seal"><b>عُقاب</b><small>منصة نشر عربية</small></div>
        </section>

        {featuredPost && !query && (
          <article className="featured" onClick={() => openDetail(featuredPost)}>
            <div className="featured-text">
              <span className="featured-tag">منشور مختار</span>
              <button className="author" onClick={e => { e.stopPropagation(); openProfile(featuredPost.author); }}>
                <Avatar author={featuredPost.author} /><span><b>{featuredPost.author.name}</b><small>{featuredPost.date} · {featuredPost.readTime ?? readTimeOf(featuredPost.text)} دقائق قراءة</small></span>
              </button>
              <p className="featured-body">{featuredPost.text}</p>
              <div className="featured-meta">
                <button className="read-link">اقرأ المنشور كاملًا <ArrowUpLeft size={14} /></button>
                <button className="save-btn" onClick={e => { e.stopPropagation(); toggleSave(featuredPost.id); }}>
                  <Bookmark size={15} /> {saved.includes(featuredPost.id) ? 'محفوظ' : 'حفظ'}
                </button>
              </div>
            </div>
            <div className="featured-num">01</div>
          </article>
        )}

        <div className="feed-layout">
          <section className="feed-main">
            {query && <div className="search-result">نتائج البحث عن «{query}» — {visible.length} منشور</div>}
            <div className="feed-title">
              <div><h2>{query ? 'نتائج البحث' : currentView === 'saved' ? 'محفوظاتك' : 'آخر المنشورات'}</h2><p>{query ? '' : 'الأحدث أولًا، بلا خوارزميات'}</p></div>
              <span><i /> {currentView === 'saved' ? 'قراءة لاحقة' : 'المحتوى العام'}</span>
            </div>
            {loading ? <div className="skeletons">{Array.from({ length: 3 }).map((_, i) => <div className="skeleton-card" key={i}><div className="sk-line w-40" /><div className="sk-line w-80" /><div className="sk-line w-60" /></div>)}</div>
            : restPosts.length ? restPosts.map((post, i) => <PostCard key={post.id} post={post} user={user} saved={saved.includes(post.id)} onSave={toggleSave} open={openDetail} profile={openProfile} edit={p => { setTarget(p); setModal('edit'); }} remove={p => { setTarget(p); setModal('delete'); }} report={p => { setTarget(p); setModal('report'); }} index={i + 2} />)
            : <div className="empty"><div><BookOpen size={20} /></div><h2>{currentView === 'saved' ? 'لا توجد محفوظات بعد' : 'لا توجد منشورات'}</h2><p>{currentView === 'saved' ? 'احفظ المنشورات التي تريد قراءتها لاحقًا.' : 'ستظهر كتاباتك هنا حين تنشر أول منشور.'}</p><button className="primary" onClick={() => requireUser(() => setModal('compose'))}><Plus size={16} /> اكتب أول منشور</button></div>}
          </section>

          <aside className="sidebar">
            <div className="side-block">
              <h3>عن عقاب</h3>
              <p>منصة نشر عربية للنصوص القصيرة التي تستحق القراءة على مهل. لا خوارزميات، لا إشعارات، لا ضجيج.</p>
            </div>
            <div className="side-block">
              <h3>الكتّاب</h3>
              {people.map(p => <button key={p.id} className="side-author" onClick={() => openProfile(p)}><Avatar author={p} /><span><b>{p.name}</b><small>{p.bio}</small></span></button>)}
            </div>
          </aside>
        </div>
      </>}

      {view === 'profile' && profile && <>
        <section className="profile-head">
          <button onClick={goBack} className="back"><ArrowUpLeft size={15} /> العودة</button>
          <div className="profile-row">
            <Avatar author={profile} large />
            <div>
              <p className="eyebrow">الملف العام</p>
              <h1>{profile.name}</h1>
              <p>{profile.bio || 'لم تُضف نبذة بعد.'}</p>
              <small>{posts.filter(p => !p.deleted && p.author.id === profile.id).length} منشور · عضو في عقاب</small>
            </div>
            {user?.id === profile.id && <button className="outline" onClick={() => setModal('profile')}><Pencil size={15} /> تعديل الملف</button>}
          </div>
        </section>
        <div className="feed-layout">
          <section className="feed-main">
            <div className="feed-title"><div><h2>منشورات {profile.name}</h2><p>كل ما نُشر هنا</p></div><span><i /> {posts.filter(p => !p.deleted && p.author.id === profile.id).length} منشور</span></div>
            {visible.length ? visible.map((post, i) => <PostCard key={post.id} post={post} user={user} saved={saved.includes(post.id)} onSave={toggleSave} open={openDetail} profile={openProfile} edit={p => { setTarget(p); setModal('edit'); }} remove={p => { setTarget(p); setModal('delete'); }} report={p => { setTarget(p); setModal('report'); }} index={i + 1} />)
            : <div className="empty"><div><BookOpen size={20} /></div><h2>لا توجد منشورات بعد</h2><p>ابدأ بكتابة أول منشور لك في عقاب.</p>{user?.id === profile?.id && <button className="primary" onClick={() => setModal('compose')}><Plus size={16} /> اكتب أول منشور</button>}</div>}
          </section>
          <aside className="sidebar">
            <div className="side-block">
              <h3>{profile.name}</h3>
              <p>{profile.bio || 'لم تُضف نبذة بعد.'}</p>
            </div>
          </aside>
        </div>
      </>}

      {view === 'saved' && <>
        <div className="feed-layout">
          <section className="feed-main">
            <div className="feed-title"><div><h2>المحفوظات</h2><p>ما أردت قراءته لاحقًا</p></div><span><i /> {saved.length} منشور</span></div>
            {visible.length ? visible.map((post, i) => <PostCard key={post.id} post={post} user={user} saved={true} onSave={toggleSave} open={openDetail} profile={openProfile} edit={p => { setTarget(p); setModal('edit'); }} remove={p => { setTarget(p); setModal('delete'); }} report={p => { setTarget(p); setModal('report'); }} index={i + 1} />)
            : <div className="empty"><div><Bookmark size={20} /></div><h2>لا توجد محفوظات بعد</h2><p>احفظ المنشورات التي تريد قراءتها لاحقًا، وستجدها هنا.</p></div>}
          </section>
        </div>
      </>}

      {view === 'detail' && detail && !detail.deleted && <PostDetail post={detail} user={user} saved={saved.includes(detail.id)} onSave={toggleSave} profile={openProfile} edit={p => { setTarget(p); setModal('edit'); }} remove={p => { setTarget(p); setModal('delete'); }} report={p => { setTarget(p); setModal('report'); }} back={goBack} />}
    </main>

    <footer><img src={logo} alt="" /><span>النشر بوعي، والقراءة بإنصاف.</span></footer>
    {notice && <div className="toast">● {notice}</div>}
    {modal === 'signin' && <Modal title="الدخول إلى عقاب" close={() => { setModal(null); setPendingAction(null); }}><div className="center"><div className="symbol"><LogIn size={22} /></div><h3>اكتب حين يكون لديك ما يستحق أن يُقرأ</h3><p>الدخول مطلوب للنشر والحفظ وتعديل ملفك والإبلاغ. التصفح متاح للجميع.</p><button className="primary full" onClick={() => { const action = pendingAction; setUser(you); setModal(null); show('أهلًا بك في عقاب'); if (action) { action(); setPendingAction(null); } }}><LogIn size={16} /> متابعة للدخول التجريبي</button><small>واجهة جاهزة للربط بخدمة الهوية عند تشغيل الخادم.</small></div></Modal>}
    {modal === 'compose' && <Composer close={() => setModal(null)} add={p => { setPosts(prev => [p, ...prev]); setModal(null); show('تم نشر منشورك في المساحة العامة'); setView('feed'); setProfile(null); setDetail(null); }} />  }
    {modal === 'profile' && user && <ProfileForm user={user} close={() => setModal(null)} save={u => { setUser(u); setPosts(posts.map(p => p.author.id === u.id ? { ...p, author: u } : p)); setProfile(u); setModal(null); show('تم تحديث ملفك الشخصي'); }} />}
    {modal === 'edit' && target && <EditForm post={target} close={() => setModal(null)} save={text => { setPosts(prev => prev.map(p => p.id === target.id ? { ...p, text, readTime: readTimeOf(text) } : p)); setDetail(d => d?.id === target.id ? { ...d, text, readTime: readTimeOf(text) } : d); setModal(null); show('تم تحديث المنشور'); }} />}
    {modal === 'delete' && target && <Modal title="حذف المنشور؟" close={() => setModal(null)}><div className="center"><div className="symbol"><Trash2 size={22} /></div><p>سيختفي هذا المنشور من المساحة العامة. لا يمكن التراجع عن الحذف.</p><div className="row"><button className="outline" onClick={() => setModal(null)}>إلغاء</button><button className="danger" onClick={() => { setPosts(prev => prev.map(p => p.id === target.id ? { ...p, deleted: true } : p)); setDetail(null); setView('feed'); setModal(null); show('تم حذف المنشور'); }}>حذف المنشور</button></div></div></Modal>}
    {modal === 'report' && <Report close={() => setModal(null)} sent={() => { setModal(null); show('شكرًا. وصل بلاغك للمراجعة'); }} />}
  </div>;
}

function PostCard({ post, user, saved, onSave, open, profile, edit, remove, report, index }: {
  post: Post; user: Author | null; saved: boolean; onSave: (id: string) => void; open: (p: Post) => void;
  profile: (a: Author) => void; edit: (p: Post) => void; remove: (p: Post) => void; report: (p: Post) => void; index: number;
}) {
  const [menu, setMenu] = useState(false);
  const own = user?.id === post.author.id;
  return <article className="card">
    <div className="post-head">
      <button className="author" onClick={() => profile(post.author)}>
        <Avatar author={post.author} />
        <span><b>{post.author.name}</b><small>{post.date} · {post.readTime ?? readTimeOf(post.text)} دقائق قراءة</small></span>
      </button>
      <div className="menu-wrap">
        <button className="icon" onClick={() => setMenu(!menu)} aria-label="خيارات"><MoreHorizontal size={19} /></button>
        {menu && <div className="menu">
          <button onClick={() => { onSave(post.id); setMenu(false); }}><Bookmark size={14} /> {saved ? 'إزالة من المحفوظات' : 'حفظ للقراءة'}</button>
          {own ? <>
            <button onClick={() => edit(post)}><Pencil size={14} /> تعديل المنشور</button>
            <button className="red" onClick={() => remove(post)}><Trash2 size={14} /> حذف المنشور</button>
          </> : <button onClick={() => report(post)}><ShieldAlert size={14} /> الإبلاغ عن المنشور</button>}
        </div>}
      </div>
    </div>
    <button className="post-content" onClick={() => open(post)}>
      <p className="post-text">{post.text}</p>
      {post.media?.map(m => m.type === 'VIDEO'
        ? <video src={m.url} controls key={m.url} />
        : <img src={m.url} alt="مرفق بالمنشور" key={m.url} />)
      }{!post.media?.length && post.image && <img src={post.image} alt="مرفق بالمنشور" />}
    </button>
    <div className="post-foot">
      <div className="post-foot-left">
        <button onClick={() => open(post)}><ArrowUpLeft size={14} /> قراءة</button>
        <button className={saved ? 'active' : ''} onClick={() => onSave(post.id)}><Bookmark size={14} /> {saved ? 'محفوظ' : 'حفظ'}</button>
      </div>
      <small>منشور {String(index).padStart(2, '0')} · نشر عام</small>
    </div>
  </article>;
}

function PostDetail({ post, user, saved, onSave, profile, edit, remove, report, back }: {
  post: Post; user: Author | null; saved: boolean; onSave: (id: string) => void; profile: (a: Author) => void;
  edit: (p: Post) => void; remove: (p: Post) => void; report: (p: Post) => void; back: () => void;
}) {
  const own = user?.id === post.author.id;
  return <article className="detail-page">
    <button className="back" onClick={back}><ArrowUpLeft size={15} /> العودة إلى المنشورات</button>
    <div className="detail-head">
      <button className="author" onClick={() => profile(post.author)}>
        <Avatar author={post.author} large />
        <span><b>{post.author.name}</b><small>{post.date} · {post.readTime ?? readTimeOf(post.text)} دقائق قراءة</small></span>
      </button>
      <div className="detail-actions">
        <button className={saved ? 'outline active' : 'outline'} onClick={() => onSave(post.id)}><Bookmark size={15} /> {saved ? 'محفوظ' : 'حفظ'}</button>
        {own ? <>
          <button className="outline" onClick={() => edit(post)}><Pencil size={15} /> تعديل</button>
          <button className="outline danger-outline" onClick={() => remove(post)}><Trash2 size={15} /> حذف</button>
        </> : <button className="outline" onClick={() => report(post)}><ShieldAlert size={15} /> إبلاغ</button>}
      </div>
    </div>
    <div className="detail-text">{post.text.split('\n').map((line, i) => <p key={i}>{line}</p>)}</div>
    {post.media?.map(m => m.type === 'VIDEO'
      ? <video className="detail-image" src={m.url} controls key={m.url} />
      : <img className="detail-image" src={m.url} alt="مرفق بالمنشور" key={m.url} />)
    }{!post.media?.length && post.image && <img className="detail-image" src={post.image} alt="مرفق بالمنشور" />}
    <div className="detail-footer">
      <Clock size={14} /> <span>{post.readTime ?? readTimeOf(post.text)} دقائق قراءة</span>
      <small>منشور في المساحة العامة · عقاب</small>
    </div>
  </article>;
}

function Composer({ close, add }: { close: () => void; add: (p: Post) => void }) {
  const [text, setText] = useState('');
  const [media, setMedia] = useState<Media[]>([]);
  const [error, setError] = useState('');
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim() && !media.length) { setError('أضف نصًا أو مرفقًا قبل النشر.'); return; }
    add({ id: String(Date.now()), author: you, text: text.trim(), media, image: media[0]?.type === 'IMAGE' ? media[0].url : undefined, date: 'الآن', readTime: readTimeOf(text) });
  };
  const addFiles = (files: File[]) => {
    const hasVideo = files.some(file => file.type.startsWith('video/'));
    if (hasVideo && files.length > 1) { setError('يمكن نشر فيديو واحد فقط دون صور أخرى.'); return; }
    if (!hasVideo && files.length > 4) { setError('يمكن إرفاق أربع صور كحد أقصى.'); return; }
    setMedia(files.map(file => ({ url: URL.createObjectURL(file), type: file.type.startsWith('video/') ? 'VIDEO' : 'IMAGE' })));
    setError('');
  };
  return <Modal title="منشور جديد" close={close}>
    <form className="form" onSubmit={submit}>
      <div className="author"><Avatar author={you} /><span><b>{you.name}</b><small>سيظهر منشورك للعامة</small></span></div>
      <textarea autoFocus value={text} onChange={e => setText(e.target.value)} maxLength={2000} placeholder="ما الذي يستحق أن يُقال اليوم؟" />
      {media.length > 0 && <div className="media-preview">{media.map(item => <div className="preview-tile" key={item.url}>{item.type === 'VIDEO' ? <video src={item.url} controls /> : <img src={item.url} alt="معاينة المرفق" />}<button type="button" onClick={() => setMedia(media.filter(c => c.url !== item.url))} aria-label="إزالة المرفق"><X size={14} /></button></div>)}</div>}
      {error && <p className="form-error">{error}</p>}
      <div className="form-bottom">
        <label><ImagePlus size={17} /> إضافة وسائط<input type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime" multiple onChange={e => addFiles(Array.from(e.target.files ?? []))} /></label>
        <small>{text.length} / 2000</small>
        <button className="primary" type="submit"><Send size={15} /> نشر</button>
      </div>
    </form>
  </Modal>;
}

function ProfileForm({ user, close, save }: { user: Author; close: () => void; save: (u: Author) => void }) {
  const [name, setName] = useState(user.name);
  const [bio, setBio] = useState(user.bio);
  const [avatar, setAvatar] = useState(user.avatar ?? '');
  return <Modal title="تعديل الملف الشخصي" close={close}>
    <form className="form fields" onSubmit={e => { e.preventDefault(); if (name.trim()) save({ ...user, name: name.trim(), bio: bio.trim(), avatar }); }}>
      <Avatar author={{ ...user, name, avatar }} large />
      <label className="file-change">تغيير الصورة<input type="file" accept="image/jpeg,image/png,image/webp" onChange={e => { const file = e.target.files?.[0]; if (file) setAvatar(URL.createObjectURL(file)); }} /></label>
      <label>الاسم الظاهر<input value={name} onChange={e => setName(e.target.value)} maxLength={50} /></label>
      <label>النبذة<textarea value={bio} onChange={e => setBio(e.target.value)} maxLength={160} /></label>
      <button className="primary full">حفظ التغييرات</button>
    </form>
  </Modal>;
}

function EditForm({ post, close, save }: { post: Post; close: () => void; save: (text: string) => void }) {
  const [text, setText] = useState(post.text);
  return <Modal title="تعديل المنشور" close={close}>
    <form className="form fields" onSubmit={e => { e.preventDefault(); if (text.trim()) save(text.trim()); }}>
      <label>نص المنشور<textarea autoFocus value={text} onChange={e => setText(e.target.value)} maxLength={2000} /></label>
      {(post.image || post.media?.length) && <small className="locked">المرفقات لا يمكن تعديلها في النسخة الأولى.</small>}
      <button className="primary full">حفظ التعديل</button>
    </form>
  </Modal>;
}

function Report({ close, sent }: { close: () => void; sent: () => void }) {
  const [reason, setReason] = useState('سبام أو محتوى مزعج');
  return <Modal title="الإبلاغ عن المنشور" close={close}>
    <form className="form fields" onSubmit={e => { e.preventDefault(); sent(); }}>
      <p>يساعدنا بلاغك في الحفاظ على مساحة قراءة ونشر محترمة.</p>
      {['مخالفة دينية', 'عنف أو تحريض', 'سبام أو محتوى مزعج', 'سبب آخر'].map(x => <label className="radio" key={x}><input type="radio" checked={reason === x} onChange={() => setReason(x)} /> {x}</label>)}
      <button className="primary full">إرسال البلاغ</button>
    </form>
  </Modal>;
}
