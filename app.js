/* ═══════════════════════════════════════════════
   Newly Booked · Shared scripts
   ═══════════════════════════════════════════════ */

/* reveal on scroll */
(() => {
  const els = document.querySelectorAll('.reveal');
  if (!els.length) return;
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target);} });
  },{threshold:.12});
  els.forEach(el => io.observe(el));
})();

/* exit-intent popup */
(() => {
  const overlay = document.getElementById('exit');
  if (!overlay) return;
  let openNow = false;
  const open = () => {
    if (openNow) return;
    openNow = true;
    overlay.classList.add('on');
  };
  const close = () => {
    overlay.classList.remove('on');
    openNow = false;
  };

  // mouse-leave trigger (desktop)
  document.addEventListener('mouseout', e => {
    if (!e.relatedTarget && e.clientY < 10) open();
  });
  // 45s idle trigger (mobile fallback) — re-arms after each close
  let idle;
  function armIdle(){
    clearTimeout(idle);
    idle = setTimeout(() => { if (!openNow) open(); }, 45000);
  }
  armIdle();
  ['scroll','click','keydown','touchstart'].forEach(ev =>
    document.addEventListener(ev, armIdle, {passive:true})
  );

  document.getElementById('exit-close')?.addEventListener('click', close);
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });

  document.getElementById('exit-form')?.addEventListener('submit', e => {
    e.preventDefault();
    const card = e.target.closest('.exit-card');
    card.innerHTML = '<div class="exit-tag">Sent</div><h3>Check your <em>inbox.</em></h3><p>Your case study is on its way.</p>';
    setTimeout(close, 2400);
  });
})();

/* sticky mobile CTA */
(() => {
  const sticky = document.querySelector('.sticky-cta');
  const form = document.getElementById('form-card');
  if (!sticky || !form) return;
  const onScroll = () => {
    const r = form.getBoundingClientRect();
    if (r.bottom < 0) sticky.classList.add('show');
    else sticky.classList.remove('show');
  };
  window.addEventListener('scroll', onScroll, {passive:true});
})();

/* multi-step form (works on any element matching the selector) */
window.NB = window.NB || {};
window.NB.initForm = function(card){
  if (!card) return;

  const data = {};
  const steps = card.querySelectorAll('.step');
  const dots = card.querySelectorAll('.progress span');
  const formEl = card.querySelector('form');
  const total = steps.length;
  const isModal = !!card.closest('.exit-overlay');

  function go(n){
    n = Math.max(1, Math.min(total, n));
    steps.forEach(s => s.classList.toggle('active', +s.dataset.step === n));
    dots.forEach((d,i) => d.classList.toggle('on', i < n));
    if (isModal){
      const overlay = card.closest('.exit-overlay');
      overlay?.scrollTo({top:0, behavior:'smooth'});
    } else {
      const y = card.getBoundingClientRect().top + window.scrollY - 90;
      window.scrollTo({top:y, behavior:'smooth'});
    }
  }

  card.querySelectorAll('[data-go]').forEach(b => {
    b.addEventListener('click', () => {
      const cur = +card.querySelector('.step.active').dataset.step;
      const next = +b.dataset.go;
      if (next > cur && !validate(cur)) return;
      if (next > cur){
        if (cur === 2 && data.owns === 'no'){ window.location.href = 'dq.html?reason=ownership'; return; }
        if (cur === 3 && data.revenue === 'under-10k'){ window.location.href = 'dq.html?reason=revenue'; return; }
      }
      go(next);
    });
  });

  card.querySelectorAll('.opt[data-q]').forEach(el => {
    el.addEventListener('click', () => {
      const q = el.dataset.q;
      card.querySelectorAll(`[data-q="${q}"]`).forEach(s => s.classList.remove('sel'));
      el.classList.add('sel');
      data[q] = el.dataset.v;
      if (el.dataset.auto === 'true'){
        setTimeout(() => {
          const nx = card.querySelector('.step.active [data-go]:not(.back)');
          if (nx) nx.click();
        }, 240);
      }
    });
  });

  card.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      chip.classList.toggle('sel');
      const g = chip.dataset.group;
      data[g] = [...card.querySelectorAll(`.chip[data-group="${g}"].sel`)].map(c => c.dataset.v);
    });
  });

  function validate(n){
    const stepEl = card.querySelector(`.step[data-step="${n}"]`);
    let ok = true;
    const groups = new Set([...stepEl.querySelectorAll('[data-q]')].map(el => el.dataset.q));
    groups.forEach(q => {
      if (![...stepEl.querySelectorAll(`[data-q="${q}"]`)].some(g => g.classList.contains('sel'))){
        ok = false;
        stepEl.querySelector('.opts')?.classList.add('shake');
        setTimeout(() => stepEl.querySelector('.opts')?.classList.remove('shake'), 400);
      }
    });
    stepEl.querySelectorAll('input[required],textarea[required]').forEach(inp => {
      if (inp.type === 'checkbox'){
        if (!inp.checked){ ok = false; inp.parentElement.classList.add('shake'); setTimeout(()=>inp.parentElement.classList.remove('shake'),400); }
      } else if (!inp.value.trim()){
        ok = false; inp.classList.add('shake'); setTimeout(()=>inp.classList.remove('shake'),400);
        inp.style.borderColor='var(--error)';
        inp.addEventListener('input',()=>inp.style.borderColor='',{once:true});
      } else if (inp.type==='email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inp.value)){
        ok = false; inp.classList.add('shake'); setTimeout(()=>inp.classList.remove('shake'),400);
        inp.style.borderColor='var(--error)';
      }
    });
    return ok;
  }

  formEl?.addEventListener('submit', e => {
    e.preventDefault();
    if (!validate(total)) return;
    const fd = new FormData(e.target);
    fd.forEach((v,k) => data[k] = v);
    try { sessionStorage.setItem('nb-lead', JSON.stringify(data)); } catch(_){}
    console.log('Lead qualified:', data);
    window.location.href = 'book-a-call.html';
  });
};

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.form-card[data-form]').forEach(c => window.NB.initForm(c));
});
