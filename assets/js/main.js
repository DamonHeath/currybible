
(function(){
  const body=document.body;
  const saved=localStorage.getItem('curryBibleTheme');
  if(saved==='dark') body.classList.add('dark');
  document.querySelectorAll('.dark-toggle').forEach(btn=>{
    const set=()=>{const dark=body.classList.contains('dark');btn.textContent=dark?'Light Mode':'Dark Mode';btn.setAttribute('aria-pressed',String(dark));};
    btn.addEventListener('click',()=>{body.classList.toggle('dark');localStorage.setItem('curryBibleTheme',body.classList.contains('dark')?'dark':'light');document.querySelectorAll('.dark-toggle').forEach(b=>{b.textContent=body.classList.contains('dark')?'Light Mode':'Dark Mode';b.setAttribute('aria-pressed',String(body.classList.contains('dark')));});});
    set();
  });
  const toggle=document.querySelector('.menu-toggle');
  const nav=document.querySelector('.main-nav');
  if(toggle&&nav){toggle.addEventListener('click',()=>{const open=nav.classList.toggle('open');toggle.setAttribute('aria-expanded',String(open));});}
  document.querySelectorAll('.nav-drop-btn').forEach(btn=>btn.addEventListener('click',()=>{const parent=btn.closest('.nav-dropdown');const open=parent.classList.toggle('open');btn.setAttribute('aria-expanded',String(open));}));
  const current=document.body.dataset.current;
  if(current){document.querySelectorAll(`[data-nav="${current}"]`).forEach(a=>a.setAttribute('aria-current','page'));}
  document.querySelectorAll('[data-year]').forEach(el=>el.textContent=new Date().getFullYear());
  document.querySelectorAll('.game-toggle').forEach(btn=>btn.addEventListener('click',()=>{const banner=btn.closest('.game-banner');const isOpen=banner.classList.toggle('open');btn.setAttribute('aria-expanded',String(isOpen));}));
})();
